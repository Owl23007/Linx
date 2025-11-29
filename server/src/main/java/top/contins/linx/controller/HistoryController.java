package top.contins.linx.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import top.contins.linx.model.common.ChatMessage;
import top.contins.linx.model.common.Result;
import top.contins.linx.model.common.UserSession;
import top.contins.linx.model.entity.ChatMessageEntity;
import top.contins.linx.model.enums.MessageType;
import top.contins.linx.service.ChatMessageService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 聊天历史记录控制器
 */
@Slf4j
@RestController
@RequestMapping("/chat/history")
@Tag(name = "聊天历史记录", description = "聊天历史记录管理接口")
public class HistoryController {

    private final ChatMessageService chatMessageService;
    private final ApplicationContext applicationContext;

    @Autowired
    public HistoryController(ChatMessageService chatMessageService, ApplicationContext applicationContext) {
        this.chatMessageService = chatMessageService;
        this.applicationContext = applicationContext;
    }

    /**
     * 获取私聊历史记录
     */
    @Operation(summary = "获取私聊历史记录", description = "分页获取两个用户之间的私聊历史记录")
    @GetMapping("/private/{otherUserId}")
    public Result<Map<String, Object>> getPrivateChatHistory(
            @Parameter(description = "对方用户ID") @PathVariable Long otherUserId,
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "20") int size) {

        try {
            UserSession userSession = applicationContext.getBean(UserSession.class);
            Long currentUserId = userSession.getUserLongId();

            if (currentUserId == null) {
                return Result.error("用户未登录");
            }

            // MyBatis-Plus Page is 1-based
            Page<ChatMessageEntity> messagePage = chatMessageService.getPrivateChatHistory(
                    currentUserId, otherUserId, page + 1, size);

            List<ChatMessage> messages = messagePage.getRecords().stream()
                    .map(chatMessageService::entityToMessage)
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("messages", messages);
            result.put("currentPage", messagePage.getCurrent() - 1);
            result.put("totalPages", messagePage.getPages());
            result.put("totalElements", messagePage.getTotal());
            result.put("hasNext", messagePage.getCurrent() < messagePage.getPages());
            result.put("hasPrevious", messagePage.getCurrent() > 1);

            return Result.success("获取私聊历史记录成功", result);

        } catch (Exception e) {
            log.error("获取私聊历史记录失败", e);
            return Result.error("获取私聊历史记录失败: " + e.getMessage());
        }
    }

    /**
     * 获取群聊历史记录
     */
    @Operation(summary = "获取群聊历史记录", description = "分页获取群组的聊天历史记录")
    @GetMapping("/group/{groupId}")
    public Result<Map<String, Object>> getGroupChatHistory(
            @Parameter(description = "群组ID") @PathVariable String groupId,
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "20") int size) {

        try {
            UserSession userSession = applicationContext.getBean(UserSession.class);
            if (userSession.getUserLongId() == null) {
                return Result.error("用户未登录");
            }

            // TODO: 验证用户是否是群组成员

            // MyBatis-Plus Page is 1-based
            Page<ChatMessageEntity> messagePage = chatMessageService.getGroupChatHistory(groupId, page + 1, size);

            List<ChatMessage> messages = messagePage.getRecords().stream()
                    .map(chatMessageService::entityToMessage)
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("messages", messages);
            result.put("currentPage", messagePage.getCurrent() - 1);
            result.put("totalPages", messagePage.getPages());
            result.put("totalElements", messagePage.getTotal());
            result.put("hasNext", messagePage.getCurrent() < messagePage.getPages());
            result.put("hasPrevious", messagePage.getCurrent() > 1);

            return Result.success("获取群聊历史记录成功", result);

        } catch (Exception e) {
            log.error("获取群聊历史记录失败", e);
            return Result.error("获取群聊历史记录失败: " + e.getMessage());
        }
    }

    /**
     * 获取指定时间之后的私聊消息（用于增量同步）
     */
    @Operation(summary = "获取指定时间之后的私聊消息", description = "用于增量同步，获取某个时间点之后的所有消息")
    @GetMapping("/private/{otherUserId}/after")
    public Result<List<ChatMessage>> getPrivateMessagesAfter(
            @Parameter(description = "对方用户ID") @PathVariable Long otherUserId,
            @Parameter(description = "起始时间")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime afterTime) {

        try {
            UserSession userSession = applicationContext.getBean(UserSession.class);
            Long currentUserId = userSession.getUserLongId();

            if (currentUserId == null) {
                return Result.error("用户未登录");
            }

            List<ChatMessageEntity> entities = chatMessageService.getPrivateMessagesAfter(
                    currentUserId, otherUserId, afterTime);

            List<ChatMessage> messages = entities.stream()
                    .map(chatMessageService::entityToMessage)
                    .collect(Collectors.toList());

            return Result.success("获取增量消息成功", messages);

        } catch (Exception e) {
            log.error("获取增量消息失败", e);
            return Result.error("获取增量消息失败: " + e.getMessage());
        }
    }

    /**
     * 获取指定时间之后的群聊消息
     */
    @Operation(summary = "获取指定时间之后的群聊消息", description = "用于增量同步，获取某个时间点之后的所有群聊消息")
    @GetMapping("/group/{groupId}/after")
    public Result<List<ChatMessage>> getGroupMessagesAfter(
            @Parameter(description = "群组ID") @PathVariable String groupId,
            @Parameter(description = "起始时间")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime afterTime) {

        try {
            UserSession userSession = applicationContext.getBean(UserSession.class);
            if (userSession.getUserLongId() == null) {
                return Result.error("用户未登录");
            }

            List<ChatMessageEntity> entities = chatMessageService.getGroupMessagesAfter(groupId, afterTime);

            List<ChatMessage> messages = entities.stream()
                    .map(chatMessageService::entityToMessage)
                    .collect(Collectors.toList());

            return Result.success("获取增量群聊消息成功", messages);

        } catch (Exception e) {
            log.error("获取增量群聊消息失败", e);
            return Result.error("获取增量群聊消息失败: " + e.getMessage());
        }
    }

    /**
     * 获取未读消息数量
     */
    @Operation(summary = "获取未读消息数量", description = "获取与指定用户的未读私聊消息数量")
    @GetMapping("/unread/{otherUserId}")
    public Result<Map<String, Object>> getUnreadCount(
            @Parameter(description = "对方用户ID") @PathVariable Long otherUserId) {

        try {
            UserSession userSession = applicationContext.getBean(UserSession.class);
            Long currentUserId = userSession.getUserLongId();

            if (currentUserId == null) {
                return Result.error("用户未登录");
            }

            long unreadCount = chatMessageService.countUnreadPrivateMessages(currentUserId, otherUserId);

            Map<String, Object> result = new HashMap<>();
            result.put("otherUserId", otherUserId);
            result.put("unreadCount", unreadCount);

            return Result.success("获取未读消息数量成功", result);

        } catch (Exception e) {
            log.error("获取未读消息数量失败", e);
            return Result.error("获取未读消息数量失败: " + e.getMessage());
        }
    }

    /**
     * 获取所有未读消息数量
     */
    @Operation(summary = "获取所有未读消息数量", description = "获取当前用户的所有未读消息总数")
    @GetMapping("/unread/total")
    public Result<Map<String, Object>> getTotalUnreadCount() {
        try {
            UserSession userSession = applicationContext.getBean(UserSession.class);
            Long currentUserId = userSession.getUserLongId();

            if (currentUserId == null) {
                return Result.error("用户未登录");
            }

            long totalUnreadCount = chatMessageService.countAllUnreadMessages(currentUserId);

            Map<String, Object> result = new HashMap<>();
            result.put("totalUnreadCount", totalUnreadCount);

            return Result.success("获取所有未读消息数量成功", result);

        } catch (Exception e) {
            log.error("获取所有未读消息数量失败", e);
            return Result.error("获取所有未读消息数量失败: " + e.getMessage());
        }
    }

    /**
     * 标记消息为已读
     */
    @Operation(summary = "标记消息为已读", description = "标记单条消息为已读状态")
    @PutMapping("/read/{messageId}")
    public Result<String> markMessageAsRead(
            @Parameter(description = "消息ID") @PathVariable String messageId) {

        try {
            boolean success = chatMessageService.markMessageAsRead(messageId);
            if (success) {
                return Result.success("消息已标记为已读", messageId);
            } else {
                return Result.error("消息不存在或已被删除");
            }

        } catch (Exception e) {
            log.error("标记消息为已读失败", e);
            return Result.error("标记消息为已读失败: " + e.getMessage());
        }
    }

    /**
     * 批量标记私聊消息为已读
     */
    @Operation(summary = "批量标记私聊消息为已读", description = "将与指定用户的所有未读消息标记为已读")
    @PutMapping("/read/batch/{otherUserId}")
    public Result<Map<String, Object>> markPrivateMessagesAsRead(
            @Parameter(description = "对方用户ID") @PathVariable Long otherUserId) {

        try {
            UserSession userSession = applicationContext.getBean(UserSession.class);
            Long currentUserId = userSession.getUserLongId();

            if (currentUserId == null) {
                return Result.error("用户未登录");
            }

            int updatedCount = chatMessageService.markPrivateMessagesAsRead(currentUserId, otherUserId);

            Map<String, Object> result = new HashMap<>();
            result.put("otherUserId", otherUserId);
            result.put("updatedCount", updatedCount);

            return Result.success("批量标记消息为已读成功", result);

        } catch (Exception e) {
            log.error("批量标记消息为已读失败", e);
            return Result.error("批量标记消息为已读失败: " + e.getMessage());
        }
    }

    /**
     * 删除消息
     */
    @Operation(summary = "删除消息", description = "软删除指定消息")
    @DeleteMapping("/{messageId}")
    public Result<String> deleteMessage(
            @Parameter(description = "消息ID") @PathVariable String messageId) {

        try {
            boolean success = chatMessageService.deleteMessage(messageId);
            if (success) {
                return Result.success("消息已删除", messageId);
            } else {
                return Result.error("消息不存在或已被删除");
            }

        } catch (Exception e) {
            log.error("删除消息失败", e);
            return Result.error("删除消息失败: " + e.getMessage());
        }
    }

    /**
     * 获取最近的聊天会话
     */
    @Operation(summary = "获取最近的聊天会话", description = "获取用户最近的聊天会话列表（每个会话显示最后一条消息）")
    @GetMapping("/conversations")
    public Result<List<ChatMessage>> getRecentConversations(
            @Parameter(description = "返回的会话数量") @RequestParam(defaultValue = "20") int limit) {

        try {
            UserSession userSession = applicationContext.getBean(UserSession.class);
            Long currentUserId = userSession.getUserLongId();

            if (currentUserId == null) {
                return Result.error("用户未登录");
            }

            List<ChatMessageEntity> entities = chatMessageService.getRecentConversations(currentUserId, limit);

            List<ChatMessage> messages = entities.stream()
                    .map(chatMessageService::entityToMessage)
                    .collect(Collectors.toList());

            return Result.success("获取最近会话成功", messages);

        } catch (Exception e) {
            log.error("获取最近会话失败", e);
            return Result.error("获取最近会话失败: " + e.getMessage());
        }
    }

    /**
     * 搜索私聊消息
     */
    @Operation(summary = "搜索私聊消息", description = "在私聊历史中搜索包含关键词的消息")
    @GetMapping("/search/private/{otherUserId}")
    public Result<Map<String, Object>> searchPrivateMessages(
            @Parameter(description = "对方用户ID") @PathVariable Long otherUserId,
            @Parameter(description = "搜索关键词") @RequestParam String keyword,
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "20") int size) {

        try {
            UserSession userSession = applicationContext.getBean(UserSession.class);
            Long currentUserId = userSession.getUserLongId();

            if (currentUserId == null) {
                return Result.error("用户未登录");
            }

            // MyBatis-Plus Page is 1-based
            Page<ChatMessageEntity> messagePage = chatMessageService.searchPrivateMessages(
                    currentUserId, otherUserId, keyword, page + 1, size);

            List<ChatMessage> messages = messagePage.getRecords().stream()
                    .map(chatMessageService::entityToMessage)
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("messages", messages);
            result.put("keyword", keyword);
            result.put("currentPage", messagePage.getCurrent() - 1);
            result.put("totalPages", messagePage.getPages());
            result.put("totalElements", messagePage.getTotal());

            return Result.success("搜索消息成功", result);

        } catch (Exception e) {
            log.error("搜索消息失败", e);
            return Result.error("搜索消息失败: " + e.getMessage());
        }
    }

    /**
     * 根据消息类型查询
     */
    @Operation(summary = "根据消息类型查询", description = "获取指定类型的私聊消息（如图片、文件等）")
    @GetMapping("/type/private/{otherUserId}")
    public Result<Map<String, Object>> getPrivateMessagesByType(
            @Parameter(description = "对方用户ID") @PathVariable Long otherUserId,
            @Parameter(description = "消息类型") @RequestParam MessageType type,
            @Parameter(description = "页码，从0开始") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "20") int size) {

        try {
            UserSession userSession = applicationContext.getBean(UserSession.class);
            Long currentUserId = userSession.getUserLongId();

            if (currentUserId == null) {
                return Result.error("用户未登录");
            }

            // MyBatis-Plus Page is 1-based
            Page<ChatMessageEntity> messagePage = chatMessageService.getPrivateMessagesByType(
                    currentUserId, otherUserId, type, page + 1, size);

            List<ChatMessage> messages = messagePage.getRecords().stream()
                    .map(chatMessageService::entityToMessage)
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("messages", messages);
            result.put("type", type);
            result.put("currentPage", messagePage.getCurrent() - 1);
            result.put("totalPages", messagePage.getPages());
            result.put("totalElements", messagePage.getTotal());

            return Result.success("获取指定类型消息成功", result);

        } catch (Exception e) {
            log.error("获取指定类型消息失败", e);
            return Result.error("获取指定类型消息失败: " + e.getMessage());
        }
    }
}
