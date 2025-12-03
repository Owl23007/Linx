import { app, Menu } from 'electron';
import DatabaseManager from './managers/database.js';
import EasyTierManager from './managers/easytier.js';
import IpcManager from './managers/ipc.js';
import KeytarManager from './managers/keytar.js';
import WindowManager from './managers/window.js';
import { initializeUserData } from './setup.js';
import { logger } from './utils/log.js';

/**
 * Electron 应用主类
 * 负责协调各个管理器的初始化和生命周期管理
 */
class ElectronApp {
  constructor() {
    this.isInitialized = false;
    this.isShuttingDown = false;

    // 初始化各个管理器
    this.windowManager = new WindowManager();
    this.keytarManager = new KeytarManager(logger);
    this.databaseManager = new DatabaseManager(logger, this.keytarManager);
    this.easyTierManager = new EasyTierManager();
    this.ipcManager = new IpcManager(
      this.windowManager,
      this.easyTierManager,
      this.databaseManager
    );
  }

  /**
   * 初始化应用程序
   */
  async init() {
    try {
      // 最先执行用户数据路径初始化
      initializeUserData();

      // 设置应用配置
      this.setupAppConfiguration();

      // 注册应用事件监听器
      this.registerAppEvents();

      // 等待应用准备就绪
      await app.whenReady();

      // 执行启动流程
      await this.startup();

    } catch (error) {
      await this.handleFatalError('APP_INIT', error);
    }
  }

  /**
   * 设置应用程序配置
   */
  setupAppConfiguration() {
    // 禁用应用程序菜单
    Menu.setApplicationMenu(null);
  }

  /**
   * 注册应用程序事件监听器
   */
  registerAppEvents() {
    // 所有窗口关闭时退出应用（macOS 除外）
    app.on('window-all-closed', this.handleWindowAllClosed.bind(this));

    // 应用退出前的清理工作
    app.on('before-quit', this.handleBeforeQuit.bind(this));

    // macOS 特定：点击 dock 图标时重新创建窗口
    app.on('activate', this.handleActivate.bind(this));

    // 处理未捕获的异常
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
  }

  /**
   * 应用启动流程
   */
  async startup() {
    try {
      logger.info('APP_STARTUP', '应用程序启动中...');

      // 按顺序初始化各个管理器
      await this.initializeManagers();

      // 设置 IPC 处理器
      this.ipcManager.setupHandlers();
      logger.info('IPC_SETUP', 'IPC 处理器设置成功');

      // 创建主窗口
      this.windowManager.createAuthWindow();
      logger.info('WINDOW_CREATED', '认证窗口创建成功');

      // 执行启动后的清理任务
      this.performPostStartupTasks();

      this.isInitialized = true;
      logger.info('APP_READY', '应用程序启动完成');

    } catch (error) {
      await this.handleFatalError('APP_STARTUP', error);
    }
  }

  /**
   * 初始化各个管理器
   */
  async initializeManagers() {
    // 初始化密钥管理器
    await this.keytarManager.init();
    logger.info('KEYTAR_INIT', '密钥管理器初始化成功');

    // 初始化数据库服务
    await this.databaseManager.init();
    logger.info('DATABASE_INIT', '数据库初始化成功');

    // 初始化 EasyTier
    await this.easyTierManager.init();
    logger.info('EASYTIER_INIT', 'EasyTier 初始化成功');
  }

  /**
   * 执行启动后的清理任务
   */
  performPostStartupTasks() {
    try {
      // 清理旧日志文件（保留 30 天）
      logger.cleanOldLogs(30);
      logger.info('LOG_CLEANUP', '旧日志文件清理完成');
    } catch (error) {
      logger.warn('LOG_CLEANUP', '日志清理失败', { error: error.message });
    }
  }

  /**
   * 处理所有窗口关闭事件
   */
  handleWindowAllClosed() {
    // macOS 应用通常在关闭所有窗口后继续运行
    if (process.platform !== 'darwin') {
      logger.info('APP_SHUTDOWN', '所有窗口关闭，应用程序退出');
      app.quit();
    }
  }

  /**
   * 处理应用退出前的清理工作
   */
  async handleBeforeQuit() {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    try {
      logger.info('APP_QUIT', '应用程序正在退出...');

      // 停止 EasyTier 进程
      if (this.easyTierManager) {
        const stopped = this.easyTierManager.stop();
        if (stopped) {
          logger.info('EASYTIER_CLOSE', 'EasyTier 进程已停止');
        }
      }

      // 关闭数据库连接
      if (this.databaseManager) {
        await this.databaseManager.close();
        logger.info('DATABASE_CLOSE', '数据库连接已关闭');
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.error('APP_QUIT', err, { message: '应用退出时发生错误' });
    }
  }

  /**
   * 处理 macOS activate 事件
   */
  handleActivate() {
    logger.debug('APP_ACTIVATE', 'macOS dock 图标被点击');

    if (this.windowManager) {
      this.windowManager.handleActivate();
    }
  }

  /**
   * 处理未捕获的异常
   */
  async handleUncaughtException(error) {
    await logger.error('UNCAUGHT_EXCEPTION', error, {
      message: '未捕获的异常',
      stack: error.stack,
    });

    // 给予时间记录日志后再退出
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }

  /**
   * 处理未处理的 Promise 拒绝
   */
  async handleUnhandledRejection(reason, promise) {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    await logger.error('UNHANDLED_REJECTION', error, {
      message: '未处理的 Promise 拒绝',
      promise: String(promise),
    });
  }

  /**
   * 处理致命错误
   */
  async handleFatalError(context, error) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error(context, err, {
      exitMessage: '应用程序因致命错误退出',
    });

    // 给予时间记录日志后再退出
    setTimeout(() => {
      app.quit();
      process.exit(1);
    }, 1000);
  }
}

// ==========================================
// 应用入口
// ==========================================

// 创建并初始化应用实例
const electronApp = new ElectronApp();
electronApp.init().catch((error) => {
  console.error('应用初始化失败:', error);
  process.exit(1);
});
