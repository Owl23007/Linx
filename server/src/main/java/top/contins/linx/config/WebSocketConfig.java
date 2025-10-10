// top/contins/linx/config/WebSocketConfig.java
package top.contins.linx.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import top.contins.linx.config.WebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final WsHandshakeInterceptor handshakeInterceptor;
    private final WebSocketHandler webSocketHandler;

    @Autowired
    public WebSocketConfig(WsHandshakeInterceptor handshakeInterceptor, WebSocketHandler webSocketHandler) {
        this.handshakeInterceptor = handshakeInterceptor;
        this.webSocketHandler = webSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketHandler, "/ws") // 前端连接路径
                .addInterceptors(handshakeInterceptor)
                .setAllowedOrigins("http://localhost:5173"); // 前端开发地址
    }
}