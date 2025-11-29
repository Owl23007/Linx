package top.contins.linx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.dto.CreateGroupDto;
import top.contins.linx.model.entity.*;
import top.contins.linx.model.enums.GroupMemberRole;
import top.contins.linx.model.enums.GroupStatus;
import top.contins.linx.model.enums.GroupType;
import top.contins.linx.model.vo.GroupMemberVO;
import top.contins.linx.model.vo.GroupVO;
import top.contins.linx.repository.GroupMemberMapper;
import top.contins.linx.repository.GroupMapper;
import top.contins.linx.repository.UserMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 群组管理服务
 */
@Service
@Transactional
public class GroupService {

    private final GroupMapper groupMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final UserMapper userMapper;

    @Autowired
    public GroupService(GroupMapper groupMapper,
                       GroupMemberMapper groupMemberMapper,
                       UserMapper userMapper) {
        this.groupMapper = groupMapper;
        this.groupMemberMapper = groupMemberMapper;
        this.userMapper = userMapper;
    }

    /**
     * 创建群组
     */
    public GroupVO createGroup(Long creatorId, CreateGroupDto createGroupDto) {
        // 1. 创建群组实体
        Group group = Group.builder()
                .name(createGroupDto.getName())
                .description(createGroupDto.getDescription())
                .ownerId(creatorId)
                .type(createGroupDto.getType() != null ? createGroupDto.getType() : GroupType.NORMAL)
                .requireApproval(createGroupDto.getRequireApproval() != null ?
                        createGroupDto.getRequireApproval() : false)
                .maxMembers(createGroupDto.getMaxMembers() != null ?
                        createGroupDto.getMaxMembers() : 500)
                .status(GroupStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        groupMapper.insert(group);
        Group savedGroup = group; // ID is populated after insert

        // 2. 添加群主为第一个成员
        GroupMember ownerMember = GroupMember.builder()
                .groupId(savedGroup.getId())
                .userId(creatorId)
                .role(GroupMemberRole.OWNER)
                .joinedAt(LocalDateTime.now())
                .lastActiveAt(LocalDateTime.now())
                .isMuted(false)
                .build();
        groupMemberMapper.insert(ownerMember);

        // 3. 添加初始成员
        if (createGroupDto.getInitialMembers() != null && !createGroupDto.getInitialMembers().isEmpty()) {
            for (Long memberId : createGroupDto.getInitialMembers()) {
                if (!memberId.equals(creatorId)) { // 避免重复添加群主
                    addMemberToGroup(savedGroup.getId(), memberId, GroupMemberRole.MEMBER);
                }
            }
        }

        return buildGroupVO(savedGroup, creatorId);
    }

    /**
     * 加入群组
     */
    public void joinGroup(Long groupId, Long userId) {
        Group group = groupMapper.selectById(groupId);
        if (group == null) {
            throw new RuntimeException("群组不存在");
        }

        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new RuntimeException("群组已不可用");
        }

        // 检查是否已经是成员
        if (groupMemberMapper.existsByGroupIdAndUserId(groupId, userId)) {
            throw new RuntimeException("您已经是群组成员");
        }

        // 检查群组人数限制
        long currentMemberCount = groupMemberMapper.countByGroupId(groupId);
        if (currentMemberCount >= group.getMaxMembers()) {
            throw new RuntimeException("群组成员已满");
        }

        // 如果需要审批，这里应该创建加群申请记录
        // 为简单起见，这里直接加入
        if (group.getRequireApproval()) {
            throw new RuntimeException("该群组需要管理员审批，功能待实现");
        }

        addMemberToGroup(groupId, userId, GroupMemberRole.MEMBER);
    }

    /**
     * 退出群组
     */
    public void leaveGroup(Long groupId, Long userId) {
        GroupMember member = groupMemberMapper.findByGroupIdAndUserId(groupId, userId);
        if (member == null) {
            throw new RuntimeException("您不是群组成员");
        }

        // 群主不能直接退出，需要先转让群组
        if (member.getRole() == GroupMemberRole.OWNER) {
            throw new RuntimeException("群主不能直接退出群组，请先转让群主身份");
        }

        groupMemberMapper.deleteById(member.getId());
    }

