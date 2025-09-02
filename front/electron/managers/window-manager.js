import { BrowserWindow } from 'electron';
import path from 'path';
import { WINDOW_CONFIG } from '../config/constants.js';
import { createSecureWebPreferences, getAppConfig, getCurrentDir } from '../utils/app-utils.js';

class WindowManager {
  constructor() {
    this.mainWindow = null;
  }

  /**
   * 创建主窗口
   */
  createMainWindow() {
    const currentDir = getCurrentDir(import.meta.url);
    const preloadPath = path.join(currentDir, '../preload/preload.cjs');
    const webPreferences = createSecureWebPreferences(preloadPath);

    this.mainWindow = new BrowserWindow({
      ...WINDOW_CONFIG.MAIN,
      webPreferences,
      show: false,
    });

    this.loadContent();
    this.setupWindowEvents();

    return this.mainWindow;
  }

  /**
   * 加载窗口内容
   */
  loadContent() {
    if (!this.mainWindow) return;

    const config = getAppConfig();

    // 开发环境加载 Vite dev server，生产环境加载打包后的文件
    if (config.isDev) {
      this.mainWindow.loadURL(`http://localhost:${config.vitePort}`);
    } else {
      // 生产环境使用打包后的文件
      const currentDir = getCurrentDir(import.meta.url);
      const indexPath = path.join(currentDir, '../../dist/index.html');
      this.mainWindow.loadFile(indexPath);
    }
  }  /**
   * 设置窗口事件
   */
  setupWindowEvents() {
    if (!this.mainWindow) return;

    // 窗口准备好后显示
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    // 窗口关闭时清理引用
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  /**
   * 获取主窗口
   */
  getMainWindow() {
    return this.mainWindow;
  }

  /**
   * 关闭主窗口
   */
  closeMainWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }
  }

  /**
   * 最小化主窗口
   */
  minimizeMainWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.minimize();
    }
  }

  /**
   * 最大化/还原主窗口
   */
  toggleMaximizeMainWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.restore();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  /**
   * 处理应用激活事件（macOS）
   */
  handleActivate() {
    // 如果没有窗口，则创建一个新窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createMainWindow();
    }
  }

  /**
   * 获取窗口边界信息
   */
  getWindowBounds() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return this.mainWindow.getBounds();
    }

    return null;
  }

  /**
   * 设置窗口位置和大小
   */
  setWindowBounds(x, y, width, height) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.setBounds({
        x: Math.round(x),
        y: Math.round(y),
        width,
        height,
      });
    }
  }
}

export default WindowManager;
