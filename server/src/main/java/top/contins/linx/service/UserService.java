package top.contins.linx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.entity.UserStatus;
import top.contins.linx.model.vo.UserVO;
import top.contins.linx.repository.UserRepository;
import top.contins.linx.util.RedisUtil;

import java.time.LocalDateTime;

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
    private final UserRepository userRepository;
    private final RedisUtil redisUtil;

    @Autowired
    public  UserService(UserRepository userRepository, RedisUtil redisUtil) {
        this.userRepository = userRepository;
        this.redisUtil = redisUtil;
    }

    /**
     * 更新用户在线状态（由 JwtAuthenticationFilter 触发）
     * <p>
     * - ONLINE / DND：更新状态 + 记录 lastSeenAt<br>
     * - OFFLINE：主动下线，记录时间<br>
     * - HIDDEN / AWAY ：隐身状态，不更新 lastSeenAt<br>
     */
    public User updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));

        user.setStatus(status);

        LocalDateTime now = LocalDateTime.now();

        if (status!=UserStatus.HIDDEN && status != UserStatus.AWAY) {
            // 如果状态是 ONLINE 或 DND，更新最后活跃时间
            user.updateLastSeenAt(now);
        }

        user.setUpdatedAt(now);

        return userRepository.save(user);
    }

    /**
     * 根据 ID 获取用户 VO（前端显示单个用户）
     */
    @Transactional(readOnly = true)
    public UserVO getUserVO(Long userId) {
        String key = "linx:user_vo:" + userId;
        UserVO userVO = redisUtil.get(key, UserVO.class);
        if (userVO != null) {
            return userVO;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在: " + userId));
        userVO = new UserVO(user);

        redisUtil.set(key, userVO);
        return userVO;
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

    /**
     * 创建或更新用户
     * - 如果用户不存在，创建新用户，状态为 OFFLINE
     * - 如果用户已存在，不修改状态，仅确保记录存在
     */
    public void createOrUpdateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElse(new User(userId, UserStatus.OFFLINE, null, null));
        userRepository.save(user);
    }
}