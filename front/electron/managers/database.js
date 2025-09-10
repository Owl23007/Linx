import Database from 'better-sqlite3-multiple-ciphers';
import crypto from 'crypto';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

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
      // get userData path
      const appDataPath = path.join(app.getPath('userData'), 'UserData'); // 存储用户数据的目录
      const appDbPath = path.join(appDataPath, 'app.db');
      this.ensureDir(path.dirname(appDbPath));

      // 检查数据库文件是否已存在且可能损坏
      const dbExists = fs.existsSync(appDbPath);

      this.appDb = new Database(appDbPath);

      // 设置数据库加密
      const dbPassword = await this.getDatabasePassword('app');
      console.log('dbPassword',dbPassword);
      this.appDb.pragma('cipher = sqlcipher');
      this.appDb.pragma(`key = '${dbPassword}'`);

      try {
        // 尝试测试数据库连接
        this.appDb.prepare('SELECT 1').get();
      } catch (testError) {
        if (testError.code === 'SQLITE_NOTADB' && dbExists) {
          // 数据库文件损坏，删除并重新创建
          this.Logger.warn('APP_DB', '检测到损坏的数据库文件，正在删除并重新创建');
          this.appDb.close();
          fs.unlinkSync(appDbPath);

          // 重新创建数据库
          this.appDb = new Database(appDbPath);
          this.appDb.pragma('cipher = sqlcipher');
          this.appDb.pragma(`key = '${dbPassword}'`);
        } else {
          throw testError;
        }
      }

      // 读取并执行初始化脚本
      const initScript = await fs.promises.readFile(
        path.join(process.cwd(), 'public/database/initApp.sql'),
        'utf8'
      );

      this.appDb.exec(initScript);
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
      const userDb = new Database(userDbPath);

      // 设置数据库加密
      const dbPassword = await this.getDatabasePassword(userId);
      userDb.pragma('cipher = sqlcipher');
      userDb.pragma(`key = '${dbPassword}'`);

      // 读取并执行用户数据库初始化脚本
      const initScript = await fs.promises.readFile(
        path.join(process.cwd(), 'public/database/initUserDatabase.sql'),
        'utf8'
      );

      userDb.exec(initScript);

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

    try {
      // 打开已存在的数据库
      const userDb = new Database(userDbPath);
      // 设置加密
      const dbPassword = await this.getDatabasePassword(userId);
      userDb.pragma('cipher = sqlcipher');
      userDb.pragma(`key = '${dbPassword}'`);

      try {
        // 测试数据库连接
        userDb.prepare('SELECT 1').get();
      } catch (testError) {
        if (testError.code === 'SQLITE_NOTADB') {
          // 数据库文件损坏，删除并重新创建
          this.Logger.warn('USER_DB', `用户 ${userId} 数据库文件损坏，正在重新创建`);
          userDb.close();
          fs.unlinkSync(userDbPath);

          return await this.initUserDatabase(userId);
        } else {
          throw testError;
        }
      }

      this.userDatabases.set(userId, userDb);

      return userDb;
    } catch (error) {
      this.Logger.error('USER_DB', `打开用户 ${userId} 数据库失败: ${error.message}`);
      throw error;
    }
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

    const sql = `
      INSERT INTO user_data (data_type, title, content, tags, is_encrypted, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;

    const stmt = userDb.prepare(sql);
    const result = stmt.run([
      dataType,
      title,
      JSON.stringify(encryptedData),
      tags,
      true
    ]);

    return result.lastInsertRowid;
  }

  // ================ 6. 数据解密读取 ================
  async getDecryptedUserData(userId, dataId) {
    const userDb = await this.getUserDatabase(userId);

    const sql = 'SELECT * FROM user_data WHERE id = ?';
    const stmt = userDb.prepare(sql);
    const row = stmt.get([dataId]);

    if (!row) {
      return null;
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

      return row;
    } catch (decryptError) {
      throw new Error(`解密失败: ${decryptError.message}`);
    }
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

  async getDatabasePassword(identifier) {
    if (!identifier) throw new Error('标识符不能为空');

    if (identifier === 'app') {
      let password = await this.keytarManager.deriveUserDEK('app', 'db-password');

      return password;
    }

    const account = 'db-password'; // 固定账户名

    try {
      let password = await this.keytarManager.getUserCredential(identifier, account);

      if (!password) {
        // 生成新密码
        password = this.generateSecurePassword();
        // 确保密码是字符串类型
        if (typeof password !== 'string') {
          password = String(password);
        }
        await this.keytarManager.storeUserCredential(identifier, account, password);
        this.Logger.info('DB_PASSWORD', `为 ${identifier} 生成新的数据库密码`);
      }

      // 确保返回字符串
      return String(password);
    } catch (error) {
      this.Logger.error('DB_PASSWORD', `获取数据库密码失败: ${error.message}`);
      throw error;
    }
  }

  generateSecurePassword() {
    return crypto.randomBytes(32).toString('hex');
  }

  async recordUserDatabase(userId, dbPath) {
    const sql = `
      INSERT OR REPLACE INTO user_database_meta
      (user_id, database_path, last_accessed_at)
      VALUES (?, ?, datetime('now'))
    `;

    const stmt = this.appDb.prepare(sql);
    const result = stmt.run([userId, dbPath]);

    return result.lastInsertRowid;
  }

  async deleteUserFromApp(userId) {
    const sql = 'DELETE FROM user WHERE id = ?';
    const stmt = this.appDb.prepare(sql);
    const result = stmt.run([userId]);

    return result.changes;
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
