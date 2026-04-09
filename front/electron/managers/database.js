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
    this.maxBackupFilesPerDb = 10;
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
      // 使用环境变量中的全局数据路径，确保多实例共享
      const baseDataPath = process.env.LINX_DATA_PATH || app.getPath('userData');
      const appDataPath = path.join(baseDataPath, 'UserData'); // 存储用户数据的目录
      const appDbPath = path.join(appDataPath, 'app.db');
      this.ensureDir(path.dirname(appDbPath));

      // 检查数据库文件是否已存在且可能损坏
      const dbExists = fs.existsSync(appDbPath);
      const dbPassword = await this.getDatabasePassword('app');

      try {
        this.appDb = this.openDatabaseWithValidation(appDbPath, dbPassword);
      } catch (openError) {
        const isNotADB = this.isNotDatabaseError(openError);
        if (isNotADB && dbExists) {
          this.Logger.warn('APP_DB', '检测到损坏的数据库文件（pragma阶段），尝试静默恢复');
          try {
            this.appDb?.close();
          } catch {
            // 忽略关闭失败
          }

          const recovered = this.trySilentRestoreDatabase(appDbPath, dbPassword, 'APP_DB');
          if (recovered) {
            this.appDb = recovered;
          } else {
            this.backupDatabaseForRecovery(appDbPath, 'pragma-not-a-database', 'APP_DB');
            this.appDb = this.openDatabaseWithValidation(appDbPath, dbPassword);
          }
        } else {
          throw openError;
        }
      }

      try {
        // 尝试测试数据库连接
        this.appDb.prepare('SELECT 1').get();
      } catch (testError) {
        const isNotADB = this.isNotDatabaseError(testError);
        if (isNotADB && dbExists) {
          // 数据库文件损坏，优先静默恢复
          this.Logger.warn('APP_DB', '检测到损坏的数据库文件（连通性测试阶段），尝试静默恢复');
          this.appDb.close();

          const recovered = this.trySilentRestoreDatabase(appDbPath, dbPassword, 'APP_DB');
          if (recovered) {
            this.appDb = recovered;
          } else {
            this.backupDatabaseForRecovery(appDbPath, 'test-query-not-a-database', 'APP_DB');
            this.appDb = this.openDatabaseWithValidation(appDbPath, dbPassword);
          }
        } else {
          throw testError;
        }
      }

      // 读取并执行初始化脚本
      const sqlPath = app.isPackaged
        ? path.join(process.resourcesPath, 'database/initApp.sql')
        : path.join(app.getAppPath(), 'public/database/initApp.sql');

      const initScript = await fs.promises.readFile(sqlPath, 'utf8');

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
      userDb.pragma('journal_mode = WAL'); // 启用 WAL 模式

      // 读取并执行用户数据库初始化脚本
      const sqlPath = app.isPackaged
        ? path.join(process.resourcesPath, 'database/initUserDatabase.sql')
        : path.join(app.getAppPath(), 'public/database/initUserDatabase.sql');

      const initScript = await fs.promises.readFile(sqlPath, 'utf8');

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
      userDb.pragma('journal_mode = WAL'); // 启用 WAL 模式

      try {
        // 测试数据库连接
        userDb.prepare('SELECT 1').get();
      } catch (testError) {
        const isNotADB = this.isNotDatabaseError(testError);
        if (isNotADB) {
          // 数据库文件损坏，优先静默恢复
          this.Logger.warn('USER_DB', `用户 ${userId} 数据库文件损坏，尝试静默恢复`);
          userDb.close();

          const recovered = this.trySilentRestoreDatabase(userDbPath, dbPassword, 'USER_DB');
          if (recovered) {
            this.userDatabases.set(userId, recovered);

            return recovered;
          }

          this.backupDatabaseForRecovery(userDbPath, `user-${userId}-not-a-database`, 'USER_DB');

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

  isNotDatabaseError(error) {
    return error?.code === 'SQLITE_NOTADB' || String(error?.message || '').includes('not a database');
  }

  openDatabaseWithValidation(dbPath, dbPassword) {
    const db = new Database(dbPath);
    db.pragma('cipher = sqlcipher');
    db.pragma(`key = '${dbPassword}'`);
    db.pragma('journal_mode = WAL');
    db.prepare('SELECT 1').get();

    return db;
  }

  getBackupRoot(dbPath) {
    return path.join(path.dirname(dbPath), 'db-backups');
  }

  getBackupManifests(dbPath) {
    const backupRoot = this.getBackupRoot(dbPath);
    if (!fs.existsSync(backupRoot)) {
      return [];
    }

    const dbBaseName = path.basename(dbPath);

    return fs.readdirSync(backupRoot)
      .filter((name) => name.startsWith(`${dbBaseName}.bak.`) && name.endsWith('.manifest.json'))
      .map((name) => {
        const fullPath = path.join(backupRoot, name);

        return {
          fullPath,
          mtimeMs: fs.statSync(fullPath).mtimeMs
        };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .map((item) => item.fullPath);
  }

  createBackupBaseName(dbPath, reason) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');

    return `${path.basename(dbPath)}.bak.${stamp}.${reason}`;
  }

  moveFileSafe(sourcePath, targetPath) {
    if (!fs.existsSync(sourcePath)) {
      return false;
    }

    try {
      fs.renameSync(sourcePath, targetPath);

      return true;
    } catch {
      // 跨分区或占用时，降级为复制再删除
      fs.copyFileSync(sourcePath, targetPath);
      fs.unlinkSync(sourcePath);

      return true;
    }
  }

  cleanupOldBackups(backupRoot, dbBaseName, logTag) {
    if (!fs.existsSync(backupRoot)) {
      return;
    }

    const entries = fs.readdirSync(backupRoot)
      .filter((name) => name.startsWith(`${dbBaseName}.bak.`))
      .map((name) => ({
        name,
        fullPath: path.join(backupRoot, name),
        mtimeMs: fs.statSync(path.join(backupRoot, name)).mtimeMs
      }))
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    const stale = entries.slice(this.maxBackupFilesPerDb);
    for (const item of stale) {
      try {
        fs.rmSync(item.fullPath, { force: true });
      } catch (err) {
        this.Logger.warn(logTag, `清理旧备份失败: ${item.name} (${err.message})`);
      }
    }
  }

  backupDatabaseForRecovery(dbPath, reason, logTag = 'DB_RECOVERY') {
    if (!fs.existsSync(dbPath)) {
      return null;
    }

    const backupRoot = this.getBackupRoot(dbPath);
    this.ensureDir(backupRoot);

    const dbBaseName = path.basename(dbPath);
    const backupBaseName = this.createBackupBaseName(dbPath, reason);
    const movedFiles = [];
    const sidecars = ['', '-wal', '-shm'];

    for (const suffix of sidecars) {
      const src = `${dbPath}${suffix}`;
      const dest = path.join(backupRoot, `${backupBaseName}${suffix}`);
      const moved = this.moveFileSafe(src, dest);
      if (moved) {
        movedFiles.push(dest);
      }
    }

    const manifestPath = path.join(backupRoot, `${backupBaseName}.manifest.json`);
    const manifest = {
      originalPath: dbPath,
      reason,
      createdAt: new Date().toISOString(),
      files: movedFiles
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    this.cleanupOldBackups(backupRoot, dbBaseName, logTag);
    this.Logger.warn(logTag, `数据库已备份到: ${backupRoot}`);

    return { backupRoot, manifestPath, files: movedFiles };
  }

  restoreDatabaseFromManifest(manifestPath, logTag = 'DB_RECOVERY', copyOnly = false) {
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`备份清单不存在: ${manifestPath}`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const originalPath = manifest.originalPath;
    if (!originalPath) {
      throw new Error('备份清单缺少 originalPath');
    }

    const sidecars = ['', '-wal', '-shm'];
    for (const suffix of sidecars) {
      const sourceName = `${path.basename(manifestPath).replace('.manifest.json', '')}${suffix}`;
      const sourcePath = path.join(path.dirname(manifestPath), sourceName);
      const targetPath = `${originalPath}${suffix}`;

      if (fs.existsSync(sourcePath)) {
        if (copyOnly) {
          fs.copyFileSync(sourcePath, targetPath);
        } else {
          this.moveFileSafe(sourcePath, targetPath);
        }
      }
    }

    this.Logger.info(logTag, `已从备份清单恢复数据库: ${manifestPath}`);
  }

  trySilentRestoreDatabase(dbPath, dbPassword, logTag = 'DB_RECOVERY') {
    const manifests = this.getBackupManifests(dbPath);
    if (manifests.length === 0) {
      this.Logger.warn(logTag, `未找到可用于静默恢复的备份: ${dbPath}`);

      return null;
    }

    for (const manifestPath of manifests) {
      try {
        this.restoreDatabaseFromManifest(manifestPath, logTag, true);
        const db = this.openDatabaseWithValidation(dbPath, dbPassword);
        this.Logger.info(logTag, `静默恢复成功: ${manifestPath}`);

        return db;
      } catch (restoreError) {
        this.Logger.warn(logTag, `静默恢复失败: ${manifestPath} (${restoreError.message})`);
      }
    }

    return null;
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
