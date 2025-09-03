import { BrowserWindow, dialog } from 'electron';
import path from 'path';
import { WINDOW_CONFIG } from '../config/constants.js';
import { createSecureWebPreferences, getAppConfig, getCurrentDir } from '../utils/app.js';

class WindowManager {
  constructor() {
    this.mainWindow = null;
  }

  /**
   * 创建认证窗口
   */
  createAuthWindow() {
    const currentDir = getCurrentDir(import.meta.url);
    const preloadPath = path.join(currentDir, '../preload/preload.cjs');
    const webPreferences = createSecureWebPreferences(preloadPath);

    this.mainWindow = new BrowserWindow({
      ...WINDOW_CONFIG.Auth,
      webPreferences,
      show: false,
    });

    this.loadContent();
    this.setupWindowEvents();

    return this.mainWindow;
  }

  createErrorWindow(title, message, details = null) {
    const currentDir = getCurrentDir(import.meta.url);
    const preloadPath = path.join(currentDir, '../preload/preload.cjs');
    const webPreferences = createSecureWebPreferences(preloadPath);

    const errorWindow = new BrowserWindow({
      ...WINDOW_CONFIG.ERROR,
      webPreferences,
      show: false,
    });

    const config = getAppConfig();

    // 构建URL参数
    const params = new URLSearchParams({
      title: title,
      message: message
    });

    if (details) {
      params.append('details', details);
    }

    // 根据环境加载错误页面
    if (config.isDev) {
      // 开发环境：使用Vite开发服务器访问public文件夹
      errorWindow.loadURL(`http://localhost:${config.vitePort}/error.html?${params.toString()}`);
    } else {
      // 生产环境：使用打包后的文件
      const errorPagePath = path.join(currentDir, '../../dist/error.html');
      errorWindow.loadFile(errorPagePath, {
        search: params.toString()
      });
    }

    return errorWindow;
  }  /**
   * 显示错误窗口的便捷方法
   * @param {string} title - 错误标题
   * @param {string} message - 错误消息
   * @param {Object} options - 可选配置
   */
  showError(title = '错误', message = '发生了未知错误', options = {}) {
    try {
      const errorWindow = this.createErrorWindow(title, message, options.details);

      // 设置错误窗口事件
      errorWindow.once('ready-to-show', () => {
        errorWindow.show();

        // 如果指定了自动关闭时间，则设置定时器
        if (options.autoClose && typeof options.autoClose === 'number') {
          setTimeout(() => {
            if (!errorWindow.isDestroyed()) {
              errorWindow.close();
            }
          }, options.autoClose);
        }
      });

      // 错误窗口关闭时的清理
      errorWindow.on('closed', () => {
        // 错误窗口关闭清理完成
      });

      // 如果需要聚焦到错误窗口
      if (options.focus !== false) {
        errorWindow.focus();
      }

      // 如果需要置顶显示
      if (options.alwaysOnTop) {
        errorWindow.setAlwaysOnTop(true);
      }

      return errorWindow;
    } catch {
      // 如果创建错误窗口失败，使用系统对话框作为备选方案
      dialog.showErrorBox(title, message);
    }
  }

  /**
   * 显示网络错误
   */
  showNetworkError(message = '网络连接失败，请检查网络设置') {
    return this.showError('网络错误', message, {
      autoClose: 5000,
      alwaysOnTop: true
    });
  }

  /**
   * 显示文件操作错误
   */
  showFileError(message = '文件操作失败') {
    return this.showError('文件错误', message, {
      focus: true
    });
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
