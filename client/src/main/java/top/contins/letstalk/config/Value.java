package top.contins.letstalk.config;

import java.lang.annotation.*;

/**
 * 💡 推荐复用：配置值注入注解
 * 
 * <p>该注解用于标记需要注入配置值的字段，配合 ConfigInjector 使用。
 * 
 * <p>特点：
 * - 类似Spring的@Value注解功能
 * - 支持路径式配置获取
 * - 运行时注解，支持反射操作
 * 
 * <p>使用示例：
 * {@code @Value("app.name") private String appName;}
 * 
 * <p>复用建议：
 * - 可直接复制到新项目使用
 * - 配合 ConfigInjector 和 AppConfig 使用
 * - 轻量级替代Spring的@Value注解
 * 
 * @author Oii Woof
 * @since 2025/08/18
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Value {
    String value();
}

