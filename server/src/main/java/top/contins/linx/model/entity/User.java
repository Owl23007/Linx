package top.contins.linx.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * 用户实体
 */
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 用户名，唯一
     */
    @Column(unique = true, nullable = false)
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    /**
     * 邮箱，唯一
     */
    @Column(unique = true)
    @Email(message = "邮箱格式不正确")
    private String email;
    
    /**
     * 密码（加密后）
     */
    @Column(nullable = false)
    private String password;
    
    /**
     * 昵称
     */
    private String nickname;
    
    /**
     * 用户状态 (ONLINE, OFFLINE, BUSY)
     */
    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.OFFLINE;
    
    /**
     * 最后在线时间
     */
    private LocalDateTime lastOnline;
    
    /**
     * 创建时间
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
    
    /**
     * 用户的好友关系（作为发起方）
     */
    @OneToMany(mappedBy = "fromUser", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Friendship> sentFriendRequests = new HashSet<>();
    
    /**
     * 用户的好友关系（作为接收方）
     */
    @OneToMany(mappedBy = "toUser", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Friendship> receivedFriendRequests = new HashSet<>();
    
    /**
     * 用户参与的群组
     */
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<GroupMember> groupMemberships = new HashSet<>();
    
    public User() {
        this.createTime = LocalDateTime.now();
        this.updateTime = LocalDateTime.now();
        this.status = UserStatus.OFFLINE;
    }
    
    public User(String username, String email, String password) {
        this();
        this.username = username;
        this.email = email;
        this.password = password;
        this.nickname = username;
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updateTime = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getNickname() {
        return nickname;
    }
    
    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
    
    public UserStatus getStatus() {
        return status;
    }
    
    public void setStatus(UserStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getLastOnline() {
        return lastOnline;
    }
    
    public void setLastOnline(LocalDateTime lastOnline) {
        this.lastOnline = lastOnline;
    }
    
    public LocalDateTime getCreateTime() {
        return createTime;
    }
    
    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
    
    public LocalDateTime getUpdateTime() {
        return updateTime;
    }
    
    public void setUpdateTime(LocalDateTime updateTime) {
        this.updateTime = updateTime;
    }
    
    public Set<Friendship> getSentFriendRequests() {
        return sentFriendRequests;
    }
    
    public void setSentFriendRequests(Set<Friendship> sentFriendRequests) {
        this.sentFriendRequests = sentFriendRequests;
    }
    
    public Set<Friendship> getReceivedFriendRequests() {
        return receivedFriendRequests;
    }
    
    public void setReceivedFriendRequests(Set<Friendship> receivedFriendRequests) {
        this.receivedFriendRequests = receivedFriendRequests;
    }
    
    public Set<GroupMember> getGroupMemberships() {
        return groupMemberships;
    }
    
    public void setGroupMemberships(Set<GroupMember> groupMemberships) {
        this.groupMemberships = groupMemberships;
    }
    
    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", nickname='" + nickname + '\'' +
                ", status=" + status +
                '}';
    }
    
    /**
     * 用户状态枚举
     */
    public enum UserStatus {
        ONLINE,     // 在线
        OFFLINE,    // 离线
        BUSY        // 忙碌
    }
}