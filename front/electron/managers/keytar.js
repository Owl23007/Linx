import crypto from 'crypto';
import { app } from 'electron';
import fs from 'fs';
import keytar from 'keytar';
import path from 'path';

import { aesDecrypt, aesEncrypt, generateSalt, hashWithSalt } from '../utils/secret.js';

// ================ 路径配置 ================
const appDataPath = app.getPath('userData');

// 当前项目中标识当前实例
const CURRENT_INSTANCE_FILE = path.join(appDataPath, 'AppData', 'instance.id');

// 用户数据目录下的多实例管理
const USER_DATA_LINX = path.join(appDataPath, 'AppData');
const INSTANCES_DIR = path.join(USER_DATA_LINX, 'instances'); // 所有 instanceId（加密存储）
const DB_ROOT = path.join(USER_DATA_LINX, 'db');               // 数据库存放根目录

// Keytar 凭据
const KEYTAR_SERVICE = 'LinxAppMainKEK';
const KEYTAR_ACCOUNT_MAIN_KEK = 'mainKEK'; // 全局主密钥

// 工具函数
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * 生成 instanceId 的短哈希（用于路径命名）
 */
function getInstanceIdHash(instanceId) {
  return crypto.createHash('sha256').update(Buffer.from(instanceId, 'utf8')).digest('hex').slice(0, 16);
}

// ================ 核心类 ================
class KeytarManager {
  constructor(logger = console) {
    this.Logger = logger;
    this._mainKEK = null;     // mainKEK（Buffer）
    this._instanceId = null;  // 当前实例 ID（Buffer）
  }

  // ================ 1. 初始化 mainKEK ================
  async init() {
    try {
      const mainKEK = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_MAIN_KEK);
      const isNew = !mainKEK;

      if (!mainKEK) {
        const newMainKEK = crypto.randomBytes(32);
        await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_MAIN_KEK, newMainKEK.toString('hex'));
        this._mainKEK = newMainKEK;
        this.Logger.info('KEYTAR_INIT', 'mainKEK 已生成');
      } else {
        this._mainKEK = Buffer.from(mainKEK, 'hex');
        this.Logger.info('KEYTAR_INIT', 'mainKEK 已加载');
      }

