import type { UserInfo } from '@/models/auth';
import type { CreateProfileImageUploadPayload, ProfileImageUploadUrlVO } from '@/request/user';
import linxApi from '@/services/linxApiService';
import type { UserStatus, UserVO } from '@/types/user';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useAuthStore } from './auth';

const USER_STORAGE_KEY = 'userProfile';
const LEGACY_USER_STORAGE_KEY = 'user';
const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const BACKGROUND_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const PROFILE_IMAGE_EXTENSION_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

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

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10}MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round((bytes / 1024) * 10) / 10}KB`;
  }

  return `${bytes}B`;
}

function resolveProfileImageContentType(file: File): string | null {
  const normalizedType = toOptionalString(file.type)?.toLowerCase();

  if (normalizedType && ALLOWED_PROFILE_IMAGE_TYPES.has(normalizedType)) {
    return normalizedType;
  }

  const dotIndex = file.name.lastIndexOf('.');
  if (dotIndex === -1) {
    return null;
  }

  const extension = file.name.slice(dotIndex + 1).trim().toLowerCase();
  if (!extension) {
    return null;
  }

  return PROFILE_IMAGE_EXTENSION_MAP[extension] || null;
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

  async function uploadProfileImage(file: File, imageType: 'avatar' | 'background'): Promise<string | null> {
    const contentType = resolveProfileImageContentType(file);

    if (!contentType) {
      ElMessage.error('仅支持 JPG、PNG、WEBP、GIF 图片');

      return null;
    }

    const maxSizeBytes = imageType === 'avatar' ? AVATAR_MAX_SIZE_BYTES : BACKGROUND_MAX_SIZE_BYTES;
    if (file.size > maxSizeBytes) {
      const label = imageType === 'avatar' ? '头像' : '背景图';
      ElMessage.error(`${label}大小不能超过 ${formatFileSize(maxSizeBytes)}`);

      return null;
    }

    const payload: CreateProfileImageUploadPayload = {
      filename: file.name || `${imageType}.jpg`,
      contentType,
      fileSize: file.size,
    };

    try {
      const createRes = imageType === 'avatar'
        ? await linxApi.user.createAvatarUploadUrl(payload)
        : await linxApi.user.createBackgroundUploadUrl(payload);

      if (createRes.code !== 0) {
        ElMessage.error(createRes.message || '生成上传地址失败');

        return null;
      }

      const uploadInfo = createRes.data as ProfileImageUploadUrlVO | undefined;
      const uploadUrl = toOptionalString(uploadInfo?.uploadUrl);
      const objectName = toOptionalString(uploadInfo?.objectName);
      const publicUrl = toOptionalString(uploadInfo?.publicUrl);
      const method = toOptionalString(uploadInfo?.method)?.toUpperCase() || 'PUT';

      if (!uploadUrl || !objectName) {
        ElMessage.error('上传地址响应缺少必要字段');

        return null;
      }

      if (method !== 'PUT') {
        ElMessage.error(`暂不支持 ${method} 上传方式`);

        return null;
      }

      const uploadContentType = toOptionalString(uploadInfo?.contentType) || contentType;
      const uploadHeaders: Record<string, string> = {};
      if (uploadInfo?.headers) {
        for (const [headerName, headerValue] of Object.entries(uploadInfo.headers)) {
          const normalizedValue = toOptionalString(headerValue);
          if (normalizedValue) {
            uploadHeaders[headerName] = normalizedValue;
          }
        }
      }
      uploadHeaders['Content-Type'] = uploadContentType;

      await axios.request({
        url: uploadUrl,
        method: 'PUT',
        headers: uploadHeaders,
        data: file,
      });

      const confirmRes = imageType === 'avatar'
        ? await linxApi.user.confirmAvatarUpload(objectName)
        : await linxApi.user.confirmBackgroundUpload(objectName);

      if (confirmRes.code !== 0) {
        ElMessage.error(confirmRes.message || '确认上传失败');

        return null;
      }

      const latestUser = setCurrentUser(confirmRes.data);
      const fallbackUrl = publicUrl || '';
      const finalUrl = imageType === 'avatar'
        ? latestUser?.avatarImage || latestUser?.avatar || fallbackUrl
        : latestUser?.backgroundImage || fallbackUrl;

      ElMessage.success(confirmRes.message || (imageType === 'avatar' ? '头像上传成功' : '背景图上传成功'));

      return finalUrl || null;
    } catch (error: unknown) {
      let errorMessage = '';
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as { message?: unknown } | undefined;
        errorMessage = toOptionalString(responseData?.message) || '';
      }

      ElMessage.error(errorMessage || '上传图片失败');

      return null;
    }
  }

  async function uploadAvatar(file: File): Promise<string | null> {
    return uploadProfileImage(file, 'avatar');
  }

  async function uploadBackground(file: File): Promise<string | null> {
    return uploadProfileImage(file, 'background');
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
    uploadAvatar,
    uploadBackground,
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
