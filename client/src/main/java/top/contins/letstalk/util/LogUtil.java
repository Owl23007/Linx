package top.contins.letstalk.util;

import top.contins.letstalk.config.AppConfig;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 💡 推荐复用：轻量级日志工具类
 * 
 * <p>该工具类设计规范，独立性强，建议在新项目中复用。
 * 
 * <p>特点：
 * - 支持 DEBUG、INFO、WARN、ERROR 级别输出
 * - 可通过配置 log.level 控制输出级别
 * - 线程安全的日志输出
 * - 格式化输出支持：[LEVEL] [yyyy-MM-dd HH:mm:ss.SSS] [Thread] [Class] 消息
 * 
 * <p>复用建议：
 * - 可直接复制到新项目使用
 * - 配合 AppConfig 使用或替换为其他配置框架
 * - 可扩展为支持文件输出等功能
 * 
 * @author Oii Woof
 * @since 2025/08/18
 */
public record LogUtil(Class<?> sourceClass) {

    // 日志时间格式化
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    // 日志输出锁
    private static final Object LOCK = new Object();

    // 日志级别枚举，ordinal 自然排序：DEBUG(0) < INFO(1) < WARN(2) < ERROR(3)
    public enum Level {
        DEBUG, INFO, WARN, ERROR
    }

    // 当前允许输出的最低级别（例如：WARN 表示只输出 WARN 和 ERROR）
    private static final Level LOG_LEVEL;

    static {
        Level level = Level.INFO; // 默认级别
        try {
            String sysDebug = System.getProperty("app.debug");
            if ("true".equals(sysDebug)) {
                level = Level.DEBUG;
            } else {
                String configLevel = AppConfig.getInstance().getString("app.log.level").trim().toLowerCase();
                level = switch (configLevel) {
                    case "debug" -> Level.DEBUG;
                    case "info"  -> Level.INFO;
                    case "warn"  -> Level.WARN;
                    case "warning" -> Level.WARN; // 兼容
                    case "error" -> Level.ERROR;
                    default -> throw new IllegalArgumentException("未知的日志级别: " + configLevel);
                };
            }
        } catch (Throwable t) {
            // 配置加载失败时使用默认级别，并打印一条标准错误信息
            System.err.println("[LogUtil] Failed to load log.level, using default: INFO");
        }
        LOG_LEVEL = level;
    }

    // ========== 工厂方法 ==========
    public static LogUtil getLogger(Class<?> clazz) {
        return new LogUtil(clazz);
    }

    // ========== 实例方法：支持格式化 ==========
    public void debug(String message) {
        if (isLevelEnabled(Level.DEBUG)) {
            log(Level.DEBUG, message, null);
        }
    }

    public void debug(String format, Object... args) {
        if (isLevelEnabled(Level.DEBUG)) {
            log(Level.DEBUG, String.format(format, args), null);
        }
    }

    public void info(String message) {
        if (isLevelEnabled(Level.INFO)) {
            log(Level.INFO, message, null);
        }
    }

    public void info(String format, Object... args) {
        if (isLevelEnabled(Level.INFO)) {
            log(Level.INFO, String.format(format, args), null);
        }
    }

    public void warn(String message) {
        if (isLevelEnabled(Level.WARN)) {
            log(Level.WARN, message, null);
        }
    }

    public void warn(String format, Object... args) {
        if (isLevelEnabled(Level.WARN)) {
            log(Level.WARN, String.format(format, args), null);
        }
    }

    public void error(String message) {
        if (isLevelEnabled(Level.ERROR)) {
            log(Level.ERROR, message, null);
        }
    }

    public void error(String message, Throwable t) {
        if (isLevelEnabled(Level.ERROR)) {
            log(Level.ERROR, message, t);
        }
    }

    public void error(String format, Object... args) {
        if (isLevelEnabled(Level.ERROR)) {
            log(Level.ERROR, String.format(format, args), null);
        }
    }

    // ========== 私有方法 ==========
    private boolean isLevelEnabled(Level level) {
        return level.ordinal() >= LOG_LEVEL.ordinal();
    }

    private void log(Level level, String message, Throwable t) {
        synchronized (LOCK) {
            String time = LocalDateTime.now().format(DATE_FORMATTER);
            String threadName = Thread.currentThread().getName();
            String className = sourceClass.getSimpleName();
            String log = String.format("[%s] [%s] [%s] [%s] %s", level, time, threadName, className, message);
            if (level == Level.ERROR) {
                System.err.println(log);
                if (t != null) {
                    t.printStackTrace(System.err);
                }
            } else {
                System.out.println(log);
            }
        }
    }

    // 静态获取 logger
    public static LogUtil of(Class<?> clazz) {
        return getLogger(clazz);
    }
}