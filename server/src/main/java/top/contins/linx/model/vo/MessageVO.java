package top.contins.linx.model.vo;

import top.contins.linx.model.entity.Message;

import java.time.LocalDateTime;

/**
 * 消息VO
 */
public class MessageVO {
    
    private Long id;
    private String content;
    private String type;
    private UserVO sender;
    private UserVO receiver;
    private GroupVO group;
    private String chatType;
    private LocalDateTime sendTime;
    private Boolean isRead;
    private String status;
    private Long replyToId;
    private String extraData;
    
    public MessageVO() {
    }
    
    public MessageVO(Message message) {
        this.id = message.getId();
        this.content = message.getContent();
        this.type = message.getType() != null ? message.getType().name() : null;
        this.sender = new UserVO(message.getSender());
        this.receiver = message.getReceiver() != null ? new UserVO(message.getReceiver()) : null;
        this.group = message.getGroup() != null ? new GroupVO(message.getGroup()) : null;
        this.chatType = message.getChatType() != null ? message.getChatType().name() : null;
        this.sendTime = message.getSendTime();
        this.isRead = message.getIsRead();
        this.status = message.getStatus() != null ? message.getStatus().name() : null;
        this.replyToId = message.getReplyTo() != null ? message.getReplyTo().getId() : null;
        this.extraData = message.getExtraData();
    }
    
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
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public UserVO getSender() {
        return sender;
    }
    
    public void setSender(UserVO sender) {
        this.sender = sender;
    }
    
    public UserVO getReceiver() {
        return receiver;
    }
    
    public void setReceiver(UserVO receiver) {
        this.receiver = receiver;
    }
    
    public GroupVO getGroup() {
        return group;
    }
    
    public void setGroup(GroupVO group) {
        this.group = group;
    }
    
    public String getChatType() {
        return chatType;
    }
    
    public void setChatType(String chatType) {
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
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Long getReplyToId() {
        return replyToId;
    }
    
    public void setReplyToId(Long replyToId) {
        this.replyToId = replyToId;
    }
    
    public String getExtraData() {
        return extraData;
    }
    
    public void setExtraData(String extraData) {
        this.extraData = extraData;
    }
    
    @Override
    public String toString() {
        return "MessageVO{" +
                "id=" + id +
                ", content='" + content + '\'' +
                ", type='" + type + '\'' +
                ", chatType='" + chatType + '\'' +
                ", sendTime=" + sendTime +
                '}';
    }
}