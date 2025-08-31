package top.contins.linx.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.dto.CreateGroupDTO;
import top.contins.linx.model.vo.ApiResponse;
import top.contins.linx.model.vo.GroupVO;
import top.contins.linx.model.vo.UserVO;
import top.contins.linx.service.GroupService;

import java.util.List;

/**
 * 群组管理API控制器
 */
@RestController
@RequestMapping("/api/group")
@Tag(name = "群组管理", description = "群组管理相关API")
public class GroupController {
    
    @Autowired
    private GroupService groupService;
    
    @Operation(summary = "创建群组", description = "创建新的群组")
    @PostMapping
    public ApiResponse<GroupVO> createGroup(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "群组信息", required = true)
            @Valid @RequestBody CreateGroupDTO request) {
        try {
            GroupVO group = groupService.createGroup(
                    userId, 
                    request.getName(), 
                    request.getDescription(),
                    request.getType(),
                    request.getMaxMembers()
            );
            return ApiResponse.success("创建群组成功", group);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("创建群组失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("创建群组失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取群组信息", description = "根据ID获取群组详细信息")
    @GetMapping("/{groupId}")
    public ApiResponse<GroupVO> getGroup(
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId) {
        try {
            GroupVO group = groupService.getGroup(groupId);
            return ApiResponse.success("获取群组信息成功", group);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("获取群组信息失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("获取群组信息失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "更新群组信息", description = "更新群组名称和描述")
    @PutMapping("/{groupId}")
    public ApiResponse<GroupVO> updateGroup(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId,
            @Parameter(description = "更新信息", required = true)
            @RequestBody UpdateGroupRequest request) {
        try {
            GroupVO group = groupService.updateGroup(
                    groupId, userId, request.getName(), request.getDescription());
            return ApiResponse.success("更新群组信息成功", group);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("更新群组信息失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("更新群组信息失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "加入群组", description = "用户加入指定群组")
    @PostMapping("/{groupId}/join")
    public ApiResponse<String> joinGroup(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId,
            @Parameter(description = "邀请人ID")
            @RequestParam(required = false) Long inviterId) {
        try {
            groupService.joinGroup(groupId, userId, inviterId);
            return ApiResponse.success("加入群组成功", "已成功加入群组");
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("加入群组失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("加入群组失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "离开群组", description = "用户离开群组")
    @PostMapping("/{groupId}/leave")
    public ApiResponse<String> leaveGroup(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId) {
        try {
            groupService.leaveGroup(groupId, userId);
            return ApiResponse.success("离开群组成功", "已成功离开群组");
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("离开群组失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("离开群组失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "踢出群成员", description = "管理员踢出群组成员")
    @PostMapping("/{groupId}/remove/{memberId}")
    public ApiResponse<String> removeMember(
            @Parameter(description = "当前用户ID（管理员）", required = true)
            @RequestHeader("User-Id") Long adminId,
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId,
            @Parameter(description = "被踢出的成员ID", required = true)
            @PathVariable Long memberId) {
        try {
            groupService.removeMember(groupId, adminId, memberId);
            return ApiResponse.success("踢出成员成功", "成员已被移出群组");
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("踢出成员失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("踢出成员失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取用户群组列表", description = "获取用户参与的所有群组")
    @GetMapping("/my-groups")
    public ApiResponse<List<GroupVO>> getUserGroups(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId) {
        try {
            List<GroupVO> groups = groupService.getUserGroups(userId);
            return ApiResponse.success("获取用户群组列表成功", groups);
        } catch (Exception e) {
            return ApiResponse.error("获取用户群组列表失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取群组成员列表", description = "获取群组的所有成员")
    @GetMapping("/{groupId}/members")
    public ApiResponse<List<UserVO>> getGroupMembers(
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId) {
        try {
            List<UserVO> members = groupService.getGroupMembers(groupId);
            return ApiResponse.success("获取群组成员列表成功", members);
        } catch (Exception e) {
            return ApiResponse.error("获取群组成员列表失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "检查成员身份", description = "检查用户是否为群组成员")
    @GetMapping("/{groupId}/is-member")
    public ApiResponse<Boolean> isMember(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId) {
        try {
            boolean isMember = groupService.isMember(groupId, userId);
            return ApiResponse.success("检查成员身份成功", isMember);
        } catch (Exception e) {
            return ApiResponse.error("检查成员身份失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "检查管理员权限", description = "检查用户是否为群组管理员")
    @GetMapping("/{groupId}/is-admin")
    public ApiResponse<Boolean> isAdmin(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId) {
        try {
            boolean isAdmin = groupService.isAdmin(groupId, userId);
            return ApiResponse.success("检查管理员权限成功", isAdmin);
        } catch (Exception e) {
            return ApiResponse.error("检查管理员权限失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "删除群组", description = "群主删除群组")
    @DeleteMapping("/{groupId}")
    public ApiResponse<String> deleteGroup(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId) {
        try {
            groupService.deleteGroup(groupId, userId);
            return ApiResponse.success("删除群组成功", "群组已被删除");
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("删除群组失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("删除群组失败: " + e.getMessage());
        }
    }
    
    /**
     * 更新群组请求DTO
     */
    public static class UpdateGroupRequest {
        private String name;
        private String description;
        
        public UpdateGroupRequest() {}
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}