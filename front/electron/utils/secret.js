import crypto, { generateKeyPairSync, privateDecrypt, publicEncrypt } from 'crypto';

/**
 * 生成随机 salt（16 字节 hex）
 */
export function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 使用 SHA-256 对 value + ':' + salt 做哈希并返回 hex 字符串
 * @param {Buffer|string} value - 如果是 Buffer，会转换为 hex
 * @param {Buffer|string} salt - 如果是 Buffer，会转换为 hex
 * @returns {string}
 */
export function hashWithSalt(value, salt) {
  const valueHex = Buffer.isBuffer(value) ? value.toString('hex') : value;
  const saltHex = Buffer.isBuffer(salt) ? salt.toString('hex') : salt;

  return crypto.createHash('sha256').update(`${valueHex}:${saltHex}`, 'utf8').digest('hex');
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
export function aesEncrypt(plaintext, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return Buffer.concat([iv, encrypted]);
}

export function aesDecrypt(ciphertextWithIv, key) {
  const iv = ciphertextWithIv.slice(0, 16);
  const encrypted = ciphertextWithIv.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
}
