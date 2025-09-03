export class UserDb {
  constructor(dbMain) {
    this.dbMain = dbMain;
  }

  /**
   * 创建用户
   * @param {Object} user - 用户信息
   * @param {string} user.username - 用户名
   * @param {string} user.password - 密码（已加密）
   * @param {string} [user.email] - 邮箱
   * @param {string} [user.avatar] - 头像
   */
  async createUser(user) {
    const sql = `
      INSERT INTO users (username, password, email, avatar, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;
    const params = [user.username, user.password, user.email || null, user.avatar || null];

    return await this.dbMain.run(sql, params);
  }

  /**
   * 根据用户名查找用户
   * @param {string} username
   */
  async getUserByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?';

    return await this.dbMain.get(sql, [username]);
  }

  /**
   * 根据邮箱查找用户
   * @param {string} email
   */
  async getUserByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';

    return await this.dbMain.get(sql, [email]);
  }

  /**
   * 根据ID查找用户
   * @param {number} id
   */
  async getUserById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';

    return await this.dbMain.get(sql, [id]);
  }

  /**
   * 更新用户信息
   * @param {number} id
   * @param {Object} updates
   */
  async updateUser(id, updates) {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`;

    return await this.dbMain.run(sql, values);
  }

  /**
   * 删除用户
   * @param {number} id
   */
  async deleteUser(id) {
    const sql = 'DELETE FROM users WHERE id = ?';

    return await this.dbMain.run(sql, [id]);
  }

  /**
   * 验证用户登录
   * @param {string} username
   * @param {string} password - 已加密的密码
   */
  async validateUser(username, password) {
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';

    return await this.dbMain.get(sql, [username, password]);
  }

  /**
   * 检查用户名是否存在
   * @param {string} username
   */
  async isUsernameExists(username) {
    const user = await this.getUserByUsername(username);

    return !!user;
  }

  /**
   * 检查邮箱是否存在
   * @param {string} email
   */
  async isEmailExists(email) {
    const user = await this.getUserByEmail(email);

    return !!user;
  }

  /**
   * 获取所有用户（分页）
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   */
  async getUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const sql = 'SELECT id, username, email, avatar, created_at, updated_at FROM users LIMIT ? OFFSET ?';

    return await this.dbMain.all(sql, [limit, offset]);
  }

  /**
   * 获取用户总数
   */
  async getUserCount() {
    const sql = 'SELECT COUNT(*) as count FROM users';
    const result = await this.dbMain.get(sql);

    return result.count;
  }

  /**
   * 更新用户最后登录时间
   * @param {number} id
   */
  async updateLastLogin(id) {
    const sql = 'UPDATE users SET last_login = datetime(\'now\') WHERE id = ?';

    return await this.dbMain.run(sql, [id]);
  }
}
