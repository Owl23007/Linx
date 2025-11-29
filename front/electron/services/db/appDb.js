/**
 * AppDb - App级别数据库服务类
 * 专门处理 App 级别的数据库操作，主要管理用户表
 */
export class AppDb {
  constructor(dbInstance) {
    this.dbInstance = dbInstance;
  }

  /**
   * 添加新用户到本地数据库
   * @param {Object} userData - 用户数据
   * @param {string} userData.server_url - 服务器地址
   * @param {string} userData.username - 用户名
   * @param {string} userData.nickname - 昵称
   * @param {string} userData.avatar_url - 头像URL (可选)
   * @param {string} userData.refresh_token - 刷新令牌
   * @returns {Promise<number>} 新插入用户的ID
   */
  async addUser(userData) {
    const { server_url, username, nickname, avatar_url, refresh_token } = userData;

    if (!server_url || !username || !nickname || !refresh_token) {
      throw new Error('server_url, username, nickname 和 refresh_token 是必填字段');
    }

    const sql = `
      INSERT INTO user (server_url, username, nickname, avatar_url, refresh_token, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    try {
      const result = await this.dbInstance.prepare(sql).run(server_url, username, nickname, avatar_url, refresh_token);

      return result.lastInsertRowid;
    } catch (error) {
      // 处理唯一约束冲突
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // 如果已存在，则更新
        return this.updateUser(userData);
      }
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param {Object} userData - 用户数据
   * @returns {Promise<number>} 更新的用户ID
   */
  async updateUser(userData) {
    const { server_url, username, nickname, avatar_url, refresh_token } = userData;

    const sql = `
      UPDATE user
      SET nickname = ?, avatar_url = ?, refresh_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE server_url = ? AND username = ?
    `;

    const result = await this.dbInstance.prepare(sql).run(nickname, avatar_url, refresh_token, server_url, username);

    if (result.changes > 0) {
      const user = await this.getUserByServerAndUsername(server_url, username);

      return user ? user.user_id : 0;
    }

    return 0;
  }

  /**
   * 根据服务器地址和用户名获取用户信息
   * @param {string} server_url - 服务器地址
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 用户信息或null
   */
  async getUserByServerAndUsername(server_url, username) {
    if (!server_url || !username) {
      throw new Error('server_url 和 username 是必填参数');
    }

    const sql = `
      SELECT user_id, server_url, username, nickname, avatar_url, refresh_token, created_at, updated_at
      FROM user
      WHERE server_url = ? AND username = ?
    `;

    return await this.dbInstance.prepare(sql).get(server_url, username);
  }

  /**
   * 根据用户ID获取用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object|null>} 用户信息或null
   */
  async getUserById(userId) {
    if (!userId) {
      throw new Error('userId 是必填参数');
    }

    const sql = `
      SELECT user_id, server_url, username, nickname, avatar_url, refresh_token, created_at, updated_at
      FROM user
      WHERE user_id = ?
    `;

    return await this.dbInstance.prepare(sql).get(userId);
  }

  /**
   * 删除用户
   * @param {string} server_url - 服务器地址
   * @param {string} username - 用户名
   */
  async deleteUser(server_url, username) {
    const sql = 'DELETE FROM user WHERE server_url = ? AND username = ?';
    await this.dbInstance.prepare(sql).run(server_url, username);
  }

  /**
   * 获取所有用户列表
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 限制数量 (可选)
   * @param {number} options.offset - 偏移量 (可选)
   * @param {string} options.orderBy - 排序字段 (可选，默认 updated_at DESC)
   * @returns {Promise<Array>} 用户列表
   */
  async getAllUsers(options = {}) {
    const { limit, offset, orderBy = 'updated_at DESC' } = options;

    let sql = `
      SELECT user_id, server_url, username, nickname, avatar_url, refresh_token, created_at, updated_at
      FROM user
      ORDER BY ${orderBy}
    `;

    const params = [];

    if (limit) {
      sql += ' LIMIT ?';
      params.push(limit);

      if (offset) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }

    return this.dbInstance.prepare(sql).all(...params);
  }

  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 要更新的数据
   * @param {string} updateData.nickname - 昵称 (可选)
   * @param {string} updateData.avatar_url - 头像URL (可选)
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateUser(userId, updateData) {
    if (!userId) {
      throw new Error('userId 是必填参数');
    }

    const allowedFields = ['nickname', 'avatar_url'];
    const updateFields = [];
    const params = [];

    // 构建动态更新字段
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updateFields.length === 0) {
      throw new Error('没有有效的更新字段');
    }

    // 添加更新时间
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    const sql = `
      UPDATE user
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const result = await this.dbInstance.run(sql, params);

    return result.changes > 0;
  }

