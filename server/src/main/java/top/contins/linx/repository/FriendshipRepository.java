package top.contins.linx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import top.contins.linx.model.entity.Friendship;
import top.contins.linx.model.enums.FriendshipStatus;

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
           "(f.requesterId = :userId1 AND f.addresseeId = :userId2) OR " +
           "(f.requesterId = :userId2 AND f.addresseeId = :userId1)")
    Optional<Friendship> findFriendshipBetweenUsers(@Param("userId1") Long userId1,
                                                   @Param("userId2") Long userId2);

    /**
     * 获取用户的所有好友（状态为ACCEPTED）
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.requesterId = :userId OR f.addresseeId = :userId) AND f.status = :status")
    List<Friendship> findFriendsByUserIdAndStatus(@Param("userId") Long userId,
                                                 @Param("status") FriendshipStatus status);

    /**
     * 获取用户收到的好友请求（状态为PENDING）
     */
    @Query("SELECT f FROM Friendship f WHERE f.addresseeId = :userId AND f.status = :status")
    List<Friendship> findReceivedRequestsByUserIdAndStatus(@Param("userId") Long userId,
                                                          @Param("status") FriendshipStatus status);

    /**
     * 获取用户发送的好友请求（状态为PENDING）
     */
    @Query("SELECT f FROM Friendship f WHERE f.requesterId = :userId AND f.status = :status")
    List<Friendship> findSentRequestsByUserIdAndStatus(@Param("userId") Long userId,
                                                      @Param("status") FriendshipStatus status);

    /**
     * 检查两个用户是否已经是好友
     */
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "((f.requesterId = :userId1 AND f.addresseeId = :userId2) OR " +
           "(f.requesterId = :userId2 AND f.addresseeId = :userId1)) AND " +
           "f.status = 'ACCEPTED'")
    boolean areFriends(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * 检查是否存在待处理的好友请求
     */
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "((f.requesterId = :userId1 AND f.addresseeId = :userId2) OR " +
           "(f.requesterId = :userId2 AND f.addresseeId = :userId1)) AND " +
           "f.status = 'PENDING'")
    boolean hasPendingRequest(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
