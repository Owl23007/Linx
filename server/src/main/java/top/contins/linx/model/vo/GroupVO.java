package top.contins.linx.model.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.enums.GroupMemberRole;
import top.contins.linx.model.enums.GroupStatus;
import top.contins.linx.model.enums.GroupType;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 群组信息VO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupVO {

    /**
     * 群组ID
     */
    private Long id;

    /**
     * 群组名称
     */
    private String name;

    /**
     * 群组描述
     */
    private String description;

    /**
     * 群主用户ID
     */
    private Long ownerId;

    /**
     * 群主用户名
     */
    private String ownerName;

    /**
     * 群组头像URL
     */
    private String avatarUrl;

    /**
     * 成员数量
     */
    private Integer memberCount;

    /**
     * 最大成员数
     */
    private Integer maxMembers;

    /**
     * 群组类型
     */
    private GroupType type;

    /**
     * 群组状态
     */
    private GroupStatus status;

    /**
     * 是否需要验证加入
     */
    private Boolean requireApproval;

    /**
     * 当前用户在群组中的角色
     */
    private GroupMemberRole myRole;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;

    /**
     * 群组成员列表（可选）
     */
    private List<GroupMemberVO> members;
}
