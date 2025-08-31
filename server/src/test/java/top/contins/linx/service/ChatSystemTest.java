package top.contins.linx.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.vo.FriendshipVO;
import top.contins.linx.model.vo.GroupVO;
import top.contins.linx.model.vo.MessageVO;
import top.contins.linx.model.vo.UserVO;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 聊天系统功能测试
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
public class ChatSystemTest {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private FriendshipService friendshipService;
    
    @Autowired
    private GroupService groupService;
    
    @Autowired
    private MessageService messageService;
    
    @Test
    public void testUserCreationAndFriendship() {
        // 创建用户
        User user1 = userService.createUser("alice", "alice@example.com", "password123");
        User user2 = userService.createUser("bob", "bob@example.com", "password123");
        
        assertNotNull(user1.getId());
        assertNotNull(user2.getId());
        assertEquals("alice", user1.getUsername());
        assertEquals("bob", user2.getUsername());
        
        // 发送好友请求
        FriendshipVO friendship = friendshipService.sendFriendRequest(
                user1.getId(), "bob", "想和你做朋友");
        
        assertNotNull(friendship);
        assertEquals("PENDING", friendship.getStatus());
        
        // 接受好友请求
        FriendshipVO acceptedFriendship = friendshipService.respondToFriendRequest(
                friendship.getId(), user2.getId(), true);
        
        assertEquals("ACCEPTED", acceptedFriendship.getStatus());
        
        // 检查好友列表
        List<UserVO> friends1 = friendshipService.getFriends(user1.getId());
        List<UserVO> friends2 = friendshipService.getFriends(user2.getId());
        
        assertEquals(1, friends1.size());
        assertEquals(1, friends2.size());
        assertEquals("bob", friends1.get(0).getUsername());
        assertEquals("alice", friends2.get(0).getUsername());
    }
    
    @Test
    public void testGroupCreationAndMessaging() {
        // 创建用户
        User owner = userService.createUser("owner", "owner@example.com", "password123");
        User member = userService.createUser("member", "member@example.com", "password123");
        
        // 创建群组
        GroupVO group = groupService.createGroup(
                owner.getId(), "测试群组", "这是一个测试群组", "NORMAL", 10);
        
        assertNotNull(group);
        assertEquals("测试群组", group.getName());
        assertEquals(1, group.getMemberCount().intValue());
        
        // 成员加入群组
        groupService.joinGroup(group.getId(), member.getId(), owner.getId());
        
        // 检查群组成员
        List<UserVO> members = groupService.getGroupMembers(group.getId());
        assertEquals(2, members.size());
        
        // 发送群聊消息（需要用户先建立好友关系或者是群成员才能发送）
        MessageVO message = messageService.sendGroupMessage(
                owner.getId(), group.getId(), "欢迎大家！", "TEXT", null, null);
        
        assertNotNull(message);
        assertEquals("欢迎大家！", message.getContent());
        assertEquals("GROUP", message.getChatType());
        
        // 获取群聊消息
        List<MessageVO> messages = messageService.getGroupMessages(group.getId(), 0, 10);
        assertEquals(1, messages.size());
        assertEquals("欢迎大家！", messages.get(0).getContent());
    }
    
    @Test
    public void testPrivateMessaging() {
        // 创建用户
        User user1 = userService.createUser("user1", "user1@example.com", "password123");
        User user2 = userService.createUser("user2", "user2@example.com", "password123");
        
        // 建立好友关系
        FriendshipVO friendship = friendshipService.sendFriendRequest(
                user1.getId(), "user2", "");
        friendshipService.respondToFriendRequest(friendship.getId(), user2.getId(), true);
        
        // 发送私聊消息
        MessageVO message = messageService.sendPrivateMessage(
                user1.getId(), user2.getId(), "你好！", "TEXT", null, null);
        
        assertNotNull(message);
        assertEquals("你好！", message.getContent());
        assertEquals("PRIVATE", message.getChatType());
        assertFalse(message.getIsRead());
        
        // 获取私聊消息
        List<MessageVO> messages = messageService.getPrivateMessages(
                user1.getId(), user2.getId(), 0, 10);
        assertEquals(1, messages.size());
        
        // 获取未读消息
        List<MessageVO> unreadMessages = messageService.getUnreadMessages(user2.getId());
        assertEquals(1, unreadMessages.size());
        
        // 标记为已读
        messageService.markMessageAsRead(message.getId(), user2.getId());
        
        // 再次检查未读消息
        unreadMessages = messageService.getUnreadMessages(user2.getId());
        assertEquals(0, unreadMessages.size());
    }
    
    @Test
    public void testUserSearch() {
        // 创建测试用户
        userService.createUser("john", "john@example.com", "password123");
        userService.createUser("jane", "jane@example.com", "password123");
        userService.createUser("alice", "alice@example.com", "password123");
        
        // 搜索用户
        List<UserVO> searchResults = userService.searchUsersByNickname("j");
        assertEquals(2, searchResults.size());
        
        // 检查用户名是否存在
        assertTrue(userService.existsByUsername("john"));
        assertFalse(userService.existsByUsername("nonexistent"));
        
        // 检查邮箱是否存在
        assertTrue(userService.existsByEmail("jane@example.com"));
        assertFalse(userService.existsByEmail("nonexistent@example.com"));
    }
}