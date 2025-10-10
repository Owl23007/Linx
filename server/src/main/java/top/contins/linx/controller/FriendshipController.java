package top.contins.linx.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.dto.FriendRequestDto;
import top.contins.linx.model.dto.UserSession;
import top.contins.linx.model.vo.FriendVO;
import top.contins.linx.model.vo.Result;
import top.contins.linx.service.FriendshipService;

import java.util.List;
import java.util.Map;

/**
 * 好友管理API控制器
 */
@RestController
@RequestMapping("/api/linx/friends")
@Tag(name = "好友管理", description = "好友添加、删除、列表查询等功能")
public class FriendshipController {

    private final FriendshipService friendshipService;
    private final ApplicationContext applicationContext;

    @Autowired
    public FriendshipController(FriendshipService friendshipService,
                              ApplicationContext applicationContext) {
        this.friendshipService = friendshipService;
        this.applicationContext = applicationContext;
    }

    /**
     * 发送好友请求
     */
    @Operation(summary = "发送好友请求", description = "向指定用户发送好友请求")
    @PostMapping("/request")
    public Result<String> sendFriendRequest(@RequestBody FriendRequestDto request) {
        try {
            Long currentUserId = getCurrentUserId();
            friendshipService.sendFriendRequest(currentUserId, request);
            return Result.success("好友请求发送成功");
        } catch (Exception e) {
            return Result.error("发送好友请求失败: " + e.getMessage());
        }
    }

    /**
     * 处理好友请求
     */
    @Operation(summary = "处理好友请求", description = "接受或拒绝好友请求")
    @PostMapping("/request/{friendshipId}/handle")
    public Result<String> handleFriendRequest(
            @Parameter(description = "好友关系ID", required = true)
            @PathVariable Long friendshipId,
            @RequestBody Map<String, Boolean> body) {
        try {
            Long currentUserId = getCurrentUserId();
            boolean accept = body.getOrDefault("accept", false);
            friendshipService.handleFriendRequest(currentUserId, friendshipId, accept);
            return Result.success(accept ? "已接受好友请求" : "已拒绝好友请求");
        } catch (Exception e) {
            return Result.error("处理好友请求失败: " + e.getMessage());
        }
    }

    /**
     * 获取好友列表
     */
    @Operation(summary = "获取好友列表", description = "获取当前用户的所有好友")
    @GetMapping
    public Result<List<FriendVO>> getFriends() {
        try {
            Long currentUserId = getCurrentUserId();
            List<FriendVO> friends = friendshipService.getFriends(currentUserId);
            return Result.success("获取好友列表成功", friends);
        } catch (Exception e) {
            return Result.error("获取好友列表失败: " + e.getMessage());
        }
    }

    /**
     * 获取收到的好友请求
     */
    @Operation(summary = "获取收到的好友请求", description = "获取当前用户收到的待处理好友请求")
    @GetMapping("/requests/received")
    public Result<List<FriendVO>> getReceivedFriendRequests() {
        try {
            Long currentUserId = getCurrentUserId();
            List<FriendVO> requests = friendshipService.getReceivedFriendRequests(currentUserId);
            return Result.success("获取收到的好友请求成功", requests);
        } catch (Exception e) {
            return Result.error("获取收到的好友请求失败: " + e.getMessage());
        }
    }

    /**
     * 获取发送的好友请求
     */
    @Operation(summary = "获取发送的好友请求", description = "获取当前用户发送的待处理好友请求")
    @GetMapping("/requests/sent")
    public Result<List<FriendVO>> getSentFriendRequests() {
        try {
            Long currentUserId = getCurrentUserId();
            List<FriendVO> requests = friendshipService.getSentFriendRequests(currentUserId);
            return Result.success("获取发送的好友请求成功", requests);
        } catch (Exception e) {
            return Result.error("获取发送的好友请求失败: " + e.getMessage());
        }
    }

    /**
     * 删除好友
     */
    @Operation(summary = "删除好友", description = "删除指定好友")
    @DeleteMapping("/{friendId}")
    public Result<String> removeFriend(
            @Parameter(description = "好友用户ID", required = true)
            @PathVariable Long friendId) {
        try {
            Long currentUserId = getCurrentUserId();
            friendshipService.removeFriend(currentUserId, friendId);
            return Result.success("删除好友成功");
        } catch (Exception e) {
            return Result.error("删除好友失败: " + e.getMessage());
        }
    }

    /**
     * 更新好友备注
     */
    @Operation(summary = "更新好友备注", description = "修改好友的备注名称")
    @PutMapping("/{friendId}/remark")
    public Result<String> updateFriendRemark(
            @Parameter(description = "好友用户ID", required = true)
            @PathVariable Long friendId,
            @RequestBody Map<String, String> body) {
        try {
            Long currentUserId = getCurrentUserId();
            String remark = body.get("remark");
            friendshipService.updateFriendRemark(currentUserId, friendId, remark);
            return Result.success("更新好友备注成功");
        } catch (Exception e) {
            return Result.error("更新好友备注失败: " + e.getMessage());
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
