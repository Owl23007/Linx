import { ipcMain } from 'electron';
import KeytarManager from '../managers/keytar.js';

let userDb = null;
let keytarManager = null;

/**
 * 设置用户相关的IPC处理器
 */
export function setupUserHandlers() {
  // 初始化KeytarManager
  keytarManager = new KeytarManager();
  keytarManager.init().catch(console.error);

  // 初始化UserDb
  //userDb = new UserDb(appDb, keytarManager);

  // IPC处理器：加密数据
  ipcMain.handle('user:encryptData', async (event, { userId, server, data }) => {
    try {
      const encrypted = userDb.encryptData(userId, server, data);

      return { success: true, encrypted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // IPC处理器：解密数据
  ipcMain.handle('user:decryptData', async (event, { userId, server, encryptedData }) => {
    try {
      const decrypted = userDb.decryptData(userId, server, encryptedData);

      return { success: true, decrypted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // IPC处理器：存储加密数据
  ipcMain.handle('user:storeEncryptedData', async (event, { userId, server, key, value }) => {
    try {
      await userDb.storeEncryptedData(userId, server, key, value);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // IPC处理器：获取解密数据
  ipcMain.handle('user:getDecryptedData', async (event, { userId, server, key }) => {
    try {
      const data = await userDb.getDecryptedData(userId, server, key);

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