    /**
     * 解散群组（仅群主可操作）
     */
    public void disbandGroup(Long groupId, Long operatorId) {
        Group group = groupMapper.selectById(groupId);
        if (group == null) {
            throw new RuntimeException("群组不存在");
        }

        // 检查操作权限
        GroupMember operatorMember = groupMemberMapper.findByGroupIdAndUserId(groupId, operatorId);
        if (operatorMember == null) {
            throw new RuntimeException("您不是群组成员");
        }

        if (operatorMember.getRole() != GroupMemberRole.OWNER) {
            throw new RuntimeException("只有群主可以解散群组");
        }

        // 更新群组状态
        group.setStatus(GroupStatus.DISBANDED);
        group.setUpdatedAt(LocalDateTime.now());
        groupMapper.updateById(group);

        // 删除所有成员关系
        groupMemberMapper.deleteByGroupId(groupId);
    }

    /**
     * 获取用户加入的群组列表
     */
    public List<GroupVO> getUserGroups(Long userId) {
        List<Group> groups = groupMapper.findGroupsByUserIdAndStatus(userId, GroupStatus.ACTIVE);
        return groups.stream()
                .map(group -> buildGroupVO(group, userId))
                .collect(Collectors.toList());
    }

    /**
     * 获取群组详情
     */
    public GroupVO getGroupDetails(Long groupId, Long requesterId) {
        Group group = groupMapper.selectById(groupId);
        if (group == null) {
            throw new RuntimeException("群组不存在");
        }

        // 检查用户是否是群组成员
        if (!groupMemberMapper.existsByGroupIdAndUserId(groupId, requesterId)) {
            throw new RuntimeException("您不是群组成员，无权查看群组详情");
        }

        GroupVO groupVO = buildGroupVO(group, requesterId);

        // 加载成员列表
        List<GroupMember> members = groupMemberMapper.findByGroupIdOrderByJoinedAtAsc(groupId);
        List<GroupMemberVO> memberVOs = members.stream()
                .map(this::buildGroupMemberVO)
                .collect(Collectors.toList());
        groupVO.setMembers(memberVOs);

        return groupVO;
    }

    /**
     * 获取群组成员列表
     */
    public List<GroupMemberVO> getGroupMembers(Long groupId, Long requesterId) {
        // 检查用户是否是群组成员
        if (!groupMemberMapper.existsByGroupIdAndUserId(groupId, requesterId)) {
            throw new RuntimeException("您不是群组成员，无权查看成员列表");
        }

        List<GroupMember> members = groupMemberMapper.findByGroupIdOrderByJoinedAtAsc(groupId);
        return members.stream()
                .map(this::buildGroupMemberVO)
                .collect(Collectors.toList());
    }

    /**
     * 移除群组成员（管理员操作）
     */
    public void removeMember(Long groupId, Long operatorId, Long targetUserId) {
        // 检查操作者权限
        GroupMember operator = groupMemberMapper.findByGroupIdAndUserId(groupId, operatorId);
        if (operator == null) {
            throw new RuntimeException("您不是群组成员");
        }

        if (operator.getRole() == GroupMemberRole.MEMBER) {
            throw new RuntimeException("权限不足，无法移除成员");
        }

        // 检查目标成员
        GroupMember targetMember = groupMemberMapper.findByGroupIdAndUserId(groupId, targetUserId);
        if (targetMember == null) {
            throw new RuntimeException("目标用户不是群组成员");
        }

        // 不能移除群主
        if (targetMember.getRole() == GroupMemberRole.OWNER) {
            throw new RuntimeException("不能移除群主");
        }

        // 管理员不能移除其他管理员（只有群主可以）
        if (operator.getRole() == GroupMemberRole.ADMIN &&
            targetMember.getRole() == GroupMemberRole.ADMIN) {
            throw new RuntimeException("管理员不能移除其他管理员");
        }

        groupMemberMapper.deleteById(targetMember.getId());
    }

