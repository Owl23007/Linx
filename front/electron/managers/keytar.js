import crypto from 'crypto';
import { app } from 'electron';
import fs from 'fs';
import keytar from 'keytar';
import { join } from 'path';

import { aesDecrypt, aesEncrypt, generateSalt, hashWithSalt } from '../utils/secret.js';

// ================ 路径配置 ================
const appDataPath = app.getPath('userData'); // 用户数据目录（自动用户隔离）
const appPath = app.getAppPath();           // 应用安装路径（区分不同副本）

// instance.id 存储路径（优先级：安装目录 > 用户数据）
const INSTANCE_ID_DIRS = [
  join(appPath, '.linx'),           // 安装内（只读，优先级高）
  join(appPath, '.backup'),         // 安装内备份目录（只读，优先级高）
  join(appDataPath, '.linx'),       // 用户数据（可写）
  join(appDataPath, '.backup')
];

// Keytar 凭据标识
const KEYTAR_SERVICE = 'LinxAppMainKEK';            // 服务名
const KEYTAR_ACCOUNT_MAIN_KEK = 'mainKEK';          // 主密钥
const KEYTAR_ACCOUNT_INSTANCE_ID = 'instanceId';    // instanceId 缓存

// 文件名
const INSTANCE_ID_FILE = 'instance.id';             // 加密存储 instanceId

// ================ 工具函数 ================
/**
 * 生成安装唯一的 instanceId
 * 基于：用户路径 + 安装路径 + 随机盐（首次生成）
 */
function generateInstanceId() {
  const fingerprint = `${appDataPath}:${appPath}`;
  const salt = generateSalt();

  return hashWithSalt(fingerprint, salt);
}

/**
 * 推导用于加密 instance.id 文件的密钥
 */
function deriveFileEncryptionKey(instanceId) {
  return hashWithSalt(instanceId, 'instance-id-file-encryption-salt-v1');
}

/**
 * 确保目录存在
 */
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

// ================ 核心类 ================
class KeytarManager {
  /**
   * 构造函数
   * @param {Object} logger - 日志对象，支持 info/warn/error
   */
  constructor(logger = console) {
    this.Logger = logger;
    this._mainKEK = null; // 内存缓存主密钥（绝不明文持久化）
  }

