package top.contins.linx.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.common.ChatMessage;
import top.contins.linx.model.entity.ChatMessageEntity;
import top.contins.linx.model.enums.MessageType;
import top.contins.linx.repository.ChatMessageMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 聊天消息服务
 */
@Slf4j
@Service
public class ChatMessageService {

    private final ChatMessageMapper chatMessageMapper;

    @Autowired
    public ChatMessageService(ChatMessageMapper chatMessageMapper) {
        this.chatMessageMapper = chatMessageMapper;
    }

    /**
     * 保存聊天消息
     */
    @Transactional
    public ChatMessageEntity saveMessage(ChatMessage message) {
        ChatMessageEntity entity = ChatMessageEntity.builder()
                .messageId(message.getMessageId())
                .type(message.getType())
                .senderId(message.getSenderId())
                .senderName(message.getSenderName())
                .receiverId(message.getReceiverId())
                .groupId(message.getGroupId())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .extra(message.getExtra())
                .isRead(message.getIsRead() != null ? message.getIsRead() : false)
                .build();

        chatMessageMapper.insert(entity);
        log.info("消息已保存到数据库: messageId={}, type={}", entity.getMessageId(), entity.getType());
        return entity;
    }

    /**
     * 批量保存消息
     */
    @Transactional
    public List<ChatMessageEntity> saveMessages(List<ChatMessage> messages) {
        List<ChatMessageEntity> entities = messages.stream()
                .map(msg -> ChatMessageEntity.builder()
                        .messageId(msg.getMessageId())
                        .type(msg.getType())
                        .senderId(msg.getSenderId())
                        .senderName(msg.getSenderName())
                        .receiverId(msg.getReceiverId())
                        .groupId(msg.getGroupId())
                        .content(msg.getContent())
                        .timestamp(msg.getTimestamp())
                        .extra(msg.getExtra())
                        .isRead(msg.getIsRead() != null ? msg.getIsRead() : false)
                        .build())
                .toList();

        for (ChatMessageEntity entity : entities) {
            chatMessageMapper.insert(entity);
        }
        return entities;
    }

    /**
     * 查询私聊历史记录
     */
    public Page<ChatMessageEntity> getPrivateChatHistory(Long userId1, Long userId2, int page, int size) {
        Page<ChatMessageEntity> pageParam = new Page<>(page, size);
        return (Page<ChatMessageEntity>) chatMessageMapper.findPrivateChatHistory(pageParam, userId1, userId2);
    }

    /**
     * 查询群聊历史记录
     */
    public Page<ChatMessageEntity> getGroupChatHistory(String groupId, int page, int size) {
        Page<ChatMessageEntity> pageParam = new Page<>(page, size);
        return (Page<ChatMessageEntity>) chatMessageMapper.findGroupChatHistory(pageParam, groupId);
    }

    /**
     * 查询指定时间之后的私聊消息
     */
    public List<ChatMessageEntity> getPrivateMessagesAfter(Long userId1, Long userId2, LocalDateTime afterTime) {
        return chatMessageMapper.findPrivateMessagesAfter(userId1, userId2, afterTime);
    }

    /**
     * 查询指定时间之后的群聊消息
     */
    public List<ChatMessageEntity> getGroupMessagesAfter(String groupId, LocalDateTime afterTime) {
        return chatMessageMapper.findGroupMessagesAfter(groupId, afterTime);
    }

    /**
     * 统计未读消息数量（私聊）
     */
    public long countUnreadPrivateMessages(Long userId, Long otherUserId) {
        return chatMessageMapper.countUnreadPrivateMessages(userId, otherUserId);
    }

    /**
     * 统计用户的所有未读消息数量
     */
    public long countAllUnreadMessages(Long userId) {
        return chatMessageMapper.countAllUnreadMessages(userId);
    }

    /**
     * 标记消息为已读
     */
    @Transactional
    public boolean markMessageAsRead(String messageId) {
        int updated = chatMessageMapper.markAsRead(messageId, LocalDateTime.now());
        if (updated > 0) {
            log.info("消息已标记为已读: messageId={}", messageId);
            return true;
        }
        return false;
    }

    /**
     * 批量标记私聊消息为已读
     */
    @Transactional
    public int markPrivateMessagesAsRead(Long userId, Long otherUserId) {
        int updated = chatMessageMapper.markPrivateMessagesAsRead(userId, otherUserId, LocalDateTime.now());
        log.info("批量标记消息为已读: userId={}, otherUserId={}, count={}", userId, otherUserId, updated);
        return updated;
    }

    /**
     * 软删除消息
     */
    @Transactional
    public boolean deleteMessage(String messageId) {
        int deleted = chatMessageMapper.softDeleteMessage(messageId, LocalDateTime.now());
        if (deleted > 0) {
            log.info("消息已删除: messageId={}", messageId);
            return true;
        }
        return false;
    }

    /**
     * 根据消息ID查找消息
     */
    public Optional<ChatMessageEntity> findByMessageId(String messageId) {
        return Optional.ofNullable(chatMessageMapper.findByMessageId(messageId));
    }

    /**
     * 查询最近的聊天会话
     */
    public List<ChatMessageEntity> getRecentConversations(Long userId, int limit) {
        return chatMessageMapper.findRecentConversations(userId, limit);
    }

    /**
     * 搜索私聊消息
     */
    public Page<ChatMessageEntity> searchPrivateMessages(Long userId1, Long userId2, String keyword, int page, int size) {
        Page<ChatMessageEntity> pageParam = new Page<>(page, size);
        return (Page<ChatMessageEntity>) chatMessageMapper.searchPrivateMessages(pageParam, userId1, userId2, keyword);
    }

    /**
     * 根据消息类型查询私聊消息
     */
    public Page<ChatMessageEntity> getPrivateMessagesByType(Long userId1, Long userId2, MessageType type, int page, int size) {
        Page<ChatMessageEntity> pageParam = new Page<>(page, size);
        return (Page<ChatMessageEntity>) chatMessageMapper.findPrivateMessagesByType(pageParam, userId1, userId2, type);
    }

    /**
     * 将实体转换为传输对象
     */
    public ChatMessage entityToMessage(ChatMessageEntity entity) {
        ChatMessage message = new ChatMessage();
        message.setMessageId(entity.getMessageId());
        message.setType(entity.getType());
        message.setSenderId(entity.getSenderId());
        message.setSenderName(entity.getSenderName());
        message.setReceiverId(entity.getReceiverId());
        message.setGroupId(entity.getGroupId());
        message.setContent(entity.getContent());
        message.setTimestamp(entity.getTimestamp());
        message.setExtra(entity.getExtra());
        message.setIsRead(entity.getIsRead());
        return message;
    }
}