    /**
     * 设置成员角色（群主操作）
     */
    public void setMemberRole(Long groupId, Long operatorId, Long targetUserId, GroupMemberRole newRole) {
        // 检查操作者权限
        GroupMember operator = groupMemberMapper.findByGroupIdAndUserId(groupId, operatorId);
        if (operator == null) {
            throw new RuntimeException("您不是群组成员");
        }

        if (operator.getRole() != GroupMemberRole.OWNER) {
            throw new RuntimeException("只有群主可以设置成员角色");
        }

        // 检查目标成员
        GroupMember targetMember = groupMemberMapper.findByGroupIdAndUserId(groupId, targetUserId);
        if (targetMember == null) {
            throw new RuntimeException("目标用户不是群组成员");
        }

        // 不能设置自己的角色
        if (operatorId.equals(targetUserId)) {
            throw new RuntimeException("不能修改自己的角色");
        }

        // 不能设置为群主角色
        if (newRole == GroupMemberRole.OWNER) {
            throw new RuntimeException("使用转让群主功能来更改群主");
        }

        targetMember.setRole(newRole);
        groupMemberMapper.updateById(targetMember);
    }

    /**
     * 搜索群组
     */
    public List<GroupVO> searchGroups(String keyword, Long userId) {
        List<Group> groups = groupMapper.findByNameContainingAndStatus(keyword, GroupStatus.ACTIVE);
        return groups.stream()
                .map(group -> buildGroupVO(group, userId))
                .collect(Collectors.toList());
    }

    /**
     * 添加成员到群组
     */
    private void addMemberToGroup(Long groupId, Long userId, GroupMemberRole role) {
        GroupMember member = GroupMember.builder()
                .groupId(groupId)
                .userId(userId)
                .role(role)
                .joinedAt(LocalDateTime.now())
                .lastActiveAt(LocalDateTime.now())
                .isMuted(false)
                .build();
        groupMemberMapper.insert(member);
    }

    /**
     * 构建GroupVO对象
     */
    private GroupVO buildGroupVO(Group group, Long requesterId) {
        // 获取当前用户在群组中的角色
        GroupMemberRole myRole = null;
        GroupMember myMembership = groupMemberMapper.findByGroupIdAndUserId(group.getId(), requesterId);
        if (myMembership != null) {
            myRole = myMembership.getRole();
        }

        // 获取成员数量
        long memberCount = groupMemberMapper.countByGroupId(group.getId());

        // 获取群主信息
        User owner = userMapper.selectById(group.getOwnerId());

        return GroupVO.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .ownerId(group.getOwnerId())
                .ownerName(owner != null ? "用户" + owner.getId() : "未知用户")
                .avatarUrl(group.getAvatarUrl())
                .memberCount((int) memberCount)
                .maxMembers(group.getMaxMembers())
                .type(group.getType())
                .status(group.getStatus())
                .requireApproval(group.getRequireApproval())
                .myRole(myRole)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }

    /**
     * 构建GroupMemberVO对象
     */
    private GroupMemberVO buildGroupMemberVO(GroupMember member) {
        User user = userMapper.selectById(member.getUserId());

        return GroupMemberVO.builder()
                .membershipId(member.getId())
                .userId(member.getUserId())
                .username(user != null ? String.valueOf(user.getId()) : "")
                .nickname(user != null ? "用户" + user.getId() : "未知用户")
                .groupNickname(member.getNickname())
                .avatar("")
                .role(member.getRole())
                .onlineStatus(user != null ? user.getStatus() : null)
                .joinedAt(member.getJoinedAt())
                .lastActiveAt(member.getLastActiveAt())
                .isMuted(member.getIsMuted())
                .muteUntil(member.getMuteUntil())
                .build();
    }
}
