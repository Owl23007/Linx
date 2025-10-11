/**
 * LinX API 使用示例
 * 展示如何在组件中调用各种API
 */

import linxApi from '@/services/linxApiService';
import type { ChatMessage } from '@/types/chat';
import type { FriendVO } from '@/types/friend';
import type { GroupVO } from '@/types/group';
import type { UserVO } from '@/types/user';
import { ElMessage } from 'element-plus';

export function useLinxApi() {
  // ==================== 用户相关示例 ====================

  /**
   * 获取当前用户信息
   */
  const getCurrentUser = async () => {
    try {
      const res = await linxApi.user.getCurrent();
      if (res.code === 0) {
        ElMessage.success('获取用户信息成功');

        return res.data as UserVO;
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      ElMessage.error('获取用户信息失败');
      console.error(error);
    }
  };

  /**
   * 更新用户状态
   */
  const updateUserStatus = async (status: 'online' | 'offline' | 'away' | 'dnd' | 'hidden') => {
    try {
      const res = await linxApi.user.updateStatus(status);
      if (res.code === 0) {
        ElMessage.success(`状态已更新为：${status}`);
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      ElMessage.error('更新状态失败');
      console.error(error);
    }
  };

  // ==================== 好友相关示例 ====================

  /**
   * 获取好友列表
   */
  const getFriendsList = async () => {
    try {
      const res = await linxApi.friends.getList();
      if (res.code === 0) {
        return res.data as FriendVO[];
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      ElMessage.error('获取好友列表失败');
      console.error(error);
    }
  };

  /**
   * 发送好友请求
   */
  const sendFriendRequest = async (targetUser: string, message?: string, remark?: string) => {
    try {
      const res = await linxApi.friends.sendRequest({
        targetUser,
        message,
        remark,
      });
      if (res.code === 0) {
        ElMessage.success('好友请求已发送');

        return true;
      } else {
        ElMessage.error(res.message);

        return false;
      }
    } catch (error) {
      ElMessage.error('发送好友请求失败');
      console.error(error);

      return false;
    }
  };

  /**
   * 处理好友请求
   */
  const handleFriendRequest = async (friendshipId: number, accept: boolean) => {
    try {
      const res = await linxApi.friends.handleRequest(friendshipId, accept);
      if (res.code === 0) {
        ElMessage.success(accept ? '已接受好友请求' : '已拒绝好友请求');

        return true;
      } else {
        ElMessage.error(res.message);

        return false;
      }
    } catch (error) {
      ElMessage.error('处理好友请求失败');
      console.error(error);

      return false;
    }
  };

  /**
   * 更新好友备注
   */
  const updateFriendRemark = async (friendId: number, remark: string) => {
    try {
      const res = await linxApi.friends.updateRemark(friendId, remark);
      if (res.code === 0) {
        ElMessage.success('备注已更新');

        return true;
      } else {
        ElMessage.error(res.message);

        return false;
      }
    } catch (error) {
      ElMessage.error('更新备注失败');
      console.error(error);

      return false;
    }
  };

  // ==================== 群组相关示例 ====================

  /**
   * 获取群组列表
   */
  const getGroupsList = async () => {
    try {
      const res = await linxApi.groups.getList();
      if (res.code === 0) {
        return res.data as GroupVO[];
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      ElMessage.error('获取群组列表失败');
      console.error(error);
    }
  };

  /**
   * 创建群组
   */
  const createGroup = async (name: string, description?: string, initialMembers?: number[]) => {
    try {
      const res = await linxApi.groups.create({
        name,
        description,
        initialMembers,
      });
      if (res.code === 0) {
        ElMessage.success('群组创建成功');

        return res.data as GroupVO;
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      ElMessage.error('创建群组失败');
      console.error(error);
    }
  };

  /**
   * 加入群组
   */
  const joinGroup = async (groupId: number) => {
    try {
      const res = await linxApi.groups.join(groupId);
      if (res.code === 0) {
        ElMessage.success('已加入群组');

        return true;
      } else {
        ElMessage.error(res.message);

        return false;
      }
    } catch (error) {
      ElMessage.error('加入群组失败');
      console.error(error);

      return false;
    }
  };

  /**
   * 搜索群组
   */
  const searchGroups = async (keyword: string) => {
    try {
      const res = await linxApi.groups.search(keyword);
      if (res.code === 0) {
        return res.data as GroupVO[];
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      ElMessage.error('搜索群组失败');
      console.error(error);
    }
  };

  // ==================== 聊天相关示例 ====================

  /**
   * 获取私聊历史记录
   */
  const getPrivateChatHistory = async (otherUserId: number, page = 0, size = 20) => {
    try {
      const res = await linxApi.chat.history.getPrivateHistory(otherUserId, page, size);
      if (res.code === 0) {
        return res.data;
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      ElMessage.error('获取聊天记录失败');
      console.error(error);
    }
  };

  /**
   * 获取未读消息总数
   */
  const getTotalUnreadCount = async () => {
    try {
      const res = await linxApi.chat.unread.getTotalCount();
      if (res.code === 0) {
        return res.data.totalUnreadCount;
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      console.error('获取未读消息数失败', error);
    }
  };

  /**
   * 标记私聊消息为已读
   */
  const markPrivateMessagesAsRead = async (otherUserId: number) => {
    try {
      const res = await linxApi.chat.unread.markPrivateAsRead(otherUserId);
      if (res.code === 0) {
        return res.data.updatedCount;
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      console.error('标记已读失败', error);
    }
  };

  /**
   * 获取最近的聊天会话
   */
  const getRecentConversations = async (limit = 20) => {
    try {
      const res = await linxApi.chat.conversation.getRecent(limit);
      if (res.code === 0) {
        return res.data as ChatMessage[];
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      ElMessage.error('获取会话列表失败');
      console.error(error);
    }
  };

  /**
   * 搜索私聊消息
   */
  const searchPrivateMessages = async (otherUserId: number, keyword: string, page = 0, size = 20) => {
    try {
      const res = await linxApi.chat.message.searchPrivate(otherUserId, keyword, page, size);
      if (res.code === 0) {
        return res.data;
      } else {
        ElMessage.error(res.message);
      }
    } catch (error) {
      ElMessage.error('搜索消息失败');
      console.error(error);
    }
  };

  /**
   * 建立WebSocket连接前的准备
   */
  const prepareWebSocketConnection = async () => {
    try {
      // 1. 先建立会话
      const sessionRes = await linxApi.chat.connection.establishSession();
      if (sessionRes.code !== 0) {
        ElMessage.error('建立会话失败：' + sessionRes.message);

        return null;
      }

      // 2. 获取ticket
      const ticketRes = await linxApi.chat.connection.getTicket();
      if (ticketRes.code === 0) {
        return ticketRes.data; // 返回ticket用于WebSocket连接
      } else {
        ElMessage.error('获取ticket失败：' + ticketRes.message);

        return null;
      }
    } catch (error) {
      ElMessage.error('准备WebSocket连接失败');
      console.error(error);

      return null;
    }
  };

  return {
    // 用户相关
    getCurrentUser,
    updateUserStatus,

    // 好友相关
    getFriendsList,
    sendFriendRequest,
    handleFriendRequest,
    updateFriendRemark,

    // 群组相关
    getGroupsList,
    createGroup,
    joinGroup,
    searchGroups,

    // 聊天相关
    getPrivateChatHistory,
    getTotalUnreadCount,
    markPrivateMessagesAsRead,
    getRecentConversations,
    searchPrivateMessages,
    prepareWebSocketConnection,
  };
}
