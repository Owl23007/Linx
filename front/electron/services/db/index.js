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
    try {
      const dbInstance = await databaseManager.init();

      let test = 1;
      if (test) {
        throw new Error(' 测试错误处理 ');
      }
      // 初始化各个服务
      this.userDb = new UserDb(dbInstance);
      console.log('[DatabaseService] 数据库服务初始化完成');
    } catch (error) {
      console.error('[DatabaseService] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户数据库服务
   */
  getUserDb() {

    if (!this.userDb) {
      throw new Error('用户数据库服务未初始化');
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
