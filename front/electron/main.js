import { app, Menu } from 'electron';
import IpcManager from './managers/ipc.js';
import WindowManager from './managers/window.js';
import { databaseService } from './services/db/index.js';

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
        // 初始化数据库服务
        await databaseService.init();

        this.windowManager.createAuthWindow();
      } catch {
        // 处理初始化错误
        process.exit(1);
      }
    });

    // 所有窗口关闭时退出应用（macOS 除外）
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // 在应用退出前关闭数据库连接
    app.on('before-quit', async () => {
      try {
        await databaseService.close();
      } catch {
        // 忽略关闭错误
      }
    });

    // macOS 点击 dock 图标时重新创建窗口
    app.on('activate', () => {
      this.windowManager.handleActivate();
    });
  }
}

// 创建并初始化应用
const electronApp = new ElectronApp();
electronApp.init();
