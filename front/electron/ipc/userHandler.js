import { ipcMain } from 'electron';
import DatabaseManager from '../managers/database.js';
import { AppDb } from '../services/db/appDb.js';

/**
 * 设置用户相关的IPC处理器
 */
export function setupUserHandlers() {
  // 获取用户列表
  ipcMain.handle('user:getList', async (event, page = 1, limit = 20) => {
    try {
      const dbManager = DatabaseManager.getInstance();
      const appDb = new AppDb(dbManager.getAppDb());

      const offset = (page - 1) * limit;
      const options = {
        limit,
        offset,
        orderBy: 'updated_at DESC'
      };

      const users = await appDb.getAllUsers(options);

      return {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total: users.length
        }
      };
    } catch (error) {
      console.error('获取用户列表失败:', error);

      return {
        success: false,
        error: error.message
      };
    }
  });

  // 根据服务器和用户名获取用户
  ipcMain.handle('user:getByServerAndUsername', async (event, serverUrl, username) => {
    try {
      const dbManager = DatabaseManager.getInstance();
      const appDb = new AppDb(dbManager.getAppDb());

      const user = await appDb.getUserByServerAndUsername(serverUrl, username);

      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);

      return {
        success: false,
        error: error.message
      };
    }
  });

  // 添加用户
  ipcMain.handle('user:create', async (event, userData) => {
    try {
      const dbManager = DatabaseManager.getInstance();
      const appDb = new AppDb(dbManager.getAppDb());

      const userId = await appDb.addUser(userData);

      return {
        success: true,
        data: { lastID: userId }
      };
    } catch (error) {
      console.error('创建用户失败:', error);

      return {
        success: false,
        error: error.message
      };
    }
  });

  // 更新用户信息
  ipcMain.handle('user:update', async (event, userId, updateData) => {
    try {
      const dbManager = DatabaseManager.getInstance();
      const appDb = new AppDb(dbManager.getAppDb());

      const success = await appDb.updateUser(userId, updateData);

      return {
        success,
        data: { updated: success }
      };
    } catch (error) {
      console.error('更新用户信息失败:', error);

      return {
        success: false,
        error: error.message
      };
    }
  });

  // 删除用户
  ipcMain.handle('user:delete', async (event, userId) => {
    try {
      const dbManager = DatabaseManager.getInstance();
      const appDb = new AppDb(dbManager.getAppDb());

      const success = await appDb.deleteUser(userId);

      return {
        success,
        data: { deleted: success }
      };
    } catch (error) {
      console.error('删除用户失败:', error);

      return {
        success: false,
        error: error.message
      };
    }
  });

  // 检查用户名是否存在 - 基础实现，需要根据实际需求完善
  ipcMain.handle('user:checkUsername', async () => {
    // 暂时返回false，表示用户名不存在
    return {
      success: true,
      data: { exists: false }
    };
  });

  // 检查邮箱是否存在 - 基础实现，需要根据实际需求完善
  ipcMain.handle('user:checkEmail', async () => {
    // 暂时返回false，表示邮箱不存在
    return {
      success: true,
      data: { exists: false }
    };
  });

  // 根据用户名获取用户 - 基础实现，需要根据实际需求完善
  ipcMain.handle('user:getByUsername', async () => {
    // 暂时返回null
    return {
      success: true,
      data: null
    };
  });

  // 根据邮箱获取用户 - 基础实现，需要根据实际需求完善
  ipcMain.handle('user:getByEmail', async () => {
    // 暂时返回null
    return {
      success: true,
      data: null
    };
  });

  // 验证用户 - 基础实现，需要根据实际需求完善
  ipcMain.handle('user:validate', async () => {
    // 暂时返回失败
    return {
      success: false,
      data: null
    };
  });

  // 更新最后登录时间 - 基础实现，需要根据实际需求完善
  ipcMain.handle('user:updateLastLogin', async () => {
    // 暂时返回成功
    return {
      success: true,
      data: { updated: true }
    };
  });
}
