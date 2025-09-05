import type { LoginRequest, RegisterRequest, UserInfo } from '@/request/auth';
import * as authApi from '@/request/auth';
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
  async function login(form: LoginRequest) {
    loading.value = true;
    try {
      const response = await authApi.login(form);
      token.value = response.data.token;
      user.value = response.data.userInfo;

      // 保存到本地存储
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.userInfo));

      return response;
    } finally {
      loading.value = false;
    }
  }

  async function register(form: RegisterRequest) {
    loading.value = true;
    try {
      const response = await authApi.register(form);

      return response;
    } finally {
      loading.value = false;
    }
  }

  async function logoutUser() {
    loading.value = true;
    try {
      await authApi.logout();
    } catch {
      // 即使API调用失败，也要清除本地状态
    } finally {
      user.value = null;
      token.value = null;
      localStorage.removeItem('token');
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
    logout: logoutUser,
    initAuth
  };
});
