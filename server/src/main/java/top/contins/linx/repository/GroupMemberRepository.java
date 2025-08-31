package top.contins.linx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import top.contins.linx.model.entity.Group;
import top.contins.linx.model.entity.GroupMember;
import top.contins.linx.model.entity.User;

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
    List<GroupMember> findByGroup(Group group);
    
    /**
     * 查找群组的活跃成员
     */
    @Query("SELECT gm FROM GroupMember gm WHERE gm.group = :group AND gm.status = 'ACTIVE'")
    List<GroupMember> findActiveMembers(@Param("group") Group group);
    
    /**
     * 查找用户参与的所有群组成员关系
     */
    List<GroupMember> findByUser(User user);
    
    /**
     * 查找用户在特定群组中的成员关系
     */
    Optional<GroupMember> findByGroupAndUser(Group group, User user);
    
    /**
     * 查找群组的管理员（包括群主）
     */
    @Query("SELECT gm FROM GroupMember gm WHERE gm.group = :group AND " +
           "(gm.role = 'OWNER' OR gm.role = 'ADMIN') AND gm.status = 'ACTIVE'")
    List<GroupMember> findAdmins(@Param("group") Group group);
    
    /**
     * 查找群组的群主
     */
    @Query("SELECT gm FROM GroupMember gm WHERE gm.group = :group AND " +
           "gm.role = 'OWNER' AND gm.status = 'ACTIVE'")
    Optional<GroupMember> findOwner(@Param("group") Group group);
    
    /**
     * 检查用户是否为群组成员
     */
    @Query("SELECT COUNT(gm) > 0 FROM GroupMember gm WHERE " +
           "gm.group = :group AND gm.user = :user AND gm.status = 'ACTIVE'")
    boolean isMember(@Param("group") Group group, @Param("user") User user);
    
    /**
     * 检查用户是否为群组管理员
     */
    @Query("SELECT COUNT(gm) > 0 FROM GroupMember gm WHERE " +
           "gm.group = :group AND gm.user = :user AND " +
           "(gm.role = 'OWNER' OR gm.role = 'ADMIN') AND gm.status = 'ACTIVE'")
    boolean isAdmin(@Param("group") Group group, @Param("user") User user);
    
    /**
     * 统计群组的活跃成员数量
     */
    @Query("SELECT COUNT(gm) FROM GroupMember gm WHERE " +
           "gm.group = :group AND gm.status = 'ACTIVE'")
    long countActiveMembers(@Param("group") Group group);
}