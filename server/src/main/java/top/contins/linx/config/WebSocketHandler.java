package top.contins.linx.config;

import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import top.contins.linx.model.dto.UserSession;

/**
 * WebSocket 消息处理器
 * 负责处理客户端连接、消息收发和断开事件
 */
@Slf4j
@Component
public class WebSocketHandler extends TextWebSocketHandler {

    @Override
    protected void handleTextMessage(WebSocketSession session, @NonNull TextMessage message) throws Exception {
        // 1. 从会话获取认证后的 UserSession
        UserSession userSession = (UserSession) session.getAttributes().get("USER_SESSION");
        if (userSession == null) {
            log.warn("未认证的 WebSocket 连接尝试发送消息，已拒绝");
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        // 2. 处理业务逻辑
        String response = String.format(
                "用户 %d 收到消息: %s",
                userSession.getUserLongId(),
                message.getPayload()
        );

        log.debug("向用户 {} 发送响应: {}", userSession.getUserId(), response);
        session.sendMessage(new TextMessage(response));
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        UserSession userSession = (UserSession) session.getAttributes().get("USER_SESSION");
        if (userSession != null) {
            log.info("WebSocket 连接已建立，用户ID: {}", userSession.getUserId());
        } else {
            log.warn("WebSocket 连接建立但未绑定用户会话");
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session,@NonNull CloseStatus status) {
        UserSession userSession = (UserSession) session.getAttributes().get("USER_SESSION");
        if (userSession != null) {
            log.info("WebSocket 连接已断开，用户ID: {}，状态码: {}",
                    userSession.getUserId(),
                    status.getCode());
        } else {
            log.debug("未认证的 WebSocket 连接已断开");
        }
    }
}