import * as crypto from 'crypto';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';

export class UserDb {
  constructor(dbMain) {
    this.dbMain = dbMain;
    this.userDatabases = new Map(); // 缓存用户数据库连接
    this.userTokens = new Map(); // 缓存用户 token

    // 获取用户数据目录
    this.userDataPath = app.getPath('userData');
    this.userDbDir = path.join(this.userDataPath, 'users');
    this.tokenDir = path.join(this.userDataPath, 'tokens');

    this._ensureDirectories();
  }

  /**
   * 确保必要的目录存在
   */
  _ensureDirectories() {
    [this.userDbDir, this.tokenDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 生成用户专用的加密密钥
   * @param {string} userId 用户ID
   * @param {string} userPassword 用户密码或PIN
   * @returns {Buffer} 加密密钥
   */
  _generateUserKey(userId, userPassword) {
    const salt = crypto.createHash('sha256').update(`${userId}_salt`).digest();

    return crypto.pbkdf2Sync(userPassword, salt, 100000, 32, 'sha256');
  }

  /**
   * 加密数据
   * @param {string} data 要加密的数据
   * @param {Buffer} key 加密密钥
   * @returns {string} 加密后的数据（Base64格式）
   */
  _encryptData(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return Buffer.concat([iv, Buffer.from(encrypted, 'hex')]).toString('base64');
  }

  /**
   * 解密数据
   * @param {string} encryptedData 加密的数据（Base64格式）
   * @param {Buffer} key 解密密钥
   * @returns {string} 解密后的数据
   */
  _decryptData(encryptedData, key) {
    const data = Buffer.from(encryptedData, 'base64');
    const iv = data.slice(0, 16);
    const encrypted = data.slice(16);

    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * 获取用户数据库连接
   * @param {string} userId 用户ID
   * @param {string} userPassword 用户密码
   * @returns {Promise<sqlite3.Database>} 数据库连接
   */
  async getUserDatabase(userId, userPassword) {
    const cacheKey = `user_${userId}`;

    // 如果已缓存，直接返回
    if (this.userDatabases.has(cacheKey)) {
      return this.userDatabases.get(cacheKey);
    }

    const dbPath = path.join(this.userDbDir, `${userId}.db`);
    const userKey = this._generateUserKey(userId, userPassword);

    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(new Error(`打开用户数据库失败: ${err.message}`));

          return;
        }

        // 设置数据库加密（如果SQLite支持加密）
        // 注意：标准SQLite不支持加密，这里使用应用层加密
        db.run('PRAGMA journal_mode=WAL', (pragmaErr) => {
          if (pragmaErr) {
            reject(pragmaErr);

            return;
          }

          this._initializeUserTables(db)
            .then(() => {
              this.userDatabases.set(cacheKey, db);
              resolve(db);
            })
            .catch(reject);
        });
      });
    });
  }

  /**
   * 初始化用户表结构
   * @param {sqlite3.Database} db 数据库连接
   * @returns {Promise<void>}
   */
  async _initializeUserTables(db) {
    const tables = [
      // 用户个人信息表
      `CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        avatar TEXT,
        phone TEXT,
        bio TEXT,
        settings TEXT, -- JSON格式的用户设置
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 聊天记录表
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE NOT NULL,
        chat_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        content TEXT NOT NULL, -- 加密存储
        message_type TEXT DEFAULT 'text',
        reply_to TEXT,
        forwarded_from TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT 0,
        is_deleted BOOLEAN DEFAULT 0,
        edit_history TEXT -- JSON格式的编辑历史
      )`,

      // 聊天列表表
      `CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT UNIQUE NOT NULL,
        chat_name TEXT,
        chat_type TEXT DEFAULT 'private', -- private, group, channel
        participants TEXT, -- JSON格式的参与者列表
        admin_ids TEXT, -- JSON格式的管理员ID列表
        last_message TEXT,
        last_message_time DATETIME,
        unread_count INTEGER DEFAULT 0,
        is_muted BOOLEAN DEFAULT 0,
        is_archived BOOLEAN DEFAULT 0,
        chat_settings TEXT, -- JSON格式的聊天设置
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 文件记录表
      `CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT UNIQUE NOT NULL,
        message_id TEXT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL, -- 加密存储的文件路径
        file_size INTEGER,
        mime_type TEXT,
        thumbnail_path TEXT,
        upload_progress INTEGER DEFAULT 100,
        is_downloaded BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 联系人表
      `CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        display_name TEXT,
        email TEXT,
        phone TEXT,
        avatar TEXT,
        status TEXT DEFAULT 'offline', -- online, offline, away, busy
        last_seen DATETIME,
        is_blocked BOOLEAN DEFAULT 0,
        is_favorite BOOLEAN DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 群组成员表
      `CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'member', -- admin, member, owner
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        invited_by TEXT,
        UNIQUE(chat_id, user_id)
      )`
    ];

    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)',
      'CREATE INDEX IF NOT EXISTS idx_chats_last_message_time ON chats(last_message_time)',
      'CREATE INDEX IF NOT EXISTS idx_files_message_id ON files(message_id)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status)',
      'CREATE INDEX IF NOT EXISTS idx_group_members_chat ON group_members(chat_id)'
    ];

    return new Promise((resolve, reject) => {
      const allStatements = [...tables, ...indexes];
      let completed = 0;

      const executeNext = () => {
        if (completed >= allStatements.length) {
          resolve();

          return;
        }

        db.run(allStatements[completed], (err) => {
          if (err) {
            reject(err);

            return;
          }
          completed++;
          executeNext();
        });
      };

      executeNext();
    });
  }

  /**
   * 保存 RefreshToken
   * @param {string} userId 用户ID
   * @param {string} userPassword 用户密码
   * @param {Object} tokenData Token数据
   * @returns {Promise<void>}
   */
  async saveRefreshToken(userId, userPassword, tokenData) {
    const userKey = this._generateUserKey(userId, userPassword);
    const tokenPath = path.join(this.tokenDir, `${userId}_tokens.enc`);

    const tokenInfo = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt || Date.now() + (7 * 24 * 60 * 60 * 1000), // 默认7天
      tokenType: tokenData.tokenType || 'Bearer',
      scope: tokenData.scope || [],
      updatedAt: Date.now()
    };

    const encryptedData = this._encryptData(JSON.stringify(tokenInfo), userKey);

    return new Promise((resolve, reject) => {
      fs.writeFile(tokenPath, encryptedData, (err) => {
        if (err) {
          reject(new Error(`保存Token失败: ${err.message}`));

          return;
        }

        // 缓存到内存
        this.userTokens.set(userId, tokenInfo);
        resolve();
      });
    });
  }

  /**
   * 获取 RefreshToken
   * @param {string} userId 用户ID
   * @param {string} userPassword 用户密码
   * @returns {Promise<Object|null>} Token数据
   */
  async getRefreshToken(userId, userPassword) {
    // 先检查内存缓存
    if (this.userTokens.has(userId)) {
      const cachedToken = this.userTokens.get(userId);
      if (cachedToken.expiresAt > Date.now()) {
        return cachedToken;
      }
      // Token过期，从缓存中移除
      this.userTokens.delete(userId);
    }

    const userKey = this._generateUserKey(userId, userPassword);
    const tokenPath = path.join(this.tokenDir, `${userId}_tokens.enc`);

    return new Promise((resolve, reject) => {
      fs.readFile(tokenPath, 'utf8', (err, encryptedData) => {
        if (err) {
          if (err.code === 'ENOENT') {
            resolve(null); // 文件不存在

            return;
          }
          reject(new Error(`读取Token失败: ${err.message}`));

          return;
        }

        try {
          const decryptedData = this._decryptData(encryptedData, userKey);
          const tokenInfo = JSON.parse(decryptedData);

          // 检查Token是否过期
          if (tokenInfo.expiresAt <= Date.now()) {
            this.deleteRefreshToken(userId).catch(console.error);
            resolve(null);

            return;
          }

          // 缓存到内存
          this.userTokens.set(userId, tokenInfo);
          resolve(tokenInfo);
        } catch (decryptError) {
          reject(new Error(`解密Token失败: ${decryptError.message}`));
        }
      });
    });
  }

  /**
   * 删除 RefreshToken
   * @param {string} userId 用户ID
   * @returns {Promise<void>}
   */
  async deleteRefreshToken(userId) {
    const tokenPath = path.join(this.tokenDir, `${userId}_tokens.enc`);

    // 从内存缓存中删除
    this.userTokens.delete(userId);

    return new Promise((resolve, reject) => {
      fs.unlink(tokenPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          reject(new Error(`删除Token失败: ${err.message}`));

          return;
        }
        resolve();
      });
    });
  }

  /**
   * 检查并刷新Token
   * @param {string} userId 用户ID
   * @param {string} userPassword 用户密码
   * @param {Function} refreshCallback 刷新Token的回调函数
   * @returns {Promise<Object|null>} 有效的Token数据
   */
  async checkAndRefreshToken(userId, userPassword, refreshCallback) {
    const tokenInfo = await this.getRefreshToken(userId, userPassword);

    if (!tokenInfo) {
      return null;
    }

    // 如果Token即将过期（剩余时间少于1小时），尝试刷新
    const oneHour = 60 * 60 * 1000;
    if (tokenInfo.expiresAt - Date.now() < oneHour) {
      try {
        const newTokenData = await refreshCallback(tokenInfo.refreshToken);
        await this.saveRefreshToken(userId, userPassword, newTokenData);

        return newTokenData;
      } catch (refreshError) {
        console.error('刷新Token失败:', refreshError);
        await this.deleteRefreshToken(userId);

        return null;
      }
    }

    return tokenInfo;
  }

  /**
   * 加密存储消息内容
   * @param {string} userId 用户ID
   * @param {string} userPassword 用户密码
   * @param {string} content 消息内容
   * @returns {string} 加密后的内容
   */
  encryptMessageContent(userId, userPassword, content) {
    const userKey = this._generateUserKey(userId, userPassword);

    return this._encryptData(content, userKey);
  }

  /**
   * 解密消息内容
   * @param {string} userId 用户ID
   * @param {string} userPassword 用户密码
   * @param {string} encryptedContent 加密的内容
   * @returns {string} 解密后的内容
   */
  decryptMessageContent(userId, userPassword, encryptedContent) {
    const userKey = this._generateUserKey(userId, userPassword);

    return this._decryptData(encryptedContent, userKey);
  }

  /**
   * 关闭用户数据库连接
   * @param {string} userId 用户ID
   * @returns {Promise<void>}
   */
  async closeUserDatabase(userId) {
    const cacheKey = `user_${userId}`;
    const db = this.userDatabases.get(cacheKey);

    if (db) {
      return new Promise((resolve) => {
        db.close((err) => {
          if (err) {
            console.error(`关闭用户数据库失败: ${err.message}`);
          }
          this.userDatabases.delete(cacheKey);
          resolve();
        });
      });
    }
  }

  /**
   * 清理用户数据（用户注销时调用）
   * @param {string} userId 用户ID
   * @returns {Promise<void>}
   */
  async cleanupUserData(userId) {
    // 关闭数据库连接
    await this.closeUserDatabase(userId);

    // 删除Token
    await this.deleteRefreshToken(userId);

    // 从内存缓存中清除
    this.userTokens.delete(userId);

    // 可选：删除用户数据库文件（谨慎操作）
    // const dbPath = path.join(this.userDbDir, `${userId}.db`);
    // if (fs.existsSync(dbPath)) {
    //   fs.unlinkSync(dbPath);
    // }
  }
}
