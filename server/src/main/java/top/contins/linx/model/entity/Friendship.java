package top.contins.linx.model.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.enums.FriendshipStatus;

import java.time.LocalDateTime;

/**
 * 好友关系实体
 */
@TableName("friendships")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friendship {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 发起好友请求的用户ID
     */
    @TableField("requester_id")
    private Long requesterId;

    /**
     * 接收好友请求的用户ID
     */
    @TableField("addressee_id")
    private Long addresseeId;

    /**
     * 好友关系状态
     */
    @TableField("status")
    private FriendshipStatus status;

    /**
     * 创建时间
     */
    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 备注名称（用户给好友设置的别名）
     */
    @TableField("remark")
    private String remark;

    // TODO: Migrate @PrePersist logic to Service or MetaObjectHandler
    // @PrePersist
    // protected void onCreate() {
    //     LocalDateTime now = LocalDateTime.now();
    //     createdAt = now;
    //     updatedAt = now;
    // }

    // TODO: Migrate @PreUpdate logic to Service or MetaObjectHandler
    // @PreUpdate
    // protected void onUpdate() {
    //     updatedAt = LocalDateTime.now();
    // }
}
