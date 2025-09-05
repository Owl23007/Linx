/**
 * 用户数据保护配置
 * 管理所有与数据安全相关的配置选项
 */

export const SECURITY_CONFIG = {
  // 默认加密设置
  encryption: {
    algorithm: 'aes-256-cbc',
    keyLength: 32,
  },
  defaultSalt: 'LINX_2025',
};
