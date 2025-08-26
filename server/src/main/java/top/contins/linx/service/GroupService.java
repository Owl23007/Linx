package top.contins.linx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.entity.Group;
import top.contins.linx.model.entity.GroupMember;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.vo.GroupVO;
import top.contins.linx.model.vo.UserVO;
import top.contins.linx.repository.GroupMemberRepository;
import top.contins.linx.repository.GroupRepository;
import top.contins.linx.repository.UserRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 群组服务类
 */
@Service
@Transactional
public class GroupService {
    
    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private GroupMemberRepository groupMemberRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 创建群组
     */
    public GroupVO createGroup(Long ownerId, String name, String description, String type, Integer maxMembers) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        Group group = new Group(name, description, owner);
        
        if (type != null) {
            try {
                group.setType(Group.GroupType.valueOf(type.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("无效的群组类型");
            }
        }
        
        if (maxMembers != null && maxMembers > 0) {
            group.setMaxMembers(maxMembers);
        }
        
        group = groupRepository.save(group);
        
        // 将群主添加为群组成员
        GroupMember ownerMember = new GroupMember(group, owner, GroupMember.MemberRole.OWNER);
        groupMemberRepository.save(ownerMember);
        
        return new GroupVO(group);
    }
    
    /**
     * 获取群组信息
     */
    @Transactional(readOnly = true)
    public GroupVO getGroup(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        return new GroupVO(group);
    }
    
    /**
     * 更新群组信息
     */
    public GroupVO updateGroup(Long groupId, Long userId, String name, String description) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        // 检查权限（只有群主或管理员可以修改）
        if (!groupMemberRepository.isAdmin(group, user)) {
            throw new IllegalArgumentException("无权限修改群组信息");
        }
        
        if (name != null && !name.trim().isEmpty()) {
            group.setName(name);
        }
        
        if (description != null) {
            group.setDescription(description);
        }
        
        group = groupRepository.save(group);
        return new GroupVO(group);
    }
    
    /**
     * 加入群组
     */
    public void joinGroup(Long groupId, Long userId, Long inviterId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        // 检查用户是否已经是群组成员
        if (groupMemberRepository.isMember(group, user)) {
            throw new IllegalArgumentException("用户已经是群组成员");
        }
        
        // 检查群组是否已满
        if (group.isFull()) {
            throw new IllegalArgumentException("群组已满");
        }
        
        User inviter = null;
        if (inviterId != null) {
            inviter = userRepository.findById(inviterId).orElse(null);
        }
        
        GroupMember member = new GroupMember(group, user);
        member.setInvitedBy(inviter);
        groupMemberRepository.save(member);
    }
    
    /**
     * 离开群组
     */
    public void leaveGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        Optional<GroupMember> memberOpt = groupMemberRepository.findByGroupAndUser(group, user);
        if (!memberOpt.isPresent()) {
            throw new IllegalArgumentException("用户不是群组成员");
        }
        
        GroupMember member = memberOpt.get();
        
        // 如果是群主离开，需要特殊处理
        if (member.getRole() == GroupMember.MemberRole.OWNER) {
            // 检查是否还有其他成员
            List<GroupMember> activeMembers = groupMemberRepository.findActiveMembers(group);
            if (activeMembers.size() > 1) {
                // 将群主转移给第一个管理员，如果没有管理员则转移给第一个成员
                Optional<GroupMember> newOwner = activeMembers.stream()
                        .filter(m -> !m.equals(member))
                        .filter(m -> m.getRole() == GroupMember.MemberRole.ADMIN)
                        .findFirst();
                
                if (!newOwner.isPresent()) {
                    newOwner = activeMembers.stream()
                            .filter(m -> !m.equals(member))
                            .findFirst();
                }
                
                if (newOwner.isPresent()) {
                    newOwner.get().setRole(GroupMember.MemberRole.OWNER);
                    groupMemberRepository.save(newOwner.get());
                    group.setOwner(newOwner.get().getUser());
                    groupRepository.save(group);
                }
            } else {
                // 群组只有群主一人，解散群组
                group.setStatus(Group.GroupStatus.DISBANDED);
                groupRepository.save(group);
            }
        }
        
        member.setStatus(GroupMember.MemberStatus.LEFT);
        groupMemberRepository.save(member);
    }
    
    /**
     * 踢出群成员
     */
    public void removeMember(Long groupId, Long adminId, Long memberId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("管理员不存在"));
        
        User memberUser = userRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("被踢出用户不存在"));
        
        // 检查管理员权限
        if (!groupMemberRepository.isAdmin(group, admin)) {
            throw new IllegalArgumentException("无权限踢出群成员");
        }
        
        Optional<GroupMember> memberOpt = groupMemberRepository.findByGroupAndUser(group, memberUser);
        if (!memberOpt.isPresent()) {
            throw new IllegalArgumentException("用户不是群组成员");
        }
        
        GroupMember member = memberOpt.get();
        
        // 不能踢出群主
        if (member.getRole() == GroupMember.MemberRole.OWNER) {
            throw new IllegalArgumentException("不能踢出群主");
        }
        
        member.setStatus(GroupMember.MemberStatus.KICKED);
        groupMemberRepository.save(member);
    }
    
    /**
     * 获取用户参与的群组列表
     */
    @Transactional(readOnly = true)
    public List<GroupVO> getUserGroups(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        return groupRepository.findGroupsByUser(user)
                .stream()
                .map(GroupVO::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取群组成员列表
     */
    @Transactional(readOnly = true)
    public List<UserVO> getGroupMembers(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        return groupMemberRepository.findActiveMembers(group)
                .stream()
                .map(member -> new UserVO(member.getUser()))
                .collect(Collectors.toList());
    }
    
    /**
     * 检查用户是否为群组成员
     */
    @Transactional(readOnly = true)
    public boolean isMember(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        return groupMemberRepository.isMember(group, user);
    }
    
    /**
     * 检查用户是否为群组管理员
     */
    @Transactional(readOnly = true)
    public boolean isAdmin(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        return groupMemberRepository.isAdmin(group, user);
    }
    
    /**
     * 删除群组
     */
    public void deleteGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        // 只有群主可以删除群组
        if (!group.isOwner(user)) {
            throw new IllegalArgumentException("只有群主可以删除群组");
        }
        
        group.setStatus(Group.GroupStatus.DISBANDED);
        groupRepository.save(group);
    }
}