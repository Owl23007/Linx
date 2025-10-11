package top.contins.linx.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.enums.MessageType;

import java.time.LocalDateTime;

/**
 * 聊天消息实体（数据库持久化）
 */
@Entity
@Table(name = "chat_messages",
       indexes = {
           @Index(name = "idx_sender", columnList = "sender_id"),
           @Index(name = "idx_receiver", columnList = "receiver_id"),
           @Index(name = "idx_group", columnList = "group_id"),
           @Index(name = "idx_timestamp", columnList = "timestamp"),
           @Index(name = "idx_sender_receiver", columnList = "sender_id,receiver_id"),
           @Index(name = "idx_is_read", columnList = "is_read")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 消息ID（UUID）
     */
    @Column(name = "message_id", nullable = false, unique = true, length = 100)
    private String messageId;

    /**
     * 消息类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private MessageType type;

    /**
     * 发送者ID
     */
    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    /**
     * 发送者用户名
     */
    @Column(name = "sender_name", length = 50)
    private String senderName;

    /**
     * 接收者ID（私聊时使用）
     */
    @Column(name = "receiver_id")
    private Long receiverId;

    /**
     * 群组ID（群聊时使用）
     */
    @Column(name = "group_id", length = 50)
    private String groupId;

    /**
     * 消息内容
     */
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    /**
     * 消息时间戳
     */
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    /**
     * 扩展数据（JSON格式，用于存储文件URL、缩略图等）
     */
    @Column(name = "extra", columnDefinition = "TEXT")
    private String extra;

    /**
     * 是否已读
     */
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    /**
     * 已读时间
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;

    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 是否已删除（软删除）
     */
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (timestamp == null) {
            timestamp = now;
        }
        if (isRead == null) {
            isRead = false;
        }
        if (isDeleted == null) {
            isDeleted = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
