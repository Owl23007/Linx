package top.contins.linx.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import top.contins.linx.model.entity.ChatMessageEntity;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ChatMessageMapper extends BaseMapper<ChatMessageEntity> {

    @Select("SELECT * FROM chat_messages WHERE message_id = #{messageId}")
    ChatMessageEntity findByMessageId(@Param("messageId") String messageId);

    @Select("SELECT * FROM chat_messages WHERE is_deleted = false AND " +
            "((sender_id = #{userId1} AND receiver_id = #{userId2}) OR " +
            "(sender_id = #{userId2} AND receiver_id = #{userId1})) " +
            "ORDER BY timestamp DESC")
    IPage<ChatMessageEntity> findPrivateChatHistory(Page<ChatMessageEntity> page,
                                                    @Param("userId1") Long userId1,
                                                    @Param("userId2") Long userId2);

    @Select("SELECT * FROM chat_messages WHERE is_deleted = false AND " +
            "group_id = #{groupId} " +
            "ORDER BY timestamp DESC")
    IPage<ChatMessageEntity> findGroupChatHistory(Page<ChatMessageEntity> page,
                                                  @Param("groupId") String groupId);

    @Select("SELECT * FROM chat_messages WHERE is_deleted = false AND " +
            "((sender_id = #{userId1} AND receiver_id = #{userId2}) OR " +
            "(sender_id = #{userId2} AND receiver_id = #{userId1})) AND " +
            "timestamp > #{afterTime} " +
            "ORDER BY timestamp ASC")
    List<ChatMessageEntity> findPrivateMessagesAfter(@Param("userId1") Long userId1,
                                                     @Param("userId2") Long userId2,
                                                     @Param("afterTime") LocalDateTime afterTime);

    @Select("SELECT * FROM chat_messages WHERE is_deleted = false AND " +
            "group_id = #{groupId} AND " +
            "timestamp > #{afterTime} " +
            "ORDER BY timestamp ASC")
    List<ChatMessageEntity> findGroupMessagesAfter(@Param("groupId") String groupId,
                                                   @Param("afterTime") LocalDateTime afterTime);

    @Select("SELECT COUNT(*) FROM chat_messages WHERE is_deleted = false AND " +
            "receiver_id = #{userId} AND sender_id = #{otherUserId} AND is_read = false")
    long countUnreadPrivateMessages(@Param("userId") Long userId,
                                    @Param("otherUserId") Long otherUserId);

    @Select("SELECT COUNT(*) FROM chat_messages WHERE is_deleted = false AND " +
            "receiver_id = #{userId} AND is_read = false")
    long countAllUnreadMessages(@Param("userId") Long userId);

    @org.apache.ibatis.annotations.Update("UPDATE chat_messages SET is_read = true, read_at = #{readAt} WHERE message_id = #{messageId}")
    int markAsRead(@Param("messageId") String messageId, @Param("readAt") LocalDateTime readAt);

    @org.apache.ibatis.annotations.Update("UPDATE chat_messages SET is_read = true, read_at = #{readAt} WHERE receiver_id = #{userId} AND sender_id = #{otherUserId} AND is_read = false")
    int markPrivateMessagesAsRead(@Param("userId") Long userId, @Param("otherUserId") Long otherUserId, @Param("readAt") LocalDateTime readAt);

    @org.apache.ibatis.annotations.Update("UPDATE chat_messages SET is_deleted = true WHERE message_id = #{messageId}")
    int softDeleteMessage(@Param("messageId") String messageId, @Param("deletedAt") LocalDateTime deletedAt);

    @Select("SELECT * FROM chat_messages WHERE id IN (" +
            "SELECT MAX(id) FROM chat_messages WHERE is_deleted = false AND (sender_id = #{userId} OR receiver_id = #{userId}) " +
            "GROUP BY CASE WHEN sender_id = #{userId} THEN receiver_id ELSE sender_id END" +
            ") ORDER BY timestamp DESC LIMIT #{limit}")
    List<ChatMessageEntity> findRecentConversations(@Param("userId") Long userId, @Param("limit") int limit);

    @Select("SELECT * FROM chat_messages WHERE is_deleted = false AND " +
            "((sender_id = #{userId1} AND receiver_id = #{userId2}) OR " +
            "(sender_id = #{userId2} AND receiver_id = #{userId1})) AND " +
            "content LIKE CONCAT('%', #{keyword}, '%') " +
            "ORDER BY timestamp DESC")
    IPage<ChatMessageEntity> searchPrivateMessages(Page<ChatMessageEntity> page,
                                                   @Param("userId1") Long userId1,
                                                   @Param("userId2") Long userId2,
                                                   @Param("keyword") String keyword);

    @Select("SELECT * FROM chat_messages WHERE is_deleted = false AND " +
            "((sender_id = #{userId1} AND receiver_id = #{userId2}) OR " +
            "(sender_id = #{userId2} AND receiver_id = #{userId1})) AND " +
            "type = #{type} " +
            "ORDER BY timestamp DESC")
    IPage<ChatMessageEntity> findPrivateMessagesByType(Page<ChatMessageEntity> page,
                                                       @Param("userId1") Long userId1,
                                                       @Param("userId2") Long userId2,
                                                       @Param("type") top.contins.linx.model.enums.MessageType type);
}
