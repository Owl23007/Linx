package top.contins.linx.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.enums.FriendshipStatus;

import java.time.LocalDateTime;

/**
 * 好友关系实体
 */
@Entity
@Table(name = "friendships",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"requester_id", "addressee_id"})
       },
       indexes = {
           @Index(name = "idx_requester", columnList = "requester_id"),
           @Index(name = "idx_addressee", columnList = "addressee_id"),
           @Index(name = "idx_status", columnList = "status")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 发起好友请求的用户ID
     */
    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    /**
     * 接收好友请求的用户ID
     */
    @Column(name = "addressee_id", nullable = false)
    private Long addresseeId;

    /**
     * 好友关系状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private FriendshipStatus status;

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

    /**
     * 备注名称（用户给好友设置的别名）
     */
    @Column(name = "remark", length = 50)
    private String remark;

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
