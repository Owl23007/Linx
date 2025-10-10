package top.contins.linx.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 群组成员实体
 */
@Entity
@Table(name = "group_members",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"group_id", "user_id"})
       },
       indexes = {
           @Index(name = "idx_group_members_group", columnList = "group_id"),
           @Index(name = "idx_group_members_user", columnList = "user_id"),
           @Index(name = "idx_group_members_role", columnList = "role")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 群组ID
     */
    @Column(name = "group_id", nullable = false)
    private Long groupId;

    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 成员角色
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private GroupMemberRole role = GroupMemberRole.MEMBER;

    /**
     * 群昵称
     */
    @Column(name = "nickname", length = 50)
    private String nickname;

    /**
     * 加入时间
     */
    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    /**
     * 最后活跃时间
     */
    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    /**
     * 是否禁言
     */
    @Column(name = "is_muted", nullable = false)
    private Boolean isMuted = false;

    /**
     * 禁言到期时间
     */
    @Column(name = "mute_until")
    private LocalDateTime muteUntil;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
        lastActiveAt = LocalDateTime.now();
    }
}
