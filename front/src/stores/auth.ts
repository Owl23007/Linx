import type { RegisterRequest, UserInfo } from '@/models/auth';
import * as authApi from '@/request/auth';
import authService from '@/services/authService';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

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
      }

      return response;
    } finally {
      loading.value = false;
    }
  }

  async function loginWithRefreshToken(refreshToken: string, endpoint: string) {
    if (loading.value) return;
    loading.value = true;
    try {
      const response = await authService.loginWithRefreshToken(refreshToken, endpoint);
      if (response.code == 0) {
        token.value = response.data.accessToken;
        localStorage.setItem('token', response.data.accessToken);
        // 如果后端返回了新的 refreshToken，也更新它
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
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
      // 调用登出 API
      await authApi.logout();
    } catch {
      // 即使API调用失败，也要清除本地状态
    } finally {
      user.value = null;
      token.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('user');
      loading.value = false;
    }
  }

  function initAuth() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('userProfile') || localStorage.getItem('user');

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
    loginWithRefreshToken,
    register,
    logout,
    initAuth
  };
});
