import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../config/constants.js';
import { databaseMain } from '../services/database/database-main.js';

class IpcManager {
  constructor(windowManager) {
    this.windowManager = windowManager;
  }

  /**
   * 设置所有 IPC 处理器
   */
  setupHandlers() {
    this.setupWindowHandlers();
    this.setupDragHandlers();
    this.setupDatabaseHandlers();
  }

  /**
   * 设置窗口控制相关的 IPC 处理器
   */
  setupWindowHandlers() {
    // 关闭窗口
    ipcMain.on(IPC_CHANNELS.WINDOW.CLOSE, () => {
      this.windowManager.closeMainWindow();
    });

    // 最小化窗口
    ipcMain.on(IPC_CHANNELS.WINDOW.MINIMIZE, () => {
      this.windowManager.minimizeMainWindow();
    });

    // 最大化/还原窗口
    ipcMain.on(IPC_CHANNELS.WINDOW.MAXIMIZE, () => {
      this.windowManager.toggleMaximizeMainWindow();
    });
  }

  /**
   * 设置窗口拖拽相关的 IPC 处理器
   */
  setupDragHandlers() {
    // 获取窗口边界信息
    ipcMain.handle(IPC_CHANNELS.DRAG.GET_BOUNDS, (event) => {
      const win = event.sender.getOwnerBrowserWindow();

      return win ? win.getBounds() : null;
    });

    // 设置窗口位置
    ipcMain.handle(IPC_CHANNELS.DRAG.SET_BOUNDS, (event, x, y, width, height) => {
      const win = event.sender.getOwnerBrowserWindow();
      if (win) {
        // 不用 setPosition 是因为 https://github.com/electron/electron/issues/9477
        win.setBounds({
          x: Math.round(x),
          y: Math.round(y),
          width,
          height,
        });
      }
    });
  }

  /**
   * 设置数据库相关的 IPC 处理器
   */
  setupDatabaseHandlers() {
    // 数据库初始化
    ipcMain.handle('db:init', async () => {
      try {
        await databaseMain.init();

        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // 执行查询
    ipcMain.handle('db:query', async (event, sql, params) => {
      try {
        const result = await databaseMain.query(sql, params);

        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // 执行更新操作
    ipcMain.handle('db:run', async (event, sql, params) => {
      try {
        const result = await databaseMain.run(sql, params);

        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // 获取单条记录
    ipcMain.handle('db:get', async (event, sql, params) => {
      try {
        const result = await databaseMain.get(sql, params);

        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // 关闭数据库
    ipcMain.handle('db:close', async () => {
      try {
        await databaseMain.close();

        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }
}

export default IpcManager;
