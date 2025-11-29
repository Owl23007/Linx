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
import top.contins.linx.model.enums.GroupMemberRole;

import java.time.LocalDateTime;

/**
 * 群组成员实体
 */
@TableName("group_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMember {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 群组ID
     */
    @TableField("group_id")
    private Long groupId;

    /**
     * 用户ID
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 成员角色
     */
    @TableField("role")
    private GroupMemberRole role = GroupMemberRole.MEMBER;

    /**
     * 群昵称
     */
    @TableField("nickname")
    private String nickname;

    /**
     * 加入时间
     */
    @TableField(value = "joined_at", fill = FieldFill.INSERT)
    private LocalDateTime joinedAt;

    /**
     * 最后活跃时间
     */
    @TableField(value = "last_active_at", fill = FieldFill.INSERT)
    private LocalDateTime lastActiveAt;

    /**
     * 是否禁言
     */
    @TableField("is_muted")
    private Boolean isMuted = false;

    /**
     * 禁言到期时间
     */
    @TableField("mute_until")
    private LocalDateTime muteUntil;

    // TODO: Migrate @PrePersist logic to Service or MetaObjectHandler
    // @PrePersist
    // protected void onCreate() {
    //     joinedAt = LocalDateTime.now();
    //     lastActiveAt = LocalDateTime.now();
    // }
}
