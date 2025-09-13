package top.contins.linx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.entity.UserStatus;
import top.contins.linx.model.vo.UserVO;
import top.contins.linx.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 用户服务类
 * 注意：本服务仅管理聊天相关的用户状态和活跃信息，
 * 不涉及用户名、邮箱、昵称等认证或个性化数据。
 * 所有用户基础信息（如昵称、头像）由 Profile Service 统一管理，
 * 用户列表通过 Kafka 事件异步同步。
 */
@Service
@Transactional
public class UserService {

    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * 根据 Auth 的 user_id 查找用户（用于聊天上下文）
     */
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    /**
     * 更新用户在线状态（由事件或客户端触发）
     * - ONLINE / AWAY / DND：更新状态 + 记录 lastSeenAt
     * - OFFLINE：主动下线，记录时间
     */
    public User updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));

        user.setStatus(status);

        // 更新最后活跃时间
        user.updateLastSeenAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    /**
     * 根据 ID 获取用户 VO（前端显示单个用户）
     */
    @Transactional(readOnly = true)
    public UserVO getUserVO(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        return new UserVO(user);
    }

    /**
     * 检查用户是否存在
     */
    @Transactional(readOnly = true)
    public boolean existsById(Long userId) {
        return userRepository.existsById(userId);
    }

    /**
     * 更新最后活跃时间（心跳机制调用）
     */
    public void updateLastSeenAt(Long userId, LocalDateTime now) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        user.updateLastSeenAt(now);
        userRepository.save(user);
    }

}