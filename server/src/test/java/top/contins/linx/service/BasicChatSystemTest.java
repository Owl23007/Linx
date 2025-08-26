package top.contins.linx.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import top.contins.linx.model.entity.User;
import top.contins.linx.model.vo.FriendshipVO;
import top.contins.linx.model.vo.GroupVO;
import top.contins.linx.model.vo.UserVO;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 聊天系统基础功能测试
 */
@SpringBootTest
@Transactional
@ActiveProfiles("test")
public class BasicChatSystemTest {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private FriendshipService friendshipService;
    
    @Autowired
    private GroupService groupService;
    
    @Test
    public void testUserManagement() {
        // 创建用户
        User user1 = userService.createUser("testuser1", "test1@example.com", "password123");
        User user2 = userService.createUser("testuser2", "test2@example.com", "password123");
        
        assertNotNull(user1.getId());
        assertNotNull(user2.getId());
        assertEquals("testuser1", user1.getUsername());
        assertEquals("testuser2", user2.getUsername());
        
        // 检查用户是否存在
        assertTrue(userService.existsByUsername("testuser1"));
        assertTrue(userService.existsByEmail("test1@example.com"));
        assertFalse(userService.existsByUsername("nonexistent"));
        
        // 获取用户信息
        UserVO userVO = userService.getUserVO(user1.getId());
        assertNotNull(userVO);
        assertEquals("testuser1", userVO.getUsername());
    }
    
    @Test
    public void testFriendshipManagement() {
        // 创建用户
        User user1 = userService.createUser("alice", "alice@test.com", "password123");
        User user2 = userService.createUser("bob", "bob@test.com", "password123");
        
        // 发送好友请求
        FriendshipVO friendship = friendshipService.sendFriendRequest(
                user1.getId(), "bob", "想和你做朋友");
        
        assertNotNull(friendship);
        assertEquals("PENDING", friendship.getStatus());
        
        // 检查收到的好友请求
        List<FriendshipVO> receivedRequests = friendshipService.getReceivedFriendRequests(user2.getId());
        assertEquals(1, receivedRequests.size());
        
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
        
        // 检查是否为好友
        assertTrue(friendshipService.areFriends(user1.getId(), user2.getId()));
    }
    
    @Test
    public void testGroupManagement() {
        // 创建用户
        User owner = userService.createUser("groupowner", "owner@test.com", "password123");
        User member1 = userService.createUser("member1", "member1@test.com", "password123");
        User member2 = userService.createUser("member2", "member2@test.com", "password123");
        
        // 创建群组
        GroupVO group = groupService.createGroup(
                owner.getId(), "测试群组", "这是一个测试群组", "NORMAL", 10);
        
        assertNotNull(group);
        assertEquals("测试群组", group.getName());
        assertEquals("这是一个测试群组", group.getDescription());
        
        // 检查群主是否为成员
        assertTrue(groupService.isMember(group.getId(), owner.getId()));
        assertTrue(groupService.isAdmin(group.getId(), owner.getId()));
        
        // 成员加入群组
        groupService.joinGroup(group.getId(), member1.getId(), owner.getId());
        groupService.joinGroup(group.getId(), member2.getId(), owner.getId());
        
        // 检查群组成员
        List<UserVO> members = groupService.getGroupMembers(group.getId());
        assertEquals(3, members.size()); // 群主 + 2个成员
        
        // 检查用户的群组列表
        List<GroupVO> userGroups = groupService.getUserGroups(owner.getId());
        assertEquals(1, userGroups.size());
        assertEquals("测试群组", userGroups.get(0).getName());
        
        // 成员离开群组
        groupService.leaveGroup(group.getId(), member1.getId());
        
        // 再次检查成员数量
        List<UserVO> remainingMembers = groupService.getGroupMembers(group.getId());
        assertEquals(2, remainingMembers.size()); // 群主 + 1个成员
    }
    
    @Test
    public void testUserSearch() {
        // 创建测试用户
        userService.createUser("john", "john@test.com", "password123");
        userService.createUser("jane", "jane@test.com", "password123");
        userService.createUser("alice", "alice@test.com", "password123");
        
        // 搜索用户（根据用户名/昵称）
        List<UserVO> searchResults = userService.searchUsersByNickname("j");
        assertTrue(searchResults.size() >= 2); // john 和 jane
        
        // 搜索特定用户
        List<UserVO> aliceResults = userService.searchUsersByNickname("alice");
        assertEquals(1, aliceResults.size());
        assertEquals("alice", aliceResults.get(0).getUsername());
    }
}