package top.contins.linx.model.dto;

import jakarta.validation.constraints.NotNull;

/**
 * 响应好友请求DTO
 */
public class RespondFriendRequestDTO {
    
    /**
     * 好友请求ID
     */
    @NotNull(message = "好友请求ID不能为空")
    private Long requestId;
    
    /**
     * 是否接受 (true: 接受, false: 拒绝)
     */
    @NotNull(message = "请求响应不能为空")
    private Boolean accept;
    
    public RespondFriendRequestDTO() {
    }
    
    public RespondFriendRequestDTO(Long requestId, Boolean accept) {
        this.requestId = requestId;
        this.accept = accept;
    }
    
    public Long getRequestId() {
        return requestId;
    }
    
    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }
    
    public Boolean getAccept() {
        return accept;
    }
    
    public void setAccept(Boolean accept) {
        this.accept = accept;
    }
    
    @Override
    public String toString() {
        return "RespondFriendRequestDTO{" +
                "requestId=" + requestId +
                ", accept=" + accept +
                '}';
    }
}