package top.contins.linx.model.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.enums.GroupMemberRole;
import top.contins.linx.model.enums.UserStatus;

import java.time.LocalDateTime;

/**
 * 群组成员信息VO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMemberVO {

    /**
     * 成员关系ID
     */
    private Long membershipId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 用户名
     */
    private String username;

    /**
     * 用户昵称
     */
    private String nickname;

    /**
     * 群昵称
     */
    private String groupNickname;

    /**
     * 用户头像
     */
    private String avatar;

    /**
     * 成员角色
     */
    private GroupMemberRole role;

    /**
     * 在线状态
     */
    private UserStatus onlineStatus;

    /**
     * 加入时间
     */
    private LocalDateTime joinedAt;

    /**
     * 最后活跃时间
     */
    private LocalDateTime lastActiveAt;

    /**
     * 是否禁言
     */
    private Boolean isMuted;

    /**
     * 禁言到期时间
     */
    private LocalDateTime muteUntil;
}
