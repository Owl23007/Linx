import { aesDecrypt, aesEncrypt } from '../../utils/secret.js';

export class encryptDb {
  constructor(dbInstance, keytarManager) {
    this.dbInstance = dbInstance;
    this.keytarManager = keytarManager;
  }

  /**
   * 加密数据使用用户的DEK
   * @param {string|number} userId - 用户ID
   * @param {string} server - 用户服务器地址
   * @param {string|Buffer} data - 要加密的数据
   * @returns {string} 加密后的十六进制字符串
   */
  encryptData(userId, server, data) {
    if (!this.keytarManager) throw new Error('KeytarManager 未初始化');

    const dekHex = this.keytarManager.deriveUserDEK(userId, server);
    const dek = Buffer.from(dekHex, 'hex');
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const encrypted = aesEncrypt(dataBuffer, dek);

    return encrypted.toString('hex');
  }

  /**
   * 解密数据使用用户的DEK
   * @param {string|number} userId - 用户ID
   * @param {string} server - 用户服务器地址
   * @param {string} encryptedDataHex - 加密数据的十六进制字符串
   * @returns {string} 解密后的数据
   */
  decryptData(userId, server, encryptedDataHex) {
    if (!this.keytarManager) throw new Error('KeytarManager 未初始化');

    const dekHex = this.keytarManager.deriveUserDEK(userId, server);
    const dek = Buffer.from(dekHex, 'hex');
    const encryptedBuffer = Buffer.from(encryptedDataHex, 'hex');
    const decrypted = aesDecrypt(encryptedBuffer, dek);

    return decrypted.toString('utf8');
  }

  /**
   * 存储加密的用户数据到数据库
   * @param {string|number} userId - 用户ID
   * @param {string} server - 用户服务器地址
   * @param {string} key - 数据键
   * @param {string|Buffer} value - 数据值
   */
  async storeEncryptedData(userId, server, key, value) {
    const encryptedValue = this.encryptData(userId, server, value);
    // 假设数据库有存储方法，这里简化
    await this.dbInstance.run('INSERT OR REPLACE INTO user_data (user_id, key, value) VALUES (?, ?, ?)', [userId, key, encryptedValue]);
  }

  /**
   * 获取并解密用户数据从数据库
   * @param {string|number} userId - 用户ID
   * @param {string} server - 用户服务器地址
   * @param {string} key - 数据键
   * @returns {string|null} 解密后的数据
   */
  async getDecryptedData(userId, server, key) {
    const row = await this.dbInstance.get('SELECT value FROM user_data WHERE user_id = ? AND key = ?', [userId, key]);
    if (row) {
      return this.decryptData(userId, server, row.value);
    }

    return null;
  }
}
