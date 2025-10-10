package top.contins.linx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import top.contins.linx.model.entity.Group;
import top.contins.linx.model.enums.GroupStatus;

import java.util.List;

/**
 * 群组数据访问层
 */
@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    /**
     * 根据群主ID查找群组
     */
    List<Group> findByOwnerIdAndStatus(Long ownerId, GroupStatus status);

    /**
     * 根据名称模糊搜索群组
     */
    @Query("SELECT g FROM Group g WHERE g.name LIKE %:name% AND g.status = :status")
    List<Group> findByNameContainingAndStatus(@Param("name") String name, @Param("status") GroupStatus status);

    /**
     * 查找用户加入的所有群组
     */
    @Query("SELECT g FROM Group g JOIN GroupMember gm ON g.id = gm.groupId " +
           "WHERE gm.userId = :userId AND g.status = :status")
    List<Group> findGroupsByUserIdAndStatus(@Param("userId") Long userId, @Param("status") GroupStatus status);

    /**
     * 统计群组成员数量
     */
    @Query("SELECT COUNT(gm) FROM GroupMember gm WHERE gm.groupId = :groupId")
    Long countMembersByGroupId(@Param("groupId") Long groupId);
}
