import crypto from 'crypto';
import { app } from 'electron';
import fs from 'fs';
import keytar from 'keytar';
import path from 'path';
import { loadFromFile, SaveToFile } from '../utils/file';
import { aesDecrypt, aesEncrypt, generateSalt, hashWithSalt } from '../utils/secret';

// ================ 全局配置 ================
// Keytar 凭据
const KEYTAR_SERVICE = 'LinxAppMainKEK';
const KEYTAR_ACCOUNT_MAIN_KEK = 'mainKEK'; // 全局主密钥

// ================ 核心类 ================
class KeytarManager {
  constructor(logger = console) {
    this.Logger = logger;
    this._mainKEK = null;     // mainKEK（Buffer）
    this._deviceId = null;  // 设备标识（字符串）
  }

  // ================ 1. 初始化 mainKEK ================
  async init() {
    try {
      const mainKEK = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_MAIN_KEK);

      if (!mainKEK) {
        const newMainKEK = crypto.randomBytes(32);
        await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_MAIN_KEK, newMainKEK.toString('hex'));
        this._mainKEK = newMainKEK;
        this.Logger.info('KEYTAR_INIT', 'mainKEK 已生成');
      } else {
        this._mainKEK = Buffer.from(mainKEK, 'hex');
        this.Logger.info('KEYTAR_INIT', 'mainKEK 已加载');
      }
    } catch (error) {
      this.Logger.error('KEYTAR_INIT', `初始化失败: ${error.message}`);
      throw error;
    }
  }

  // ================ 2. 派生用户密钥（基于用户ID与用户server） ================
  /**
   * 为用户生成绑定用户ID的DEK并保存到keytar
   * @param {string|number} userId - 用户ID
   * @param {string} server -  用户服务器地址
   *
   * @return {string} 32字节十六进制编码的DEK
   */
  deriveUserDEK(userId, server) {
    if (!this._mainKEK) throw new Error('mainKEK未初始化');
    if (!userId) throw new Error('用户ID不能为空');

    const userIdBuffer = Buffer.from(String(userId).trim(), 'utf8');
    const serverBuffer = Buffer.from(server, 'utf8');

    const info = Buffer.concat([
      Buffer.from('userDEK:', 'utf8'),
      userIdBuffer,
      Buffer.from(':', 'utf8'),
      serverBuffer
    ]);

    const derived = crypto.hkdfSync('sha256',
      this._mainKEK,
      Buffer.from('linx-user-dek-salt-v1', 'utf8'),
      info,
      32
    );

    return derived.toString('hex');
  }

  // ================ 4. 用户凭据管理 ================
  async storeUserCredential(userId, key, value) {
    if (!userId || !key) throw new Error('用户ID和密钥不能为空');

    const deviceId = this.getDeviceId();
    const service = `linx-user-${userId}-${deviceId}`;
    const encryptData = aesEncrypt(Buffer.from(value, 'utf8'), this._mainKEK);
    // hash keytar 服务和账号名
    const hashedService = hashWithSalt(service, 'linx-user-dek-salt-v1');

    const account = key;

    try {
      await keytar.setPassword(hashedService, account, encryptData);
      this.Logger.info('STORE_CREDENTIAL', '用户凭据已存储');
    } catch (error) {
      this.Logger.error('STORE_CREDENTIAL', `存储凭据失败: ${error.message}`);
      throw error;
    }
  }

  async getUserCredential(userId, key) {
    if (!userId || !key) throw new Error('用户ID和密钥不能为空');

    const service = `linx-user-${userId}`;
    const account = key;

    try {
      const password = await keytar.getPassword(service, account);

      return password;
    } catch (error) {
      this.Logger.error('GET_CREDENTIAL', `获取凭据失败: ${error.message}`);

      return null;
    }
  }
  // ================= 4. 创建用户数据库目录 =================
  ensureUserDatabaseDir(userId) {
    if (!userId) throw new Error('用户ID不能为空');

    // 根据KEK生成用户数据库目录（确定哈希输入为 Buffer）
    const deviceId = this.getDeviceId();
    const hash = crypto.createHash('sha256').update(Buffer.from(`${userId}-${deviceId}`, 'utf8')).digest('hex');

    const baseDir =  app.getPath('userData')  ;
    const userDbDir = path.join(baseDir, 'user_data', hash);

    // 确保目录存在并设置安全权限
    try {
      fs.mkdirSync(userDbDir, { recursive: true, mode: 0o700 }); // 仅用户可读写执行

      return userDbDir;
    } catch (err) {
      // 忽略 race 或记录日志
      this.Logger.warn('MKDIR_USER_DB', err.message);
    }
  }

  // ================ 5. 获取基于KEK的设备标识 ================
  getDeviceId() {
    if (!this._mainKEK) throw new Error('mainKEK未初始化');

    if (this._deviceId) return this._deviceId;

    // 从cwd获取唯一标识
    const cwd = process.cwd();
    const filePath = path.join(cwd, '.linx_id');
    const deviceString = loadFromFile(filePath);

    if (deviceString) {
      // 使用 Buffer.concat 显式连接，避免隐式字符串转换
      const marker = Buffer.from('forDeviceId', 'utf8');
      const data = Buffer.concat([this._mainKEK, marker]);

      const parts = deviceString.split('|');
      if (parts.length === 3) {
        const hashSalt = parts[0]; // 取文件内容的前一部分作为盐
        const hashedValue = parts[1]; // 取文件内容的第二部分作为哈希值
        const encryptData = parts[2]; // 取文件内容的后一部分作为加密值

        try {
          // 反向推导服务标识
          const rewServiceId = aesDecrypt(Buffer.from(encryptData, 'hex'), this._mainKEK);
          const computedHash = hashWithSalt(data, hashSalt);
          if (computedHash === hashedValue) {
            this._deviceId = rewServiceId;

            return rewServiceId; // 返回设备标识
          }
        } catch (error) {
          this.Logger.warn('DEVICE_ID', `验证设备标识失败: ${error.message}`);
        }
      }
    }

    // 创建并保存设备标识
    const deviceId = this.generateDeviceId();
    SaveToFile(filePath, deviceId);

    this._deviceId = deviceId;

    return deviceId;
  }

  // ================ 6. 生成基于KEK的设备标识 ================
  generateDeviceId() {
    if (!this._mainKEK) throw new Error('mainKEK未初始化');

    const deviceId = crypto.randomBytes(16);
    const data = Buffer.concat([this._mainKEK, deviceId]);

    const salt = generateSalt();
    const hash = hashWithSalt(data, salt);

    const encryptedData = aesEncrypt(deviceId, this._mainKEK);

    return `${salt}|${hash}|${encryptedData.toString('hex')}`;
  }

}

export default KeytarManager;
