import type { UserInfo } from '@/models/auth';
import linxApi from '@/services/linxApiService';
import type { UserStatus, UserVO } from '@/types/user';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useAuthStore } from './auth';

const USER_STORAGE_KEY = 'userProfile';
const LEGACY_USER_STORAGE_KEY = 'user';

function toOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed || undefined;
  }

  if (typeof value === 'number') {
    return `${value}`;
  }

  return undefined;
}

function normalizePresenceStatus(status: unknown): UserStatus | undefined {
  const normalized = toOptionalString(status)?.toUpperCase();

  if (normalized === 'ONLINE' || normalized === 'OFFLINE' || normalized === 'AWAY' || normalized === 'DND' || normalized === 'HIDDEN') {
    return normalized;
  }

  return undefined;
}

function normalizeUser(raw: unknown): UserVO | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as Record<string, unknown>;
  const rawId = source.userId ?? source.id;
  const numericId = typeof rawId === 'number' ? rawId : Number(rawId);
  const userId = Number.isFinite(numericId) ? numericId : undefined;
  const username = toOptionalString(source.username);
  const nickname = toOptionalString(source.nickname);
  const avatarImage = toOptionalString(source.avatarImage ?? source.avatar ?? source.avatarUrl ?? source.avatar_url);
  const presenceStatus = normalizePresenceStatus(source.status);

  return {
    userId,
    id: userId,
    username,
    nickname,
    avatar: avatarImage,
    avatarImage,
    email: toOptionalString(source.email),
    phone: toOptionalString(source.phone),
    signature: toOptionalString(source.signature),
    backgroundImage: toOptionalString(source.backgroundImage ?? source.background),
    role: toOptionalString(source.role),
    status: presenceStatus,
    accountStatus: presenceStatus ? undefined : toOptionalString(source.status),
    lastSeenAt: toOptionalString(source.lastSeenAt),
    createdAt: toOptionalString(source.createdAt ?? source.createTime),
    updatedAt: toOptionalString(source.updatedAt ?? source.updateTime),
  };
}

function toAuthUser(user: UserVO | null): UserInfo | null {
  if (!user) {
    return null;
  }

  return {
    userId: user.userId,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    phone: user.phone,
    signature: user.signature,
    avatarImage: user.avatarImage ?? user.avatar,
    backgroundImage: user.backgroundImage,
    status: user.accountStatus ?? user.status,
    role: user.role,
  };
}

