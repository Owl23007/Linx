package top.contins.linx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import top.contins.linx.model.entity.User;

import java.util.Optional;

/**
 * 用户数据访问层
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * 根据用户名查找用户
     */
    Optional<User> findByUsername(String username);
    
    /**
     * 根据邮箱查找用户
     */
    Optional<User> findByEmail(String email);
    
    /**
     * 检查用户名是否存在
     */
    boolean existsByUsername(String username);
    
    /**
     * 检查邮箱是否存在
     */
    boolean existsByEmail(String email);
    
    /**
     * 根据用户名或邮箱查找用户
     */
    @Query("SELECT u FROM User u WHERE u.username = :loginId OR u.email = :loginId")
    Optional<User> findByUsernameOrEmail(@Param("loginId") String loginId);
    
    /**
     * 查找在线用户
     */
    @Query("SELECT u FROM User u WHERE u.status = 'ONLINE'")
    java.util.List<User> findOnlineUsers();
    
    /**
     * 根据昵称模糊查询用户
     */
    @Query("SELECT u FROM User u WHERE u.nickname LIKE %:nickname%")
    java.util.List<User> findByNicknameContaining(@Param("nickname") String nickname);
}