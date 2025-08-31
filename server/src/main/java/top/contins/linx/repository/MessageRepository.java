package top.contins.linx.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import top.contins.linx.model.entity.Group;
import top.contins.linx.model.entity.Message;
import top.contins.linx.model.entity.User;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 消息数据访问层
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    /**
     * 查找两个用户之间的私聊消息
     */
    @Query("SELECT m FROM Message m WHERE " +
           "m.chatType = 'PRIVATE' AND " +
           "((m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1)) " +
           "ORDER BY m.sendTime DESC")
    List<Message> findPrivateMessages(@Param("user1") User user1, @Param("user2") User user2, Pageable pageable);
    
    /**
     * 查找群组消息
     */
    @Query("SELECT m FROM Message m WHERE " +
           "m.chatType = 'GROUP' AND m.group = :group " +
           "ORDER BY m.sendTime DESC")
    List<Message> findGroupMessages(@Param("group") Group group, Pageable pageable);
    
    /**
     * 查找用户发送的消息
     */
    List<Message> findBySenderOrderBySendTimeDesc(User sender, Pageable pageable);
    
    /**
     * 查找用户接收的未读私聊消息
     */
    @Query("SELECT m FROM Message m WHERE " +
           "m.chatType = 'PRIVATE' AND m.receiver = :user AND m.isRead = false " +
           "ORDER BY m.sendTime DESC")
    List<Message> findUnreadPrivateMessages(@Param("user") User user);
    
    /**
     * 查找特定时间段的消息
     */
    @Query("SELECT m FROM Message m WHERE " +
           "m.sendTime BETWEEN :startTime AND :endTime " +
           "ORDER BY m.sendTime DESC")
    List<Message> findMessagesBetween(@Param("startTime") LocalDateTime startTime, 
                                     @Param("endTime") LocalDateTime endTime);
    
    /**
     * 查找群组中特定时间之后的消息
     */
    @Query("SELECT m FROM Message m WHERE " +
           "m.chatType = 'GROUP' AND m.group = :group AND m.sendTime > :afterTime " +
           "ORDER BY m.sendTime ASC")
    List<Message> findGroupMessagesAfter(@Param("group") Group group, @Param("afterTime") LocalDateTime afterTime);
    
    /**
     * 查找私聊中特定时间之后的消息
     */
    @Query("SELECT m FROM Message m WHERE " +
           "m.chatType = 'PRIVATE' AND " +
           "((m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1)) AND " +
           "m.sendTime > :afterTime " +
           "ORDER BY m.sendTime ASC")
    List<Message> findPrivateMessagesAfter(@Param("user1") User user1, @Param("user2") User user2, 
                                          @Param("afterTime") LocalDateTime afterTime);
    
    /**
     * 统计用户的未读消息数量
     */
    @Query("SELECT COUNT(m) FROM Message m WHERE " +
           "m.chatType = 'PRIVATE' AND m.receiver = :user AND m.isRead = false")
    long countUnreadMessages(@Param("user") User user);
    
    /**
     * 查找最近的聊天记录（按对话分组）
     */
    @Query("SELECT m FROM Message m WHERE " +
           "m.id IN (" +
           "    SELECT MAX(m2.id) FROM Message m2 WHERE " +
           "    m2.chatType = 'PRIVATE' AND " +
           "    (m2.sender = :user OR m2.receiver = :user) " +
           "    GROUP BY CASE " +
           "        WHEN m2.sender = :user THEN m2.receiver " +
           "        ELSE m2.sender " +
           "    END" +
           ") " +
           "ORDER BY m.sendTime DESC")
    List<Message> findRecentChats(@Param("user") User user);
}