export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore();

  const currentUser = ref<UserVO | null>(null);
  const userCache = ref<Map<number, UserVO>>(new Map());
  const loading = ref(false);

  const isOnline = computed(() => currentUser.value?.status === 'ONLINE');
  const userId = computed(() => currentUser.value?.userId);
  const username = computed(() => currentUser.value?.username);
  const displayName = computed(() => currentUser.value?.nickname || currentUser.value?.username || '联机玩家');
  const avatarUrl = computed(() => currentUser.value?.avatarImage || currentUser.value?.avatar || '');
  const initials = computed(() => {
    const source = displayName.value.trim();

    return source.slice(0, 1).toUpperCase() || 'L';
  });

  function persistCurrentUser(user: UserVO | null) {
    if (user) {
      const payload = JSON.stringify(user);
      localStorage.setItem(USER_STORAGE_KEY, payload);
      localStorage.setItem(LEGACY_USER_STORAGE_KEY, payload);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
    }
  }

  function syncAuthUser(user: UserVO | null) {
    authStore.user = toAuthUser(user);
  }

  function updateCache(user: UserVO | null) {
    if (!user?.userId) {
      return;
    }

    userCache.value.set(user.userId, user);
  }

  function setCurrentUser(user: unknown, persist = true): UserVO | null {
    const normalizedUser = normalizeUser(user);
    currentUser.value = normalizedUser;
    syncAuthUser(normalizedUser);

    if (normalizedUser) {
      updateCache(normalizedUser);
    }

    if (persist) {
      persistCurrentUser(normalizedUser);
    }

    return normalizedUser;
  }

  function hydrate() {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem(LEGACY_USER_STORAGE_KEY);

    if (!savedUser) {
      return null;
    }

    try {
      return setCurrentUser(JSON.parse(savedUser), false);
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(LEGACY_USER_STORAGE_KEY);

      return null;
    }
  }

  async function loadCurrentUser() {
    loading.value = true;

    try {
      const res = await linxApi.user.getCurrent();
      if (res.code === 0) {
        return setCurrentUser(res.data);
      }

      ElMessage.error(res.message || '获取用户信息失败');

      return currentUser.value;
    } catch {
      ElMessage.error('获取用户信息失败');

      return currentUser.value;
    } finally {
      loading.value = false;
    }
  }

  async function updateProfile(payload: {
    nickname?: string;
    phone?: string;
    signature?: string;
    avatarImage?: string;
    backgroundImage?: string;
  }) {
    try {
      const res = await linxApi.user.updateProfile(payload);
      if (res.code === 0) {
        setCurrentUser(res.data);
        ElMessage.success(res.message || '个人资料更新成功');

        return true;
      }

      ElMessage.error(res.message || '个人资料更新失败');

      return false;
    } catch {
      ElMessage.error('个人资料更新失败');

      return false;
    }
  }

  async function getUserById(targetUserId: number, forceRefresh = false): Promise<UserVO | undefined> {
    if (!forceRefresh && userCache.value.has(targetUserId)) {
      return userCache.value.get(targetUserId);
    }

    try {
      const res = await linxApi.user.getById(targetUserId);
      if (res.code === 0) {
        const normalizedUser = normalizeUser(res.data);

        if (normalizedUser?.userId) {
          userCache.value.set(normalizedUser.userId, normalizedUser);
        }

        return normalizedUser || undefined;
      }
    } catch {
      // 静默失败，交给调用方处理空结果
    }
  }

  async function getUsersByIds(userIds: number[]): Promise<UserVO[]> {
    const uncachedIds = userIds.filter((id) => !userCache.value.has(id));

    if (uncachedIds.length > 0) {
      await Promise.all(uncachedIds.map((id) => getUserById(id)));
    }

    return userIds
      .map((id) => userCache.value.get(id))
      .filter((user): user is UserVO => user !== undefined);
  }

  async function updateStatus(status: UserStatus) {
    try {
      const apiStatus = status.toLowerCase() as 'online' | 'offline' | 'away' | 'dnd' | 'hidden';
      const res = await linxApi.user.updateStatus(apiStatus);

      if (res.code === 0) {
        if (currentUser.value) {
          currentUser.value = {
            ...currentUser.value,
            status,
          };
          updateCache(currentUser.value);
          persistCurrentUser(currentUser.value);
          syncAuthUser(currentUser.value);
        }

        ElMessage.success(`状态已更新为：${getStatusText(status)}`);

        return true;
      }

      ElMessage.error(res.message || '更新状态失败');

      return false;
    } catch {
      ElMessage.error('更新状态失败');

      return false;
    }
  }

  async function searchUsers(keyword: string) {
    try {
      const res = await linxApi.user.search(keyword);
      if (res.code === 0 && Array.isArray(res.data)) {
        return res.data
          .map((item: unknown) => normalizeUser(item))
          .filter((user): user is UserVO => user !== null);
      }

      ElMessage.error(res.message || '搜索用户失败');

      return [];
    } catch {
      return [];
    }
  }

  function clearCache(targetUserId?: number) {
    if (typeof targetUserId === 'number') {
      userCache.value.delete(targetUserId);

      return;
    }

    userCache.value.clear();
  }

  async function initialize(forceRefresh = false) {
    if (!currentUser.value) {
      hydrate();
    }

    if (forceRefresh || (authStore.token && !loading.value)) {
      await loadCurrentUser();
    }

    return currentUser.value;
  }

  function reset() {
    currentUser.value = null;
    userCache.value.clear();
    loading.value = false;
    persistCurrentUser(null);
    syncAuthUser(null);
  }

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
    currentUser,
    userCache,
    loading,
    isOnline,
    userId,
    username,
    displayName,
    avatarUrl,
    initials,
    hydrate,
    setCurrentUser,
    loadCurrentUser,
    updateProfile,
    getUserById,
    getUsersByIds,
    updateStatus,
    searchUsers,
    clearCache,
    initialize,
    reset,
    getStatusText,
    getStatusColor,
  };
});
