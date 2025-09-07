import { app, Menu } from 'electron';
import DatabaseManager from './managers/database.js';
import IpcManager from './managers/ipc.js';
import KeytarManager from './managers/keytar.js';
import WindowManager from './managers/window.js';
import { logger } from './utils/log.js';

class ElectronApp {
  constructor() {
    this.windowManager = new WindowManager();
    this.keytarManager = new KeytarManager(logger);
    this.databaseManager = new DatabaseManager(logger, this.keytarManager);
    this.ipcManager = new IpcManager(this.windowManager);
  }

  async init() {
    // 禁用应用程序菜单
    Menu.setApplicationMenu(null);

    // 应用准备就绪时创建窗口和初始化数据库
    app.whenReady().then(async () => {
      try {
        logger.info('APP_STARTUP', '应用程序启动中...');

        // 初始化密钥管理器
        await this.keytarManager.init();
        logger.info('KEYTAR_INIT', '密钥管理器初始化成功');

        // 初始化数据库服务
        await this.databaseManager.init();
        logger.info('DATABASE_INIT', '数据库初始化成功');

        // 创建 IPC 管理器
        this.ipcManager.setupHandlers(this.databaseManager.appDb);

        // 创建认证窗口
        this.windowManager.createAuthWindow();
        logger.info('WINDOW_CREATED', '认证窗口创建成功');

        // 清理旧日志文件
        logger.cleanOldLogs(30);
        logger.info('LOG_CLEANUP', '旧日志文件清理完成');

      } catch (error) {
        // 记录初始化错误
        const err = error instanceof Error ? error : new Error(error);
        await logger.error('APP_INITIALIZATION', err, { exitMessage: '应用程序因初始化失败退出' });

        // 退出应用
        process.exit(1);
      }
    });

    // 所有窗口关闭时退出应用（macOS 除外）
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        logger.info('APP_SHUTDOWN', '所有窗口关闭，应用程序退出');
        app.quit();
      }
    });

    // 在应用退出前关闭数据库连接
    app.on('before-quit', async function() {
      try {
        await this.databaseManager.close();
        logger.info('DATABASE_CLOSE', '数据库连接已关闭');
      } catch (error) {
        const err = error instanceof Error ? error : new Error(error);
        await logger.error('DATABASE_CLOSE', err);
      }
    }.bind(this));

    // macOS 点击 dock 图标时重新创建窗口
    app.on('activate', () => {
      logger.debug('APP_ACTIVATE', 'macOS dock 图标被点击');
      this.windowManager.handleActivate();
    });
  }
}

// 创建并初始化应用
const electronApp = new ElectronApp();
electronApp.init();
