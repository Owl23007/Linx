package top.contins.linx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.dto.FriendRequestDto;
import top.contins.linx.model.entity.Friendship;
import top.contins.linx.model.enums.FriendshipStatus;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.vo.FriendVO;
import top.contins.linx.repository.FriendshipMapper;
import top.contins.linx.repository.UserMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 好友管理服务
 */
@Service
@Transactional
public class FriendshipService {

    private final FriendshipMapper friendshipMapper;
    private final UserMapper userMapper;

    @Autowired
    public FriendshipService(FriendshipMapper friendshipMapper,
                           UserMapper userMapper) {
        this.friendshipMapper = friendshipMapper;
        this.userMapper = userMapper;
    }

    /**
     * 发送好友请求
     */
    public void sendFriendRequest(Long requesterId, FriendRequestDto request) {
        // 1. 查找目标用户
        User targetUser = findUserByUsernameOrId(request.getTargetUser());
        if (targetUser == null) {
            throw new RuntimeException("用户不存在");
        }

        Long addresseeId = targetUser.getId();

        // 2. 检查是否试图添加自己为好友
        if (requesterId.equals(addresseeId)) {
            throw new RuntimeException("不能添加自己为好友");
        }

        // 3. 检查是否已经是好友
        if (friendshipMapper.areFriends(requesterId, addresseeId)) {
            throw new RuntimeException("你们已经是好友了");
        }

        // 4. 检查是否已有待处理的请求
        if (friendshipMapper.hasPendingRequest(requesterId, addresseeId)) {
            throw new RuntimeException("已存在待处理的好友请求");
        }

        // 5. 创建好友请求
        Friendship friendship = Friendship.builder()
                .requesterId(requesterId)
                .addresseeId(addresseeId)
                .status(FriendshipStatus.PENDING)
                .remark(request.getRemark())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        friendshipMapper.insert(friendship);
    }

    /**
     * 处理好友请求（接受或拒绝）
     */
    public void handleFriendRequest(Long userId, Long friendshipId, boolean accept) {
        Friendship friendship = friendshipMapper.selectById(friendshipId);
        if (friendship == null) {
            throw new RuntimeException("好友请求不存在");
        }

        // 检查是否是请求的接收者
        if (!friendship.getAddresseeId().equals(userId)) {
            throw new RuntimeException("无权处理此好友请求");
        }

        // 检查请求状态
        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new RuntimeException("该好友请求已被处理");
        }

        // 更新状态
        friendship.setStatus(accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.REJECTED);
        friendship.setUpdatedAt(LocalDateTime.now());

        friendshipMapper.updateById(friendship);
    }

    /**
     * 删除好友
     */
    public void removeFriend(Long userId, Long friendId) {
        Friendship friendship = friendshipMapper.findFriendshipBetweenUsers(userId, friendId);

        if (friendship == null) {
            throw new RuntimeException("好友关系不存在");
        }

        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new RuntimeException("你们不是好友关系");
        }

        friendshipMapper.deleteById(friendship.getId());
    }

    /**
     * 获取好友列表
     */
    public List<FriendVO> getFriends(Long userId) {
        List<Friendship> friendships = friendshipMapper.findFriendsByUserIdAndStatus(
                userId, FriendshipStatus.ACCEPTED);

        return friendships.stream()
                .map(friendship -> buildFriendVO(friendship, userId))
                .collect(Collectors.toList());
    }

    /**
     * 获取收到的好友请求
     */
    public List<FriendVO> getReceivedFriendRequests(Long userId) {
        List<Friendship> requests = friendshipMapper.findReceivedRequestsByUserIdAndStatus(
                userId, FriendshipStatus.PENDING);

        return requests.stream()
                .map(friendship -> buildFriendVO(friendship, userId))
                .collect(Collectors.toList());
    }

    /**
     * 获取发送的好友请求
     */
    public List<FriendVO> getSentFriendRequests(Long userId) {
        List<Friendship> requests = friendshipMapper.findSentRequestsByUserIdAndStatus(
                userId, FriendshipStatus.PENDING);

        return requests.stream()
                .map(friendship -> buildFriendVO(friendship, userId))
                .collect(Collectors.toList());
    }

    /**
     * 更新好友备注
     */
    public void updateFriendRemark(Long userId, Long friendId, String remark) {
        Friendship friendship = friendshipMapper.findFriendshipBetweenUsers(userId, friendId);

        if (friendship == null) {
            throw new RuntimeException("好友关系不存在");
        }

        if (friendship.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new RuntimeException("你们不是好友关系");
        }

        // 只有请求发起者或好友本人可以修改备注
        if (friendship.getRequesterId().equals(userId)) {
            friendship.setRemark(remark);
        } else if (friendship.getAddresseeId().equals(userId)) {
            // 对于接收者，需要创建反向的备注逻辑或使用其他字段
            friendship.setRemark(remark);
        } else {
            throw new RuntimeException("无权修改此备注");
        }

        friendship.setUpdatedAt(LocalDateTime.now());
        friendshipMapper.updateById(friendship);
    }

    /**
     * 根据用户名或ID查找用户
     */
    private User findUserByUsernameOrId(String userInput) {
        try {
            // 尝试作为ID解析
            Long userId = Long.parseLong(userInput);
            return userMapper.selectById(userId);
        } catch (NumberFormatException e) {
            // 作为用户名查找（这里需要根据实际的User实体调整）
            // 由于当前User实体没有username字段，可能需要调整
            return null;
        }
    }

    /**
     * 构建FriendVO对象
     */
    private FriendVO buildFriendVO(Friendship friendship, Long currentUserId) {
        // 确定友好的用户ID（不是当前用户的那个）
        Long friendId = friendship.getRequesterId().equals(currentUserId)
                ? friendship.getAddresseeId()
                : friendship.getRequesterId();

        // 获取好友用户信息
        User friendUser = userMapper.selectById(friendId);

        return FriendVO.builder()
                .friendshipId(friendship.getId())
                .friendId(friendId)
                .friendUsername(friendUser != null ? String.valueOf(friendUser.getId()) : "")
                .friendNickname(friendUser != null ? "用户" + friendUser.getId() : "未知用户")
                .friendAvatar("")
                .remark(friendship.getRemark())
                .status(friendship.getStatus())
                .onlineStatus(friendUser != null ? friendUser.getStatus() : null)
                .lastSeenAt(friendUser != null ? friendUser.getLastSeenAt() : null)
                .friendsSince(friendship.getCreatedAt())
                .build();
    }
}
