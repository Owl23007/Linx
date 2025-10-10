package top.contins.linx.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP WebSocket 配置
 * 提供基于消息的 WebSocket 通信（发布/订阅模式）
 */
@Configuration
@EnableWebSocketMessageBroker
public class StompConfig implements WebSocketMessageBrokerConfigurer {

    private final WsHandshakeInterceptor handshakeInterceptor;

    @Autowired
    public StompConfig(WsHandshakeInterceptor handshakeInterceptor) {
        this.handshakeInterceptor = handshakeInterceptor;
    }

    /**
     * 配置消息代理
     * /topic - 用于广播消息（一对多，群聊）
     * /queue - 用于点对点消息（一对一，私聊）
     * /app - 客户端发送消息的前缀
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 启用简单消息代理，支持 /topic 和 /queue 前缀
        config.enableSimpleBroker("/topic", "/queue");

        // 配置客户端发送消息的目的地前缀
        config.setApplicationDestinationPrefixes("/app");

        // 配置点对点消息的用户目的地前缀
        config.setUserDestinationPrefix("/user");
    }

    /**
     * 注册 STOMP 端点
     * 客户端通过此端点建立 WebSocket 连接
     *
     * 端点说明:
     * - /stomp: 原生 WebSocket 连接 (推荐用于现代浏览器)
     * - /stomp-sockjs: SockJS 降级方案 (用于不支持 WebSocket 的旧浏览器)
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 原生 WebSocket 端点（推荐）
        registry.addEndpoint("/stomp")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOriginPatterns("*"); // TODO: 生产环境需配置具体域名

        // SockJS 降级端点（兼容旧浏览器）
        registry.addEndpoint("/stomp-sockjs")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOriginPatterns("*") // TODO: 生产环境需配置具体域名
                .withSockJS(); // 启用 SockJS 降级方案
    }
}
