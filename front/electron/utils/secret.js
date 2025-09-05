import crypto, { generateKeyPairSync, privateDecrypt, publicEncrypt } from 'crypto';

/**
 * 生成随机 salt（16 字节 hex）
 */
export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 使用 SHA-256 对 value + ':' + salt 做哈希并返回 hex 字符串
 * @param {string} value
 * @param {string} salt
 * @returns {string}
 */
export function hashWithSalt(value, salt) {
  return crypto.createHash('sha256').update(`${value}:${salt}`, 'utf8').digest('hex');
}

/**
 * AES-256-GCM 加密
 * 返回 base64( iv(12) | tag(16) | cipher )
 * @param {string} plain
 * @param {string} keySeed - 任意字符串，内部用 SHA-256 提取 32 字节密钥
 * @returns {string}
 */
export function aesEncrypt(plain, keySeed) {
  const key = crypto.createHash('sha256').update(String(keySeed), 'utf8').digest(); // 32 bytes
  const iv = crypto.randomBytes(12); // GCM 推荐 12 字节 iv
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString('base64');

  return payload;
}

/**
 * AES-256-GCM 解密（对应 aesEncrypt 的格式）
 * @param {string} payloadBase64
 * @param {string} keySeed
 * @returns {string} 解密后的 UTF-8 文本
 */
export function aesDecrypt(payloadBase64, keySeed) {
  const data = Buffer.from(String(payloadBase64), 'base64');
  if (data.length < 12 + 16) throw new Error('invalid payload');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const cipherText = data.slice(28);
  const key = crypto.createHash('sha256').update(String(keySeed), 'utf8').digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);

  return decrypted.toString('utf8');
}

export function generateKeyPair() {
  // 生成RSA-3072密钥对
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 3072,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { publicKey, privateKey };
}

export function encrypt(publicKey, data) {
  const buffer = Buffer.from(data);
  const encrypted = publicEncrypt(publicKey, buffer);

  return encrypted.toString('base64');
}

export function decrypt(privateKey, data) {
  const buffer = Buffer.from(data, 'base64');
  const decrypted = privateDecrypt(privateKey, buffer);

  return decrypted.toString('utf8');
}

export function aesDecryptOld(encryptedData, key) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.alloc(16, 0));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
