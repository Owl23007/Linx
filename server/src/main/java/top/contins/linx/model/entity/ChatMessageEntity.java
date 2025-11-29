package top.contins.linx.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.enums.MessageType;

import java.time.LocalDateTime;

/**
 * 聊天消息实体（数据库持久化）
 */
@TableName("chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 消息ID（UUID）
     */
    @TableField("message_id")
    private String messageId;

    /**
     * 消息类型
     */
    @TableField("type")
    private MessageType type;

    /**
     * 发送者ID
     */
    @TableField("sender_id")
    private Long senderId;

    /**
     * 发送者用户名
     */
    @TableField("sender_name")
    private String senderName;

    /**
     * 接收者ID（私聊时使用）
     */
    @TableField("receiver_id")
    private Long receiverId;

    /**
     * 群组ID（群聊时使用）
     */
    @TableField("group_id")
    private String groupId;

    /**
     * 消息内容
     */
    @TableField("content")
    private String content;

    /**
     * 消息时间戳
     */
    @TableField("timestamp")
    private LocalDateTime timestamp;

    /**
     * 扩展数据（JSON格式，用于存储文件URL、缩略图等）
     */
    @TableField("extra")
    private String extra;

    /**
     * 是否已读
     */
    @TableField("is_read")
    private Boolean isRead = false;

    /**
     * 已读时间
     */
    @TableField("read_at")
    private LocalDateTime readAt;

    /**
     * 是否删除
     */
    @TableField("is_deleted")
    private Boolean isDeleted = false;
}
