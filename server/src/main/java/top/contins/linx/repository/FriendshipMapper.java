package top.contins.linx.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import top.contins.linx.model.entity.Friendship;
import top.contins.linx.model.enums.FriendshipStatus;

import java.util.List;

@Mapper
public interface FriendshipMapper extends BaseMapper<Friendship> {

    @Select("SELECT * FROM friendships WHERE " +
            "(requester_id = #{userId1} AND addressee_id = #{userId2}) OR " +
            "(requester_id = #{userId2} AND addressee_id = #{userId1})")
    Friendship findFriendshipBetweenUsers(@Param("userId1") Long userId1,
                                          @Param("userId2") Long userId2);

    @Select("SELECT * FROM friendships WHERE " +
            "(requester_id = #{userId} OR addressee_id = #{userId}) AND status = #{status}")
    List<Friendship> findFriendsByUserIdAndStatus(@Param("userId") Long userId,
                                                  @Param("status") FriendshipStatus status);

    @Select("SELECT * FROM friendships WHERE addressee_id = #{userId} AND status = #{status}")
    List<Friendship> findReceivedRequestsByUserIdAndStatus(@Param("userId") Long userId,
                                                           @Param("status") FriendshipStatus status);

    @Select("SELECT * FROM friendships WHERE requester_id = #{userId} AND status = #{status}")
    List<Friendship> findSentRequestsByUserIdAndStatus(@Param("userId") Long userId,
                                                       @Param("status") FriendshipStatus status);

    @Select("SELECT COUNT(*) > 0 FROM friendships WHERE " +
            "((requester_id = #{userId1} AND addressee_id = #{userId2}) OR " +
            "(requester_id = #{userId2} AND addressee_id = #{userId1})) AND " +
            "status = 'ACCEPTED'")
    boolean areFriends(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Select("SELECT COUNT(*) > 0 FROM friendships WHERE " +
            "((requester_id = #{userId1} AND addressee_id = #{userId2}) OR " +
            "(requester_id = #{userId2} AND addressee_id = #{userId1})) AND " +
            "status = 'PENDING'")
    boolean hasPendingRequest(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
