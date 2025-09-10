package top.contins.linx.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.vo.ApiResponse;
import top.contins.linx.model.vo.MessageVO;
import top.contins.linx.service.MessageService;

import java.util.List;

/**
 * 消息管理API控制器
 */
@RestController
@RequestMapping("/api/message")
@Tag(name = "消息管理", description = "消息管理相关API")
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    @Operation(summary = "获取私聊消息记录", description = "获取两个用户之间的私聊消息记录")
    @GetMapping("/private/{targetUserId}")
    public ApiResponse<List<MessageVO>> getPrivateMessages(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "聊天对象用户ID", required = true)
            @PathVariable Long targetUserId,
            @Parameter(description = "页码", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小", required = false)
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<MessageVO> messages = messageService.getPrivateMessages(userId, targetUserId, page, size);
            return ApiResponse.success("获取私聊消息成功", messages);
        } catch (Exception e) {
            return ApiResponse.error("获取私聊消息失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取群聊消息记录", description = "获取群组的消息记录")
    @GetMapping("/group/{groupId}")
    public ApiResponse<List<MessageVO>> getGroupMessages(
            @Parameter(description = "群组ID", required = true)
            @PathVariable Long groupId,
            @Parameter(description = "页码", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小", required = false)
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<MessageVO> messages = messageService.getGroupMessages(groupId, page, size);
            return ApiResponse.success("获取群聊消息成功", messages);
        } catch (Exception e) {
            return ApiResponse.error("获取群聊消息失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取未读消息", description = "获取用户的所有未读私聊消息")
    @GetMapping("/unread")
    public ApiResponse<List<MessageVO>> getUnreadMessages(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId) {
        try {
            List<MessageVO> messages = messageService.getUnreadMessages(userId);
            return ApiResponse.success("获取未读消息成功", messages);
        } catch (Exception e) {
            return ApiResponse.error("获取未读消息失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "标记消息为已读", description = "标记指定消息为已读")
    @PostMapping("/{messageId}/read")
    public ApiResponse<String> markMessageAsRead(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "消息ID", required = true)
            @PathVariable Long messageId) {
        try {
            messageService.markMessageAsRead(messageId, userId);
            return ApiResponse.success("标记消息已读成功", "消息已标记为已读");
        } catch (Exception e) {
            return ApiResponse.error("标记消息已读失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "批量标记消息为已读", description = "标记与指定用户的所有未读消息为已读")
    @PostMapping("/read-all/{chatPartnerId}")
    public ApiResponse<String> markMessagesAsRead(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "聊天对象用户ID", required = true)
            @PathVariable Long chatPartnerId) {
        try {
            messageService.markMessagesAsRead(userId, chatPartnerId);
            return ApiResponse.success("批量标记已读成功", "所有消息已标记为已读");
        } catch (Exception e) {
            return ApiResponse.error("批量标记已读失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取最近聊天列表", description = "获取用户的最近聊天记录")
    @GetMapping("/recent-chats")
    public ApiResponse<List<MessageVO>> getRecentChats(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId) {
        try {
            List<MessageVO> messages = messageService.getRecentChats(userId);
            return ApiResponse.success("获取最近聊天列表成功", messages);
        } catch (Exception e) {
            return ApiResponse.error("获取最近聊天列表失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "获取未读消息数量", description = "获取用户的未读消息总数")
    @GetMapping("/unread-count")
    public ApiResponse<Long> getUnreadMessageCount(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId) {
        try {
            long count = messageService.getUnreadMessageCount(userId);
            return ApiResponse.success("获取未读消息数量成功", count);
        } catch (Exception e) {
            return ApiResponse.error("获取未读消息数量失败: " + e.getMessage());
        }
    }
    
    @Operation(summary = "删除消息", description = "删除指定消息")
    @DeleteMapping("/{messageId}")
    public ApiResponse<String> deleteMessage(
            @Parameter(description = "当前用户ID", required = true)
            @RequestHeader("User-Id") Long userId,
            @Parameter(description = "消息ID", required = true)
            @PathVariable Long messageId) {
        try {
            messageService.deleteMessage(messageId, userId);
            return ApiResponse.success("删除消息成功", "消息已删除");
        } catch (Exception e) {
            return ApiResponse.error("删除消息失败: " + e.getMessage());
        }
    }
}