import { app, dialog, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

/*
使用示例：

// 引入日志器
import { logger, LOG_LEVELS } from './utils/log.js';

// 调试信息（仅开发环境控制台输出，不保存到文件）
logger.debug('APP_INIT', '应用程序初始化开始');

// 信息日志（保存到 log-{timestamp}.log）
logger.info('USER_LOGIN', '用户登录成功', { userId: 123, username: 'john' });

// 警告日志（保存到 log-{timestamp}.log）
logger.warn('DEPRECATED_API', '使用了已废弃的API', { apiName: 'oldMethod' });

// 错误日志（保存到 log-{timestamp}.log 和 error.log）
logger.error('DATABASE_ERROR', '数据库连接失败', { errorCode: 'CONN_TIMEOUT' });

// 传入 Error 对象
try {
  // 可能出错的代码
} catch (error) {
  logger.error('UNEXPECTED_ERROR', error, { operation: 'userUpdate' });
}

// 设置日志级别（默认为 DEBUG）
logger.setLevel(LOG_LEVELS.INFO); // 只记录 INFO 及以上级别

// 日志文件说明：
// - log-{timestamp}.log: 包含 INFO、WARN、ERROR 级别的日志
// - error.log: 仅包含 ERROR 级别的日志，格式更详细
// - DEBUG 级别日志不保存到文件，仅开发环境控制台输出
*/

// 日志级别常量
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  // 添加静态实例变量，确保单例
  static instance = null;

  constructor() {
    // 如果已有实例，返回现有实例
    if (Logger.instance) {
      return Logger.instance;
    }
    Logger.instance = this;

    this.logPath = null;
    this.errorLogPath = null;
    this.currentLogPath = null;
    this.logsDir = null;
    this.currentLevel = LOG_LEVELS.DEBUG; // 可以动态调整日志级别
    this.init();
  }

  /**
   * 初始化日志器，设置路径和全局处理器
   */
  init() {
    // 获取日志文件路径
    const userDataPath = app.getPath('userData');
    this.logsDir = path.join(userDataPath, 'logs');

    // 确保日志目录存在
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

    // 创建带时间戳的日志文件名 (保存 info, warn, error)
    const timestamp = Date.now();
    this.currentLogPath = path.join(this.logsDir, `log-${timestamp}.log`);

    // 错误专用日志文件 (只记录 error)
    this.errorLogPath = path.join(this.logsDir, 'error.log');

    // 清理旧日志文件
    this.cleanOldLogs();

    // 设置全局错误处理
    this.setupGlobalHandlers();
  }

  /**
   * 设置全局错误处理器
   */
  setupGlobalHandlers() {
    // 处理未捕获的异常（同步错误）
    process.on('uncaughtException', async (error, origin) => {
      await this.error('UNCAUGHT_EXCEPTION', error, { origin });
    });

    // 处理未处理的 Promise 拒绝（异步错误）
    process.on('unhandledRejection', async (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      await this.error('UNHANDLED_REJECTION', error, {
        promise: promise.toString(),
        stack: error.stack || new Error().stack
      });
    });

    // 处理警告
    process.on('warning', (warning) => {
      this.warn('SYSTEM_WARNING', warning.message, {
        name: warning.name,
        stack: warning.stack
      });
    });

    // Electron 特定的错误处理
    app.on('render-process-gone', async (event, webContents, details) => {
      await this.error('RENDER_PROCESS_GONE', `Render process gone: ${details.reason}`, {
        details,
        webContentsId: webContents.id,
        url: webContents.getURL()
      });
    });

    app.on('child-process-gone', async (event, details) => {
      await this.error('CHILD_PROCESS_GONE', `Child process gone: ${details.type} - ${details.reason}`, { details });
    });

    // 窗口相关错误
    app.on('web-contents-created', (event, webContents) => {
      webContents.on('crashed', async (event, killed) => {
        await this.error('WEB_CONTENTS_CRASHED', `WebContents crashed${killed ? ' (killed)' : ''}`, {
          killed,
          webContentsId: webContents.id,
          url: webContents.getURL()
        });
      });

      webContents.on('unresponsive', async () => {
        await this.warn('WEB_CONTENTS_UNRESPONSIVE', 'WebContents became unresponsive', {
          webContentsId: webContents.id,
          url: webContents.getURL()
        });
      });
    });

    // GPU 进程崩溃
    app.on('gpu-process-crashed', async (event, killed) => {
      await this.error('GPU_PROCESS_CRASHED', `GPU process crashed${killed ? ' (killed)' : ''}`, { killed });
    });

    // 证书错误
    app.on('certificate-error', async (event, webContents, url, error, certificate) => {
      await this.warn('CERTIFICATE_ERROR', `Certificate error: ${error}`, {
        url,
        certificate: certificate.subject
      });
    });
  }

  /**
   * 设置日志级别
   * @param {number} level - 日志级别（使用 LOG_LEVELS 常量）
   */
  setLevel(level) {
    this.currentLevel = level;
  }

  /**
   * 记录 DEBUG 级别日志（仅开发环境控制台，不保存文件）
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {object} [context={}] - 额外上下文
   */
  debug(tag, message, context = {}) {
    if (this.currentLevel > LOG_LEVELS.DEBUG) return;

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG][${tag}]`, message);
      if (Object.keys(context).length > 0) {
        console.debug('Context:', context);
      }
    }
  }

  /**
   * 记录 INFO 级别日志（保存到 log-{timestamp}.log）
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {object} [context={}] - 额外上下文
   */
  info(tag, message, context = {}) {
    if (this.currentLevel > LOG_LEVELS.INFO) return;

    const logInfo = this.createLogEntry('INFO', tag, message, context);

    // 只写入到时间戳日志文件
    this.writeToLogFile(logInfo, false);

    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO][${tag}]`, message);
      if (Object.keys(context).length > 0) {
        console.info('Context:', context);
      }
    }
  }

  /**
   * 记录 WARN 级别日志（保存到 log-{timestamp}.log）
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {object} [context={}] - 额外上下文
   */
  warn(tag, message, context = {}) {
    if (this.currentLevel > LOG_LEVELS.WARN) return;

    const logInfo = this.createLogEntry('WARN', tag, message, context);

    // 只写入到时间戳日志文件
    this.writeToLogFile(logInfo, false);

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN][${tag}]`, message);
      if (Object.keys(context).length > 0) {
        console.warn('Context:', context);
      }
    }
  }

  /**
   * 记录 ERROR 级别日志（保存到 log-{timestamp}.log 和 error.log）
   * @param {string} tag - 日志标签
   * @param {string|Error} message - 日志消息或错误对象
   * @param {object} [context={}] - 额外上下文
   * @returns {Promise<void>}
   */
  async error(tag, message, context = {}) {
    // 简化处理：直接使用传入的Error或构造新Error
    let errObj;
    if (message instanceof Error) {
      errObj = message;
    } else {
      errObj = new Error(String(message));
      // 如果context中有stack，使用它；否则生成调用堆栈
      if (context.stack) {
        errObj.stack = context.stack;
      } else if (Error.captureStackTrace) {
        Error.captureStackTrace(errObj, this.error);
      }
    }

    // 清理堆栈
    const cleanedStack = this.cleanStack(errObj.stack);

    const logInfo = this.createLogEntry('ERROR', tag, errObj.message, {
      ...context,
      stack: cleanedStack
    });

    // 写入到两个文件
    this.writeToLogFile(logInfo, true);

    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR][${tag}]`, errObj);
      if (Object.keys(context).length > 0) {
        console.error('Context:', context);
      }
      // 输出清理后的堆栈，便于开发者快速定位
      console.error('Cleaned Stack:', cleanedStack);
    }

    // 只有在应用准备就绪后才显示错误对话框
    if (app.isReady()) {
      await this.showErrorDialog(tag, errObj);
    } else {
      await app.whenReady();
      await this.showErrorDialog(tag, errObj);
    }
  }

  /**
   * 清理错误堆栈，去除内部帧
   * @param {string} stackRaw - 原始堆栈
   * @returns {string} 清理后的堆栈
   */
  cleanStack(stackRaw) {
    try {
      if (!stackRaw || typeof stackRaw !== 'string') return String(stackRaw || '');
      const lines = stackRaw.split('\n').map(l => l.trim());
      if (lines.length <= 1) return stackRaw;

      // 第一行是错误消息，保留
      const header = lines[0];
      const frames = lines.slice(1);

      // 过滤条件：排除包含 utils/log.js、Logger. 或明显的内部调用的位置
      const filteredFrames = frames.filter(frame => {
        const lower = frame.toLowerCase();
        if (lower.includes('utils/log.js')) return false;
        if (lower.includes('logger.')) return false;
        // 排除 node internals 中明显属于本文件或错误处理的行
        if (lower.includes('at object.error') || lower.includes('at logger.error')) return false;

        return true;
      });

      // 如果过滤后为空，退回到原始 frames 中移除第一条内部帧（保底）
      const finalFrames = filteredFrames.length > 0 ? filteredFrames : frames.slice(1);

      return [header, ...finalFrames].join('\n');
    } catch {
      return stackRaw;
    }
  }

  /**
   * 创建日志条目对象
   * @param {string} level - 日志级别
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {object} [context={}] - 额外上下文
   * @returns {object} 日志条目
   */
  createLogEntry(level, tag, message, context = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      tag,
      message,
      context,
      platform: process.platform,
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node
    };
  }

  /**
   * 将日志写入文件
   * @param {object} logInfo - 日志信息
   * @param {boolean} [isError=false] - 是否为错误日志
   */
  writeToLogFile(logInfo, isError = false) {
    try {
      // 提取上下文，去除stack以单独处理
      const contextWithoutStack = { ...logInfo.context };
      delete contextWithoutStack.stack;

      // 通用日志格式，展开stack为多行
      const logEntry = `[${logInfo.timestamp}] [${logInfo.level}] [${logInfo.tag}] ${logInfo.message}${
        logInfo.context.stack ? `\nStack Trace:\n${logInfo.context.stack}` : ''
      }${Object.keys(contextWithoutStack).length > 0 ? '\nContext: ' + JSON.stringify(contextWithoutStack, null, 2) : ''
      }\n`;

      // 写入到时间戳日志文件
      fs.appendFileSync(this.currentLogPath, logEntry);

      // 如果是错误，还要写入到error.log
      if (isError) {
        // 错误日志格式更详细
        const errorEntry = `
================================================================================
Timestamp: ${logInfo.timestamp}
Level: ${logInfo.level}
Tag: ${logInfo.tag}
Message: ${logInfo.message}
${logInfo.context.stack ? `Stack Trace:\n${logInfo.context.stack}` : ''}

Context: ${JSON.stringify(logInfo.context, null, 2)}
Platform: ${logInfo.platform}
App Version: ${logInfo.version}
Electron Version: ${logInfo.electronVersion}
Node.js Version: ${logInfo.nodeVersion}
================================================================================

`;
        fs.appendFileSync(this.errorLogPath, errorEntry);
      }
    } catch (logError) {
      // 如果无法写入日志文件，至少在控制台输出
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to write to log file:', logError);
        console.error('Original log:', logInfo);
      }
    }
  }

  /**
   * 判断是否应在错误时退出应用
   * @param {Error} error - 错误对象
   * @returns {boolean}
   */
  shouldExitOnError(error) {
    // 严重的系统级错误应该退出应用
    const fatalErrors = [
      'EACCES',  // 权限错误
      'ENOENT',  // 文件不存在（关键文件）
      'EMFILE',  // 文件描述符用尽
      'ENOMEM'   // 内存不足
    ];

    const fatalMessages = [
      'cannot allocate memory',
      'out of memory',
      'segmentation fault',
      'stack overflow'
    ];

    return fatalErrors.some(code => error.code === code) ||
           fatalMessages.some(msg => error.message.toLowerCase().includes(msg));
  }

  /**
   * 判断是否显示恢复选项
   * @param {string} type - 错误类型
   * @returns {boolean}
   */
  shouldShowRecoveryOptions(type) {
    const recoveryTypes = [
      'RENDER_PROCESS_GONE',
      'WEB_CONTENTS_CRASHED',
      'GPU_PROCESS_CRASHED',
      'UNCAUGHT_EXCEPTION',
      'UNHANDLED_REJECTION'
    ];

    return recoveryTypes.includes(type);
  }

  /**
   * 判断是否为严重错误
   * @param {string} type - 错误类型
   * @param {Error} error - 错误对象
   * @returns {boolean}
   */
  isCriticalError(type, error) {
    const criticalTypes = [
      'UNCAUGHT_EXCEPTION',
      'RENDER_PROCESS_GONE',
      'CHILD_PROCESS_GONE'
    ];

    const criticalMessages = [
      'database',
      'file system',
      'permission denied',
      'access denied'
    ];

    return criticalTypes.includes(type) ||
           criticalMessages.some(msg => error.message.toLowerCase().includes(msg));
  }

  /**
   * 显示错误对话框
   * @param {string} type - 错误类型
   * @param {Error} error - 错误对象
   */
  async showErrorDialog(type, error) {
    try {
      const logPath = this.getLogPath();
      const result = await dialog.showMessageBox({
        type: 'error',
        title: '应用程序错误',
        message: `发生了一个错误: ${error.message}`,
        detail: '详细错误信息已保存到日志文件中。\n\n点击"打开日志"查看完整错误信息。',
        buttons: ['确定', '打开日志'],
        defaultId: 0,
        cancelId: 0,
        noLink: true
      });

      // 如果用户选择打开日志
      if (result.response === 1) {
        try {
          await shell.openPath(logPath);
        } catch (openError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to open log file:', openError);
          }
          // 如果无法打开文件，尝试打开文件夹
          try {
            const logDir = path.dirname(logPath);
            await shell.openPath(logDir);
          } catch (dirError) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Failed to open log directory:', dirError);
            }
            dialog.showErrorBox('无法打开日志', `请手动导航到日志文件：\n${logPath}`);
          }
        }
      }
    } catch (dialogError) {
      // 如果对话框显示失败，至少在控制台输出错误信息
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to show error dialog:', dialogError);
        console.error('Original error:', error.message);
        console.error('Log file location:', this.getLogPath());
      }
    }
  }

  /**
   * 手动记录错误
   * @param {string} type - 错误类型
   * @param {Error|string} error - 错误对象或消息
   * @param {object} [context={}] - 额外上下文
   * @returns {Promise<void>}
   */
  async logError(type, error, context = {}) {
    return await this.error(type, error, context);
  }

  /**
   * 获取主日志文件路径
   * @returns {string}
   */
  getLogPath() {
    return this.currentLogPath;
  }

  /**
   * 获取错误日志文件路径
   * @returns {string}
   */
  getErrorLogPath() {
    return this.errorLogPath;
  }

  /**
   * 清理旧日志文件
   * @param {number} [daysToKeep=30] - 保留天数
   * @param {number} [maxFiles=50] - 最大文件数
   */
  cleanOldLogs(daysToKeep = 30, maxFiles = 50) {
    try {
      const files = fs.readdirSync(this.logsDir);
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      const currentLogFile = path.basename(this.currentLogPath);
      const errorLogFile = path.basename(this.errorLogPath);

      // 过滤出 log-${timestamp}.log 格式的文件（时间戳为数字）
      const timestampLogFiles = files.filter(file => {
        // 匹配 log-数字.log 格式
        const timestampMatch = file.match(/^log-(\d+)\.log$/);

        return timestampMatch &&
               file !== currentLogFile &&
               file !== errorLogFile;
      });

      // 按文件名中的时间戳排序（最旧的在前）
      const fileInfos = timestampLogFiles.map(file => {
        const filePath = path.join(this.logsDir, file);
        const timestampMatch = file.match(/^log-(\d+)\.log$/);
        const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : 0;

        try {
          const stats = fs.statSync(filePath);

          return {
            name: file,
            path: filePath,
            timestamp: timestamp,
            mtime: stats.mtime.getTime(),
            isFile: stats.isFile()
          };
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`[Logger] 获取文件信息失败 ${file}:`, error);
          }

          return null;
        }
      }).filter(info => info && info.isFile)
        .sort((a, b) => a.timestamp - b.timestamp); // 按时间戳排序，最旧的在前

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Logger] 找到 ${fileInfos.length} 个时间戳日志文件`);
      }

      // 1. 删除超过指定天数的文件（基于文件名中的时间戳）
      let deletedCount = 0;
      fileInfos.forEach(fileInfo => {
        if (fileInfo.timestamp < cutoffTime) {
          try {
            fs.unlinkSync(fileInfo.path);
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Logger] 已删除过期日志文件: ${fileInfo.name}`);
            }
            deletedCount++;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(`[Logger] 删除过期文件失败 ${fileInfo.name}:`, error);
            }
          }
        }
      });

      // 2. 重新统计剩余文件（排除已删除的）
      const remainingFiles = fileInfos.filter(fileInfo => fileInfo.timestamp >= cutoffTime);

      // 3. 如果文件数量超过限制，删除最旧的文件
      if (remainingFiles.length >= maxFiles) {
        const filesToDelete = remainingFiles.slice(0, remainingFiles.length - maxFiles + 1);
        filesToDelete.forEach(fileInfo => {
          try {
            fs.unlinkSync(fileInfo.path);
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Logger] 已删除超出数量限制的日志文件: ${fileInfo.name}`);
            }
            deletedCount++;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(`[Logger] 删除文件失败 ${fileInfo.name}:`, error);
            }
          }
        });
      }

      if (deletedCount > 0 && process.env.NODE_ENV === 'development') {
        console.log(`[Logger] 总共删除了 ${deletedCount} 个日志文件`);
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Logger] 清理旧日志失败:', error);
      }
    }
  }
}

// 导出单例实例
export const logger = new Logger();

// 导出日志级别常量，方便外部使用
export { LOG_LEVELS };
