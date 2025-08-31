package top.contins.linx.model.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 发送好友请求DTO
 */
public class SendFriendRequestDTO {
    
    /**
     * 目标用户的用户名或邮箱
     */
    @NotBlank(message = "用户标识不能为空")
    private String userIdentifier;
    
    /**
     * 好友请求备注
     */
    private String remark;
    
    public SendFriendRequestDTO() {
    }
    
    public SendFriendRequestDTO(String userIdentifier, String remark) {
        this.userIdentifier = userIdentifier;
        this.remark = remark;
    }
    
    public String getUserIdentifier() {
        return userIdentifier;
    }
    
    public void setUserIdentifier(String userIdentifier) {
        this.userIdentifier = userIdentifier;
    }
    
    public String getRemark() {
        return remark;
    }
    
    public void setRemark(String remark) {
        this.remark = remark;
    }
    
    @Override
    public String toString() {
        return "SendFriendRequestDTO{" +
                "userIdentifier='" + userIdentifier + '\'' +
                ", remark='" + remark + '\'' +
                '}';
    }
}