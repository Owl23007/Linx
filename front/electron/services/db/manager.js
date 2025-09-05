import { app, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';

// 获取当前模块的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = path.join(app.getPath('userData'), 'AppData', 'db', 'linx.db');

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
    if (this.db) {
      return this;
    }

    return new Promise((resolve, reject) => {
      // 使用明确的打开标志
      const flags = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
      this.db = new sqlite3.Database(this.dbPath, flags, async (err) => {
        if (err) {
          this.db = null;

          return reject(err);
        }

        try {
          await this._runInitSql();
          resolve(this);
        } catch (e) {
          dialog.showErrorBox('初始化数据库失败', e && e.message ? e.message : String(e));
          reject(e);
        }
      });
    });
  }

  /**
   * 使用 db.exec 一次性执行 init.sql（避免手动分割带来的边界问题）
   */
  async _runInitSql() {
    const initSqlPath = path.join(__dirname, '..', '..', '..', 'public', 'database', 'init.sql');

    if (!fs.existsSync(initSqlPath)) {
      return;
    }

    const sql = fs.readFileSync(initSqlPath, 'utf8').trim();

    if (!sql) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 确保数据库已初始化
   */
  _ensureDb() {
    if (!this.db) throw new Error('Database not initialized');
  }

  /**
   * 执行 SQL 语句
   */
  async run(sql, params = []) {
    this._ensureDb();

    return new Promise((resolve, reject) => {
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
   * 获取单行数据
   */
  async get(sql, params = []) {
    this._ensureDb();

    return new Promise((resolve, reject) => {
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
   * 获取所有行数据
   */
  async all(sql, params = []) {
    this._ensureDb();

    return new Promise((resolve, reject) => {
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
   * 获取数据库主实例
   */
  getMain() {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    return this;
  }

  /**
   * 关闭所有数据库连接
   */
  async close() {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          this.db = null;
          resolve();
        }
      });
    });
  }

  isInitialized() {
    return this.db !== null;
  }
}

// 导出单例实例
export const databaseManager = new DatabaseManager();
