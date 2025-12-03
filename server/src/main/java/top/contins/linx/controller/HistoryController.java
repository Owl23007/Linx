package top.contins.linx.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;

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
    @GetMapping("/private/{otherUserId}")
    public Result<Map<String, Object>> getPrivateChatHistory(
            @PathVariable Long otherUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

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
    
    @GetMapping("/group/{groupId}")
    public Result<Map<String, Object>> getGroupChatHistory(
            @PathVariable String groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

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
    
    @GetMapping("/private/{otherUserId}/after")
    public Result<List<ChatMessage>> getPrivateMessagesAfter(
            @PathVariable Long otherUserId,
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
    
    @GetMapping("/group/{groupId}/after")
    public Result<List<ChatMessage>> getGroupMessagesAfter(
            @PathVariable String groupId,
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
    
    @GetMapping("/unread/{otherUserId}")
    public Result<Map<String, Object>> getUnreadCount(
            @PathVariable Long otherUserId) {

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
    
    @PutMapping("/read/{messageId}")
    public Result<String> markMessageAsRead(
            @PathVariable String messageId) {

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
    
    @PutMapping("/read/batch/{otherUserId}")
    public Result<Map<String, Object>> markPrivateMessagesAsRead(
            @PathVariable Long otherUserId) {

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
    
    @DeleteMapping("/{messageId}")
    public Result<String> deleteMessage(
            @PathVariable String messageId) {

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
    
    @GetMapping("/conversations")
    public Result<List<ChatMessage>> getRecentConversations(
            @RequestParam(defaultValue = "20") int limit) {

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
    
    @GetMapping("/search/private/{otherUserId}")
    public Result<Map<String, Object>> searchPrivateMessages(
            @PathVariable Long otherUserId,
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

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
    
    @GetMapping("/type/private/{otherUserId}")
    public Result<Map<String, Object>> getPrivateMessagesByType(
            @PathVariable Long otherUserId,
            @RequestParam MessageType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

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
