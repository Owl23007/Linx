package top.contins.linx.model.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * 群组成员实体
 */
@Entity
@Table(name = "group_members", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "user_id"}))
public class GroupMember {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 所属群组
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;
    
    /**
     * 用户
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    /**
     * 成员角色
     */
    @Enumerated(EnumType.STRING)
    private MemberRole role = MemberRole.MEMBER;
    
    /**
     * 成员状态
     */
    @Enumerated(EnumType.STRING)
    private MemberStatus status = MemberStatus.ACTIVE;
    
    /**
     * 加入时间
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime joinTime;
    
    /**
     * 最后发言时间
     */
    private LocalDateTime lastSpeakTime;
    
    /**
     * 群内昵称
     */
    private String groupNickname;
    
    /**
     * 邀请人
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_id")
    private User invitedBy;
    
    public GroupMember() {
        this.joinTime = LocalDateTime.now();
    }
    
    public GroupMember(Group group, User user) {
        this();
        this.group = group;
        this.user = user;
    }
    
    public GroupMember(Group group, User user, MemberRole role) {
        this(group, user);
        this.role = role;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Group getGroup() {
        return group;
    }
    
    public void setGroup(Group group) {
        this.group = group;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public MemberRole getRole() {
        return role;
    }
    
    public void setRole(MemberRole role) {
        this.role = role;
    }
    
    public MemberStatus getStatus() {
        return status;
    }
    
    public void setStatus(MemberStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getJoinTime() {
        return joinTime;
    }
    
    public void setJoinTime(LocalDateTime joinTime) {
        this.joinTime = joinTime;
    }
    
    public LocalDateTime getLastSpeakTime() {
        return lastSpeakTime;
    }
    
    public void setLastSpeakTime(LocalDateTime lastSpeakTime) {
        this.lastSpeakTime = lastSpeakTime;
    }
    
    public String getGroupNickname() {
        return groupNickname;
    }
    
    public void setGroupNickname(String groupNickname) {
        this.groupNickname = groupNickname;
    }
    
    public User getInvitedBy() {
        return invitedBy;
    }
    
    public void setInvitedBy(User invitedBy) {
        this.invitedBy = invitedBy;
    }
    
    /**
     * 检查是否为管理员（群主或管理员）
     */
    public boolean isAdmin() {
        return role == MemberRole.OWNER || role == MemberRole.ADMIN;
    }
    
    /**
     * 检查是否为群主
     */
    public boolean isOwner() {
        return role == MemberRole.OWNER;
    }
    
    /**
     * 检查成员是否活跃
     */
    public boolean isActive() {
        return status == MemberStatus.ACTIVE;
    }
    
    @Override
    public String toString() {
        return "GroupMember{" +
                "id=" + id +
                ", group=" + (group != null ? group.getName() : null) +
                ", user=" + (user != null ? user.getUsername() : null) +
                ", role=" + role +
                ", status=" + status +
                '}';
    }
    
    /**
     * 成员角色枚举
     */
    public enum MemberRole {
        OWNER,      // 群主
        ADMIN,      // 管理员
        MEMBER      // 普通成员
    }
    
    /**
     * 成员状态枚举
     */
    public enum MemberStatus {
        ACTIVE,     // 活跃
        MUTED,      // 被禁言
        KICKED,     // 被踢出
        LEFT        // 主动退出
    }
}