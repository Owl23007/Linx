package top.contins.linx.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

/**
 * 配置类，用于加载私钥属性文件
 */
@Configuration
@PropertySource("classpath:private-key.properties")
public class SecretKeyProperties {
    // 用于加载 private-key.properties 文件
}

