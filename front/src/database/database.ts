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
    // 获取 init.sql 文件路径
    const initSqlPath = path.join(__dirname, '..', 'public', 'database', 'init.sql');

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
