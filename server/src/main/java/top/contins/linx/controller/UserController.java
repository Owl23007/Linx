package top.contins.linx.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.vo.ApiResponse;
import top.contins.linx.model.vo.UserVO;
import top.contins.linx.service.UserService;

import java.util.List;

/**
 * 用户管理API控制器
 */
@RestController
@RequestMapping("/api/user")
@Tag(name = "用户管理", description = "用户管理相关API")
public class UserController {
    

    private UserService userService  = null;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @Operation(summary = "获取用户信息", description = "根据用户ID获取用户信息")
    @GetMapping("/{userId}")
    public ApiResponse<UserVO> getUser(
            @Parameter(description = "用户ID", required = true)
            @PathVariable Long userId) {
        try {
            UserVO user = userService.getUserVO(userId);
            return ApiResponse.success("获取用户信息成功", user);
        } catch (Exception e) {
            return ApiResponse.error("获取用户信息失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的信息")
    @GetMapping("/me")
    public ApiResponse<UserVO> getCurrentUser(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId) {
        try {
            UserVO user = userService.getUserVO(userId);
            return ApiResponse.success("获取用户信息成功", user);
        } catch (Exception e) {
            return ApiResponse.error("获取用户信息失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "更新用户信息", description = "更新用户昵称和邮箱")
    @PutMapping("/me")
    public ApiResponse<UserVO> updateUser(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @RequestBody UpdateUserRequest request) {
        try {
            User user = userService.updateUser(userId, request.getNickname(), request.getEmail());
            return ApiResponse.success("更新用户信息成功", new UserVO(user));
        } catch (Exception e) {
            return ApiResponse.error("更新用户信息失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "更新用户状态", description = "更新用户在线状态")
    @PostMapping("/status")
    public ApiResponse<UserVO> updateUserStatus(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @RequestBody String status) {
        try {
            User.UserStatus updateStatus = User.UserStatus.valueOf(status);
            User user = userService.updateUserStatus(userId, updateStatus);
            return ApiResponse.success("更新用户状态成功", new UserVO(user));
        } catch (Exception e) {
            return ApiResponse.error("更新用户状态失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "搜索用户", description = "根据昵称搜索用户")
    @GetMapping("/search")
    public ApiResponse<List<UserVO>> searchUsers(
            @Parameter(description = "搜索关键词", required = true)
            @RequestParam String keyword) {
        try {
            List<UserVO> users = userService.searchUsersByNickname(keyword);
            return ApiResponse.success("搜索用户成功", users);
        } catch (Exception e) {
            return ApiResponse.error("搜索用户失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取在线用户列表", description = "获取当前在线的用户列表")
    @GetMapping("/online")
    public ApiResponse<List<UserVO>> getOnlineUsers() {
        try {
            List<UserVO> users = userService.getOnlineUsers();
            return ApiResponse.success("获取在线用户列表成功", users);
        } catch (Exception e) {
            return ApiResponse.error("获取在线用户列表失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "检查用户名是否存在", description = "检查用户名是否已被使用")
    @GetMapping("/check-username/{username}")
    public ApiResponse<Boolean> checkUsername(
            @Parameter(description = "用户名", required = true)
            @PathVariable String username) {
        try {
            boolean exists = userService.existsByUsername(username);
            return ApiResponse.success("检查用户名成功", exists);
        } catch (Exception e) {
            return ApiResponse.error("检查用户名失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "检查邮箱是否存在", description = "检查邮箱是否已被使用")
    @GetMapping("/check-email/{email}")
    public ApiResponse<Boolean> checkEmail(
            @Parameter(description = "邮箱", required = true)
            @PathVariable String email) {
        try {
            boolean exists = userService.existsByEmail(email);
            return ApiResponse.success("检查邮箱成功", exists);
        } catch (Exception e) {
            return ApiResponse.error("检查邮箱失败: " + e.getMessage());
        }
    }
    
    /**
     * 更新用户信息请求
     */
    @Data
    public static class UpdateUserRequest {
        private String nickname;
        private String email;
        
        public UpdateUserRequest() {}

    }
    
    /**
     * 更新状态请求
     */
    @Data
    public static class UpdateStatusRequest {
        private String status;
        public UpdateStatusRequest() {}
    }
}