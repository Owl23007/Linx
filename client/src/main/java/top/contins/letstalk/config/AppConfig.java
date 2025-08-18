package top.contins.letstalk.config;

import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * <h1>App配置类</h1>
 * <p>
 * 配置项路径式获取，如 "app.baseUrl.auth"
 *
 * @author Oii Woof
 * @since 2025/08/18
 *
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

    @SuppressWarnings("unchecked")
    public Map<String, Object> getMap(String path) {
        Object val = get(path);
        return val instanceof Map ? (Map<String, Object>) val : null;
    }
}
