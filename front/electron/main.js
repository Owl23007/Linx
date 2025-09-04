import { app, Menu } from 'electron';
import IpcManager from './managers/ipc.js';
import WindowManager from './managers/window.js';
import { databaseService } from './services/db/index.js';
import { logger } from './utils/log.js';

class ElectronApp {
  constructor() {
    this.windowManager = new WindowManager();
    this.ipcManager = new IpcManager(this.windowManager);
  }

  async init() {
    // 禁用应用程序菜单
    Menu.setApplicationMenu(null);

    // 设置 IPC 处理器
    this.ipcManager.setupHandlers();

    // 应用准备就绪时创建窗口和初始化数据库
    app.whenReady().then(async () => {
      try {
        logger.info('APP_STARTUP', '应用程序启动中...');

        // 初始化数据库服务
        await databaseService.init();
        logger.info('DATABASE_INIT', '数据库初始化成功');

        this.windowManager.createAuthWindow();
        logger.info('WINDOW_CREATED', '认证窗口创建成功');

        // 清理旧日志文件
        logger.cleanOldLogs(30);
        logger.info('LOG_CLEANUP', '旧日志文件清理完成');

      } catch (error) {
        // 记录初始化错误
        await logger.error('APP_INITIALIZATION', error);
        logger.error('APP_EXIT', '应用程序因初始化失败退出');

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
    app.on('before-quit', async () => {
      try {
        logger.info('DATABASE_CLOSE', '正在关闭数据库连接...');
        await databaseService.close();
        logger.info('DATABASE_CLOSE', '数据库连接已关闭');
      } catch (error) {
        await logger.error('DATABASE_CLOSE', error);
      }
    });

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
