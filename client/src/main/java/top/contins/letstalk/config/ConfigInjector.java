package top.contins.letstalk.config;

import java.lang.reflect.Field;

/**
 * 💡 推荐复用：配置注入器
 * 
 * <p>该配置注入器实现了类似Spring的@Value注解功能，设计规范，建议复用。
 * 
 * <p>特点：
 * - 基于反射的配置值注入
 * - 支持多种数据类型（String、Integer、Boolean）
 * - 简单易用的注解式配置
 * 
 * <p>复用建议：
 * - 可直接复制到新项目使用
 * - 配合 AppConfig 和 @Value 注解使用
 * - 可扩展支持更多数据类型
 * - 轻量级替代Spring的依赖注入功能
 * 
 * @author Oii Woof
 * @since 2025/08/18
 * @version 1.0
 */
public class ConfigInjector {
    public static void injectConfigValues(Object target) {
        Class<?> clazz = target.getClass();
        for (Field field : clazz.getDeclaredFields()) {
            Value valueAnno = field.getAnnotation(Value.class);
            if (valueAnno != null) {
                String key = valueAnno.value();
                Object configValue = AppConfig.getInstance().getString(key);
                if (configValue != null) {
                    field.setAccessible(true);
                    try {
                        if (field.getType() == String.class) {
                            field.set(target, configValue.toString());
                        } else if (field.getType() == int.class || field.getType() == Integer.class) {
                            field.set(target, Integer.parseInt(configValue.toString()));
                        } else if (field.getType() == boolean.class || field.getType() == Boolean.class) {
                            field.set(target, Boolean.parseBoolean(configValue.toString()));
                        }
                    } catch (Exception e) {
                        throw new RuntimeException("配置注入失败: " + key, e);
                    }
                }
            }
        }
    }
}

