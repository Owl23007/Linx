import { databaseManager } from './manager.js';
import { UserDb } from './userDb.js';

class DatabaseService {
  constructor() {
    this.userDb = null;
  }

  /**
   * 初始化所有数据库服务
   */
  async init() {
    const dbMain = await databaseManager.init();

    // 初始化各个服务
    this.userDb = new UserDb(dbMain);
  }

  /**
   * 获取用户数据库服务
   */
  getUserDb() {
    if (!this.userDb) {
      throw new Error('Database service not initialized. Call init() first.');
    }

    return this.userDb;
  }

  /**
   * 关闭所有服务
   */
  async close() {
    await databaseManager.close();
    this.userDb = null;
  }
}

// 导出单例实例
export const databaseService = new DatabaseService();
