import path from 'path';
import sqlite3 from 'sqlite3';
import { getCurrentDir } from '../../utils/app.js';

class DatabaseService {
  constructor() {
    this.db = null;
    const currentDir = getCurrentDir(import.meta.url);
    this.dbPath = path.join(currentDir, '../../public/database/app.db');
  }

  /**
   * 初始化数据库连接
   */
  async initialize() {
    try {
      this.db = new sqlite3.Database(this.dbPath);
      await this.createTables();

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';

      return { success: false, error: errorMessage };
    }
  }

  /**
   * 创建必要的数据表
   */
  async createTables() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));

        return;
      }

      // 这里可以添加创建表的 SQL 语句
      const createUserTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createUserTable, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 获取数据库实例
   */
  getDatabase() {
    return this.db;
  }
}

export default DatabaseService;
