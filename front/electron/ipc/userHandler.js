import { ipcMain } from 'electron';
import { databaseService } from '../services/db/index.js';

function userToUserVo(user) {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    avatar_url: user.avatar_url,
    background_url: user.background_url,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

/**
 * 统一的数据库操作处理函数
 * @param {Function} operation - 要执行的数据库操作，接收 userDb 作为参数
 * @returns {Object} 统一格式的响应
 */
async function handleUserDbOperation(operation) {
  try {
    const userDb = databaseService.getUserDb();
    const result = await operation(userDb);

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function setupUserIpcHandlers() {
  // 创建用户
  ipcMain.handle('user:create', async (event, userData) => {
    return handleUserDbOperation(async (userDb) => {
      return await userDb.createUser(userData);
    });
  });

  // 根据用户名获取用户
  ipcMain.handle('user:getByUsername', async (event, username) => {
    return handleUserDbOperation(async (userDb) => {
      const user = await userDb.getUserByUsername(username);

      return userToUserVo(user);
    });
  });

  // 根据邮箱获取用户
  ipcMain.handle('user:getByEmail', async (event, email) => {
    return handleUserDbOperation(async (userDb) => {
      const user = await userDb.getUserByEmail(email);

      return userToUserVo(user);
    });
  });

  // 验证用户登录
  ipcMain.handle('user:validate', async (event, username, password) => {
    return handleUserDbOperation(async (userDb) => {
      const user = await userDb.validateUser(username, password);

      return userToUserVo(user);
    });
  });

  // 检查用户名是否存在
  ipcMain.handle('user:checkUsername', async (event, username) => {
    return handleUserDbOperation(async (userDb) => {
      const exists = await userDb.isUsernameExists(username);

      return { exists };
    });
  });

  // 检查邮箱是否存在
  ipcMain.handle('user:checkEmail', async (event, email) => {
    return handleUserDbOperation(async (userDb) => {
      const exists = await userDb.isEmailExists(email);

      return { exists };
    });
  });

  // 更新用户信息
  ipcMain.handle('user:update', async (event, id, updates) => {
    return handleUserDbOperation(async (userDb) => {
      return await userDb.updateUser(id, updates);
    });
  });

  // 删除用户
  ipcMain.handle('user:delete', async (event, id) => {
    return handleUserDbOperation(async (userDb) => {
      return await userDb.deleteUser(id);
    });
  });

  // 获取用户列表（分页）
  ipcMain.handle('user:getList', async (event, page, limit) => {
    return handleUserDbOperation(async (userDb) => {
      const users = await userDb.getUsers(page, limit);
      const total = await userDb.getUserCount();
      const safeUsers = users.map(userToUserVo);

      return { users: safeUsers, total };
    });
  });

  // 更新最后登录时间
  ipcMain.handle('user:updateLastLogin', async (event, id) => {
    return handleUserDbOperation(async (userDb) => {
      return await userDb.updateLastLogin(id);
    });
  });
}
