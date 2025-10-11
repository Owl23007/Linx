package top.contins.linx.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.common.UserSession;
import top.contins.linx.model.enums.UserStatus;
import top.contins.linx.model.common.Result;
import top.contins.linx.model.vo.UserVO;
import top.contins.linx.service.UserService;

import java.util.Map;

/**
 * 用户管理API控制器（LinX 聊天服务专用）
 * 注意：本控制器仅处理与聊天行为相关的用户状态和可见性，
 * 不涉及用户名、邮箱、昵称等认证或个性化数据。
 * 所有资料修改请调用 Profile Service。
 */
@RestController
@RequestMapping("/user")
@Tag(name = "用户管理", description = "聊天服务中的用户状态与信息查询")
public class UserController {

    private final UserService userService;
    private final ApplicationContext applicationContext;

    @Autowired
    public UserController(UserService userService, ApplicationContext applicationContext) {
        this.userService = userService;
        this.applicationContext = applicationContext;
    }

    /**
     * 根据用户ID获取用户状态
     */
    @Operation(summary = "根据用户ID获取用户状态", description = "返回用户的在线状态、最后活跃时间")
    @GetMapping("/{userId}")
    public Result<UserVO> getUser(
            @Parameter(description = "目标用户ID", required = true)
            @PathVariable Long userId) {
        try {
            UserVO userVO = userService.getUserVO(userId);
            return Result.success("获取用户信息成功", userVO);
        } catch (Exception e) {
            return Result.error("获取用户信息失败: " + e.getMessage());
        }
    }

    /**
     * 获取当前登录用户的信息（通过JWT解析）
     */
    @Operation(summary = "获取当前登录用户信息", description = "基于 Authorization: Bearer <token> 自动识别当前用户")
    @GetMapping("/me")
    public Result<UserVO> getCurrentUser() {
        try {
            Long currentUserId = applicationContext.getBean(UserSession.class).getUserLongId();
            if (currentUserId == null) {
                return Result.error("未提供有效身份令牌，请登录后重试");
            }

            UserVO userVO = userService.getUserVO(currentUserId);
            return Result.success("获取当前用户信息成功", userVO);
        } catch (Exception e) {
            return Result.error("获取当前用户信息失败: " + e.getMessage());
        }
    }

    /**
     * 更新用户在线状态（如：在线、离开、勿扰）
     */
    @Operation(summary = "更新用户在线状态", description = "用户主动切换状态，如 'online', 'away', 'dnd', 'offline'")
    @PostMapping("/status")
    public Result<UserVO> updateUserStatus(@RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        try {
            Long currentUserId = applicationContext.getBean(UserSession.class).getUserLongId();
            if (currentUserId == null) {
                return Result.error("未提供有效身份令牌，请登录后重试");
            }

            UserStatus status = UserStatus.valueOf(statusStr.toUpperCase());
            UserVO userVO = new UserVO(userService.updateUserStatus(currentUserId, status));
            return Result.success("更新用户状态成功", userVO);
        } catch (IllegalArgumentException e) {
            return Result.error("无效的状态值: " + statusStr + "。支持: online, offline, away, dnd, hidden");
        } catch (Exception e) {
            return Result.error("更新用户状态失败: " + e.getMessage());
        }
    }
}
