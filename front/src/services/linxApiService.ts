/**
 * LinX 聊天服务 API 服务类
 * 提供统一的API调用接口
 */

import * as authApi from '@/request/auth';
import * as chatApi from '@/request/chat';
import * as friendsApi from '@/request/friends';
import * as groupsApi from '@/request/groups';
import * as roomsApi from '@/request/rooms';
import * as userApi from '@/request/user';

class LinxApiService {
  // ==================== 认证相关 ====================
  auth = {
    /**
     * 获取验证码
     */
    getCaptcha: authApi.getCaptcha,

    /**
     * 用户登录
     */
    login: authApi.login,

    /**
     * 用户注册
     */
    register: authApi.register,

    /**
     * 获取用户信息
     */
    getUserInfo: authApi.getUserInfo,

    /**
     * 刷新Token
     */
    refreshToken: authApi.refreshToken,

    /**
     * 用户登出
     */
    logout: authApi.logout,
  };

  // ==================== 用户相关 ====================
  user = {
    /**
     * 根据ID获取用户
     */
    getById: userApi.getUserById,

    /**
     * 获取当前用户信息
     */
    getCurrent: userApi.getCurrentUser,

    /**
     * 更新当前用户资料
     */
    updateProfile: userApi.updateCurrentUserProfile,

    /**
     * 创建头像上传直链
     */
    createAvatarUploadUrl: userApi.createCurrentUserAvatarUploadUrl,

    /**
     * 确认头像上传
     */
    confirmAvatarUpload: userApi.confirmCurrentUserAvatarUpload,

    /**
     * 创建背景图上传直链
     */
    createBackgroundUploadUrl: userApi.createCurrentUserBackgroundUploadUrl,

    /**
     * 确认背景图上传
     */
    confirmBackgroundUpload: userApi.confirmCurrentUserBackgroundUpload,

    /**
     * 更新用户状态
     */
    updateStatus: userApi.updateUserStatus,

    /**
     * 搜索用户（待后端实现）
     */
    search: userApi.searchUsers,

    /**
     * 批量获取用户信息（待后端实现）
     */
    getByIds: userApi.getUsersByIds,
  };

  // ==================== 好友相关 ====================
  friends = {
    /**
     * 发送好友请求
     */
    sendRequest: friendsApi.sendFriendRequest,

    /**
     * 处理好友请求（接受/拒绝）
     */
    handleRequest: friendsApi.handleFriendRequest,

    /**
     * 获取好友列表
     */
    getList: friendsApi.getFriends,

    /**
     * 获取收到的好友请求
     */
    getReceivedRequests: friendsApi.getReceivedFriendRequests,

    /**
     * 获取发送的好友请求
     */
    getSentRequests: friendsApi.getSentFriendRequests,

    /**
     * 删除好友
     */
    remove: friendsApi.removeFriend,

    /**
     * 更新好友备注
     */
    updateRemark: friendsApi.updateFriendRemark,
  };

  // ==================== 群组相关 ====================
  groups = {
    /**
     * 创建群组
     */
    create: groupsApi.createGroup,

    /**
     * 获取用户群组列表
     */
    getList: groupsApi.getUserGroups,

    /**
     * 获取群组详情
     */
    getDetails: groupsApi.getGroupDetails,

    /**
     * 加入群组
     */
    join: groupsApi.joinGroup,

    /**
     * 退出群组
     */
    leave: groupsApi.leaveGroup,

    /**
     * 解散群组
     */
    disband: groupsApi.disbandGroup,

    /**
     * 获取群组成员
     */
    getMembers: groupsApi.getGroupMembers,

    /**
     * 移除群组成员
     */
    removeMember: groupsApi.removeMember,

    /**
     * 设置成员角色
     */
    setMemberRole: groupsApi.setMemberRole,

    /**
     * 搜索群组
     */
    search: groupsApi.searchGroups,
  };

  // ==================== 房间相关 ====================
  rooms = {
    create: roomsApi.createRoom,
    join: roomsApi.joinRoom,
    getMine: roomsApi.getMyRooms,
    getDetails: roomsApi.getRoomDetails,
  };

  // ==================== 聊天相关 ====================
  chat = {
    // WebSocket 连接管理
    connection: {
      /**
       * 获取WebSocket Ticket
       */
      getTicket: chatApi.getTicket,

      /**
       * 建立WebSocket会话
       */
      establishSession: chatApi.establishWebSocketSession,
    },

    // 历史记录
    history: {
      /**
       * 获取私聊历史记录
       */
      getPrivateHistory: chatApi.getPrivateChatHistory,

      /**
       * 获取群聊历史记录
       */
      getGroupHistory: chatApi.getGroupChatHistory,

      /**
       * 获取指定时间后的私聊消息
       */
      getPrivateMessagesAfter: chatApi.getPrivateMessagesAfter,

      /**
       * 获取指定时间后的群聊消息
       */
      getGroupMessagesAfter: chatApi.getGroupMessagesAfter,
    },

    // 未读消息管理
    unread: {
      /**
       * 获取与指定用户的未读消息数
       */
      getCount: chatApi.getUnreadCount,

      /**
       * 获取所有未读消息总数
       */
      getTotalCount: chatApi.getTotalUnreadCount,

      /**
       * 标记单条消息为已读
       */
      markAsRead: chatApi.markMessageAsRead,

      /**
       * 批量标记私聊消息为已读
       */
      markPrivateAsRead: chatApi.markPrivateMessagesAsRead,
    },

    // 消息操作
    message: {
      /**
       * 删除消息
       */
      delete: chatApi.deleteMessage,

      /**
       * 搜索私聊消息
       */
      searchPrivate: chatApi.searchPrivateMessages,

      /**
       * 根据类型获取私聊消息
       */
      getPrivateByType: chatApi.getPrivateMessagesByType,
    },

    // 会话管理
    conversation: {
      /**
       * 获取最近的聊天会话
       */
      getRecent: chatApi.getRecentConversations,
    },
  };
}

// 导出单例
export default new LinxApiService();
