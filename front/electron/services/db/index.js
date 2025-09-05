import { AppDb } from './appDb.js';
import { databaseManager } from './manager.js';
import { UserDb } from './userDb.js';

class DatabaseService {
  constructor() {
    this.userDb = null;
    this.appDb = null;
  }

  /**
   * 初始化所有数据库服务
   */
  async init() {
    const dbInstance = await databaseManager.init();
    // 初始化各个服务
    this.userDb = new UserDb(dbInstance);
    this.appDb = new AppDb(dbInstance);

    console.log('[DatabaseService] 数据库服务初始化完成');
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
   * 获取App数据库服务
   */
  getAppDb() {
    if (!this.appDb) {
      throw new Error('App数据库服务未初始化');
    }

    return this.appDb;
  }

  /**
   * 获取加密用户数据库服务
   */
  getEncryptedUserDb() {
    if (!this.encryptedUserDb) {
      throw new Error('加密用户数据库服务未初始化');
    }

    return this.encryptedUserDb;
  }

  /**
   * 获取消息数据库服务
   */
  getMessageDb() {
    if (!this.messageDb) {
      throw new Error('消息数据库服务未初始化');
    }

    return this.messageDb;
  }

  /**
   * 关闭所有服务
   */
  async close() {
    await databaseManager.close();
    this.userDb = null;
    this.appDb = null;
  }
}

// 导出单例实例
export const databaseService = new DatabaseService();
