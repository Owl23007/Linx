import { DatabaseMain } from './main.js';

class DatabaseManager {
  constructor() {
    this.dbMain = null;
  }

  /**
   * 初始化数据库管理器
   */
  async init() {
    if (!this.dbMain) {
      this.dbMain = new DatabaseMain();
      await this.dbMain.init();
    }

    return this.dbMain;
  }

  /**
   * 获取数据库主实例
   */
  getMain() {
    if (!this.dbMain) {
      throw new Error('Database not initialized. Call init() first.');
    }

    return this.dbMain;
  }

  /**
   * 关闭所有数据库连接
   */
  async close() {
    if (this.dbMain) {
      await this.dbMain.close();
      this.dbMain = null;
    }
  }
}

// 导出单例实例
export const databaseManager = new DatabaseManager();
