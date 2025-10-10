package top.contins.linx.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import top.contins.linx.model.common.ChatMessage;
import top.contins.linx.model.common.UserSession;
import top.contins.linx.service.WebsocketService;

/**
 * WebSocket 事件监听器
 * 监听连接、断开、订阅等事件
 */
@Slf4j
@Component
public class WebSocketEventListener {

    private final WebsocketService websocketService;
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebSocketEventListener(
            WebsocketService websocketService,
            SimpMessagingTemplate messagingTemplate) {
        this.websocketService = websocketService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * 监听 WebSocket 连接建立事件
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        // 从会话属性中获取用户信息
        UserSession userSession = (UserSession) headerAccessor.getSessionAttributes().get("USER_SESSION");

        if (userSession != null && sessionId != null) {
            Long userId = userSession.getUserLongId();

            // 标记用户上线
            websocketService.userOnline(userId, sessionId);

            log.info("WebSocket 连接已建立 - 用户ID: {}, 会话ID: {}", userId, sessionId);

            // 可选：广播用户上线消息
            broadcastUserJoined(userSession);

        } else {
            log.warn("WebSocket 连接建立但缺少用户信息 - 会话ID: {}", sessionId);
        }
    }

    /**
     * 监听 WebSocket 断开连接事件
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        // 从会话属性中获取用户信息
        UserSession userSession = (UserSession) headerAccessor.getSessionAttributes().get("USER_SESSION");

        if (userSession != null && sessionId != null) {
            Long userId = userSession.getUserLongId();

            // 标记用户下线
            websocketService.userOffline(userId, sessionId);

            log.info("WebSocket 连接已断开 - 用户ID: {}, 会话ID: {}", userId, sessionId);

            // 可选：广播用户离线消息
            broadcastUserLeft(userSession);

        } else {
            log.debug("WebSocket 连接断开 - 会话ID: {}", sessionId);
        }
    }

    /**
     * 监听订阅事件
     */
    @EventListener
    public void handleSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();
        String sessionId = headerAccessor.getSessionId();

        UserSession userSession = (UserSession) headerAccessor.getSessionAttributes().get("USER_SESSION");
        String userId = userSession != null ? userSession.getUserId() : "未知";

        log.debug("用户 {} 订阅了频道: {} (会话ID: {})", userId, destination, sessionId);

        // 可以在这里添加订阅权限验证
        // 例如：验证用户是否有权订阅某个群组或私聊频道
    }

    /**
     * 广播用户加入消息
     *
     * @param userSession 用户会话
     */
    private void broadcastUserJoined(UserSession userSession) {
        try {
            ChatMessage joinMessage = ChatMessage.createJoinMessage(
                    userSession.getUserLongId(),
                    userSession.getUserId()
            );

            // 广播到所有在线用户（可以根据业务需求调整）
            messagingTemplate.convertAndSend("/topic/system", joinMessage);

            log.debug("广播用户加入消息：{}", userSession.getUserId());

        } catch (Exception e) {
            log.error("广播用户加入消息失败", e);
        }
    }

    /**
     * 广播用户离开消息
     *
     * @param userSession 用户会话
     */
    private void broadcastUserLeft(UserSession userSession) {
        try {
            ChatMessage leaveMessage = ChatMessage.createLeaveMessage(
                    userSession.getUserLongId(),
                    userSession.getUserId()
            );

            // 广播到所有在线用户（可以根据业务需求调整）
            messagingTemplate.convertAndSend("/topic/system", leaveMessage);

            log.debug("广播用户离开消息：{}", userSession.getUserId());

        } catch (Exception e) {
            log.error("广播用户离开消息失败", e);
        }
    }
}
