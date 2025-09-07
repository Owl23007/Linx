import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

class DatabaseManager {

  constructor(logger = console,keytarManager) {
    this.Logger = logger;
    this.keytarManager = keytarManager;
    this.appDb = null;
    this.userDatabases = new Map(); // 缓存用户数据库连接
  }

  async getInstance() {
    return this.appDb;
  }

  // ================ 1. 初始化 ================
  async init() {
    await this.initAppDatabase();

    this.Logger.info('DATABASE_MANAGER', '数据库管理器初始化完成');
  }

  // ================ 2. App级别数据库 ================
  async initAppDatabase() {
    try {
      const appDbPath = path.join(process.env.USERDATA_PATH || './userData', 'app.db');
      this.ensureDir(path.dirname(appDbPath));

      this.appDb = new sqlite3.Database(appDbPath);

      // 读取并执行初始化脚本
      const initScript = await fs.promises.readFile(
        path.join(process.cwd(), 'public/database/initApp.sql'),
        'utf8'
      );

      await this.executeScript(this.appDb, initScript);
      this.Logger.info('APP_DB', 'App数据库初始化成功');
    } catch (error) {
      this.Logger.error('APP_DB', `App数据库初始化失败: ${error.message}`);
      throw error;
    }
  }

  // ================ 3. 用户级别数据库 ================
  async initUserDatabase(userId) {
    if (!userId) throw new Error('用户ID不能为空');

    try {
      // 确保用户数据库目录存在
      this.keytarManager.ensureUserDatabaseDir(userId);

      const userDbPath = this.keytarManager.getUserDatabasePath(userId);
      const userDb = new sqlite3.Database(userDbPath);

      // 读取并执行用户数据库初始化脚本
      const initScript = await fs.promises.readFile(
        path.join(process.cwd(), 'public/database/initUserDatabase.sql'),
        'utf8'
      );

      await this.executeScript(userDb, initScript);

      // 记录用户数据库元信息到App数据库
      await this.recordUserDatabase(userId, userDbPath);

      // 缓存数据库连接
      this.userDatabases.set(userId, userDb);

      this.Logger.info('USER_DB', `用户 ${userId} 数据库初始化成功`);

      return userDb;
    } catch (error) {
      this.Logger.error('USER_DB', `用户 ${userId} 数据库初始化失败: ${error.message}`);
      throw error;
    }
  }

  // ================ 4. 获取用户数据库连接 ================
  async getUserDatabase(userId) {
    if (!userId) throw new Error('用户ID不能为空');

    // 检查缓存
    if (this.userDatabases.has(userId)) {
      return this.userDatabases.get(userId);
    }

    // 检查数据库文件是否存在
    const userDbPath = this.keytarManager.getUserDatabasePath(userId);
    if (!fs.existsSync(userDbPath)) {
      // 数据库不存在，创建新的
      return await this.initUserDatabase(userId);
    }

    // 打开已存在的数据库
    const userDb = new sqlite3.Database(userDbPath);
    this.userDatabases.set(userId, userDb);

    return userDb;
  }

  // ================ 5. 数据加密存储 ================
  async storeEncryptedUserData(userId, dataType, data, title = '', tags = '') {
    const userDb = await this.getUserDatabase(userId);
    const userKey = this.keytarManager.deriveUserDEK(userId, dataType);

    // 加密数据
    const encryptedData = this.keytarManager.encryptData(
      JSON.stringify(data),
      userKey,
      `${userId}:${dataType}` // 附加认证数据
    );

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO user_data (data_type, title, content, tags, is_encrypted, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `;

      userDb.run(sql, [
        dataType,
        title,
        JSON.stringify(encryptedData),
        tags,
        true
      ], function(error) {
        if (error) {
          reject(error);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // ================ 6. 数据解密读取 ================
  async getDecryptedUserData(userId, dataId) {
    const userDb = await this.getUserDatabase(userId);

    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM user_data WHERE id = ?';

      userDb.get(sql, [dataId], (error, row) => {
        if (error) {
          reject(error);

          return;
        }

        if (!row) {
          resolve(null);

          return;
        }

        try {
          if (row.is_encrypted) {
            const userKey = this.keytarManager.deriveUserDEK(userId, row.data_type);
            const encryptedData = JSON.parse(row.content);
            const decryptedContent = this.keytarManager.decryptData(
              encryptedData,
              userKey,
              `${userId}:${row.data_type}`
            );

            row.content = JSON.parse(decryptedContent);
          } else {
            row.content = JSON.parse(row.content);
          }

          resolve(row);
        } catch (decryptError) {
          reject(new Error(`解密失败: ${decryptError.message}`));
        }
      });
    });
  }

  // ================ 7. 用户凭据管理 ================
  async storeUserCredentials(userId, accessToken, refreshToken) {
    await this.keytarManager.storeUserCredential(userId, 'access_token', accessToken);
    await this.keytarManager.storeUserCredential(userId, 'refresh_token', refreshToken);
  }

  async getUserCredentials(userId) {
    const accessToken = await this.keytarManager.getUserCredential(userId, 'access_token');
    const refreshToken = await this.keytarManager.getUserCredential(userId, 'refresh_token');

    return { accessToken, refreshToken };
  }

  // ================ 8. 清理用户数据 ================
  async deleteUser(userId) {
    try {
      // 关闭数据库连接
      if (this.userDatabases.has(userId)) {
        const userDb = this.userDatabases.get(userId);
        userDb.close();
        this.userDatabases.delete(userId);
      }

      // 删除用户数据和凭据
      await this.keytarManager.deleteUserData(userId, true);

      // 从App数据库删除用户记录
      await this.deleteUserFromApp(userId);

      this.Logger.info('DELETE_USER', `用户 ${userId} 已完全删除`);

      return true;
    } catch (error) {
      this.Logger.error('DELETE_USER', `删除用户 ${userId} 失败: ${error.message}`);

      return false;
    }
  }

  // ================ 工具方法 ================
  ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
  }

  executeScript(db, script) {
    return new Promise((resolve, reject) => {
      db.exec(script, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async recordUserDatabase(userId, dbPath) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO user_database_meta
        (user_id, database_path, last_accessed_at)
        VALUES (?, ?, datetime('now'))
      `;

      this.appDb.run(sql, [userId, dbPath], function(error) {
        if (error) {
          reject(error);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async deleteUserFromApp(userId) {
    return new Promise((resolve, reject) => {
      this.appDb.run('DELETE FROM user WHERE id = ?', [userId], function(error) {
        if (error) {
          reject(error);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // ================ 清理资源 ================
  async close() {
    // 关闭所有用户数据库连接
    for (const [userId, userDb] of this.userDatabases) {
      userDb.close();
      this.Logger.info('CLOSE', `用户 ${userId} 数据库连接已关闭`);
    }
    this.userDatabases.clear();

    // 关闭App数据库连接
    if (this.appDb) {
      this.appDb.close();
      this.appDb = null;
      this.Logger.info('CLOSE', 'App数据库连接已关闭');
    }
  }

  getAppDb() {
    return this.appDb;
  }
}

export default DatabaseManager;
