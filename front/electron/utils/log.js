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

// 日志级别对应的颜色（ANSI转义码）
const LEVEL_COLORS = {
  DEBUG: '\x1b[36m', // 青色
  INFO: '\x1b[32m',  // 绿色
  WARN: '\x1b[33m',  // 黄色
  ERROR: '\x1b[31m'  // 红色
};
const RESET_COLOR = '\x1b[0m';

class Logger {
  // 静态实例变量，全局单例
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
    this.currentLevel = LOG_LEVELS.DEBUG; // 动态调整日志级别
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
    this.setupElectronHandlers();
  }

  /**
   * 设置 Electron 特定的错误处理器
   */
  setupElectronHandlers() {
    // 处理 Node.js 警告
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

      webContents.on('unresponsive', () => {
        this.warn('WEB_CONTENTS_UNRESPONSIVE', 'WebContents became unresponsive', {
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
    app.on('certificate-error', (event, webContents, url, error, certificate) => {
      this.warn('CERTIFICATE_ERROR', `Certificate error: ${error}`, {
        url,
        certificate: certificate.subject
      });
    });
  }

  /**
   * 设置日志级别
   * @param {number} level - 日志级别
   */
  setLevel(level) {
    this.currentLevel = level;
  }

  /**
   * 获取格式化的时间戳
   * @returns {string} 格式化的时间戳
   */
  getTimestamp() {
    const now = new Date();
    const pad = (n, len = 2) => String(n).padStart(len, '0');

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
           `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
  }

  /**
   * 获取调用位置信息
   * @returns {string} 调用位置，格式如 "setup.js:42"
   */
  getCallerLocation(skipInternal = true) {
    try {
      const err = new Error();
      const stack = err.stack?.split('\n') || [];
      // 跳过 Error、getCallerLocation、debug/info/warn/error、以及可能的内部调用
      for (let i = 2; i < stack.length; i++) {
        const line = stack[i];
        // 跳过 log.js 自身的调用
        if (skipInternal && (line.includes('utils/log.js') || line.includes('utils\\log.js'))) continue;
        // 匹配文件路径和行号
        const match = line.match(/(?:at\s+)?(?:.*?\s+\()?(.+?):(\d+)(?::\d+)?\)?$/);
        if (match) {
          const fullPath = match[1];
          const lineNum = match[2];
          // 提取文件名
          const fileName = fullPath.split(/[\\/]/).pop();

          return `${fileName}:${lineNum}`;
        }
      }
    } catch {
      // 忽略错误
    }

    return 'unknown';
  }

  /**
   * 格式化控制台输出
   * @param {string} level - 日志级别
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {string} location - 调用位置
   * @returns {string} 格式化的日志字符串
   */
  formatConsoleOutput(level, tag, message, location) {
    const timestamp = this.getTimestamp();
    const color = LEVEL_COLORS[level] || '';

    return `${color}[${timestamp}][${level}][${tag}]${RESET_COLOR} ${message} ${LEVEL_COLORS.DEBUG}(${location})${RESET_COLOR}`;
  }

  /**
   * 记录 DEBUG 级别日志（仅在开发环境输出）
   * @param {string} tag - 日志标签
   * @param {string} message - 日志消息
   * @param {object} [context={}] - 额外上下文
   */
  debug(tag, message, context = {}) {
    if (this.currentLevel > LOG_LEVELS.DEBUG) return;

    if (process.env.NODE_ENV === 'development') {
      const location = this.getCallerLocation();
      console.debug(this.formatConsoleOutput('DEBUG', tag, message, location));
      if (Object.keys(context).length > 0) {
        console.debug('  Context:', context);
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

    const location = this.getCallerLocation();
    const logInfo = this.createLogEntry('INFO', tag, message, context, location);

    // 只写入到时间戳日志文件
    this.writeToLogFile(logInfo, false);

    if (process.env.NODE_ENV === 'development') {
      console.info(this.formatConsoleOutput('INFO', tag, message, location));
      if (Object.keys(context).length > 0) {
        console.info('  Context:', context);
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

    const location = this.getCallerLocation();
    const logInfo = this.createLogEntry('WARN', tag, message, context, location);

    // 只写入到时间戳日志文件
    this.writeToLogFile(logInfo, false);

    if (process.env.NODE_ENV === 'development') {
      console.warn(this.formatConsoleOutput('WARN', tag, message, location));
      if (Object.keys(context).length > 0) {
        console.warn('  Context:', context);
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
    const location = this.getCallerLocation();

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
        Error.captureStackTrace(errObj);
      }
    }

    // 清理堆栈
    const cleanedStack = this.cleanStack(errObj.stack);

    const logInfo = this.createLogEntry('ERROR', tag, errObj.message, {
      ...context,
      stack: cleanedStack
    }, location);

    // 写入到两个文件
    this.writeToLogFile(logInfo, true);

    if (process.env.NODE_ENV === 'development') {
      console.error(this.formatConsoleOutput('ERROR', tag, errObj.message, location));
      if (Object.keys(context).length > 0) {
        console.error('  Context:', context);
      }
      // 输出清理后的堆栈，便于开发者快速定位
      console.error('  Stack:', cleanedStack);
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
   * @param {string} [location=''] - 调用位置
   * @returns {object} 日志条目
   */
  createLogEntry(level, tag, message, context = {}, location = '') {
    return {
      timestamp: this.getTimestamp(),
      level,
      tag,
      message,
      location,
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

      // 通用日志格式：时间戳 | 级别 | 标签 | 位置 | 消息
      const locationPart = logInfo.location ? ` (${logInfo.location})` : '';
      const logEntry = `[${logInfo.timestamp}][${logInfo.level}][${logInfo.tag}]${locationPart} ${logInfo.message}${
        logInfo.context.stack ? `\n  Stack Trace:\n${logInfo.context.stack.split('\n').map(l => '    ' + l).join('\n')}` : ''
      }${Object.keys(contextWithoutStack).length > 0 ? '\n  Context: ' + JSON.stringify(contextWithoutStack, null, 2).split('\n').join('\n  ') : ''
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
Location: ${logInfo.location || 'unknown'}
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
      'ENOENT',  // 文件不存在
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
            console.error(`[ERROR][Logger] 获取文件信息失败 ${file}:`, error);
          }

          return null;
        }
      }).filter(info => info && info.isFile)
        .sort((a, b) => a.timestamp - b.timestamp); // 按时间戳排序，最旧的在前

      if (process.env.NODE_ENV === 'development') {
        console.log(this.formatConsoleOutput('INFO', 'Logger', `找到 ${fileInfos.length} 个时间戳日志文件`, this.getCallerLocation(false)));
      }

      // 1. 删除超过指定天数的文件
      let deletedCount = 0;
      fileInfos.forEach(fileInfo => {
        if (fileInfo.timestamp < cutoffTime) {
          try {
            fs.unlinkSync(fileInfo.path);
            if (process.env.NODE_ENV === 'development') {
              console.log(this.formatConsoleOutput('INFO', 'Logger', `已删除过期日志文件: ${fileInfo.name}`, this.getCallerLocation(false)));
            }
            deletedCount++;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(this.formatConsoleOutput('ERROR', 'Logger', `删除过期文件失败 ${fileInfo.name}: ${error.message}`, this.getCallerLocation(false)));
            }
          }
        }
      });

      // 2. 重新统计剩余文件
      const remainingFiles = fileInfos.filter(fileInfo => fileInfo.timestamp >= cutoffTime);

      // 3. 如果文件数量超过限制，删除最旧的文件
      if (remainingFiles.length >= maxFiles) {
        const filesToDelete = remainingFiles.slice(0, remainingFiles.length - maxFiles + 1);
        filesToDelete.forEach(fileInfo => {
          try {
            fs.unlinkSync(fileInfo.path);
            if (process.env.NODE_ENV === 'development') {
              console.log(this.formatConsoleOutput('INFO', 'Logger', `已删除超出数量限制的日志文件: ${fileInfo.name}`, this.getCallerLocation(false)));
            }
            deletedCount++;
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(this.formatConsoleOutput('ERROR', 'Logger', `删除文件失败 ${fileInfo.name}: ${error.message}`, this.getCallerLocation(false)));
            }
          }
        });
      }

      if (deletedCount > 0 && process.env.NODE_ENV === 'development') {
        console.log(this.formatConsoleOutput('INFO', 'Logger', `总共删除了 ${deletedCount} 个日志文件`, this.getCallerLocation(false)));
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(this.formatConsoleOutput('ERROR', 'Logger', `清理旧日志失败: ${error.message}`, this.getCallerLocation(false)));
      }
    }
  }
}

// 导出单例实例
export const logger = new Logger();

// 导出日志级别常量，外部使用
export { LOG_LEVELS };
