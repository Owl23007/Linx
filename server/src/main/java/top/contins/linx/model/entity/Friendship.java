package top.contins.linx.model.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * 好友关系实体
 */
@Entity
@Table(name = "friendships", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"from_user_id", "to_user_id"}))
public class Friendship {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 发起好友请求的用户
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_user_id", nullable = false)
    private User fromUser;
    
    /**
     * 接收好友请求的用户
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User toUser;
    
    /**
     * 好友关系状态
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendshipStatus status;
    
    /**
     * 请求时间
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime requestTime;
    
    /**
     * 响应时间（接受或拒绝）
     */
    private LocalDateTime responseTime;
    
    /**
     * 备注信息
     */
    private String remark;
    
    public Friendship() {
        this.requestTime = LocalDateTime.now();
        this.status = FriendshipStatus.PENDING;
    }
    
    public Friendship(User fromUser, User toUser) {
        this();
        this.fromUser = fromUser;
        this.toUser = toUser;
    }
    
    public Friendship(User fromUser, User toUser, String remark) {
        this(fromUser, toUser);
        this.remark = remark;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getFromUser() {
        return fromUser;
    }
    
    public void setFromUser(User fromUser) {
        this.fromUser = fromUser;
    }
    
    public User getToUser() {
        return toUser;
    }
    
    public void setToUser(User toUser) {
        this.toUser = toUser;
    }
    
    public FriendshipStatus getStatus() {
        return status;
    }
    
    public void setStatus(FriendshipStatus status) {
        this.status = status;
        if (status != FriendshipStatus.PENDING && this.responseTime == null) {
            this.responseTime = LocalDateTime.now();
        }
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
    
    /**
     * 获取另一个用户（相对于指定用户）
     */
    public User getOtherUser(User currentUser) {
        if (fromUser.equals(currentUser)) {
            return toUser;
        } else if (toUser.equals(currentUser)) {
            return fromUser;
        }
        throw new IllegalArgumentException("用户不在此好友关系中");
    }
    
    /**
     * 检查是否为双向好友关系
     */
    public boolean isAccepted() {
        return status == FriendshipStatus.ACCEPTED;
    }
    
    @Override
    public String toString() {
        return "Friendship{" +
                "id=" + id +
                ", fromUser=" + (fromUser != null ? fromUser.getUsername() : null) +
                ", toUser=" + (toUser != null ? toUser.getUsername() : null) +
                ", status=" + status +
                ", requestTime=" + requestTime +
                '}';
    }
    
    /**
     * 好友关系状态枚举
     */
    public enum FriendshipStatus {
        PENDING,    // 等待接受
        ACCEPTED,   // 已接受
        REJECTED,   // 已拒绝
        BLOCKED     // 已屏蔽
    }
}