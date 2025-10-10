import type { RegisterRequest, UserInfo } from '@/models/auth';
import * as authApi from '@/request/auth';
import authService from '@/services/authService';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useWebSocketStore } from './websocket';

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<UserInfo | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);

  // 计算属性
  const isAuthenticated = computed(() => !!token.value);
  const isLoggedIn = computed(() => !!user.value);

  // 动作
  async function login(form: any, endpoint: string) {
    if (loading.value) return;
    loading.value = true;
    try {
      const response = await authService.login(form, endpoint);
      if (response.code == 0) {
        // 正确保存 accessToken
        token.value = response.data.accessToken;
        // 保存到本地存储
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);

        // 登录成功后自动连接 WebSocket
        try {
          const wsStore = useWebSocketStore();
          const wsUrl = endpoint + '/linx/ws';
          const userId = response.data.userId || 'unknown'; // 从响应中获取用户ID

          console.log('[Auth] WebSocket 尝试连接:', wsUrl,token.value);

          await wsStore.connect(wsUrl, userId, token.value || undefined);
        } catch (wsError: any) {
          // WebSocket 连接失败不影响登录流程,只记录错误
          // eslint-disable-next-line no-console
          console.error('[Auth] WebSocket 连接失败:', wsError);
        }
      }

      return response;
    } finally {
      loading.value = false;
    }
  }

  async function register(form: RegisterRequest, endpoint: string) {
    if (loading.value) return;
    loading.value = true;
    try {
      const response = await authService.register(form, endpoint);

      return response;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    try {
      // 先断开 WebSocket 连接
      try {
        const wsStore = useWebSocketStore();
        await wsStore.disconnect();
      } catch (wsError: any) {
        // eslint-disable-next-line no-console
        console.error('[Auth] WebSocket 断开失败:', wsError);
      }

      // 调用登出 API
      await authApi.logout();
    } catch {
      // 即使API调用失败，也要清除本地状态
    } finally {
      user.value = null;
      token.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      loading.value = false;
    }
  }

  function initAuth() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      token.value = savedToken;
      user.value = JSON.parse(savedUser);
    }
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isLoggedIn,
    login,
    register,
    logout,
    initAuth
  };
});
