package top.contins.linx.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 发送消息DTO
 */
public class SendMessageDTO {
    
    /**
     * 消息内容
     */
    @NotBlank(message = "消息内容不能为空")
    private String content;
    
    /**
     * 消息类型
     */
    private String type = "TEXT";
    
    /**
     * 聊天类型 (PRIVATE/GROUP)
     */
    @NotBlank(message = "聊天类型不能为空")
    private String chatType;
    
    /**
     * 接收者ID（私聊时）
     */
    private Long receiverId;
    
    /**
     * 群组ID（群聊时）
     */
    private Long groupId;
    
    /**
     * 回复的消息ID
     */
    private Long replyToId;
    
    /**
     * 附加数据
     */
    private String extraData;
    
    public SendMessageDTO() {
    }
    
    public SendMessageDTO(String content, String chatType) {
        this.content = content;
        this.chatType = chatType;
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
    
    public String getChatType() {
        return chatType;
    }
    
    public void setChatType(String chatType) {
        this.chatType = chatType;
    }
    
    public Long getReceiverId() {
        return receiverId;
    }
    
    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }
    
    public Long getGroupId() {
        return groupId;
    }
    
    public void setGroupId(Long groupId) {
        this.groupId = groupId;
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
        return "SendMessageDTO{" +
                "content='" + content + '\'' +
                ", type='" + type + '\'' +
                ", chatType='" + chatType + '\'' +
                ", receiverId=" + receiverId +
                ", groupId=" + groupId +
                '}';
    }
}