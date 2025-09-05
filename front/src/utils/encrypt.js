import { generateKeyPairSync, privateDecrypt, publicEncrypt, randomBytes } from 'crypto';

export function generateSalt() {
  return randomBytes(16).toString('hex');
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
