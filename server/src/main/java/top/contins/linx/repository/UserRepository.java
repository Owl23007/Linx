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
     * 根据用户id获取用户状态
     */
    @Query("SELECT u.status FROM User u WHERE u.id = :userId")
    User getUserStatus(@Param("userId") Long userId);
}