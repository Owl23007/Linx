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
    // 检查数据库文件是否已存在
    if (fs.existsSync(this.dbPath)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
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

// 导出单例实例
export const databaseMain = new DatabaseMain();
