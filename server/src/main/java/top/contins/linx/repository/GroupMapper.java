package top.contins.linx.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import top.contins.linx.model.entity.Group;
import top.contins.linx.model.enums.GroupStatus;

import java.util.List;

@Mapper
public interface GroupMapper extends BaseMapper<Group> {

    @Select("SELECT * FROM \"groups\" WHERE owner_id = #{ownerId} AND status = #{status}")
    List<Group> findByOwnerIdAndStatus(@Param("ownerId") Long ownerId, @Param("status") GroupStatus status);

    @Select("SELECT * FROM \"groups\" WHERE name LIKE CONCAT('%', #{name}, '%') AND status = #{status}")
    List<Group> findByNameContainingAndStatus(@Param("name") String name, @Param("status") GroupStatus status);

    @Select("SELECT g.* FROM \"groups\" g JOIN group_members gm ON g.id = gm.group_id " +
            "WHERE gm.user_id = #{userId} AND g.status = #{status}")
    List<Group> findGroupsByUserIdAndStatus(@Param("userId") Long userId, @Param("status") GroupStatus status);

    @Select("SELECT COUNT(*) FROM group_members WHERE group_id = #{groupId}")
    Long countMembersByGroupId(@Param("groupId") Long groupId);
}
