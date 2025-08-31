package top.contins.linx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import top.contins.linx.model.entity.Friendship;
import top.contins.linx.model.entity.User;

import java.util.List;
import java.util.Optional;

/**
 * 好友关系数据访问层
 */
@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    
    /**
     * 查找两个用户之间的好友关系
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.fromUser = :user1 AND f.toUser = :user2) OR " +
           "(f.fromUser = :user2 AND f.toUser = :user1)")
    Optional<Friendship> findByUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    /**
     * 查找用户的所有好友关系（已接受的）
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.fromUser = :user OR f.toUser = :user) AND " +
           "f.status = 'ACCEPTED'")
    List<Friendship> findAcceptedFriendships(@Param("user") User user);
    
    /**
     * 查找用户发送的好友请求
     */
    @Query("SELECT f FROM Friendship f WHERE f.fromUser = :user AND f.status = :status")
    List<Friendship> findSentRequests(@Param("user") User user, @Param("status") Friendship.FriendshipStatus status);
    
    /**
     * 查找用户接收的好友请求
     */
    @Query("SELECT f FROM Friendship f WHERE f.toUser = :user AND f.status = :status")
    List<Friendship> findReceivedRequests(@Param("user") User user, @Param("status") Friendship.FriendshipStatus status);
    
    /**
     * 查找用户的待处理好友请求（作为接收方）
     */
    @Query("SELECT f FROM Friendship f WHERE f.toUser = :user AND f.status = 'PENDING'")
    List<Friendship> findPendingRequests(@Param("user") User user);
    
    /**
     * 检查两个用户是否为好友
     */
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "((f.fromUser = :user1 AND f.toUser = :user2) OR " +
           "(f.fromUser = :user2 AND f.toUser = :user1)) AND " +
           "f.status = 'ACCEPTED'")
    boolean areFriends(@Param("user1") User user1, @Param("user2") User user2);
    
    /**
     * 检查是否存在待处理的好友请求
     */
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "((f.fromUser = :user1 AND f.toUser = :user2) OR " +
           "(f.fromUser = :user2 AND f.toUser = :user1)) AND " +
           "f.status = 'PENDING'")
    boolean hasPendingRequest(@Param("user1") User user1, @Param("user2") User user2);
}