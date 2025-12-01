import { ipcMain } from 'electron';
import { AppDb } from '../services/db/appDb.js';

/**
 * 设置用户相关的IPC处理器
 * @param {import('../managers/database.js').default} databaseManager - 数据库管理器实例
 */
export function setupUserHandlers(databaseManager) {
  const appDb = new AppDb(databaseManager.appDb);

  // 保存账号信息 (登录成功后调用)
  ipcMain.handle('user:save-account', async (event, userData) => {
    try {
      // userData 应包含: server_url, username, nickname, avatar_url, refresh_token
      return await appDb.addUser(userData);
    } catch (error) {
      console.error('保存账号失败:', error);
      throw error;
    }
  });

  // 初始化用户个人数据库 (登录成功后调用)
  ipcMain.handle('user:init-db', async (event, userId) => {
    try {
      await databaseManager.initUserDatabase(userId);

      return true;
    } catch (error) {
      console.error('初始化用户数据库失败:', error);
      throw error;
    }
  });

  // 获取所有已保存的账号
  ipcMain.handle('user:get-accounts', async () => {
    try {
      return await appDb.getAllUsers();
    } catch (error) {
      console.error('获取账号列表失败:', error);
      throw error;
    }
  });

  // 删除账号
  ipcMain.handle('user:delete-account', async (event, { server_url, username }) => {
    try {
      await appDb.deleteUserByAccount(server_url, username);

      return true;
    } catch (error) {
      console.error('删除账号失败:', error);
      throw error;
    }
  });
}
