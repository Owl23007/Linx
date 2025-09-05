import crypto from 'crypto';
import keytar from 'keytar';

// ================ 全局配置 ================
// Keytar 凭据
const KEYTAR_SERVICE = 'LinxAppMainKEK';
const KEYTAR_ACCOUNT_MAIN_KEK = 'mainKEK'; // 全局主密钥

// ================ 核心类 ================
class KeytarManager {
  constructor(logger = console) {
    this.Logger = logger;
    this._mainKEK = null;     // mainKEK（Buffer）
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

  // ================ 3. 获取基于KEK的设备标识 ================
  getDeviceId() {
    if (!this._mainKEK) throw new Error('mainKEK未初始化');

    return crypto.createHash('sha256').update(this._mainKEK + 'forDeviceId').digest('hex');
  }
}

export default KeytarManager;
