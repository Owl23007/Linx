package top.contins.linx.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 聊天消息实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    /**
     * 消息ID
     */
    private String messageId;

    /**
     * 消息类型
     */
    private MessageType type;

    /**
     * 发送者ID
     */
    private Long senderId;

    /**
     * 发送者用户名
     */
    private String senderName;

    /**
     * 接收者ID（私聊时使用）
     */
    private Long receiverId;

    /**
     * 群组ID（群聊时使用）
     */
    private String groupId;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 消息时间戳
     */
    private LocalDateTime timestamp;

    /**
     * 扩展数据（JSON格式，用于存储文件URL、缩略图等）
     */
    private String extra;

    /**
     * 是否已读
     */
    private Boolean isRead;

    /**
     * 创建聊天消息
     */
    public static ChatMessage createChatMessage(Long senderId, String senderName, Long receiverId, String content) {
        ChatMessage message = new ChatMessage();
        message.setType(MessageType.CHAT);
        message.setSenderId(senderId);
        message.setSenderName(senderName);
        message.setReceiverId(receiverId);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        message.setIsRead(false);
        return message;
    }

    /**
     * 创建系统消息
     */
    public static ChatMessage createSystemMessage(String content) {
        ChatMessage message = new ChatMessage();
        message.setType(MessageType.SYSTEM);
        message.setContent(content);
        message.setTimestamp(LocalDateTime.now());
        return message;
    }

    /**
     * 创建用户加入消息
     */
    public static ChatMessage createJoinMessage(Long userId, String userName) {
        ChatMessage message = new ChatMessage();
        message.setType(MessageType.JOIN);
        message.setSenderId(userId);
        message.setSenderName(userName);
        message.setContent(userName + " 加入了聊天");
        message.setTimestamp(LocalDateTime.now());
        return message;
    }

    /**
     * 创建用户离开消息
     */
    public static ChatMessage createLeaveMessage(Long userId, String userName) {
        ChatMessage message = new ChatMessage();
        message.setType(MessageType.LEAVE);
        message.setSenderId(userId);
        message.setSenderName(userName);
        message.setContent(userName + " 离开了聊天");
        message.setTimestamp(LocalDateTime.now());
        return message;
    }
}
