package top.contins.linx.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.dto.CreateGroupDto;
import top.contins.linx.model.dto.UserSession;
import top.contins.linx.model.entity.GroupMemberRole;
import top.contins.linx.model.vo.GroupMemberVO;
import top.contins.linx.model.vo.GroupVO;
import top.contins.linx.model.vo.Result;
import top.contins.linx.service.GroupService;

import java.util.List;
import java.util.Map;

/**
 * 群组管理API控制器
 */
@RestController
@RequestMapping("/api/linx/groups")
@Tag(name = "群组管理", description = "群组创建、加入、退出、成员管理等功能")
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
    @Operation(summary = "创建群组", description = "创建新的群组")
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
    @Operation(summary = "获取群组列表", description = "获取当前用户加入的所有群组")
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
    @Operation(summary = "获取群组详情", description = "获取指定群组的详细信息")
    @GetMapping("/{groupId}")
    public Result<GroupVO> getGroupDetails(
            @Parameter(description = "群组ID", required = true)
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
    @Operation(summary = "加入群组", description = "申请加入指定群组")
    @PostMapping("/{groupId}/join")
    public Result<String> joinGroup(
            @Parameter(description = "群组ID", required = true)
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
    @Operation(summary = "退出群组", description = "退出指定群组")
    @PostMapping("/{groupId}/leave")
    public Result<String> leaveGroup(
            @Parameter(description = "群组ID", required = true)
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
    @Operation(summary = "解散群组", description = "解散群组（仅群主可操作）")
    @DeleteMapping("/{groupId}")
    public Result<String> disbandGroup(
            @Parameter(description = "群组ID", required = true)
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
    @Operation(summary = "获取群组成员", description = "获取指定群组的成员列表")
    @GetMapping("/{groupId}/members")
    public Result<List<GroupMemberVO>> getGroupMembers(
            @Parameter(description = "群组ID", required = true)
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
    @Operation(summary = "移除群组成员", description = "从群组中移除指定成员（管理员操作）")
    @DeleteMapping("/{groupId}/members/{userId}")
    public Result<String> removeMember(
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId,
            @Parameter(description = "用户ID", required = true)
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
    @Operation(summary = "设置成员角色", description = "设置群组成员的角色（群主操作）")
    @PutMapping("/{groupId}/members/{userId}/role")
    public Result<String> setMemberRole(
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId,
            @Parameter(description = "用户ID", required = true)
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
    @Operation(summary = "搜索群组", description = "根据关键词搜索群组")
    @GetMapping("/search")
    public Result<List<GroupVO>> searchGroups(
            @Parameter(description = "搜索关键词", required = true)
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
