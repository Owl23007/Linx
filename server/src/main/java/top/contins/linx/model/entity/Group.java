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
import top.contins.linx.model.enums.GroupStatus;
import top.contins.linx.model.enums.GroupType;

import java.time.LocalDateTime;

/**
 * 群组实体
 */
@TableName("\"groups\"")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Group {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 群组名称
     */
    @TableField("name")
    private String name;

    /**
     * 群组描述
     */
    @TableField("description")
    private String description;

    /**
     * 群主用户ID
     */
    @TableField("owner_id")
    private Long ownerId;

    /**
     * 群组头像URL
     */
    @TableField("avatar_url")
    private String avatarUrl;

    /**
     * 最大成员数
     */
    @TableField("max_members")
    private Integer maxMembers = 500;

    /**
     * 群组类型
     */
    @TableField("type")
    private GroupType type = GroupType.NORMAL;

    /**
     * 群组状态
     */
    @TableField("status")
    private GroupStatus status = GroupStatus.ACTIVE;

    /**
     * 是否需要验证加入
     */
    @TableField("require_approval")
    private Boolean requireApproval = false;

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

    // TODO: Migrate @PrePersist logic to Service or MetaObjectHandler
    // @PrePersist
    // protected void onCreate() {
    //     LocalDateTime now = LocalDateTime.now();
    //     createdAt = now;
    //     updatedAt = now;
    // }
}
