package top.contins.linx.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import top.contins.linx.model.entity.GroupMember;
import top.contins.linx.model.enums.GroupMemberRole;

import java.util.List;

@Mapper
public interface GroupMemberMapper extends BaseMapper<GroupMember> {

    @Select("SELECT * FROM group_members WHERE group_id = #{groupId} ORDER BY joined_at ASC")
    List<GroupMember> findByGroupIdOrderByJoinedAtAsc(@Param("groupId") Long groupId);

    @Select("SELECT * FROM group_members WHERE group_id = #{groupId} AND user_id = #{userId}")
    GroupMember findByGroupIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Long userId);

    @Select("SELECT * FROM group_members WHERE user_id = #{userId}")
    List<GroupMember> findByUserId(@Param("userId") Long userId);

    @Select("SELECT COUNT(*) > 0 FROM group_members WHERE group_id = #{groupId} AND user_id = #{userId}")
    boolean existsByGroupIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Long userId);

    @Select("SELECT COUNT(*) FROM group_members WHERE group_id = #{groupId}")
    long countByGroupId(@Param("groupId") Long groupId);

    @Select("SELECT * FROM group_members WHERE group_id = #{groupId} AND role = #{role}")
    List<GroupMember> findByGroupIdAndRole(@Param("groupId") Long groupId, @Param("role") GroupMemberRole role);

    @Delete("DELETE FROM group_members WHERE group_id = #{groupId}")
    void deleteByGroupId(@Param("groupId") Long groupId);

    @Select("SELECT * FROM group_members WHERE group_id = #{groupId} AND role IN ('OWNER', 'ADMIN')")
    List<GroupMember> findAdminsByGroupId(@Param("groupId") Long groupId);
}
