package top.contins.letstalk.config;

import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * 💡 推荐复用：YAML配置管理类
 * 
 * <p>该配置类设计规范，提供路径式配置获取功能，建议在新项目中复用。
 * 
 * <p>特点：
 * - 支持路径式配置获取，如 "app.baseUrl.auth"
 * - 单例模式，确保配置一致性
 * - 支持多种数据类型（String、Integer、Boolean、List）
 * - 基于 SnakeYAML 实现
 * 
 * <p>复用建议：
 * - 可直接复制到新项目使用
 * - 可扩展支持配置热重载
 * - 可替换为 Spring Boot 的 @ConfigurationProperties
 * 
 * @author Oii Woof
 * @since 2025/08/18
 */
public class AppConfig {
    private static AppConfig instance;
    private Map<String, Object> configMap;

    private AppConfig() {
        loadConfig();
    }

    private void loadConfig() {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream("application.yml")) {
            if (in == null) throw new RuntimeException("application.yml not found");
            Yaml yaml = new Yaml();
            this.configMap = yaml.load(in);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load application.yml", e);
        }
    }

    public static AppConfig getInstance() {
        if (instance == null) {
            instance = new AppConfig();
        }
        return instance;
    }

    /**
     * 路径式获取配置，如 "app.baseUrl.auth"
     */
    public Object get(String path) {
        String[] keys = path.split("\\.");
        Object current = configMap;
        for (String key : keys) {
            if (!(current instanceof Map)) return null;
            current = ((Map<?, ?>) current).get(key);
            if (current == null) return null;
        }
        return current;
    }

    public String getString(String path) {
        Object val = get(path);
        return val != null ? val.toString() : null;
    }

    public Integer getInt(String path) {
        Object val = get(path);
        if (val instanceof Number) return ((Number) val).intValue();
        try { return val != null ? Integer.parseInt(val.toString()) : null; } catch (Exception e) { return null; }
    }

    public Boolean getBoolean(String path) {
        Object val = get(path);
        if (val instanceof Boolean) return (Boolean) val;
        if (val != null) return Boolean.parseBoolean(val.toString());
        return null;
    }

    public List<?> getList(String path) {
        Object val = get(path);
        return val instanceof List ? (List<?>) val : null;
    }
}
