import { app, Menu } from 'electron';
import IpcManager from './managers/ipc.js';
import WindowManager from './managers/window.js';
import { databaseMain } from './services/db/main.js';

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
      // 初始化数据库
      await databaseMain.init();

      this.windowManager.createAuthWindow();
    });

    // 所有窗口关闭时退出应用（macOS 除外）
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // 在应用退出前关闭数据库连接
    app.on('before-quit', async () => {
      await databaseMain.close();
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
