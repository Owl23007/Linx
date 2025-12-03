package top.contins.linx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.dto.CreateGroupDto;
import top.contins.linx.model.common.UserSession;
import top.contins.linx.model.enums.GroupMemberRole;
import top.contins.linx.model.vo.GroupMemberVO;
import top.contins.linx.model.vo.GroupVO;
import top.contins.linx.model.common.Result;
import top.contins.linx.service.GroupService;

import java.util.List;
import java.util.Map;

/**
 * 群组管理API控制器
 */
@RestController
@RequestMapping("/groups")
public class GroupController {

    private final GroupService groupService;
    private final ApplicationContext applicationContext;

    @Autowired
    public GroupController(GroupService groupService, ApplicationContext applicationContext) {
        this.groupService = groupService;
        this.applicationContext = applicationContext;
    }

    /**
     * 创建群组
     */
    @PostMapping
    public Result<GroupVO> createGroup(@RequestBody CreateGroupDto createGroupDto) {
        try {
            Long currentUserId = getCurrentUserId();
            GroupVO group = groupService.createGroup(currentUserId, createGroupDto);
            return Result.success("创建群组成功", group);
        } catch (Exception e) {
            return Result.error("创建群组失败: " + e.getMessage());
        }
    }

    /**
     * 获取用户加入的群组列表
     */
    @GetMapping
    public Result<List<GroupVO>> getUserGroups() {
        try {
            Long currentUserId = getCurrentUserId();
            List<GroupVO> groups = groupService.getUserGroups(currentUserId);
            return Result.success("获取群组列表成功", groups);
        } catch (Exception e) {
            return Result.error("获取群组列表失败: " + e.getMessage());
        }
    }

    /**
     * 获取群组详情
     */
    @GetMapping("/{groupId}")
    public Result<GroupVO> getGroupDetails(
            @PathVariable Long groupId) {
        try {
            Long currentUserId = getCurrentUserId();
            GroupVO group = groupService.getGroupDetails(groupId, currentUserId);
            return Result.success("获取群组详情成功", group);
        } catch (Exception e) {
            return Result.error("获取群组详情失败: " + e.getMessage());
        }
    }

    /**
     * 加入群组
     */
    @PostMapping("/{groupId}/join")
    public Result<String> joinGroup(
            @PathVariable Long groupId) {
        try {
            Long currentUserId = getCurrentUserId();
            groupService.joinGroup(groupId, currentUserId);
            return Result.success("加入群组成功");
        } catch (Exception e) {
            return Result.error("加入群组失败: " + e.getMessage());
        }
    }

    /**
     * 退出群组
     */
    @PostMapping("/{groupId}/leave")
    public Result<String> leaveGroup(
            @PathVariable Long groupId) {
        try {
            Long currentUserId = getCurrentUserId();
            groupService.leaveGroup(groupId, currentUserId);
            return Result.success("退出群组成功");
        } catch (Exception e) {
            return Result.error("退出群组失败: " + e.getMessage());
        }
    }

    /**
     * 解散群组
     */
    @DeleteMapping("/{groupId}")
    public Result<String> disbandGroup(
            @PathVariable Long groupId) {
        try {
            Long currentUserId = getCurrentUserId();
            groupService.disbandGroup(groupId, currentUserId);
            return Result.success("解散群组成功");
        } catch (Exception e) {
            return Result.error("解散群组失败: " + e.getMessage());
        }
    }

    /**
     * 获取群组成员列表
     */
    
    @GetMapping("/{groupId}/members")
    public Result<List<GroupMemberVO>> getGroupMembers(
            
            @PathVariable Long groupId) {
        try {
            Long currentUserId = getCurrentUserId();
            List<GroupMemberVO> members = groupService.getGroupMembers(groupId, currentUserId);
            return Result.success("获取群组成员成功", members);
        } catch (Exception e) {
            return Result.error("获取群组成员失败: " + e.getMessage());
        }
    }

    /**
     * 移除群组成员
     */
    
    @DeleteMapping("/{groupId}/members/{userId}")
    public Result<String> removeMember(
            
            @PathVariable Long groupId,
            
            @PathVariable Long userId) {
        try {
            Long currentUserId = getCurrentUserId();
            groupService.removeMember(groupId, currentUserId, userId);
            return Result.success("移除成员成功");
        } catch (Exception e) {
            return Result.error("移除成员失败: " + e.getMessage());
        }
    }

    /**
     * 设置成员角色
     */
    
    @PutMapping("/{groupId}/members/{userId}/role")
    public Result<String> setMemberRole(
            
            @PathVariable Long groupId,
            
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {
        try {
            Long currentUserId = getCurrentUserId();
            String roleStr = body.get("role");
            GroupMemberRole role = GroupMemberRole.valueOf(roleStr);
            groupService.setMemberRole(groupId, currentUserId, userId, role);
            return Result.success("设置成员角色成功");
        } catch (Exception e) {
            return Result.error("设置成员角色失败: " + e.getMessage());
        }
    }

    /**
     * 搜索群组
     */
    
    @GetMapping("/search")
    public Result<List<GroupVO>> searchGroups(
            
            @RequestParam String keyword) {
        try {
            Long currentUserId = getCurrentUserId();
            List<GroupVO> groups = groupService.searchGroups(keyword, currentUserId);
            return Result.success("搜索群组成功", groups);
        } catch (Exception e) {
            return Result.error("搜索群组失败: " + e.getMessage());
        }
    }

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        UserSession userSession = applicationContext.getBean(UserSession.class);
        if (userSession.getUserLongId() == null) {
            throw new RuntimeException("用户未登录");
        }
        return userSession.getUserLongId();
    }
}
