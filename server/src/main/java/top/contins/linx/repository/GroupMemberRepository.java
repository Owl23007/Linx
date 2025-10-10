package top.contins.linx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import top.contins.linx.model.entity.GroupMember;
import top.contins.linx.model.enums.GroupMemberRole;

import java.util.List;
import java.util.Optional;

/**
 * 群组成员数据访问层
 */
@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    /**
     * 查找群组的所有成员
     */
    List<GroupMember> findByGroupIdOrderByJoinedAtAsc(Long groupId);

    /**
     * 查找用户在指定群组中的成员关系
     */
    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    /**
     * 查找用户加入的所有群组
     */
    List<GroupMember> findByUserId(Long userId);

    /**
     * 检查用户是否是群组成员
     */
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    /**
     * 统计群组成员数量
     */
    long countByGroupId(Long groupId);

    /**
     * 根据角色查找群组成员
     */
    List<GroupMember> findByGroupIdAndRole(Long groupId, GroupMemberRole role);

    /**
     * 删除群组的所有成员
     */
    void deleteByGroupId(Long groupId);

    /**
     * 查找群组的管理员（包括群主）
     */
    @Query("SELECT gm FROM GroupMember gm WHERE gm.groupId = :groupId AND gm.role IN ('OWNER', 'ADMIN')")
    List<GroupMember> findAdminsByGroupId(@Param("groupId") Long groupId);
}
