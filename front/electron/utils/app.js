import path from 'path';
import { fileURLToPath } from 'url';

/**
 * 获取当前模块的目录路径（ES 模块兼容）
 */
function getCurrentDir(importMetaUrl) {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = path.dirname(__filename);

  return __dirname;
}

/**
 * 检查是否为开发环境
 */
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * 检查是否为生产环境
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * 获取应用配置
 */
function getAppConfig() {
  return {
    isDev: isDevelopment(),
    isProd: isProduction(),
    platform: process.platform,
    vitePort: process.env.VITE_PORT || '5173',
  };
}

/**
 * 创建安全的窗口配置
 */
function createSecureWebPreferences(preloadPath) {
  return {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    preload: preloadPath,
    webSecurity: true,
  };
}

export {
  createSecureWebPreferences, getAppConfig, getCurrentDir,
  isDevelopment,
  isProduction
};
