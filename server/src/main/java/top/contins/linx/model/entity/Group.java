package top.contins.linx.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * 群组实体
 */
@Entity
@Table(name = "chat_groups")
public class Group {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * 群组名称
     */
    @Column(nullable = false)
    @NotBlank(message = "群组名称不能为空")
    private String name;
    
    /**
     * 群组描述
     */
    private String description;
    
    /**
     * 群组类型
     */
    @Enumerated(EnumType.STRING)
    private GroupType type = GroupType.NORMAL;
    
    /**
     * 最大成员数
     */
    private Integer maxMembers = 100;
    
    /**
     * 群主
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
    
    /**
     * 群组状态
     */
    @Enumerated(EnumType.STRING)
    private GroupStatus status = GroupStatus.ACTIVE;
    
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
     * 群组成员
     */
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<GroupMember> members = new HashSet<>();
    
    /**
     * 群组消息
     */
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Message> messages = new HashSet<>();
    
    public Group() {
        this.createTime = LocalDateTime.now();
        this.updateTime = LocalDateTime.now();
    }
    
    public Group(String name, User owner) {
        this();
        this.name = name;
        this.owner = owner;
    }
    
    public Group(String name, String description, User owner) {
        this(name, owner);
        this.description = description;
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
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public GroupType getType() {
        return type;
    }
    
    public void setType(GroupType type) {
        this.type = type;
    }
    
    public Integer getMaxMembers() {
        return maxMembers;
    }
    
    public void setMaxMembers(Integer maxMembers) {
        this.maxMembers = maxMembers;
    }
    
    public User getOwner() {
        return owner;
    }
    
    public void setOwner(User owner) {
        this.owner = owner;
    }
    
    public GroupStatus getStatus() {
        return status;
    }
    
    public void setStatus(GroupStatus status) {
        this.status = status;
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
    
    public Set<GroupMember> getMembers() {
        return members;
    }
    
    public void setMembers(Set<GroupMember> members) {
        this.members = members;
    }
    
    public Set<Message> getMessages() {
        return messages;
    }
    
    public void setMessages(Set<Message> messages) {
        this.messages = messages;
    }
    
    /**
     * 获取当前成员数量
     */
    public int getMemberCount() {
        return members != null ? (int) members.stream()
                .filter(member -> member.getStatus() == GroupMember.MemberStatus.ACTIVE)
                .count() : 0;
    }
    
    /**
     * 检查群组是否已满
     */
    public boolean isFull() {
        return getMemberCount() >= maxMembers;
    }
    
    /**
     * 检查用户是否为群主
     */
    public boolean isOwner(User user) {
        return owner != null && owner.equals(user);
    }
    
    @Override
    public String toString() {
        return "Group{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", type=" + type +
                ", status=" + status +
                ", memberCount=" + getMemberCount() +
                '}';
    }
    
    /**
     * 群组类型枚举
     */
    public enum GroupType {
        NORMAL,     // 普通群组
        PRIVATE,    // 私有群组
        TEMPORARY   // 临时群组
    }
    
    /**
     * 群组状态枚举
     */
    public enum GroupStatus {
        ACTIVE,     // 活跃
        INACTIVE,   // 非活跃
        DISBANDED   // 已解散
    }
}