package top.contins.linx.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import top.contins.linx.model.entity.RoomMember;

import java.util.List;

@Mapper
public interface RoomMemberMapper extends BaseMapper<RoomMember> {

    @Select("SELECT * FROM room_members WHERE room_id = #{roomId} ORDER BY joined_at ASC")
    List<RoomMember> findByRoomIdOrderByJoinedAtAsc(@Param("roomId") Long roomId);

    @Select("SELECT * FROM room_members WHERE room_id = #{roomId} AND user_id = #{userId}")
    RoomMember findByRoomIdAndUserId(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Select("SELECT COUNT(*) > 0 FROM room_members WHERE room_id = #{roomId} AND user_id = #{userId}")
    boolean existsByRoomIdAndUserId(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM room_members WHERE room_id = #{roomId}")
    long countByRoomId(@Param("roomId") Long roomId);
}

