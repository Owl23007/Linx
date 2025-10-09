package top.contins.linx.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_last_seen", columnList = "last_seen_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @Column(name = "id", nullable = false)
    private Long id; // 来源：Auth 服务，唯一标识用户，不可修改

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private UserStatus status = UserStatus.ONLINE;

    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now(); // 私密字段

    /**
     * 更新最后活跃时间，通常由消息接收、心跳包触发
     */
    public void updateLastSeenAt(LocalDateTime now) {
        lastSeenAt = now;
    }

    public void updateStatus(UserStatus status) {
        this.status = status;
    }

    // 每次更新
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        // 当状态为 ONLINE 或 DND 时更新 lastSeenAt
        if (this.status == UserStatus.ONLINE|| this.status == UserStatus.DND) {
            this.lastSeenAt = LocalDateTime.now();
        }
    }
}