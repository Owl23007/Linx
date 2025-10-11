import linxApi from '@/services/linxApiService';
import type { UserStatus, UserVO } from '@/types/user';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * 用户状态管理 Store
 */
export const useUserStore = defineStore('user', () => {
  // ==================== 状态 ====================
  const currentUser = ref<UserVO | null>(null);
  const userCache = ref<Map<number, UserVO>>(new Map());
  const loading = ref(false);

  // ==================== 计算属性 ====================
  const isOnline = computed(() => currentUser.value?.status === 'ONLINE');
  const userId = computed(() => currentUser.value?.userId);
  const username = computed(() => currentUser.value?.username);

  // ==================== 操作方法 ====================

  /**
   * 加载当前用户信息
   */
  async function loadCurrentUser() {
    loading.value = true;
    try {
      const res = await linxApi.user.getCurrent();
      if (res.code === 0) {
        currentUser.value = res.data;

        // 同时缓存到用户缓存中
        if (res.data?.userId) {
          userCache.value.set(res.data.userId, res.data);
        }

        return res.data;
      }
      ElMessage.error(res.message);
    } catch {
      ElMessage.error('获取用户信息失败');
    } finally {
      loading.value = false;
    }
  }

  /**
   * 根据ID获取用户信息（带缓存）
   */
  async function getUserById(userId: number, forceRefresh = false): Promise<UserVO | undefined> {
    // 如果有缓存且不强制刷新，直接返回
    if (!forceRefresh && userCache.value.has(userId)) {
      return userCache.value.get(userId);
    }

    try {
      const res = await linxApi.user.getById(userId);
      if (res.code === 0) {
        userCache.value.set(userId, res.data);

        return res.data;
      }
    } catch {
      // 静默失败
    }
  }

  /**
   * 批量获取用户信息
   */
  async function getUsersByIds(userIds: number[]): Promise<UserVO[]> {
    const uncachedIds = userIds.filter(id => !userCache.value.has(id));

    if (uncachedIds.length > 0) {
      try {
        // TODO: 等待后端实现批量获取接口
        // const res = await linxApi.user.getByIds(uncachedIds);
        // if (res.code === 0) {
        //   res.data.forEach((user: UserVO) => {
        //     userCache.value.set(user.userId, user);
        //   });
        // }

        // 临时方案：逐个获取
        await Promise.all(
          uncachedIds.map(id => getUserById(id))
        );
      } catch {
        // 静默失败
      }
    }

    // 从缓存中返回所有请求的用户
    return userIds
      .map(id => userCache.value.get(id))
      .filter((user): user is UserVO => user !== undefined);
  }

  /**
   * 更新用户状态
   */
  async function updateStatus(status: UserStatus) {
    try {
      // 转换为小写以匹配API要求
      const apiStatus = status.toLowerCase() as 'online' | 'offline' | 'away' | 'dnd' | 'hidden';
      const res = await linxApi.user.updateStatus(apiStatus);
      if (res.code === 0) {
        if (currentUser.value) {
          currentUser.value.status = status;
        }
        ElMessage.success(`状态已更新为：${getStatusText(status)}`);

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch {
      ElMessage.error('更新状态失败');

      return false;
    }
  }

  /**
   * 搜索用户
   */
  async function searchUsers(keyword: string) {
    try {
      // TODO: 等待后端实现搜索接口
      const res = await linxApi.user.search(keyword);
      if (res.code === 0) {
        return res.data || [];
      }
      ElMessage.error(res.message);

      return [];
    } catch {
      // 静默失败

      return [];
    }
  }

  /**
   * 清除用户缓存
   */
  function clearCache(userId?: number) {
    if (userId) {
      userCache.value.delete(userId);
    } else {
      userCache.value.clear();
    }
  }

  /**
   * 初始化
   */
  async function initialize() {
    await loadCurrentUser();
  }

  /**
   * 清空状态
   */
  function reset() {
    currentUser.value = null;
    userCache.value.clear();
    loading.value = false;
  }

  // ==================== 工具函数 ====================

  /**
   * 获取状态文本
   */
  function getStatusText(status: UserStatus): string {
    const statusMap: Record<UserStatus, string> = {
      ONLINE: '在线',
      OFFLINE: '离线',
      AWAY: '离开',
      DND: '勿扰',
      HIDDEN: '隐身',
    };

    return statusMap[status] || status;
  }

  /**
   * 获取状态颜色
   */
  function getStatusColor(status: UserStatus): string {
    const colorMap: Record<UserStatus, string> = {
      ONLINE: '#67C23A',
      OFFLINE: '#909399',
      AWAY: '#E6A23C',
      DND: '#F56C6C',
      HIDDEN: '#909399',
    };

    return colorMap[status] || '#909399';
  }

  return {
    // 状态
    currentUser,
    userCache,
    loading,

    // 计算属性
    isOnline,
    userId,
    username,

    // 方法
    loadCurrentUser,
    getUserById,
    getUsersByIds,
    updateStatus,
    searchUsers,
    clearCache,
    initialize,
    reset,

    // 工具函数
    getStatusText,
    getStatusColor,
  };
});
