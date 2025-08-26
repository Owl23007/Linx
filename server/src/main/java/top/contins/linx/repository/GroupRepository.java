package top.contins.linx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import top.contins.linx.model.entity.Group;
import top.contins.linx.model.entity.User;

import java.util.List;

/**
 * 群组数据访问层
 */
@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    
    /**
     * 根据群主查找群组
     */
    List<Group> findByOwner(User owner);
    
    /**
     * 根据群组状态查找群组
     */
    List<Group> findByStatus(Group.GroupStatus status);
    
    /**
     * 根据群组类型查找群组
     */
    List<Group> findByType(Group.GroupType type);
    
    /**
     * 根据群组名称模糊查询
     */
    @Query("SELECT g FROM Group g WHERE g.name LIKE %:name%")
    List<Group> findByNameContaining(@Param("name") String name);
    
    /**
     * 查找用户参与的所有群组
     */
    @Query("SELECT DISTINCT g FROM Group g " +
           "JOIN g.members m " +
           "WHERE m.user = :user AND m.status = 'ACTIVE' AND g.status = 'ACTIVE'")
    List<Group> findGroupsByUser(@Param("user") User user);
    
    /**
     * 查找活跃的群组
     */
    @Query("SELECT g FROM Group g WHERE g.status = 'ACTIVE'")
    List<Group> findActiveGroups();
    
    /**
     * 根据群主和状态查找群组
     */
    List<Group> findByOwnerAndStatus(User owner, Group.GroupStatus status);
}