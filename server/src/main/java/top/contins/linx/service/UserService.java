package top.contins.linx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.vo.UserVO;
import top.contins.linx.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 用户服务类
 */
@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 根据ID查找用户
     */
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    /**
     * 根据用户名查找用户
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    /**
     * 根据邮箱查找用户
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * 根据用户名或邮箱查找用户
     */
    public Optional<User> findByUsernameOrEmail(String loginId) {
        return userRepository.findByUsernameOrEmail(loginId);
    }
    
    /**
     * 创建用户
     */
    public User createUser(String username, String email, String password) {
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("用户名已存在");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("邮箱已存在");
        }
        
        User user = new User(username, email, password);
        return userRepository.save(user);
    }
    
    /**
     * 更新用户信息
     */
    public User updateUser(Long userId, String nickname, String email) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        if (nickname != null && !nickname.trim().isEmpty()) {
            user.setNickname(nickname);
        }
        
        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("邮箱已存在");
            }
            user.setEmail(email);
        }
        
        return userRepository.save(user);
    }
    
    /**
     * 更新用户状态
     */
    public User updateUserStatus(Long userId, User.UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        user.setStatus(status);
        if (status == User.UserStatus.OFFLINE) {
            user.setLastOnline(LocalDateTime.now());
        }
        
        return userRepository.save(user);
    }
    
    /**
     * 获取在线用户列表
     */
    @Transactional(readOnly = true)
    public List<UserVO> getOnlineUsers() {
        return userRepository.findOnlineUsers()
                .stream()
                .map(UserVO::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 根据昵称搜索用户
     */
    @Transactional(readOnly = true)
    public List<UserVO> searchUsersByNickname(String nickname) {
        return userRepository.findByNicknameContaining(nickname)
                .stream()
                .map(UserVO::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取用户信息VO
     */
    @Transactional(readOnly = true)
    public UserVO getUserVO(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        return new UserVO(user);
    }
    
    /**
     * 检查用户名是否存在
     */
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
    
    /**
     * 检查邮箱是否存在
     */
    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    
    /**
     * 删除用户
     */
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        userRepository.delete(user);
    }
}