package top.contins.linx.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.enums.GroupStatus;
import top.contins.linx.model.enums.GroupType;

import java.time.LocalDateTime;

/**
 * 群组实体
 */
@Entity
@Table(name = "`groups`", indexes = {
        @Index(name = "idx_group_name", columnList = "name"),
        @Index(name = "idx_group_owner", columnList = "owner_id"),
        @Index(name = "idx_group_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 群组名称
     */
    @Column(name = "name", nullable = false, length = 50)
    private String name;

    /**
     * 群组描述
     */
    @Column(name = "description", length = 255)
    private String description;

    /**
     * 群主用户ID
     */
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    /**
     * 群组头像URL
     */
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /**
     * 最大成员数
     */
    @Column(name = "max_members", nullable = false)
    private Integer maxMembers = 500;

    /**
     * 群组类型
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private GroupType type = GroupType.NORMAL;

    /**
     * 群组状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GroupStatus status = GroupStatus.ACTIVE;

    /**
     * 是否需要验证加入
     */
    @Column(name = "require_approval", nullable = false)
    private Boolean requireApproval = false;

    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