      return { mainKEK: this._mainKEK.toString('hex'), isNew };
    } catch (error) {
      this.Logger.error('KEYTAR_INIT', `初始化失败: ${error.message}`);
      throw error;
    }
  }

  // ================ 2. 随机生成 instanceId ================
  /**
   * 生成一个完全随机的 instanceId
   */
  _generateRandomInstanceId() {
    return crypto.randomBytes(32); // 返回 Buffer
  }

  // ================ 3. 读取当前 instanceId ================
  async _readCurrentInstanceId() {
    if (!fs.existsSync(CURRENT_INSTANCE_FILE)) {
      this.Logger.info('INSTANCE', 'instance.id 文件不存在');

      return null;
    }

    try {
      const content = fs.readFileSync(CURRENT_INSTANCE_FILE, 'utf8').trim();
      const parts = content.split('|');
      if (parts.length !== 3) {
        this.Logger.warn('INSTANCE', `instance.id 格式错误: ${content}`);

        return null;
      }
      const [salt, storedHash, encrypted] = parts;
      const decrypted = aesDecrypt(Buffer.from(encrypted, 'hex'), this._mainKEK);
      const computedHash = hashWithSalt(decrypted, Buffer.from(salt, 'hex'));
      const storedHashBuffer = Buffer.from(storedHash, 'hex');
      if (Buffer.from(computedHash, 'hex').equals(storedHashBuffer)) {
        return decrypted;
      } else {
        this.Logger.warn('INSTANCE', '哈希验证失败');

        return null;
      }
    } catch (err) {
      this.Logger.warn('INSTANCE', `读取 instance.id 失败: ${err.message}`);

      return null;
    }
  }

  // ================ 4. 创建新实例 ================
  async _createNewInstance() {
    const instanceId = this._generateRandomInstanceId();

    // 加密保存到当前项目
    const encSalt = generateSalt();
    const hash = hashWithSalt(instanceId, encSalt);
    const encrypted = aesEncrypt(instanceId, this._mainKEK);
    const content = `${encSalt.toString('hex')}|${hash.toString('hex')}|${encrypted.toString('hex')}`;

    ensureDir(path.dirname(CURRENT_INSTANCE_FILE));
    fs.writeFileSync(CURRENT_INSTANCE_FILE, content, 'utf8');

    this.Logger.info('INSTANCE', `新实例已创建: ${instanceId.toString('hex').slice(0, 8)}...`);

    return instanceId;
  }

  // ================ 5. 注册 instanceId 到 userData ================
  async _registerInstance(instanceId) {
    ensureDir(INSTANCES_DIR);
    const files = fs.readdirSync(INSTANCES_DIR);

    for (const file of files) {
      const filePath = path.join(INSTANCES_DIR, file);
      try {
        const encrypted = fs.readFileSync(filePath, 'utf8');
        const existingId = aesDecrypt(Buffer.from(encrypted, 'hex'), this._mainKEK);
        if (existingId.equals(instanceId)) return; // 已存在
      } catch { /* 忽略损坏文件 */ }
    }

    // 不存在才写入
    const encrypted = aesEncrypt(instanceId, this._mainKEK);
    fs.writeFileSync(
      path.join(INSTANCES_DIR, instanceId.slice(0,16).toString('hex')),
      encrypted.toString('hex'),
      'utf8'
    );
  }

  // ================ 6. 加载当前实例 ================
  /**
   * 加载当前运行环境的 instanceId
   * - 优先从 AppData/instance.id 读
   * - 若无，则生成新实例
   */
  async loadCurrentInstance() {
    try {
      let instanceId = await this._readCurrentInstanceId();

      if (!instanceId) {
        instanceId = await this._createNewInstance();
      }

      // 注册到全局实例列表
      await this._registerInstance(instanceId);

      this._instanceId = instanceId;
      this.Logger.info('INSTANCE', `当前实例已加载: ${instanceId.toString('hex').slice(0, 8)}...`);

      return instanceId.toString('hex');
    } catch (error) {
      this.Logger.error('INSTANCE', `加载实例失败: ${error.message}`);
      throw error;
    }
  }

  // ================ 7. 列出所有已知实例 ================
  /**
   * 获取所有已注册的 instanceId（用于切换实例）
   */
  async listAllInstances() {
    if (!fs.existsSync(INSTANCES_DIR)) return [];

    const files = fs.readdirSync(INSTANCES_DIR);
    const instances = [];

    for (const file of files) {
      try {
        const filePath = path.join(INSTANCES_DIR, file);
        const encrypted = fs.readFileSync(filePath, 'utf8');
        const instanceId = aesDecrypt(Buffer.from(encrypted, 'hex'), this._mainKEK);
        instances.push(instanceId.toString('hex'));
      } catch (err) {
        this.Logger.warn('INSTANCE', `跳过无效实例文件 ${file}: ${err.message}`);
      }
    }

    return instances;
  }

  // ================ 8. 获取数据库路径 ================
  getDatabaseDir() {
    if (!this._instanceId) throw new Error('未加载实例');
    const hash = getInstanceIdHash(this._instanceId.toString('hex'));

    return path.join(DB_ROOT, hash);
  }

  getDatabasePath() {
    return path.join(this.getDatabaseDir(), 'data.db');
  }

  ensureDatabaseDir() {
    ensureDir(this.getDatabaseDir());
  }

  // ================ 9. 派生用户密钥（绑定实例） ================
  /**
   * 为用户生成绑定当前实例的 userKEK
   * 防止跨实例使用
   */
  deriveUserKEK(userId) {
    if (!this._instanceId) throw new Error('未加载实例');
    const id = userId ? Buffer.from(String(userId).trim(), 'utf8') : Buffer.from('default', 'utf8');

    const info = Buffer.concat([
      Buffer.from('userKEK:', 'utf8'),
      this._instanceId,
      Buffer.from(':', 'utf8'),
      id
    ]);
    const derived = crypto.hkdfSync('sha256',
      this._mainKEK,
      Buffer.from('linx-user-key-salt-v1', 'utf8'),
      info,
      32
    );

    return derived.toString('hex');
  }

  // ================ 10. 获取当前 instanceId ================
  getCurrentInstanceId() {
    return this._instanceId ? this._instanceId.toString('hex') : null;
  }

  // ================ 11. 重置当前实例数据（不清除 mainKEK） ================
  async resetCurrentInstanceData() {
    if (!this._instanceId) return;

    const dbDir = this.getDatabaseDir();
    if (fs.existsSync(dbDir)) {
      fs.rmSync(dbDir, { recursive: true });
    }

    this.Logger.info('RESET', `实例 ${this._instanceId.toString('hex').slice(0, 8)}... 的数据已清除`);
  }

  // ================ 12. 删除指定实例 ================
  /**
   * 删除指定的实例（从实例列表中移除，并可选清除其数据库）
   * @param {string} instanceIdHex - 要删除的实例 ID（十六进制字符串）
   * @param {boolean} [clearData=true] - 是否同时清除数据库数据
   */
  async deleteInstance(instanceIdHex, clearData = true) {
    if (!instanceIdHex) throw new Error('实例 ID 不能为空');

    const instanceId = Buffer.from(instanceIdHex, 'hex');
    const fileName = instanceId.slice(0, 16).toString('hex');
    const filePath = path.join(INSTANCES_DIR, fileName);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      this.Logger.warn('DELETE_INSTANCE', `实例文件不存在: ${fileName}`);

      return false;
    }

    try {
      // 验证文件内容是否匹配
      const encrypted = fs.readFileSync(filePath, 'utf8');
      const storedId = aesDecrypt(Buffer.from(encrypted, 'hex'), this._mainKEK);
      if (!storedId.equals(instanceId)) {
        this.Logger.warn('DELETE_INSTANCE', `实例文件内容不匹配: ${fileName}`);

        return false;
      }

      // 删除实例文件
      fs.unlinkSync(filePath);
      this.Logger.info('DELETE_INSTANCE', `实例文件已删除: ${fileName}`);

      // 如果需要清除数据
      if (clearData) {
        const hash = getInstanceIdHash(instanceIdHex);
        const dbDir = path.join(DB_ROOT, hash);
        if (fs.existsSync(dbDir)) {
          fs.rmSync(dbDir, { recursive: true });
          this.Logger.info('DELETE_INSTANCE', `实例数据库已清除: ${hash}`);
        }
      }

      return true;
    } catch (error) {
      this.Logger.error('DELETE_INSTANCE', `删除实例失败: ${error.message}`);

      return false;
    }
  }
}

export default KeytarManager;
