import crypto from 'crypto';
import { app } from 'electron';
import fs from 'fs';
import keytar from 'keytar';
import path from 'path';
import { loadFromFile, SaveToFile } from '../utils/file.js';
import { aesDecrypt, aesEncrypt, generateSalt, hashWithSalt } from '../utils/secret.js';

// ================ 全局配置 ================
// Keytar 凭据
const KEYTAR_ACCOUNT_MAIN_KEK = 'mainKEK'; // 全局主密钥

// ================ 核心类 ================
class KeytarManager {
  constructor(logger = console) {
    this.Logger = logger;
    this._mainKEK = null;     // mainKEK（Buffer）
    this._deviceId = null;  // 设备标识（字符串）
    this.serviceName = this.getServiceName(); // 动态生成服务名
  }

  // ================ 0. 获取服务名 ================
  getServiceName() {
    // 基于全局数据路径生成哈希，确保多实例共享同一套凭据
    const userDataPath = process.env.LINX_DATA_PATH || app.getPath('userData');
    const pathHash = crypto.createHash('sha256').update(userDataPath).digest('hex').substring(0, 16);

    return `LinxApp-${pathHash}`;
  }

  /**
   * 脱敏服务名，用于日志输出
   * @param {string} serviceName - 原始服务名
   * @returns {string} 脱敏后的服务名，如 "LinxApp-5bc0****10d3"
   */
  maskServiceName(serviceName) {
    if (!serviceName || serviceName.length < 12) return '***';
    const prefix = serviceName.substring(0, 12);
    const suffix = serviceName.substring(serviceName.length - 4);

    return `${prefix}****${suffix}`;
  }

