package top.contins.letstalk.config;

import java.lang.reflect.Field;

/**
 * 配置注入器，用于将配置文件中的值注入到带有 @Value 注解的字段中
 * @author Oii Woof
 * @since 2025/08/18
 * @version 1.0
 **/
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
                        // 可扩展更多类型
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }
}