  /**
   * 删除用户
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteUser(userId) {
    if (!userId) {
      throw new Error('userId 是必填参数');
    }

    const sql = 'DELETE FROM user WHERE id = ?';
    const result = await this.dbInstance.run(sql, [userId]);

    return result.changes > 0;
  }

  /**
   * 根据服务器地址和用户名删除用户
   * @param {string} server_url - 服务器地址
   * @param {string} username - 用户名
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteUserByServerAndUsername(server_url, username) {
    if (!server_url || !username) {
      throw new Error('server_url 和 username 是必填参数');
    }

    const sql = 'DELETE FROM user WHERE server_url = ? AND username = ?';
    const result = await this.dbInstance.run(sql, [server_url, username]);

    return result.changes > 0;
  }

  /**
   * 检查用户是否存在
   * @param {string} server_url - 服务器地址
   * @param {string} username - 用户名
   * @returns {Promise<boolean>} 用户是否存在
   */
  async userExists(server_url, username) {
    if (!server_url || !username) {
      throw new Error('server_url 和 username 是必填参数');
    }

    const sql = 'SELECT 1 FROM user WHERE server_url = ? AND username = ? LIMIT 1';
    const result = await this.dbInstance.get(sql, [server_url, username]);

    return !!result;
  }

  /**
   * 获取用户数量
   * @returns {Promise<number>} 用户总数
   */
  async getUserCount() {
    const sql = 'SELECT COUNT(*) as count FROM user';
    const result = await this.dbInstance.get(sql);

    return result.count;
  }

  /**
   * 根据服务器地址获取用户列表
   * @param {string} server_url - 服务器地址
   * @returns {Promise<Array>} 该服务器的用户列表
   */
  async getUsersByServer(server_url) {
    if (!server_url) {
      throw new Error('server_url 是必填参数');
    }

    const sql = `
      SELECT id, server_url, username, nickname, avatar_url, created_at, updated_at
      FROM user
      WHERE server_url = ?
      ORDER BY updated_at DESC
    `;

    return await this.dbInstance.all(sql, [server_url]);
  }

  /**
   * 搜索用户 (根据昵称或用户名模糊匹配)
   * @param {string} searchTerm - 搜索关键词
   * @returns {Promise<Array>} 匹配的用户列表
   */
  async searchUsers(searchTerm) {
    if (!searchTerm) {
      throw new Error('searchTerm 是必填参数');
    }

    const sql = `
      SELECT id, server_url, username, nickname, avatar_url, created_at, updated_at
      FROM user
      WHERE nickname LIKE ? OR username LIKE ?
      ORDER BY updated_at DESC
    `;

    const likePattern = `%${searchTerm}%`;

    return await this.dbInstance.all(sql, [likePattern, likePattern]);
  }

  /**
   * 批量添加用户
   * @param {Array<Object>} users - 用户数据数组
   * @returns {Promise<Array<number>>} 新插入用户的ID数组
   */
  async addUsers(users) {
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('users 必须是非空数组');
    }

    const insertedIds = [];

    // 使用事务处理批量插入
    for (const userData of users) {
      try {
        const userId = await this.addUser(userData);
        insertedIds.push(userId);
      } catch (error) {
        // 记录错误但继续处理其他用户
        console.warn(`添加用户 ${userData.username}@${userData.server_url} 失败:`, error.message);
      }
    }

    return insertedIds;
  }

  /**
   * 更新用户最后活动时间
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否更新成功
   */
  async updateUserLastActivity(userId) {
    if (!userId) {
      throw new Error('userId 是必填参数');
    }

    const sql = 'UPDATE user SET updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    const result = await this.dbInstance.run(sql, [userId]);

    return result.changes > 0;
  }

  /**
   * 清空所有用户数据
   * @returns {Promise<boolean>} 是否清空成功
   */
  async clearAllUsers() {
    const sql = 'DELETE FROM user';
    const result = await this.dbInstance.run(sql);

    return result.changes > 0;
  }
}
