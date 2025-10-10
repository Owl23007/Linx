package top.contins.linx.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

/**
 * WebSocket 消息控制器
 * 处理聊天相关的 WebSocket 消息
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 处理群发消息
     * 客户端发送到: /app/chat.send
     * 服务端广播到: /topic/public
     *
     * @param chatMessage 聊天消息
     * @param headerAccessor 消息头访问器
     * @return 处理后的消息
     */
    @MessageMapping("/chat.send")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage,
                                    SimpMessageHeaderAccessor headerAccessor) {
        // 从会话属性中获取用户信息
        String userId = (String) headerAccessor.getSessionAttributes().get("userId");
        Long userLongId = (Long) headerAccessor.getSessionAttributes().get("userLongId");

        log.info("收到群发消息: userId={}, content={}", userId, chatMessage.getContent());

        // 设置发送者信息
        chatMessage.setSenderId(userId);
        chatMessage.setSenderLongId(userLongId);
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setType(MessageType.CHAT);

        return chatMessage;
    }

    /**
     * 处理私聊消息
     * 客户端发送到: /app/chat.private
     * 服务端发送到: /user/{recipientId}/queue/messages
     *
     * @param chatMessage 聊天消息
     * @param headerAccessor 消息头访问器
     */
    @MessageMapping("/chat.private")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage,
                                    SimpMessageHeaderAccessor headerAccessor) {
        // 从会话属性中获取用户信息
        String senderId = (String) headerAccessor.getSessionAttributes().get("userId");
        Long senderLongId = (Long) headerAccessor.getSessionAttributes().get("userLongId");

        log.info("收到私聊消息: senderId={}, recipientId={}, content={}",
                senderId, chatMessage.getRecipientId(), chatMessage.getContent());

        // 设置发送者信息
        chatMessage.setSenderId(senderId);
        chatMessage.setSenderLongId(senderLongId);
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setType(MessageType.PRIVATE);

        // 发送给指定用户
        messagingTemplate.convertAndSendToUser(
                chatMessage.getRecipientId(),
                "/queue/messages",
                chatMessage
        );

        // 可选: 同时发送给发送者自己(用于显示已发送的消息)
        messagingTemplate.convertAndSendToUser(
                senderId,
                "/queue/messages",
                chatMessage
        );
    }

    /**
     * 处理用户加入
     * 客户端发送到: /app/chat.join
     * 服务端广播到: /topic/public
     *
     * @param chatMessage 聊天消息
     * @param headerAccessor 消息头访问器
     * @return 处理后的消息
     */
    @MessageMapping("/chat.join")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage,
                                SimpMessageHeaderAccessor headerAccessor) {
        // 从会话属性中获取用户信息
        String userId = (String) headerAccessor.getSessionAttributes().get("userId");
        Long userLongId = (Long) headerAccessor.getSessionAttributes().get("userLongId");

        log.info("用户加入聊天: userId={}, username={}", userId, chatMessage.getSenderName());

        // 在 WebSocket 会话中存储用户名
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSenderName());

        // 设置消息信息
        chatMessage.setSenderId(userId);
        chatMessage.setSenderLongId(userLongId);
        chatMessage.setTimestamp(LocalDateTime.now());
        chatMessage.setType(MessageType.JOIN);
        chatMessage.setContent(chatMessage.getSenderName() + " 加入了聊天");

        return chatMessage;
    }

    /**
     * 聊天消息实体
     */
    public static class ChatMessage {
        private MessageType type;
        private String content;
        private String senderId;
        private Long senderLongId;
        private String senderName;
        private String recipientId;
        private LocalDateTime timestamp;

        // Getters and Setters
        public MessageType getType() {
            return type;
        }

        public void setType(MessageType type) {
            this.type = type;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getSenderId() {
            return senderId;
        }

        public void setSenderId(String senderId) {
            this.senderId = senderId;
        }

        public Long getSenderLongId() {
            return senderLongId;
        }

        public void setSenderLongId(Long senderLongId) {
            this.senderLongId = senderLongId;
        }

        public String getSenderName() {
            return senderName;
        }

        public void setSenderName(String senderName) {
            this.senderName = senderName;
        }

        public String getRecipientId() {
            return recipientId;
        }

        public void setRecipientId(String recipientId) {
            this.recipientId = recipientId;
        }

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }
    }

    /**
     * 消息类型枚举
     */
    public enum MessageType {
        CHAT,    // 普通聊天消息
        JOIN,    // 用户加入
        LEAVE,   // 用户离开
        PRIVATE  // 私聊消息
    }
}
