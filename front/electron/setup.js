import { app } from 'electron';
import fs from 'fs';
import path from 'path';

/**
 * 初始化用户数据路径
 * 处理便携模式检测和多实例数据隔离
 */
export function initializeUserData() {
  const exePath = app.getPath('exe');
  const exeDir = path.dirname(exePath);
  const cwd = process.cwd();

  // ==========================================
  // 1. 确定基础数据根目录 (Base User Data Dir)
  // ==========================================
  let baseDir = null;
  let isPortable = false;

  // 策略 A: 检查打包后的 exe 同级目录下是否有 'data' 文件夹
  const portableDataDir = path.join(exeDir, 'data');
  if (fs.existsSync(portableDataDir)) {
    baseDir = portableDataDir;
    isPortable = true;
  }

  // 策略 B: 开发环境下，检查项目根目录是否有 'data' 文件夹
  if (!baseDir && !app.isPackaged) {
    const devDataDir = path.join(cwd, 'data');
    if (fs.existsSync(devDataDir)) {
      baseDir = devDataDir;
      isPortable = true;
    }
  }

  // 策略 C: 默认安装模式，使用系统标准 AppData 路径
  if (!baseDir) {
    baseDir = app.getPath('userData');
  }

  // 核心：设置共享数据路径环境变量，供 Keytar 和 Database 使用
  process.env.LINX_DATA_PATH = baseDir;

  // ==========================================
  // 2. 分配实例槽位 (Instance Slot Allocation)
  // ==========================================
  // 目标：找到一个未被占用的目录作为当前进程的 userData
  // 槽位命名规则：
  // - 主槽位: baseDir
  // - 副槽位: baseDir + "_2", baseDir + "_3", ...

  let instanceId = 1;
  let finalUserDataPath = baseDir;
  const maxInstances = 5; // 最大允许自动多开数

  while (instanceId <= maxInstances) {
    // 构造当前尝试的路径
    // 统一策略：所有实例（包括主实例）都运行在 _instances 子目录下
    // 这样 baseDir 仅作为共享数据存储（数据库、配置），不包含运行时缓存
    finalUserDataPath = path.join(baseDir, '_instances', `instance_${instanceId}`);

    // 确保目录存在
    try {
      if (!fs.existsSync(finalUserDataPath)) {
        fs.mkdirSync(finalUserDataPath, { recursive: true });
      }
    } catch (err) {
      console.error(`[Setup] 无法创建目录: ${finalUserDataPath}`, err);
      instanceId++;
      continue;
    }

    // 检查锁状态
    // 策略：对于 instance_2 及以上的副实例，如果发现它们没在运行（锁是空的或陈旧的），
    // 我们在启动前先清空目录，确保存储空间不膨胀。
    const shouldClean = instanceId > 1;

    if (tryAcquireLock(finalUserDataPath, shouldClean)) {
      // 成功获取锁！
      console.log(`[Setup] 实例初始化成功 (ID: ${instanceId})`);
      console.log(`[Setup] 数据目录: ${finalUserDataPath}`);
      console.log(`[Setup] 运行模式: ${isPortable ? '便携版 (Portable)' : '安装版 (Installed)'}`);

      // 核心：告诉 Electron 使用这个目录
      app.setPath('userData', finalUserDataPath);

      return;
    }

    // 当前槽位被占用，尝试下一个
    instanceId++;
  }

  console.warn('[Setup] 警告: 无法找到空闲的实例槽位，将强制使用主目录（可能会导致崩溃）');
  app.setPath('userData', baseDir);
}

/**
 * 尝试获取目录锁
 * @param {string} dirPath 目标目录
 * @param {boolean} shouldClean 是否在获取锁前清空目录（用于副实例清理）
 * @returns {boolean} 是否成功获取锁
 */
function tryAcquireLock(dirPath, shouldClean = false) {
  const lockFile = path.join(dirPath, '.app_lock');

  try {
    // 1. 检查是否存在锁文件
    if (fs.existsSync(lockFile)) {
      const pid = parseInt(fs.readFileSync(lockFile, 'utf8'), 10);

      // 2. 检查持有锁的进程是否存活
      if (isProcessRunning(pid)) {
        return false; // 进程活着，锁有效，获取失败
      }

      // 进程死了，锁是陈旧的，可以覆盖
      console.log(`[Setup] 发现陈旧的锁文件 (PID: ${pid})，正在清理...`);
    }

    // 3. [新增] 如果需要清理且目录未被锁定，则清空目录内容（保留目录本身）
    // 这确保了副实例每次启动都是干净的，不会占用磁盘空间
    if (shouldClean) {
      try {
        console.log(`[Setup] 正在清理临时实例目录: ${dirPath}`);
        // 读取目录下的所有文件
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const curPath = path.join(dirPath, file);
          // 强制删除文件或文件夹
          fs.rmSync(curPath, { recursive: true, force: true });
        }
      } catch (cleanErr) {
        console.warn(`[Setup] 清理目录失败 (非致命): ${cleanErr.message}`);
      }
    }

    // 4. 写入当前 PID 获取锁
    fs.writeFileSync(lockFile, String(process.pid));

    // 5. 注册退出时的清理逻辑
    const cleanup = () => {
      try {
        if (fs.existsSync(lockFile)) {
          const currentPid = parseInt(fs.readFileSync(lockFile, 'utf8'), 10);
          if (currentPid === process.pid) {
            fs.unlinkSync(lockFile);
          }
        }
      } catch { /* 忽略清理错误 */ }
    };

    // 监听各种退出信号
    process.on('exit', cleanup);
    process.on('SIGINT', () => { cleanup(); process.exit(); });
    process.on('SIGTERM', () => { cleanup(); process.exit(); });

    return true;

  } catch (err) {
    console.error(`[Setup] 锁操作失败: ${err.message}`);

    return false;
  }
}

/**
 * 检查进程是否运行
 */
function isProcessRunning(pid) {
  try {
    if (!pid) return false;
    process.kill(pid, 0); // 发送信号 0 检测进程是否存在

    return true;
  } catch {
    return false;
  }
}
