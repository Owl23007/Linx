package top.contins.linx.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.entity.FriendshipStatus;

import java.time.LocalDateTime;

/**
 * 好友请求DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendRequestDto {

    /**
     * 目标用户ID或用户名
     */
    private String targetUser;

    /**
     * 请求消息
     */
    private String message;

    /**
     * 备注名称
     */
    private String remark;
}
