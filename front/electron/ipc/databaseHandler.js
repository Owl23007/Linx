import { ipcMain } from 'electron';
import { databaseService } from '../services/db/index.js';

export function setupDatabaseHandlers() {
  // 数据库初始化
  ipcMain.handle('db:init', async () => {
    try {
      await databaseService.init();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 执行查询
  ipcMain.handle('db:query', async (event, sql, params) => {
    try {
      const dbMain = databaseService.getUserDb().dbMain;
      const result = await dbMain.all(sql, params);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 执行更新操作
  ipcMain.handle('db:run', async (event, sql, params) => {
    try {
      const dbMain = databaseService.getUserDb().dbMain;
      const result = await dbMain.run(sql, params);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 获取单条记录
  ipcMain.handle('db:get', async (event, sql, params) => {
    try {
      const dbMain = databaseService.getUserDb().dbMain;
      const result = await dbMain.get(sql, params);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 关闭数据库
  ipcMain.handle('db:close', async () => {
    try {
      await databaseService.close();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
