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
import top.contins.linx.model.enums.RoomMemberRole;

import java.time.LocalDateTime;

@TableName("room_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMember {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("room_id")
    private Long roomId;

    @TableField("user_id")
    private Long userId;

    @TableField("role")
    private RoomMemberRole role = RoomMemberRole.MEMBER;

    @TableField("virtual_ip")
    private String virtualIp;

    @TableField("connection_mode")
    private String connectionMode;

    @TableField(value = "joined_at", fill = FieldFill.INSERT)
    private LocalDateTime joinedAt;

    @TableField(value = "last_active_at", fill = FieldFill.INSERT)
    private LocalDateTime lastActiveAt;
}

