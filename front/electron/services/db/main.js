import { app, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

// 获取当前模块的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseMain {
  constructor() {
    this.db = null;

    // 获取用户数据目录
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'linx.db');

    // 确保目录存在
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  /**
   * 初始化数据库
   */
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          // 如果数据库文件不存在或为空，创建表
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  /**
   * 创建数据表
   */
  async createTables() {
    // 获取 init.sql 文件路径
    const initSqlPath = path.join(__dirname, '..', '..', '..', 'public', 'database', 'init.sql');

    try {
      // 读取 SQL 文件内容
      const sql = fs.readFileSync(initSqlPath, 'utf8');

      // 分割 SQL 语句并逐个执行
      const statements = sql.split(';').filter(stmt => stmt.trim() !== '');

      for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (trimmedStatement) {
          await this.run(trimmedStatement);
        }
      }
    } catch (err) {
      // 显示错误弹窗
      dialog.showErrorBox('初始化数据库失败', err.message);
    }
  }

  /**
   * 执行 SQL 语句（返回 Promise）
   * @param {string} sql
   * @param {Array|Object} [params]
   */
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('Database not initialized'));
      }
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * 查询数据（返回单条记录）
   * @param {string} sql
   * @param {Array|Object} [params]
   */
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('Database not initialized'));
      }
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * 查询数据（返回多条记录）
   * @param {string} sql
   * @param {Array|Object} [params]
   */
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject(new Error('Database not initialized'));
      }
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 关闭数据库连接
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 检查数据库是否已初始化
   */
  isInitialized() {
    return this.db !== null;
  }
}
