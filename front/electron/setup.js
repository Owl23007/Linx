import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/log.js';

// ==========================================
// 配置常量
// ==========================================
const CONFIG = {
  MAX_INSTANCES: 5,
  PORTABLE_DATA_FOLDER: 'data',
  INSTANCES_FOLDER: '_instances',
  LOCK_FILE_NAME: '.app_lock',
  CLEAN_SECONDARY_INSTANCES: true,
};

// 模块级状态：用于跟踪清理回调是否已注册
let cleanupRegistered = false;
let currentLockFile = null;

// ==========================================
// 工具函数
// ==========================================

/**
 * 检查进程是否正在运行
 */
function isProcessRunning(pid) {
  try {
    if (!pid || isNaN(pid)) return false;
    process.kill(pid, 0);

    return true;
  } catch {
    return false;
  }
}

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    return true;
  } catch (error) {
    logger.error('APP_SETUP', `无法创建目录: ${dirPath}`, { error: error.message });

    return false;
  }
}

/**
 * 清空目录内容（保留目录本身）
 */
function cleanDir(dirPath) {
  try {
    logger.info('APP_SETUP', `正在清理临时实例目录: ${dirPath}`);
    for (const file of fs.readdirSync(dirPath)) {
      fs.rmSync(path.join(dirPath, file), { recursive: true, force: true });
    }

    return true;
  } catch (error) {
    logger.warn('APP_SETUP', `清理目录失败: ${error.message}`);

    return false;
  }
}

// ==========================================
// 路径解析
// ==========================================

/**
 * 解析基础数据目录
 */
function resolveBaseDir() {
  const exeDir = path.dirname(app.getPath('exe'));
  const cwd = process.cwd();

  // 策略 A: 打包后 exe 同级目录下的 'data' 文件夹（便携版）
  const portableDir = path.join(exeDir, CONFIG.PORTABLE_DATA_FOLDER);
  if (fs.existsSync(portableDir)) {
    return { baseDir: portableDir, isPortable: true };
  }

  // 策略 B: 开发环境下项目根目录的 'data' 文件夹
  if (!app.isPackaged) {
    const devDir = path.join(cwd, CONFIG.PORTABLE_DATA_FOLDER);
    if (fs.existsSync(devDir)) {
      return { baseDir: devDir, isPortable: true };
    }
  }

  // 策略 C: 系统标准 AppData 路径（安装版）
  return { baseDir: app.getPath('userData'), isPortable: false };
}

// ==========================================
// 锁管理
// ==========================================

/**
 * 检查锁文件状态
 */
function checkLock(lockFile) {
  if (!fs.existsSync(lockFile)) {
    return { locked: false, pid: null };
  }

  try {
    const pid = parseInt(fs.readFileSync(lockFile, 'utf8'), 10);
    if (isProcessRunning(pid)) {
      return { locked: true, pid };
    }
    logger.info('APP_SETUP', `发现陈旧的锁文件 (PID: ${pid})，将覆盖`);

    return { locked: false, pid };
  } catch {
    return { locked: false, pid: null };
  }
}

/**
 * 尝试获取锁
 */
function acquireLock(lockFile) {
  const { locked } = checkLock(lockFile);
  if (locked) return false;

  try {
    fs.writeFileSync(lockFile, String(process.pid), 'utf8');
    currentLockFile = lockFile;
    registerCleanup();

    return true;
  } catch (error) {
    logger.error('APP_SETUP', `锁操作失败: ${error.message}`);

    return false;
  }
}

/**
 * 释放锁
 */
function releaseLock() {
  if (!currentLockFile) return;

  try {
    if (fs.existsSync(currentLockFile)) {
      const pid = parseInt(fs.readFileSync(currentLockFile, 'utf8'), 10);
      if (pid === process.pid) {
        fs.unlinkSync(currentLockFile);
      }
    }
  } catch {
    // 忽略清理错误
  }
}

/**
 * 注册退出时的清理逻辑
 */
function registerCleanup() {
  if (cleanupRegistered) return;

  process.on('exit', releaseLock);
  process.on('SIGINT', () => { releaseLock(); process.exit(130); });
  process.on('SIGTERM', () => { releaseLock(); process.exit(143); });

  cleanupRegistered = true;
}

// ==========================================
// 实例分配
// ==========================================

/**
 * 分配可用的实例槽位
 */
function allocateInstance(baseDir) {
  for (let id = 1; id <= CONFIG.MAX_INSTANCES; id++) {
    const instancePath = path.join(baseDir, CONFIG.INSTANCES_FOLDER, `instance_${id}`);

    if (!ensureDir(instancePath)) continue;

    const lockFile = path.join(instancePath, CONFIG.LOCK_FILE_NAME);
    const { locked } = checkLock(lockFile);

    // 副实例（id > 1）且未被锁定时清理旧数据
    if (!locked && CONFIG.CLEAN_SECONDARY_INSTANCES && id > 1) {
      cleanDir(instancePath);
    }

    if (acquireLock(lockFile)) {
      return { instanceId: id, instancePath };
    }
  }

  return null;
}

// ==========================================
// 主入口
// ==========================================

/**
 * 初始化用户数据路径
 * 处理便携模式检测和多实例数据隔离
 */
export function initializeUserData() {
  try {
    // 1. 解析基础数据目录
    const { baseDir, isPortable } = resolveBaseDir();
    process.env.LINX_DATA_PATH = baseDir;

    const mode = isPortable ? '便携版' : '安装版';
    logger.info('APP_SETUP', `基础目录: ${baseDir} (${mode})`);

    // 2. 分配实例槽位
    const instance = allocateInstance(baseDir);

    if (instance) {
      logger.info('APP_SETUP', `实例 #${instance.instanceId}: ${instance.instancePath}`);
      app.setPath('userData', instance.instancePath);
    } else {
      logger.warn('APP_SETUP', `已达到最大实例数 (${CONFIG.MAX_INSTANCES})，使用主目录（可能冲突）`);
      app.setPath('userData', baseDir);
    }
  } catch (error) {
    logger.error('APP_SETUP', '初始化失败', { error: error.message });
  }
}
