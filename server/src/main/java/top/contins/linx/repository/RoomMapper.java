package top.contins.linx.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import top.contins.linx.model.entity.Room;
import top.contins.linx.model.enums.RoomStatus;

import java.util.List;

@Mapper
public interface RoomMapper extends BaseMapper<Room> {

    @Select("SELECT * FROM rooms WHERE room_code = #{roomCode} LIMIT 1")
    Room findByRoomCode(@Param("roomCode") String roomCode);

    @Select("SELECT r.* FROM rooms r " +
            "JOIN room_members rm ON r.id = rm.room_id " +
            "WHERE rm.user_id = #{userId} AND r.status = #{status} " +
            "ORDER BY r.updated_at DESC")
    List<Room> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") RoomStatus status);

    @Select("SELECT COUNT(*) FROM room_members WHERE room_id = #{roomId}")
    long countMembersByRoomId(@Param("roomId") Long roomId);
}

