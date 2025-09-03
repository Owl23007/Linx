import { ipcMain } from 'electron';
import { databaseService } from '../services/db/index.js';

export function setupUserIpcHandlers() {
  // 创建用户
  ipcMain.handle('user:create', async (event, userData) => {
    try {
      const userDb = databaseService.getUserDb();
      const result = await userDb.createUser(userData);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 根据用户名获取用户
  ipcMain.handle('user:getByUsername', async (event, username) => {
    try {
      const userDb = databaseService.getUserDb();
      const user = await userDb.getUserByUsername(username);

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 根据邮箱获取用户
  ipcMain.handle('user:getByEmail', async (event, email) => {
    try {
      const userDb = databaseService.getUserDb();
      const user = await userDb.getUserByEmail(email);

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 验证用户登录
  ipcMain.handle('user:validate', async (event, username, password) => {
    try {
      const userDb = databaseService.getUserDb();
      const user = await userDb.validateUser(username, password);

      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查用户名是否存在
  ipcMain.handle('user:checkUsername', async (event, username) => {
    try {
      const userDb = databaseService.getUserDb();
      const exists = await userDb.isUsernameExists(username);

      return { success: true, data: { exists } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 检查邮箱是否存在
  ipcMain.handle('user:checkEmail', async (event, email) => {
    try {
      const userDb = databaseService.getUserDb();
      const exists = await userDb.isEmailExists(email);

      return { success: true, data: { exists } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 更新用户信息
  ipcMain.handle('user:update', async (event, id, updates) => {
    try {
      const userDb = databaseService.getUserDb();
      const result = await userDb.updateUser(id, updates);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 删除用户
  ipcMain.handle('user:delete', async (event, id) => {
    try {
      const userDb = databaseService.getUserDb();
      const result = await userDb.deleteUser(id);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 获取用户列表（分页）
  ipcMain.handle('user:getList', async (event, page, limit) => {
    try {
      const userDb = databaseService.getUserDb();
      const users = await userDb.getUsers(page, limit);
      const total = await userDb.getUserCount();

      return { success: true, data: { users, total } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 更新最后登录时间
  ipcMain.handle('user:updateLastLogin', async (event, id) => {
    try {
      const userDb = databaseService.getUserDb();
      const result = await userDb.updateLastLogin(id);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
