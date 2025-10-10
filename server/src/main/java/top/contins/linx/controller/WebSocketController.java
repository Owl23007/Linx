package top.contins.linx.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import top.contins.linx.model.dto.ChatMessage;
import top.contins.linx.model.dto.MessageType;
import top.contins.linx.model.dto.UserSession;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * WebSocket/STOMP 消息控制器
 * 处理实时消息通信
 */
@Slf4j
@Controller
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * 处理私聊消息
     * 客户端发送到：/app/chat.private
     * 服务器推送到：/user/{receiverId}/queue/messages
     *
     * @param message 聊天消息
     * @param headerAccessor 消息头访问器
     */
    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        try {
            // 1. 从会话属性中获取发送者信息
            UserSession userSession = (UserSession) headerAccessor.getSessionAttributes().get("USER_SESSION");
            if (userSession == null) {
                log.warn("未认证的用户尝试发送私聊消息");
                return;
            }

            // 2. 设置消息信息
            message.setMessageId(UUID.randomUUID().toString());
            message.setSenderId(userSession.getUserLongId());
            message.setSenderName(userSession.getUserId());
            message.setTimestamp(LocalDateTime.now());
            message.setType(MessageType.CHAT);
            message.setIsRead(false);

            // 3. 验证接收者ID
            if (message.getReceiverId() == null) {
                log.warn("私聊消息缺少接收者ID");
                return;
            }

            log.info("私聊消息：从用户 {} 发送到用户 {}",
                    userSession.getUserId(), message.getReceiverId());

            // 4. 发送给接收者（点对点）
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(message.getReceiverId()),
                    "/queue/messages",
                    message
            );

            // 5. 发送给发送者自己（消息回执）
            messagingTemplate.convertAndSendToUser(
                    userSession.getUserId(),
                    "/queue/messages",
                    message
            );

        } catch (Exception e) {
            log.error("发送私聊消息失败", e);
        }
    }

    /**
     * 处理群聊消息
     * 客户端发送到：/app/chat.group
     * 服务器广播到：/topic/group.{groupId}
     *
     * @param message 聊天消息
     * @param headerAccessor 消息头访问器
     */
    @MessageMapping("/chat.group")
    @SendTo("/topic/group.{groupId}")
    public ChatMessage sendGroupMessage(@Payload ChatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        try {
            // 1. 从会话属性中获取发送者信息
            UserSession userSession = (UserSession) headerAccessor.getSessionAttributes().get("USER_SESSION");
            if (userSession == null) {
                log.warn("未认证的用户尝试发送群聊消息");
                return null;
            }

            // 2. 设置消息信息
            message.setMessageId(UUID.randomUUID().toString());
            message.setSenderId(userSession.getUserLongId());
            message.setSenderName(userSession.getUserId());
            message.setTimestamp(LocalDateTime.now());
            message.setType(MessageType.CHAT);

            // 3. 验证群组ID
            if (message.getGroupId() == null || message.getGroupId().trim().isEmpty()) {
                log.warn("群聊消息缺少群组ID");
                return null;
            }

            log.info("群聊消息：用户 {} 发送到群组 {}",
                    userSession.getUserId(), message.getGroupId());

            // 4. 广播到群组（这里使用 @SendTo 自动广播）
            return message;

        } catch (Exception e) {
            log.error("发送群聊消息失败", e);
            return null;
        }
    }

    /**
     * 处理心跳消息
     * 客户端发送到：/app/chat.heartbeat
     *
     * @param headerAccessor 消息头访问器
     */
    @MessageMapping("/chat.heartbeat")
    @SendToUser("/queue/heartbeat")
    public String handleHeartbeat(SimpMessageHeaderAccessor headerAccessor) {
        UserSession userSession = (UserSession) headerAccessor.getSessionAttributes().get("USER_SESSION");
        if (userSession != null) {
            log.debug("收到用户 {} 的心跳", userSession.getUserId());
            return "pong";
        }
        return "unauthorized";
    }

    /**
     * 处理输入状态（正在输入...）
     * 客户端发送到：/app/chat.typing
     *
     * @param message 消息（包含 receiverId）
     * @param headerAccessor 消息头访问器
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload ChatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        try {
            UserSession userSession = (UserSession) headerAccessor.getSessionAttributes().get("USER_SESSION");
            if (userSession == null) {
                return;
            }

            message.setType(MessageType.TYPING);
            message.setSenderId(userSession.getUserLongId());
            message.setSenderName(userSession.getUserId());
            message.setTimestamp(LocalDateTime.now());

            // 发送给对方
            if (message.getReceiverId() != null) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(message.getReceiverId()),
                        "/queue/typing",
                        message
                );
                log.debug("用户 {} 正在给用户 {} 输入",
                        userSession.getUserId(), message.getReceiverId());
            }

        } catch (Exception e) {
            log.error("处理输入状态失败", e);
        }
    }

    /**
     * 处理已读回执
     * 客户端发送到：/app/chat.read
     *
     * @param message 消息（包含 messageId 和 senderId）
     * @param headerAccessor 消息头访问器
     */
    @MessageMapping("/chat.read")
    public void handleReadReceipt(@Payload ChatMessage message, SimpMessageHeaderAccessor headerAccessor) {
        try {
            UserSession userSession = (UserSession) headerAccessor.getSessionAttributes().get("USER_SESSION");
            if (userSession == null) {
                return;
            }

            message.setType(MessageType.READ_RECEIPT);
            message.setReceiverId(userSession.getUserLongId());
            message.setTimestamp(LocalDateTime.now());
            message.setIsRead(true);

            // 发送给原消息发送者
            if (message.getSenderId() != null) {
                messagingTemplate.convertAndSendToUser(
                        String.valueOf(message.getSenderId()),
                        "/queue/read-receipt",
                        message
                );
                log.debug("用户 {} 已读来自用户 {} 的消息 {}",
                        userSession.getUserId(), message.getSenderId(), message.getMessageId());
            }

        } catch (Exception e) {
            log.error("处理已读回执失败", e);
        }
    }
}
