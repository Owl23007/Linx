package top.contins.linx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.entity.Group;
import top.contins.linx.model.entity.Message;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.vo.MessageVO;
import top.contins.linx.repository.GroupRepository;
import top.contins.linx.repository.MessageRepository;
import top.contins.linx.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 消息服务类
 */
@Service
@Transactional
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private GroupRepository groupRepository;
    
    @Autowired
    private GroupService groupService;
    
    @Autowired
    private FriendshipService friendshipService;
    
    /**
     * 发送私聊消息
     */
    public MessageVO sendPrivateMessage(Long senderId, Long receiverId, String content, 
                                       String messageType, Long replyToId, String extraData) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("发送者不存在"));
        
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("接收者不存在"));
        
        // 检查是否为好友关系
        if (!friendshipService.areFriends(senderId, receiverId)) {
            throw new IllegalArgumentException("只能向好友发送消息");
        }
        
        Message message = Message.createPrivateMessage(content, sender, receiver);
        
        if (messageType != null) {
            try {
                message.setType(Message.MessageType.valueOf(messageType.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("无效的消息类型");
            }
        }
        
        if (replyToId != null) {
            Message replyTo = messageRepository.findById(replyToId).orElse(null);
            message.setReplyTo(replyTo);
        }
        
        if (extraData != null) {
            message.setExtraData(extraData);
        }
        
        message = messageRepository.save(message);
        return new MessageVO(message);
    }
    
    /**
     * 发送群聊消息
     */
    public MessageVO sendGroupMessage(Long senderId, Long groupId, String content, 
                                     String messageType, Long replyToId, String extraData) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("发送者不存在"));
        
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        // 检查是否为群组成员
        if (!groupService.isMember(groupId, senderId)) {
            throw new IllegalArgumentException("只有群组成员才能发送消息");
        }
        
        Message message = Message.createGroupMessage(content, sender, group);
        
        if (messageType != null) {
            try {
                message.setType(Message.MessageType.valueOf(messageType.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("无效的消息类型");
            }
        }
        
        if (replyToId != null) {
            Message replyTo = messageRepository.findById(replyToId).orElse(null);
            message.setReplyTo(replyTo);
        }
        
        if (extraData != null) {
            message.setExtraData(extraData);
        }
        
        message = messageRepository.save(message);
        return new MessageVO(message);
    }
    
    /**
     * 获取私聊消息记录
     */
    @Transactional(readOnly = true)
    public List<MessageVO> getPrivateMessages(Long user1Id, Long user2Id, int page, int size) {
        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new IllegalArgumentException("用户1不存在"));
        
        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new IllegalArgumentException("用户2不存在"));
        
        Pageable pageable = PageRequest.of(page, size);
        
        return messageRepository.findPrivateMessages(user1, user2, pageable)
                .stream()
                .map(MessageVO::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取群聊消息记录
     */
    @Transactional(readOnly = true)
    public List<MessageVO> getGroupMessages(Long groupId, int page, int size) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        Pageable pageable = PageRequest.of(page, size);
        
        return messageRepository.findGroupMessages(group, pageable)
                .stream()
                .map(MessageVO::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取用户的未读消息
     */
    @Transactional(readOnly = true)
    public List<MessageVO> getUnreadMessages(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        return messageRepository.findUnreadPrivateMessages(user)
                .stream()
                .map(MessageVO::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 标记消息为已读
     */
    public void markMessageAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("消息不存在"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        // 只有消息的接收者才能标记为已读
        if (message.isPrivateMessage() && message.getReceiver().equals(user)) {
            message.setIsRead(true);
            messageRepository.save(message);
        } else {
            throw new IllegalArgumentException("无权限标记此消息为已读");
        }
    }
    
    /**
     * 批量标记消息为已读
     */
    public void markMessagesAsRead(Long userId, Long chatPartnerId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        User chatPartner = userRepository.findById(chatPartnerId)
                .orElseThrow(() -> new IllegalArgumentException("聊天对象不存在"));
        
        List<Message> unreadMessages = messageRepository.findUnreadPrivateMessages(user);
        
        unreadMessages.stream()
                .filter(message -> message.getSender().equals(chatPartner))
                .forEach(message -> {
                    message.setIsRead(true);
                    messageRepository.save(message);
                });
    }
    
    /**
     * 获取用户的最近聊天列表
     */
    @Transactional(readOnly = true)
    public List<MessageVO> getRecentChats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        return messageRepository.findRecentChats(user)
                .stream()
                .map(MessageVO::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取用户的未读消息数量
     */
    @Transactional(readOnly = true)
    public long getUnreadMessageCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        return messageRepository.countUnreadMessages(user);
    }
    
    /**
     * 删除消息
     */
    public void deleteMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("消息不存在"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        
        // 只有消息发送者可以删除消息
        if (!message.getSender().equals(user)) {
            throw new IllegalArgumentException("只能删除自己发送的消息");
        }
        
        messageRepository.delete(message);
    }
    
    /**
     * 获取指定时间之后的群组消息
     */
    @Transactional(readOnly = true)
    public List<MessageVO> getGroupMessagesAfter(Long groupId, LocalDateTime afterTime) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("群组不存在"));
        
        return messageRepository.findGroupMessagesAfter(group, afterTime)
                .stream()
                .map(MessageVO::new)
                .collect(Collectors.toList());
    }
    
    /**
     * 获取指定时间之后的私聊消息
     */
    @Transactional(readOnly = true)
    public List<MessageVO> getPrivateMessagesAfter(Long user1Id, Long user2Id, LocalDateTime afterTime) {
        User user1 = userRepository.findById(user1Id)
                .orElseThrow(() -> new IllegalArgumentException("用户1不存在"));
        
        User user2 = userRepository.findById(user2Id)
                .orElseThrow(() -> new IllegalArgumentException("用户2不存在"));
        
        return messageRepository.findPrivateMessagesAfter(user1, user2, afterTime)
                .stream()
                .map(MessageVO::new)
                .collect(Collectors.toList());
    }
}