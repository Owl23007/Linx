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
import top.contins.linx.model.enums.RoomStatus;

import java.time.LocalDateTime;

@TableName("rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("name")
    private String name;

    @TableField("room_code")
    private String roomCode;

    @TableField("game_name")
    private String gameName;

    @TableField("network_name")
    private String networkName;

    @TableField("network_secret")
    private String networkSecret;

    @TableField("relay_addresses")
    private String relayAddresses;

    @TableField("owner_id")
    private Long ownerId;

    @TableField("status")
    private RoomStatus status = RoomStatus.ACTIVE;

    @TableField("max_members")
    private Integer maxMembers = 8;

    @TableField(value = "created_at", fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
