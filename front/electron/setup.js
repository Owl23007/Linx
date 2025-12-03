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
  INSTANCES_FOLDER: 'instances',
  LOCK_FILE_NAME: '.app_lock',
  CLEAN_SECONDARY_INSTANCES: true,
};

// ==========================================
// 模块状态
// ==========================================
let cleanupRegistered = false;
let currentLockFile = null;
let isReleasingLock = false; // 防止重复释放

// ==========================================
// 工具函数
// ==========================================

/**
 * 检查进程是否正在运行
 * @param {number} pid - 进程ID
 * @returns {boolean}
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
 * @param {string} dirPath - 目录路径
 * @returns {boolean} 是否成功
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
 * 清空目录内容
 * @param {string} dirPath - 目录路径
 * @returns {boolean} 是否成功
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
 * @returns {{ baseDir: string, isPortable: boolean }}
 */
function resolveBaseDir() {
  const exeDir = path.dirname(app.getPath('exe'));
  const cwd = process.cwd();
  const portableDir = path.join(exeDir, CONFIG.PORTABLE_DATA_FOLDER);
  const portableMarker = path.join(exeDir, '.portable');

  // 策略 A: 便携版 - 检测 .portable 标记文件或 data 文件夹已存在
  if (fs.existsSync(portableMarker) || fs.existsSync(portableDir)) {
    ensureDir(portableDir);

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
 * @param {string} lockFile - 锁文件路径
 * @returns {{ locked: boolean, isStale: boolean, stalePid: number|null }}
 */
function checkLockState(lockFile) {
  if (!fs.existsSync(lockFile)) {
    return { locked: false, isStale: false, stalePid: null };
  }

  try {
    const pid = parseInt(fs.readFileSync(lockFile, 'utf8'), 10);

    if (isProcessRunning(pid)) {
      return { locked: true, isStale: false, stalePid: null };
    }

    // 进程已不存在，锁文件是陈旧的
    return { locked: false, isStale: true, stalePid: pid };
  } catch {
    // 读取失败，视为无效锁文件
    return { locked: false, isStale: true, stalePid: null };
  }
}

/**
 * 尝试获取锁
 * @param {string} lockFile - 锁文件路径
 * @returns {{ success: boolean, isStale: boolean, stalePid: number|null }}
 */
function tryAcquireLock(lockFile) {
  const state = checkLockState(lockFile);

  // 已被其他活跃进程锁定
  if (state.locked) {
    return { success: false, isStale: false, stalePid: null };
  }

  // 尝试写入锁文件
  try {
    fs.writeFileSync(lockFile, String(process.pid), 'utf8');
    currentLockFile = lockFile;
    registerCleanup();

    return {
      success: true,
      isStale: state.isStale,
      stalePid: state.stalePid
    };
  } catch (error) {
    logger.error('APP_SETUP', `锁操作失败: ${error.message}`);

    return { success: false, isStale: state.isStale, stalePid: state.stalePid };
  }
}

/**
 * 释放锁
 * @returns {boolean} 是否成功释放
 */
function releaseLock() {
  // 防止并发重复释放
  if (isReleasingLock || !currentLockFile) return false;

  isReleasingLock = true;

  try {
    if (fs.existsSync(currentLockFile)) {
      const content = fs.readFileSync(currentLockFile, 'utf8');
      const pid = parseInt(content, 10);

      // 仅删除属于当前进程的锁
      if (pid === process.pid) {
        fs.unlinkSync(currentLockFile);

        if (typeof logger.debug === 'function') {
          logger.debug('APP_SETUP', `锁已释放: ${currentLockFile}`);
        } else {
          logger.info('APP_SETUP', '应用锁已释放');
        }

        return true;
      }
    }

    return false;
  } catch (error) {
    // 静默处理清理错误，避免退出时抛出异常
    logger.warn?.('APP_SETUP', `释放锁时出错: ${error.message}`);

    return false;
  } finally {
    currentLockFile = null;
    isReleasingLock = false;
  }
}

/**
 * 注册退出时的清理逻辑
 * 此处仅保留锁文件释放相关的最小事件监听
 */
function registerCleanup() {
  if (cleanupRegistered) return;

  // 进程退出时释放锁
  process.on('exit', releaseLock);

  // Electron will-quit 事件确保锁被释放
  app.on('will-quit', () => {
    releaseLock();
  });

  cleanupRegistered = true;
}

// ==========================================
// 实例分配
// ==========================================

/**
 * 分配可用的实例槽位
 * @param {string} baseDir - 基础目录
 * @returns {{ instanceId: number, instancePath: string }|null}
 */
function allocateInstance(baseDir) {
  for (let id = 1; id <= CONFIG.MAX_INSTANCES; id++) {
    const instancePath = path.join(baseDir, CONFIG.INSTANCES_FOLDER, `instance_${id}`);

    if (!ensureDir(instancePath)) continue;

    const lockFile = path.join(instancePath, CONFIG.LOCK_FILE_NAME);
    const result = tryAcquireLock(lockFile);

    // 记录陈旧锁日志（仅在获取锁时输出一次）
    if (result.isStale && result.stalePid) {
      logger.info('APP_SETUP', `发现陈旧的锁文件 (PID: ${result.stalePid})，已覆盖`);
    }

    if (result.success) {
      // 副实例（id > 1）清理旧数据
      if (CONFIG.CLEAN_SECONDARY_INSTANCES && id > 1) {
        cleanDir(instancePath);
      }

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

/**
 * 导出手动释放应用锁
 * @returns {boolean} 是否成功释放
 */
export { releaseLock };
