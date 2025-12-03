package top.contins.linx.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.dto.FriendRequestDto;
import top.contins.linx.model.common.UserSession;
import top.contins.linx.model.vo.FriendVO;
import top.contins.linx.model.common.Result;
import top.contins.linx.service.FriendshipService;

import java.util.List;
import java.util.Map;

/**
 * 好友管理API控制器
 */
@Slf4j
@RestController
@RequestMapping("/friends")
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
    @PostMapping("/request/{friendshipId}/handle")
    public Result<String> handleFriendRequest(
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
    @GetMapping
    public Result<List<FriendVO>> getFriends() {
        try {
            Long currentUserId = getCurrentUserId();
            log.info("获取好友列表: {}", currentUserId);
            List<FriendVO> friends = friendshipService.getFriends(currentUserId);
            return Result.success("获取好友列表成功", friends);
        } catch (Exception e) {
            return Result.error("获取好友列表失败: " + e.getMessage());
        }
    }

    /**
     * 获取收到的好友请求
     */
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
    @DeleteMapping("/{friendId}")
    public Result<String> removeFriend(
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
    @PutMapping("/{friendId}/remark")
    public Result<String> updateFriendRemark(
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
