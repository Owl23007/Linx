import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    // 获取用户数据目录
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'linx.db');

    // 确保目录存在
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
  }

  /**
   * 初始化数据库连接
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error('数据库连接失败:', err);
          reject(err);
        } else {
          // eslint-disable-next-line no-console
          console.log('数据库连接成功:', this.dbPath);
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * 创建数据表
   */
  private async createTables(): Promise<void> {
    const tables = [
      // 用户表
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT,
        avatar TEXT,
        status TEXT DEFAULT 'online',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 聊天记录表
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER,
        group_id INTEGER,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        file_path TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (sender_id) REFERENCES users (id)
      )`,

      // 群组表
      `CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        avatar TEXT,
        creator_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users (id)
      )`,

      // 群组成员表
      `CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(group_id, user_id)
      )`,

      // 好友关系表
      `CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_id INTEGER NOT NULL,
        addressee_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users (id),
        FOREIGN KEY (addressee_id) REFERENCES users (id),
        UNIQUE(requester_id, addressee_id)
      )`,

      // 应用设置表
      `CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id)',
      'CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_friendships_requester_id ON friendships(requester_id)',
      'CREATE INDEX IF NOT EXISTS idx_friendships_addressee_id ON friendships(addressee_id)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
  }

  /**
   * 执行 SQL 语句
   */
  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));

        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          // eslint-disable-next-line no-console
          console.error('SQL执行失败:', err, 'SQL:', sql);
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * 查询单条记录
   */
  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));

        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error('SQL查询失败:', err, 'SQL:', sql);
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  /**
   * 查询多条记录
   */
  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('数据库未初始化'));

        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error('SQL查询失败:', err, 'SQL:', sql);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  /**
   * 开始事务
   */
  async beginTransaction(): Promise<void> {
    await this.run('BEGIN TRANSACTION');
  }

  /**
   * 提交事务
   */
  async commit(): Promise<void> {
    await this.run('COMMIT');
  }

  /**
   * 回滚事务
   */
  async rollback(): Promise<void> {
    await this.run('ROLLBACK');
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();

        return;
      }

      this.db.close((err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error('数据库关闭失败:', err);
          reject(err);
        } else {
          // eslint-disable-next-line no-console
          console.log('数据库连接已关闭');
          this.db = null;
          resolve();
        }
      });
    });
  }

  /**
   * 获取数据库路径
   */
  getDbPath(): string {
    return this.dbPath;
  }
}

// 导出单例实例
export const database = new Database();
