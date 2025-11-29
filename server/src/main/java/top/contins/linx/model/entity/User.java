package top.contins.linx.model.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.enums.UserStatus;

import java.time.LocalDateTime;

@TableName("users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @TableId
    private Long id; // 来源：Auth 服务，唯一标识用户，不可修改

    @TableField("status")
    private UserStatus status = UserStatus.ONLINE;

    @TableField("last_seen_at")
    private LocalDateTime lastSeenAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
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

    // TODO: Migrate @PreUpdate logic to Service or MetaObjectHandler
    // 每次更新
    // @PreUpdate
    // protected void onUpdate() {
    //     this.updatedAt = LocalDateTime.now();
    //     // 当状态为 ONLINE 或 DND 时更新 lastSeenAt
    //     if (this.status == UserStatus.ONLINE|| this.status == UserStatus.DND) {
    //         this.lastSeenAt = LocalDateTime.now();
    //     }
    // }
}
