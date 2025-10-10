package top.contins.linx.model.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.entity.FriendshipStatus;
import top.contins.linx.model.entity.UserStatus;

import java.time.LocalDateTime;

/**
 * 好友信息VO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendVO {

    /**
     * 好友关系ID
     */
    private Long friendshipId;

    /**
     * 好友用户ID
     */
    private Long friendId;

    /**
     * 好友用户名
     */
    private String friendUsername;

    /**
     * 好友昵称
     */
    private String friendNickname;

    /**
     * 好友头像URL
     */
    private String friendAvatar;

    /**
     * 备注名称
     */
    private String remark;

    /**
     * 好友关系状态
     */
    private FriendshipStatus status;

    /**
     * 好友在线状态
     */
    private UserStatus onlineStatus;

    /**
     * 最后在线时间
     */
    private LocalDateTime lastSeenAt;

    /**
     * 成为好友的时间
     */
    private LocalDateTime friendsSince;
}
