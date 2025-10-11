import linxApi from '@/services/linxApiService';
import type { FriendVO } from '@/types/friend';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * 好友管理 Store
 */
export const useFriendsStore = defineStore('friends', () => {
  // ==================== 状态 ====================
  const friends = ref<FriendVO[]>([]);
  const receivedRequests = ref<FriendVO[]>([]);
  const sentRequests = ref<FriendVO[]>([]);
  const loading = ref(false);

  // ==================== 计算属性 ====================
  const friendsCount = computed(() => friends.value.length);
  const pendingRequestsCount = computed(() => receivedRequests.value.length);

  // 按状态分组的好友
  const acceptedFriends = computed(() =>
    friends.value.filter(f => f.status === 'ACCEPTED')
  );

  const onlineFriends = computed(() =>
    acceptedFriends.value.filter(f => f.onlineStatus === 'ONLINE')
  );

  // ==================== 操作方法 ====================

  /**
   * 加载好友列表
   */
  async function loadFriends() {
    loading.value = true;
    try {
      const res = await linxApi.friends.getList();
      if (res.code === 0) {
        friends.value = res.data || [];
      } else {
        ElMessage.error(res.message);
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * 加载收到的好友请求
   */
  async function loadReceivedRequests() {
    try {
      const res = await linxApi.friends.getReceivedRequests();
      if (res.code === 0) {
        receivedRequests.value = res.data || [];
      }
    } catch (error) {
      // 静默失败
    }
  }

  /**
   * 加载发送的好友请求
   */
  async function loadSentRequests() {
    try {
      const res = await linxApi.friends.getSentRequests();
      if (res.code === 0) {
        sentRequests.value = res.data || [];
      }
    } catch (error) {
      // 静默失败
    }
  }

  /**
   * 发送好友请求
   */
  async function sendFriendRequest(targetUser: string, message?: string, remark?: string) {
    try {
      const res = await linxApi.friends.sendRequest({
        targetUser,
        message,
        remark,
      });
      if (res.code === 0) {
        ElMessage.success('好友请求已发送');
        await loadSentRequests();

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch (error) {
      ElMessage.error('发送好友请求失败');

      return false;
    }
  }

  /**
   * 处理好友请求
   */
  async function handleFriendRequest(friendshipId: number, accept: boolean) {
    try {
      const res = await linxApi.friends.handleRequest(friendshipId, accept);
      if (res.code === 0) {
        ElMessage.success(accept ? '已接受好友请求' : '已拒绝好友请求');

        // 从请求列表中移除
        receivedRequests.value = receivedRequests.value.filter(
          r => r.friendshipId !== friendshipId
        );

        // 如果接受，重新加载好友列表
        if (accept) {
          await loadFriends();
        }

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch (error) {
      ElMessage.error('处理好友请求失败');

      return false;
    }
  }

  /**
   * 删除好友
   */
  async function removeFriend(friendId: number) {
    try {
      const res = await linxApi.friends.remove(friendId);
      if (res.code === 0) {
        ElMessage.success('已删除好友');
        friends.value = friends.value.filter(f => f.friendId !== friendId);

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch (error) {
      ElMessage.error('删除好友失败');

      return false;
    }
  }

  /**
   * 更新好友备注
   */
  async function updateRemark(friendId: number, remark: string) {
    try {
      const res = await linxApi.friends.updateRemark(friendId, remark);
      if (res.code === 0) {
        ElMessage.success('备注已更新');

        // 更新本地状态
        const friend = friends.value.find(f => f.friendId === friendId);
        if (friend) {
          friend.remark = remark;
        }

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch (error) {
      ElMessage.error('更新备注失败');

      return false;
    }
  }

  /**
   * 根据ID获取好友
   */
  function getFriendById(friendId: number): FriendVO | undefined {
    return friends.value.find(f => f.friendId === friendId);
  }

  /**
   * 初始化（加载所有数据）
   */
  async function initialize() {
    await Promise.all([
      loadFriends(),
      loadReceivedRequests(),
      loadSentRequests(),
    ]);
  }

  /**
   * 清空状态
   */
  function reset() {
    friends.value = [];
    receivedRequests.value = [];
    sentRequests.value = [];
    loading.value = false;
  }

  return {
    // 状态
    friends,
    receivedRequests,
    sentRequests,
    loading,

    // 计算属性
    friendsCount,
    pendingRequestsCount,
    acceptedFriends,
    onlineFriends,

    // 方法
    loadFriends,
    loadReceivedRequests,
    loadSentRequests,
    sendFriendRequest,
    handleFriendRequest,
    removeFriend,
    updateRemark,
    getFriendById,
    initialize,
    reset,
  };
});
