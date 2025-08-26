package top.contins.linx.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.dto.RespondFriendRequestDTO;
import top.contins.linx.model.dto.SendFriendRequestDTO;
import top.contins.linx.model.vo.ApiResponse;
import top.contins.linx.model.vo.FriendshipVO;
import top.contins.linx.model.vo.UserVO;
import top.contins.linx.service.FriendshipService;

import java.util.List;

/**
 * 好友关系管理API控制器
 */
@RestController
@RequestMapping("/api/friendship")
@Tag(name = "好友管理", description = "好友关系管理相关API")
public class FriendshipController {
    
    @Autowired
    private FriendshipService friendshipService;
    
    @Operation(summary = "发送好友请求", description = "向指定用户发送好友请求")
    @PostMapping("/request")
    public ApiResponse<FriendshipVO> sendFriendRequest(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "好友请求信息", required = true)
            @Valid @RequestBody SendFriendRequestDTO request) {
        try {
            FriendshipVO friendship = friendshipService.sendFriendRequest(
                    userId, request.getUserIdentifier(), request.getRemark());
            return ApiResponse.success("好友请求发送成功", friendship);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("发送好友请求失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("发送好友请求失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "响应好友请求", description = "接受或拒绝好友请求")
    @PostMapping("/respond")
    public ApiResponse<FriendshipVO> respondToFriendRequest(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "响应信息", required = true)
            @Valid @RequestBody RespondFriendRequestDTO request) {
        try {
            FriendshipVO friendship = friendshipService.respondToFriendRequest(
                    request.getRequestId(), userId, request.getAccept());
            return ApiResponse.success("好友请求处理成功", friendship);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("处理好友请求失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("处理好友请求失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取好友列表", description = "获取当前用户的好友列表")
    @GetMapping("/friends")
    public ApiResponse<List<UserVO>> getFriends(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId) {
        try {
            List<UserVO> friends = friendshipService.getFriends(userId);
            return ApiResponse.success("获取好友列表成功", friends);
        } catch (Exception e) {
            return ApiResponse.error("获取好友列表失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取收到的好友请求", description = "获取当前用户收到的待处理好友请求")
    @GetMapping("/requests/received")
    public ApiResponse<List<FriendshipVO>> getReceivedFriendRequests(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId) {
        try {
            List<FriendshipVO> requests = friendshipService.getReceivedFriendRequests(userId);
            return ApiResponse.success("获取收到的好友请求成功", requests);
        } catch (Exception e) {
            return ApiResponse.error("获取好友请求失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取发送的好友请求", description = "获取当前用户发送的待处理好友请求")
    @GetMapping("/requests/sent")
    public ApiResponse<List<FriendshipVO>> getSentFriendRequests(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId) {
        try {
            List<FriendshipVO> requests = friendshipService.getSentFriendRequests(userId);
            return ApiResponse.success("获取发送的好友请求成功", requests);
        } catch (Exception e) {
            return ApiResponse.error("获取好友请求失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "删除好友", description = "删除指定的好友关系")
    @DeleteMapping("/friends/{friendId}")
    public ApiResponse<String> removeFriend(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "好友ID", required = true)
            @PathVariable Long friendId) {
        try {
            friendshipService.removeFriend(userId, friendId);
            return ApiResponse.success("删除好友成功", "好友关系已删除");
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("删除好友失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("删除好友失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "屏蔽用户", description = "屏蔽指定用户")
    @PostMapping("/block/{targetUserId}")
    public ApiResponse<String> blockUser(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "目标用户ID", required = true)
            @PathVariable Long targetUserId) {
        try {
            friendshipService.blockUser(userId, targetUserId);
            return ApiResponse.success("屏蔽用户成功", "用户已被屏蔽");
        } catch (IllegalArgumentException e) {
            return ApiResponse.error("屏蔽用户失败: " + e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("屏蔽用户失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "检查好友关系", description = "检查两个用户是否为好友")
    @GetMapping("/check/{targetUserId}")
    public ApiResponse<Boolean> checkFriendship(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "目标用户ID", required = true)
            @PathVariable Long targetUserId) {
        try {
            boolean areFriends = friendshipService.areFriends(userId, targetUserId);
            return ApiResponse.success("检查好友关系成功", areFriends);
        } catch (Exception e) {
            return ApiResponse.error("检查好友关系失败: " + e.getMessage());
        }
    }
}