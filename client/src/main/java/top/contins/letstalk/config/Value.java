package top.contins.letstalk.config;

import java.lang.annotation.*;

/**
 * 用于注入配置文件中的值到类的字段中
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Value {
    String value();
}

