package top.contins.linx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.entity.Friendship;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.vo.FriendshipVO;
import top.contins.linx.model.vo.UserVO;
import top.contins.linx.repository.FriendshipRepository;
import top.contins.linx.repository.UserRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 好友关系服务类
 */
@Service
@Transactional
public class FriendshipService {
    
    @Autowired
    private FriendshipRepository friendshipRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 发送好友请求
     */
    public FriendshipVO sendFriendRequest(Long fromUserId, String toUserIdentifier, String remark) {
        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new IllegalArgumentException("发送方用户不存在"));
        
        User toUser = userRepository.findByUsernameOrEmail(toUserIdentifier)
                .orElseThrow(() -> new IllegalArgumentException("目标用户不存在"));
        
        if (fromUser.equals(toUser)) {
            throw new IllegalArgumentException("不能添加自己为好友");
        }
        
        // 检查是否已经是好友
        if (friendshipRepository.areFriends(fromUser, toUser)) {
            throw new IllegalArgumentException("已经是好友关系");
        }
        
        // 检查是否已经有待处理的请求
        if (friendshipRepository.hasPendingRequest(fromUser, toUser)) {
            throw new IllegalArgumentException("已经存在待处理的好友请求");
        }
        
        Friendship friendship = new Friendship(fromUser, toUser, remark);
        friendship = friendshipRepository.save(friendship);
        
        return new FriendshipVO(friendship);
    }
    
    /**
     * 响应好友请求
     */
    public FriendshipVO respondToFriendRequest(Long requestId, Long userId, boolean accept) {
        Friendship friendship = friendshipRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("好友请求不存在"));
        
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        // 检查是否为请求的接收方
        if (!friendship.getToUser().equals(currentUser)) {
            throw new IllegalArgumentException("无权限处理此好友请求");
        }
        
        // 检查请求状态
        if (friendship.getStatus() != Friendship.FriendshipStatus.PENDING) {
            throw new IllegalArgumentException("好友请求已经被处理");
        }
        
        if (accept) {
            friendship.setStatus(Friendship.FriendshipStatus.ACCEPTED);
        } else {
            friendship.setStatus(Friendship.FriendshipStatus.REJECTED);
        }
        
        friendship = friendshipRepository.save(friendship);
        return new FriendshipVO(friendship);
    }
    
    /**
     * 获取用户的好友列表
     */
    @Transactional(readOnly = true)
    public List<UserVO> getFriends(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        return friendshipRepository.findAcceptedFriendships(user)
                .stream()
                .map(friendship -> {
                    User friend = friendship.getOtherUser(user);
                    return new UserVO(friend);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * 获取用户收到的好友请求
     */
    @Transactional(readOnly = true)
    public List<FriendshipVO> getReceivedFriendRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        return friendshipRepository.findPendingRequests(user)
                .stream()
                .map(FriendshipVO::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取用户发送的好友请求
     */
    @Transactional(readOnly = true)
    public List<FriendshipVO> getSentFriendRequests(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        return friendshipRepository.findSentRequests(user, Friendship.FriendshipStatus.PENDING)
                .stream()
                .map(FriendshipVO::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 删除好友关系
     */
    public void removeFriend(Long userId, Long friendId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new IllegalArgumentException("好友用户不存在"));
        
        Optional<Friendship> friendshipOpt = friendshipRepository.findByUsers(user, friend);
        if (friendshipOpt.isPresent()) {
            Friendship friendship = friendshipOpt.get();
            if (friendship.getStatus() == Friendship.FriendshipStatus.ACCEPTED) {
                friendshipRepository.delete(friendship);
            } else {
                throw new IllegalArgumentException("不是好友关系");
            }
        } else {
            throw new IllegalArgumentException("好友关系不存在");
        }
    }
    
    /**
     * 屏蔽用户
     */
    public void blockUser(Long userId, Long targetUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("目标用户不存在"));
        
        Optional<Friendship> friendshipOpt = friendshipRepository.findByUsers(user, targetUser);
        if (friendshipOpt.isPresent()) {
            Friendship friendship = friendshipOpt.get();
            friendship.setStatus(Friendship.FriendshipStatus.BLOCKED);
            friendshipRepository.save(friendship);
        } else {
            // 创建新的屏蔽关系
            Friendship friendship = new Friendship(user, targetUser);
            friendship.setStatus(Friendship.FriendshipStatus.BLOCKED);
            friendshipRepository.save(friendship);
        }
    }
    
    /**
     * 检查两个用户是否为好友
     */
    @Transactional(readOnly = true)
    public boolean areFriends(Long userId1, Long userId2) {
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new IllegalArgumentException("用户1不存在"));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new IllegalArgumentException("用户2不存在"));
        
        return friendshipRepository.areFriends(user1, user2);
    }
}