package top.contins.linx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.common.ChatMessage;
import top.contins.linx.model.entity.ChatMessageEntity;
import top.contins.linx.model.enums.MessageStatus;
import top.contins.linx.model.enums.MessageType;
import top.contins.linx.repository.ChatMessageRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 聊天消息服务
 */
@Slf4j
@Service
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;

    @Autowired
    public ChatMessageService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
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

        ChatMessageEntity saved = chatMessageRepository.save(entity);
        log.info("消息已保存到数据库: messageId={}, type={}", saved.getMessageId(), saved.getType());
        return saved;
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

        return chatMessageRepository.saveAll(entities);
    }

    /**
     * 查询私聊历史记录
     */
    public Page<ChatMessageEntity> getPrivateChatHistory(Long userId1, Long userId2, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatMessageRepository.findPrivateChatHistory(userId1, userId2, pageable);
    }

    /**
     * 查询群聊历史记录
     */
    public Page<ChatMessageEntity> getGroupChatHistory(String groupId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatMessageRepository.findGroupChatHistory(groupId, pageable);
    }

    /**
     * 查询指定时间之后的私聊消息
     */
    public List<ChatMessageEntity> getPrivateMessagesAfter(Long userId1, Long userId2, LocalDateTime afterTime) {
        return chatMessageRepository.findPrivateMessagesAfter(userId1, userId2, afterTime);
    }

    /**
     * 查询指定时间之后的群聊消息
     */
    public List<ChatMessageEntity> getGroupMessagesAfter(String groupId, LocalDateTime afterTime) {
        return chatMessageRepository.findGroupMessagesAfter(groupId, afterTime);
    }

    /**
     * 统计未读消息数量（私聊）
     */
    public long countUnreadPrivateMessages(Long userId, Long otherUserId) {
        return chatMessageRepository.countUnreadPrivateMessages(userId, otherUserId);
    }

    /**
     * 统计用户的所有未读消息数量
     */
    public long countAllUnreadMessages(Long userId) {
        return chatMessageRepository.countAllUnreadMessages(userId);
    }

    /**
     * 标记消息为已读
     */
    @Transactional
    public boolean markMessageAsRead(String messageId) {
        int updated = chatMessageRepository.markAsRead(messageId, LocalDateTime.now());
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
        int updated = chatMessageRepository.markPrivateMessagesAsRead(userId, otherUserId, LocalDateTime.now());
        log.info("批量标记消息为已读: userId={}, otherUserId={}, count={}", userId, otherUserId, updated);
        return updated;
    }

    /**
     * 软删除消息
     */
    @Transactional
    public boolean deleteMessage(String messageId) {
        int deleted = chatMessageRepository.softDeleteMessage(messageId, LocalDateTime.now());
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
        return chatMessageRepository.findByMessageId(messageId);
    }

    /**
     * 查询最近的聊天会话
     */
    public List<ChatMessageEntity> getRecentConversations(Long userId, int limit) {
        return chatMessageRepository.findRecentConversations(userId, limit);
    }

    /**
     * 搜索私聊消息
     */
    public Page<ChatMessageEntity> searchPrivateMessages(Long userId1, Long userId2, String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatMessageRepository.searchPrivateMessages(userId1, userId2, keyword, pageable);
    }

    /**
     * 根据消息类型查询私聊消息
     */
    public Page<ChatMessageEntity> getPrivateMessagesByType(Long userId1, Long userId2, MessageType type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatMessageRepository.findPrivateMessagesByType(userId1, userId2, type, pageable);
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

    /**
     * 撤回消息
     * 
     * @param messageId 消息ID
     * @param userId 操作用户ID（必须是发送者）
     * @return 是否撤回成功
     */
    @Transactional
    public boolean revokeMessage(String messageId, Long userId) {
        if (messageId == null || userId == null) {
            log.warn("撤回消息失败：参数为空");
            return false;
        }

        try {
            Optional<ChatMessageEntity> messageOpt = chatMessageRepository.findByMessageId(messageId);
            
            if (messageOpt.isEmpty()) {
                log.warn("撤回消息失败：消息不存在, messageId={}", messageId);
                return false;
            }

            ChatMessageEntity message = messageOpt.get();
            
            // 验证是否是消息发送者
            if (!message.getSenderId().equals(userId)) {
                log.warn("撤回消息失败：无权限, messageId={}, userId={}", messageId, userId);
                return false;
            }

            // 检查消息是否已被撤回
            if (message.getStatus() == MessageStatus.REVOKED) {
                log.warn("撤回消息失败：消息已被撤回, messageId={}", messageId);
                return false;
            }

            // 标记为已撤回
            message.setStatus(MessageStatus.REVOKED);
            message.setContent("[消息已撤回]");
            chatMessageRepository.save(message);
            
            log.info("消息已撤回: messageId={}, userId={}", messageId, userId);
            return true;
            
        } catch (Exception e) {
            log.error("撤回消息失败: messageId={}, userId={}", messageId, userId, e);
            return false;
        }
    }

    /**
     * 保存引用回复消息
     * 
     * @param message 消息对象
     * @param quotedMessageId 被引用的消息ID
     * @param maxDepth 最大引用深度（防止无限嵌套）
     * @return 保存的消息实体
     */
    @Transactional
    public ChatMessageEntity saveQuotedMessage(ChatMessage message, String quotedMessageId, int maxDepth) {
        if (message == null) {
            throw new IllegalArgumentException("消息对象不能为空");
        }

        if (quotedMessageId != null && !quotedMessageId.isEmpty()) {
            // 验证被引用的消息是否存在
            Optional<ChatMessageEntity> quotedOpt = chatMessageRepository.findByMessageId(quotedMessageId);
            
            if (quotedOpt.isEmpty()) {
                log.warn("被引用的消息不存在: quotedMessageId={}", quotedMessageId);
                // 继续保存，但不设置引用关系
            } else {
                // 检查引用深度
                int depth = calculateQuoteDepth(quotedMessageId);
                if (depth >= maxDepth) {
                    log.warn("引用深度超过限制: quotedMessageId={}, depth={}, maxDepth={}", 
                        quotedMessageId, depth, maxDepth);
                    // 超过深度限制，不设置引用关系
                    quotedMessageId = null;
                }
            }
        }

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
                .quotedMessageId(quotedMessageId)
                .build();

        ChatMessageEntity saved = chatMessageRepository.save(entity);
        log.info("引用回复消息已保存: messageId={}, quotedMessageId={}", 
            saved.getMessageId(), quotedMessageId);
        return saved;
    }

    /**
     * 计算引用深度（递归）
     * 
     * @param messageId 消息ID
     * @return 引用深度
     */
    private int calculateQuoteDepth(String messageId) {
        if (messageId == null || messageId.isEmpty()) {
            return 0;
        }

        Optional<ChatMessageEntity> messageOpt = chatMessageRepository.findByMessageId(messageId);
        
        if (messageOpt.isEmpty()) {
            return 0;
        }

        ChatMessageEntity message = messageOpt.get();
        String quotedId = message.getQuotedMessageId();
        
        if (quotedId == null || quotedId.isEmpty()) {
            return 0;
        }

        return 1 + calculateQuoteDepth(quotedId);
    }

    /**
     * 获取引用的消息详情
     * 
     * @param messageId 消息ID
     * @return 被引用的消息，如果不存在返回null
     */
    public ChatMessageEntity getQuotedMessage(String messageId) {
        if (messageId == null || messageId.isEmpty()) {
            return null;
        }

        Optional<ChatMessageEntity> messageOpt = chatMessageRepository.findByMessageId(messageId);
        
        if (messageOpt.isEmpty()) {
            return null;
        }

        ChatMessageEntity message = messageOpt.get();
        String quotedId = message.getQuotedMessageId();
        
        if (quotedId == null || quotedId.isEmpty()) {
            return null;
        }

        return chatMessageRepository.findByMessageId(quotedId).orElse(null);
    }
}
