import { ipcMain } from 'electron';
import { AppDb } from '../services/db/appDb.js';

/**
 * 设置用户相关的IPC处理器
 * @param {import('better-sqlite3').Database} dbInstance - 数据库实例
 */
export function setupUserHandlers(dbInstance) {
  const appDb = new AppDb(dbInstance);

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
      await appDb.deleteUser(server_url, username);

      return true;
    } catch (error) {
      console.error('删除账号失败:', error);
      throw error;
    }
  });
}
