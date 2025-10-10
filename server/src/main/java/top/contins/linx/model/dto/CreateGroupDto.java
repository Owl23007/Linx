package top.contins.linx.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import top.contins.linx.model.entity.GroupType;

import java.util.List;

/**
 * 创建群组DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateGroupDto {

    /**
     * 群组名称
     */
    private String name;

    /**
     * 群组描述
     */
    private String description;

    /**
     * 群组类型
     */
    private GroupType type;

    /**
     * 是否需要验证加入
     */
    private Boolean requireApproval;

    /**
     * 最大成员数
     */
    private Integer maxMembers;

    /**
     * 初始成员ID列表
     */
    private List<Long> initialMembers;
}