  // ================ 对外统一入口：init ================
  /**
   * 初始化或加载主密钥
   * 外部只需调用一次 init()，内部自动判断是否首次运行
   * 成功后可通过 getMainKEK() 获取主密钥
   *
   * @returns {Promise<{ mainKEK: string, instanceId: string, isNew: boolean }>}
   */
  async init() {
    try {
      const isInitialized = await this._isInitialized();

      if (!isInitialized) {
        return await this._initialize();
      } else {
        const mainKEK = await this._loadMainKEK();
        const instanceId = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_INSTANCE_ID);
        this._mainKEK = mainKEK;

        this.Logger.info('KEYTAR_INIT', `已加载现有环境（instance: ${instanceId.slice(0, 8)}...）`);

        return { mainKEK, instanceId, isNew: false };
      }
    } catch (error) {
      this.Logger.error('KEYTAR_INIT', `初始化失败: ${error.message}`);
      throw error;
    }
  }

  // ================ 内部：状态检查 ================
  /**
   * 检查是否已完成初始化
   * 条件：keytar 中存在 mainKEK 且至少一个 instance.id 文件存在
   */
  async _isInitialized() {
    const hasMainKEK = !!(await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_MAIN_KEK));
    const hasInstanceIdFile = INSTANCE_ID_DIRS.some(dir =>
      fs.existsSync(join(dir, INSTANCE_ID_FILE))
    );

    return hasMainKEK && hasInstanceIdFile;
  }

  // ================ 内部：首次初始化 ================
  /**
   * 首次运行：生成 instanceId 和 mainKEK
   */
  async _initialize() {
    this.Logger.info('KEYTAR_INIT', '正在初始化新环境...');

    // 1. 生成唯一 instanceId（绑定用户 + 安装路径）
    const instanceId = generateInstanceId();

    // 2. 生成主密钥加密密钥（mainKEK）
    const mainKEK = crypto.randomBytes(32).toString('hex');

    // 3. 加密 instanceId 并写入多路径
    const fileEncryptionKey = deriveFileEncryptionKey(instanceId);
    const salt = generateSalt();
    const hash = hashWithSalt(instanceId, salt);
    const encryptedInstanceId = aesEncrypt(instanceId, fileEncryptionKey);
    const content = `${salt}|${hash}|${encryptedInstanceId}`;

    for (const dir of INSTANCE_ID_DIRS) {
      try {
        ensureDir(dir);
        const filePath = join(dir, INSTANCE_ID_FILE);
        fs.writeFileSync(filePath, content, 'utf8');
        this.Logger.info('KEYTAR_INIT', `已写入 instance.id: ${filePath}`);
      } catch (err) {
        this.Logger.warn('KEYTAR_INIT', `无法写入路径 ${dir}: ${err.message}`);
      }
    }

    // 4. 将密钥安全存入系统凭据（keytar）
    await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_MAIN_KEK, mainKEK);
    await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_INSTANCE_ID, instanceId);

    this.Logger.info('KEYTAR_INIT', '初始化完成：KEK 与 instanceId 已生成并保护');
    this._mainKEK = mainKEK;

    return { mainKEK, instanceId, isNew: true };
  }

  // ================ 内部：常规加载 ================
  /**
   * 加载已有的 mainKEK 并验证 instance.id 完整性
   */
  async _loadMainKEK() {
    const mainKEK = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_MAIN_KEK);
    if (!mainKEK) {
      throw new Error('mainKEK 不存在，凭据丢失');
    }

    const storedInstanceId = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_INSTANCE_ID);
    if (!storedInstanceId) {
      throw new Error('instanceId 缓存丢失，初始化不完整');
    }

    // 验证本地 instance.id 是否匹配（防篡改/复制）
    const recoveredInstanceId = await this._recoverInstanceId();
    if (recoveredInstanceId !== storedInstanceId) {
      throw new Error('instance.id 验证失败！应用可能被复制或篡改');
    }

    return mainKEK;
  }

  /**
   * 从 instance.id 文件恢复 instanceId
   */
  async _recoverInstanceId() {
    for (const dir of INSTANCE_ID_DIRS) {
      const filePath = join(dir, INSTANCE_ID_FILE);
      if (!fs.existsSync(filePath)) continue;

      try {
        const content = fs.readFileSync(filePath, 'utf8').trim();
        const [salt, storedHash, encrypted] = content.split('|');
        if (!salt || !storedHash || !encrypted) continue;

        // 尝试用缓存的 instanceId 推导密钥来解密（验证一致性）
        let decrypted;
        try {
          const knownInstanceId = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_INSTANCE_ID);
          const encryptionKey = deriveFileEncryptionKey(knownInstanceId);
          decrypted = aesDecrypt(encrypted, encryptionKey);
        } catch {
          continue;
        }

        const computedHash = hashWithSalt(decrypted, salt);
        if (computedHash === storedHash) {
          this.Logger.info('KEYTAR_INIT', `验证通过（来源: ${dir}）`);

          return decrypted;
        }
      } catch (err) {
        this.Logger.warn('KEYTAR_INIT', `验证失败 ${filePath}: ${err.message}`);
      }
    }

    throw new Error('未找到有效的 instance.id');
  }

  // ================ 对外：获取主密钥 ================
  /**
   * 获取主密钥（必须先调用 init）
   * @returns {string} mainKEK
   */
  getMainKEK() {
    if (!this._mainKEK) {
      throw new Error('主密钥未加载，请先调用 init()');
    }

    return this._mainKEK;
  }

  // ================ 业务密钥操作 ================
  /**
   * 对 userId 做 SHA-256 哈希（十六进制），避免在凭据中泄露明文 userId
   * @param {string} id
   * @returns {string}
   */
  hashUserId(id) {
    return crypto.createHash('sha256').update(id, 'utf8').digest('hex');
  }

  /**
   * 将 userId 映射为 keytar 中的 account 名称
   * - 未提供 userId（undefined/null/''）：使用 'userMainKey:default'（兼容默认行为）
   * - 提供 userId：对 userId 做哈希后使用 'userMainKey:{hash}'
   *
   * @param {string} [userId]
   * @returns {string} account
   */
  userAccount(userId) {
    if (typeof userId === 'undefined' || userId === null || String(userId).trim() === '') {
      return 'userMainKey:default';
    }

    const id = String(userId).trim();
    const idHash = this.hashUserId(id);

    return `userMainKey:${idHash}`;
  }

  /**
   * 设置用户主密钥（如登录 token），支持按 userId 保存（默认 userId='default'）
   * @param {string} key
   * @param {string} [userId] 可选，用户标识
   */
  async setMainKey(key, userId) {
    if (typeof key !== 'string') throw new TypeError('密钥必须是字符串');
    const account = this.userAccount(userId);
    await keytar.setPassword(KEYTAR_SERVICE, account, key);
    this.Logger.info('KEYTAR', `用户主密钥已保存（account=${account}）`);
  }

  /**
   * 获取用户主密钥（可按 userId 获取，默认 userId='default'）
   * @param {string} [userId]
   * @returns {Promise<string|null>}
   */
  async getMainKey(userId) {
    const account = this.userAccount(userId);
    const key = await keytar.getPassword(KEYTAR_SERVICE, account);
    if (!key) this.Logger.warn('KEYTAR', `用户主密钥未设置（account=${account}）`);

    return key;
  }

  /**
   * 清除用户主密钥（支持按 userId，默认 userId='default'）
   * @param {string} [userId]
   */
  async clearMainKey(userId) {
    const account = this.userAccount(userId);
    await keytar.deletePassword(KEYTAR_SERVICE, account);
    this.Logger.info('KEYTAR', `用户主密钥已清除（account=${account}）`);
  }

  /**
   * 重置所有凭据（用于登出或重装）
   */
  async reset() {
    // 删除主 KEK 与 instanceId
    await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_MAIN_KEK);
    await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_INSTANCE_ID);
    // 向后兼容：尝试删除旧命名
    await keytar.deletePassword(KEYTAR_SERVICE, 'userMainKey').catch(() => {});
    // 向后兼容：旧的未哈希默认用户命名
    await keytar.deletePassword(KEYTAR_SERVICE, 'userMainKey:default').catch(() => {});
    // 删除新的哈希命名的默认用户（如果 userAccount('default') 产生哈希名）
    await keytar.deletePassword(KEYTAR_SERVICE, this.userAccount('default')).catch(() => {});
    this._mainKEK = null;
    this.Logger.info('KEYTAR_RESET', '所有凭据已清除（包含历史命名与哈希命名）');
  }
}

export default KeytarManager;