  // ================ 1. 初始化 mainKEK ================
  async init() {
    try {
      let mainKEK = await keytar.getPassword(this.serviceName, KEYTAR_ACCOUNT_MAIN_KEK);

      if (!mainKEK) {
        const newMainKEK = crypto.randomBytes(32);
        await keytar.setPassword(this.serviceName, KEYTAR_ACCOUNT_MAIN_KEK, newMainKEK.toString('hex'));
        this._mainKEK = newMainKEK;
        this.Logger.info('KEYTAR_INIT', `mainKEK 已生成 (Service: ${this.maskServiceName(this.serviceName)})`);
      } else {
        this._mainKEK = Buffer.from(mainKEK, 'hex');
        this.Logger.info('KEYTAR_INIT', `mainKEK 已加载 (Service: ${this.maskServiceName(this.serviceName)})`);
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

    return Buffer.from(derived).toString('hex');
  }

  // ================ 4. 用户凭据管理 ================
  async storeUserCredential(userId, key, value) {
    if (!userId || !key) throw new Error('用户ID和密钥不能为空');
    if (!value) throw new Error('值不能为空');

    // 确保 value 是字符串类型
    const stringValue = typeof value === 'string' ? value : String(value);

    const deviceId = this.getDeviceId();
    const service = `linx-user-${userId}-${deviceId}`;
    const encryptData = aesEncrypt(Buffer.from(stringValue, 'utf8'), this._mainKEK);
    // hash keytar 服务和账号名
    const hashedService = hashWithSalt(service, 'linx-user-dek-salt-v1');

    const account = key;

    try {
      await keytar.setPassword(hashedService, account, encryptData.toString('hex'));
      this.Logger.info('STORE_CREDENTIAL', '用户凭据已存储');
    } catch (error) {
      this.Logger.error('STORE_CREDENTIAL', `存储凭据失败: ${error.message}`);
      throw error;
    }
  }

  async getUserCredential(userId, key) {
    if (!userId || !key) throw new Error('用户ID和密钥不能为空');

    const deviceId = this.getDeviceId();
    const service = `linx-user-${userId}-${deviceId}`;
    // hash keytar 服务和账号名，保持与存储时一致
    const hashedService = hashWithSalt(service, 'linx-user-dek-salt-v1');
    const account = key;

    try {
      const encryptedData = await keytar.getPassword(hashedService, account);

      if (!encryptedData) {
        return null;
      }

      // 解密数据
      const decryptedData = aesDecrypt(Buffer.from(encryptedData, 'hex'), this._mainKEK);

      return decryptedData.toString('utf8');
    } catch (error) {
      this.Logger.error('GET_CREDENTIAL', `获取凭据失败: ${error.message}`);

      return null;
    }
  }

  // ================= 4.1 数据加密与解密 =================
  encryptData(data, keyHex) {
    try {
      const key = Buffer.from(keyHex, 'hex');
      const buffer = Buffer.from(data, 'utf8');
      // aesEncrypt 返回 iv + ciphertext 的 Buffer
      const encryptedBuffer = aesEncrypt(buffer, key);

      return {
        v: 1,
        d: encryptedBuffer.toString('base64')
      };
    } catch (error) {
      this.Logger.error('ENCRYPT', `加密失败: ${error.message}`);
      throw error;
    }
  }

  decryptData(encryptedData, keyHex) {
    try {
      const key = Buffer.from(keyHex, 'hex');
      if (encryptedData.v === 1) {
        const buffer = Buffer.from(encryptedData.d, 'base64');
        const decryptedBuffer = aesDecrypt(buffer, key);

        return decryptedBuffer.toString('utf8');
      }
      throw new Error(`未知的加密版本: ${encryptedData.v}`);
    } catch (error) {
      this.Logger.error('DECRYPT', `解密失败: ${error.message}`);
      throw error;
    }
  }

  // ================= 4.2 获取用户数据库路径 =================
  getUserDatabasePath(userId) {
    const dir = this.ensureUserDatabaseDir(userId);

    return path.join(dir, 'user.db');
  }

  // ================= 4.3 创建用户数据库目录 =================
  ensureUserDatabaseDir(userId) {
    if (!userId) throw new Error('用户ID不能为空');

    // 根据KEK生成用户数据库目录（确定哈希输入为 Buffer）
    const deviceId = this.getDeviceId();
    const hash = crypto.createHash('sha256').update(Buffer.from(`${userId}-${deviceId}`, 'utf8')).digest('hex');

    const baseDir = process.env.LINX_DATA_PATH || app.getPath('userData');
    const userDbDir = path.join(baseDir, 'user_data', hash);

    // 确保目录存在并设置安全权限
    try {
      fs.mkdirSync(userDbDir, { recursive: true, mode: 0o700 }); // 仅用户可读写执行

      return userDbDir;
    } catch (err) {
      // 记录日志
      this.Logger.warn('MKDIR_USER_DB', err.message);

      return null;
    }
  }

  // ================ 5. 获取基于KEK的设备标识 ================
  getDeviceId() {
    if (!this._mainKEK) throw new Error('mainKEK未初始化');

    if (this._deviceId) return this._deviceId;

    const baseDir = process.env.LINX_DATA_PATH || app.getPath('userData');
    const filePath = path.join(baseDir, '.linx_id');

    const deviceString = loadFromFile(filePath);

    if (deviceString) {
      const parts = deviceString.split('|');
      if (parts.length === 3) {
        const hashSalt = parts[0];
        const hashedValue = parts[1];
        const encryptData = parts[2];

        try {
        // 解密得到 deviceId
          const rewServiceId = aesDecrypt(Buffer.from(encryptData, 'hex'), this._mainKEK);
          const deviceIdHex = rewServiceId.toString('hex');

          const data = Buffer.concat([this._mainKEK, Buffer.from(deviceIdHex, 'hex')]);
          const computedHash = hashWithSalt(data, hashSalt);

          if (computedHash === hashedValue) {
            this._deviceId = deviceIdHex;

            return this._deviceId;
          }
        } catch (error) {
          this.Logger.warn('DEVICE_ID', `验证设备标识失败: ${error.message}`);
        }
      }
    }

    // 创建新 deviceId
    const deviceIdHex = crypto.randomBytes(16).toString('hex');
    const storageString = this.createDeviceIdStorage(deviceIdHex);
    SaveToFile(filePath, storageString);

    this._deviceId = deviceIdHex;

    return deviceIdHex;
  }

  // ================ 7. 删除用户数据 ================
  async deleteUserData(userId, deleteFiles = false) {
    if (!userId) throw new Error('用户ID不能为空');

    const deviceId = this.getDeviceId();
    const service = `linx-user-${userId}-${deviceId}`;
    const hashedService = hashWithSalt(service, 'linx-user-dek-salt-v1');

    try {
      // 1. 删除 Keytar 中的凭据
      const credentials = await keytar.findCredentials(hashedService);
      for (const cred of credentials) {
        await keytar.deletePassword(hashedService, cred.account);
      }
      this.Logger.info('DELETE_USER_DATA', `用户 ${userId} 凭据已清除`);

      // 2. 删除文件（如果需要）
      if (deleteFiles) {
        const dbPath = this.getUserDatabasePath(userId);
        const dbDir = path.dirname(dbPath);

        if (fs.existsSync(dbDir)) {
          fs.rmSync(dbDir, { recursive: true, force: true });
          this.Logger.info('DELETE_USER_DATA', `用户 ${userId} 数据文件已删除`);
        }
      }
    } catch (error) {
      this.Logger.error('DELETE_USER_DATA', `删除用户数据失败: ${error.message}`);
      throw error;
    }
  }

  // ================ 6. 创建设备标识存储格式 ================
  createDeviceIdStorage(deviceIdHex) {
    if (!this._mainKEK) throw new Error('mainKEK未初始化');

    const data = Buffer.concat([this._mainKEK, Buffer.from(deviceIdHex, 'hex')]);

    const salt = generateSalt();
    const hash = hashWithSalt(data, salt);

    const encryptedData = aesEncrypt(Buffer.from(deviceIdHex, 'hex'), this._mainKEK);

    return `${salt}|${hash}|${encryptedData.toString('hex')}`;
  }

}

export default KeytarManager;
