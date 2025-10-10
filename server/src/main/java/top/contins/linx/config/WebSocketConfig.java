package top.contins.linx.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * WebSocket配置类
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 启用简单消息代理，用于向客户端发送消息
        config.enableSimpleBroker("/topic", "/queue");

        // 设置应用程序消息前缀
        config.setApplicationDestinationPrefixes("/app");

        // 设置用户专用消息前缀
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 注册WebSocket端点，添加握手拦截器进行认证
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new WebSocketHandshakeInterceptor())
                .withSockJS();
    }

    /**
     * WebSocket 握手拦截器
     * 从网关传递的请求头中提取用户信息并存储到 WebSocket 会话属性中
     */
    private static class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                       WebSocketHandler wsHandler, Map<String, Object> attributes) {
            log.info("WebSocket 握手开始");

            if (request instanceof ServletServerHttpRequest servletRequest) {
                var httpRequest = servletRequest.getServletRequest();

                // 从网关传递的请求头中提取用户信息
                String userId = httpRequest.getHeader("X-User-ID");
                String userLongId = httpRequest.getHeader("X-User-Long-ID");
                String userRole = httpRequest.getHeader("X-User-Role");
                String userScopes = httpRequest.getHeader("X-User-Scopes");
                String tokenJti = httpRequest.getHeader("X-Token-JTI");
                String tokenType = httpRequest.getHeader("X-Token-Type");

                // 验证必需的用户信息
                if (userId == null || userId.isEmpty() || userLongId == null || userLongId.isEmpty()) {
                    log.warn("WebSocket 握手失败: 缺少用户身份信息");
                    return false;
                }

                // 将用户信息存储到 WebSocket 会话属性中
                attributes.put("userId", userId);
                attributes.put("userLongId", Long.parseLong(userLongId));
                attributes.put("userRole", userRole);
                attributes.put("userScopes", userScopes);
                attributes.put("tokenJti", tokenJti);
                attributes.put("tokenType", tokenType);

                log.info("WebSocket 握手成功: userId={}, userLongId={}", userId, userLongId);
                return true;
            }

            log.warn("WebSocket 握手失败: 无效的请求类型");
            return false;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Exception exception) {
            if (exception != null) {
                log.error("WebSocket 握手完成后发生异常", exception);
            } else {
                log.info("WebSocket 握手完成");
            }
        }
    }
}
