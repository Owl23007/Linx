package top.contins.linx.listener;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import top.contins.linx.model.entity.UserStatus;
import top.contins.linx.service.UserService;

/**
 * WebSocket 事件监听器
 * 监听 WebSocket 连接和断开事件,更新用户在线状态
 */
@Slf4j
@Component
public class WebSocketEventListener {

    private final UserService userService;

    @Autowired
    public WebSocketEventListener(UserService userService) {
        this.userService = userService;
    }

    /**
     * 监听 WebSocket 连接事件
     * 当用户建立 WebSocket 连接时,将用户状态设置为在线
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        // 从会话属性中获取用户信息
        var attributes = headerAccessor.getSessionAttributes();
        if (attributes != null) {
            String userId = (String) attributes.get("userId");
            Long userLongId = (Long) attributes.get("userLongId");

            if (userLongId != null) {
                log.info("用户连接 WebSocket: userId={}, userLongId={}, sessionId={}",
                        userId, userLongId, headerAccessor.getSessionId());

                // 更新用户状态为在线
                try {
                    userService.updateUserStatus(userLongId, UserStatus.ONLINE);
                    log.info("用户 {} 状态已更新为在线", userLongId);
                } catch (Exception e) {
                    log.error("更新用户在线状态失败: userId={}", userLongId, e);
                }
            } else {
                log.warn("WebSocket 连接缺少用户信息: sessionId={}", headerAccessor.getSessionId());
            }
        }
    }

    /**
     * 监听 WebSocket 断开事件
     * 当用户断开 WebSocket 连接时,将用户状态设置为离线
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        // 从会话属性中获取用户信息
        var attributes = headerAccessor.getSessionAttributes();
        if (attributes != null) {
            String userId = (String) attributes.get("userId");
            Long userLongId = (Long) attributes.get("userLongId");

            if (userLongId != null) {
                log.info("用户断开 WebSocket: userId={}, userLongId={}, sessionId={}",
                        userId, userLongId, headerAccessor.getSessionId());

                // 更新用户状态为离线
                try {
                    userService.updateUserStatus(userLongId, UserStatus.OFFLINE);
                    log.info("用户 {} 状态已更新为离线", userLongId);
                } catch (Exception e) {
                    log.error("更新用户离线状态失败: userId={}", userLongId, e);
                }
            } else {
                log.warn("WebSocket 断开缺少用户信息: sessionId={}", headerAccessor.getSessionId());
            }
        }
    }
}
