package top.contins.linx.model.vo;

import top.contins.linx.model.entity.Friendship;

import java.time.LocalDateTime;

/**
 * 好友关系VO
 */
public class FriendshipVO {
    
    private Long id;
    private UserVO fromUser;
    private UserVO toUser;
    private String status;
    private LocalDateTime requestTime;
    private LocalDateTime responseTime;
    private String remark;
    
    public FriendshipVO() {
    }
    
    public FriendshipVO(Friendship friendship) {
        this.id = friendship.getId();
        this.fromUser = new UserVO(friendship.getFromUser());
        this.toUser = new UserVO(friendship.getToUser());
        this.status = friendship.getStatus() != null ? friendship.getStatus().name() : null;
        this.requestTime = friendship.getRequestTime();
        this.responseTime = friendship.getResponseTime();
        this.remark = friendship.getRemark();
    }
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public UserVO getFromUser() {
        return fromUser;
    }
    
    public void setFromUser(UserVO fromUser) {
        this.fromUser = fromUser;
    }
    
    public UserVO getToUser() {
        return toUser;
    }
    
    public void setToUser(UserVO toUser) {
        this.toUser = toUser;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDateTime getRequestTime() {
        return requestTime;
    }
    
    public void setRequestTime(LocalDateTime requestTime) {
        this.requestTime = requestTime;
    }
    
    public LocalDateTime getResponseTime() {
        return responseTime;
    }
    
    public void setResponseTime(LocalDateTime responseTime) {
        this.responseTime = responseTime;
    }
    
    public String getRemark() {
        return remark;
    }
    
    public void setRemark(String remark) {
        this.remark = remark;
    }
    
    @Override
    public String toString() {
        return "FriendshipVO{" +
                "id=" + id +
                ", status='" + status + '\'' +
                ", requestTime=" + requestTime +
                '}';
    }
}