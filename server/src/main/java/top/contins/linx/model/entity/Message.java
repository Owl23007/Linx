package top.contins.linx.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

/**
 * 消息实体
 */
@Entity
@Table(name = "messages")
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 消息内容
     */
    @Column(nullable = false, length = 2000)
    @NotBlank(message = "消息内容不能为空")
    private String content;
    
    /**
     * 消息类型
     */
    @Enumerated(EnumType.STRING)
    private MessageType type = MessageType.TEXT;
    
    /**
     * 发送者
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    
    /**
     * 接收者（私聊消息）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    private User receiver;
    
    /**
     * 群组（群聊消息）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;
    
    /**
     * 聊天类型
     */
    @Enumerated(EnumType.STRING)
    private ChatType chatType;
    
    /**
     * 发送时间
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime sendTime;
    
    /**
     * 是否已读
     */
    private Boolean isRead = false;
    
    /**
     * 消息状态
     */
    @Enumerated(EnumType.STRING)
    private MessageStatus status = MessageStatus.SENT;
    
    /**
     * 引用的消息（回复功能）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private Message replyTo;
    
    /**
     * 附加数据（JSON格式，用于文件、图片等）
     */
    @Column(length = 1000)
    private String extraData;
    
    public Message() {
        this.sendTime = LocalDateTime.now();
    }
    
    public Message(String content, User sender, MessageType type) {
        this();
        this.content = content;
        this.sender = sender;
        this.type = type;
    }
    
    /**
     * 创建私聊消息
     */
    public static Message createPrivateMessage(String content, User sender, User receiver) {
        Message message = new Message(content, sender, MessageType.TEXT);
        message.setReceiver(receiver);
        message.setChatType(ChatType.PRIVATE);
        return message;
    }
    
    /**
     * 创建群聊消息
     */
    public static Message createGroupMessage(String content, User sender, Group group) {
        Message message = new Message(content, sender, MessageType.TEXT);
        message.setGroup(group);
        message.setChatType(ChatType.GROUP);
        return message;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public MessageType getType() {
        return type;
    }
    
    public void setType(MessageType type) {
        this.type = type;
    }
    
    public User getSender() {
        return sender;
    }
    
    public void setSender(User sender) {
        this.sender = sender;
    }
    
    public User getReceiver() {
        return receiver;
    }
    
    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }
    
    public Group getGroup() {
        return group;
    }
    
    public void setGroup(Group group) {
        this.group = group;
    }
    
    public ChatType getChatType() {
        return chatType;
    }
    
    public void setChatType(ChatType chatType) {
        this.chatType = chatType;
    }
    
    public LocalDateTime getSendTime() {
        return sendTime;
    }
    
    public void setSendTime(LocalDateTime sendTime) {
        this.sendTime = sendTime;
    }
    
    public Boolean getIsRead() {
        return isRead;
    }
    
    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }
    
    public MessageStatus getStatus() {
        return status;
    }
    
    public void setStatus(MessageStatus status) {
        this.status = status;
    }
    
    public Message getReplyTo() {
        return replyTo;
    }
    
    public void setReplyTo(Message replyTo) {
        this.replyTo = replyTo;
    }
    
    public String getExtraData() {
        return extraData;
    }
    
    public void setExtraData(String extraData) {
        this.extraData = extraData;
    }
    
    /**
     * 检查是否为私聊消息
     */
    public boolean isPrivateMessage() {
        return chatType == ChatType.PRIVATE;
    }
    
    /**
     * 检查是否为群聊消息
     */
    public boolean isGroupMessage() {
        return chatType == ChatType.GROUP;
    }
    
    @Override
    public String toString() {
        return "Message{" +
                "id=" + id +
                ", content='" + content + '\'' +
                ", type=" + type +
                ", chatType=" + chatType +
                ", sender=" + (sender != null ? sender.getUsername() : null) +
                ", sendTime=" + sendTime +
                '}';
    }
    
    /**
     * 消息类型枚举
     */
    public enum MessageType {
        TEXT,       // 文本消息
        IMAGE,      // 图片消息
        FILE,       // 文件消息
        VOICE,      // 语音消息
        VIDEO,      // 视频消息
        SYSTEM      // 系统消息
    }
    
    /**
     * 聊天类型枚举
     */
    public enum ChatType {
        PRIVATE,    // 私聊
        GROUP       // 群聊
    }
    
    /**
     * 消息状态枚举
     */
    public enum MessageStatus {
        SENDING,    // 发送中
        SENT,       // 已发送
        DELIVERED,  // 已送达
        READ,       // 已读
        FAILED      // 发送失败
    }
}