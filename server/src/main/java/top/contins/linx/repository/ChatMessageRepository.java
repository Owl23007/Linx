package top.contins.linx.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import top.contins.linx.model.entity.ChatMessageEntity;
import top.contins.linx.model.enums.MessageType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 聊天消息数据访问层
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {

    /**
     * 根据消息ID查找消息
     */
    Optional<ChatMessageEntity> findByMessageId(String messageId);

    /**
     * 查询两个用户之间的私聊历史记录（分页）
     */
    @Query("SELECT m FROM ChatMessageEntity m WHERE " +
           "m.isDeleted = false AND " +
           "((m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1)) " +
           "ORDER BY m.timestamp DESC")
    Page<ChatMessageEntity> findPrivateChatHistory(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2,
            Pageable pageable);

    /**
     * 查询群组聊天历史记录（分页）
     */
    @Query("SELECT m FROM ChatMessageEntity m WHERE " +
           "m.isDeleted = false AND " +
           "m.groupId = :groupId " +
           "ORDER BY m.timestamp DESC")
    Page<ChatMessageEntity> findGroupChatHistory(
            @Param("groupId") String groupId,
            Pageable pageable);

    /**
     * 查询指定时间之后的私聊消息
     */
    @Query("SELECT m FROM ChatMessageEntity m WHERE " +
           "m.isDeleted = false AND " +
           "((m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1)) AND " +
           "m.timestamp > :afterTime " +
           "ORDER BY m.timestamp ASC")
    List<ChatMessageEntity> findPrivateMessagesAfter(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2,
            @Param("afterTime") LocalDateTime afterTime);

    /**
     * 查询指定时间之后的群聊消息
     */
    @Query("SELECT m FROM ChatMessageEntity m WHERE " +
           "m.isDeleted = false AND " +
           "m.groupId = :groupId AND " +
           "m.timestamp > :afterTime " +
           "ORDER BY m.timestamp ASC")
    List<ChatMessageEntity> findGroupMessagesAfter(
            @Param("groupId") String groupId,
            @Param("afterTime") LocalDateTime afterTime);

    /**
     * 统计未读消息数量（私聊）
     */
    @Query("SELECT COUNT(m) FROM ChatMessageEntity m WHERE " +
           "m.isDeleted = false AND " +
           "m.receiverId = :userId AND " +
           "m.senderId = :otherUserId AND " +
           "m.isRead = false")
    long countUnreadPrivateMessages(
            @Param("userId") Long userId,
            @Param("otherUserId") Long otherUserId);

    /**
     * 统计用户的所有未读消息数量
     */
    @Query("SELECT COUNT(m) FROM ChatMessageEntity m WHERE " +
           "m.isDeleted = false AND " +
           "m.receiverId = :userId AND " +
           "m.isRead = false")
    long countAllUnreadMessages(@Param("userId") Long userId);

    /**
     * 标记消息为已读
     */
    @Modifying
    @Query("UPDATE ChatMessageEntity m SET m.isRead = true, m.readAt = :readAt, m.updatedAt = :readAt " +
           "WHERE m.messageId = :messageId")
    int markAsRead(@Param("messageId") String messageId, @Param("readAt") LocalDateTime readAt);

    /**
     * 批量标记消息为已读（私聊）
     */
    @Modifying
    @Query("UPDATE ChatMessageEntity m SET m.isRead = true, m.readAt = :readAt, m.updatedAt = :readAt " +
           "WHERE m.receiverId = :userId AND m.senderId = :otherUserId AND m.isRead = false")
    int markPrivateMessagesAsRead(
            @Param("userId") Long userId,
            @Param("otherUserId") Long otherUserId,
            @Param("readAt") LocalDateTime readAt);

    /**
     * 软删除消息
     */
    @Modifying
    @Query("UPDATE ChatMessageEntity m SET m.isDeleted = true, m.updatedAt = :deleteTime " +
           "WHERE m.messageId = :messageId")
    int softDeleteMessage(@Param("messageId") String messageId, @Param("deleteTime") LocalDateTime deleteTime);

    /**
     * 查询用户最近的聊天会话（获取每个会话的最后一条消息）
     */
    @Query(value = "SELECT m.* FROM chat_messages m " +
           "INNER JOIN (" +
           "  SELECT " +
           "    CASE " +
           "      WHEN sender_id = :userId THEN receiver_id " +
           "      ELSE sender_id " +
           "    END AS other_user_id, " +
           "    MAX(timestamp) AS last_time " +
           "  FROM chat_messages " +
           "  WHERE is_deleted = false " +
           "    AND group_id IS NULL " +
           "    AND (sender_id = :userId OR receiver_id = :userId) " +
           "  GROUP BY other_user_id" +
           ") latest ON (" +
           "  (m.sender_id = :userId AND m.receiver_id = latest.other_user_id) OR " +
           "  (m.receiver_id = :userId AND m.sender_id = latest.other_user_id)" +
           ") AND m.timestamp = latest.last_time " +
           "WHERE m.is_deleted = false " +
           "ORDER BY m.timestamp DESC " +
           "LIMIT :limit",
           nativeQuery = true)
    List<ChatMessageEntity> findRecentConversations(@Param("userId") Long userId, @Param("limit") int limit);

    /**
     * 搜索消息内容
     */
    @Query("SELECT m FROM ChatMessageEntity m WHERE " +
           "m.isDeleted = false AND " +
           "((m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1)) AND " +
           "m.content LIKE %:keyword% " +
           "ORDER BY m.timestamp DESC")
    Page<ChatMessageEntity> searchPrivateMessages(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * 根据消息类型查询
     */
    @Query("SELECT m FROM ChatMessageEntity m WHERE " +
           "m.isDeleted = false AND " +
           "((m.senderId = :userId1 AND m.receiverId = :userId2) OR " +
           "(m.senderId = :userId2 AND m.receiverId = :userId1)) AND " +
           "m.type = :type " +
           "ORDER BY m.timestamp DESC")
    Page<ChatMessageEntity> findPrivateMessagesByType(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2,
            @Param("type") MessageType type,
            Pageable pageable);
}
