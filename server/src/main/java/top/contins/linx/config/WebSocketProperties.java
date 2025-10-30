package top.contins.linx.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * WebSocket 配置属性
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "linx.websocket")
public class WebSocketProperties {

    /**
     * 心跳间隔（默认30秒）
     */
    private Duration heartbeatInterval = Duration.ofSeconds(30);

    /**
     * 连接超时时间（默认60秒）
     */
    private Duration timeout = Duration.ofSeconds(60);

    /**
     * 最大连接数（默认10000）
     */
    private int maxConnections = 10000;

    /**
     * 是否启用心跳检测
     */
    private boolean heartbeatEnabled = true;
}
