// utils/http.ts
import { useGlobalStore } from '@/stores/global';
import axios from 'axios';
import { ref } from 'vue';

// 创建实例（baseURL 留空，后面动态设置）
const http = axios.create({
  timeout: 10000,
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

const tempEndpoint = ref<string>('');

// 请求拦截器 —— 每次请求前设置 baseURL + token
http.interceptors.request.use(config => {
  // 从 localStorage 读 endpoint（登录后设置）
  const endpoint = tempEndpoint.value || useGlobalStore().endpoint || localStorage.getItem('apiEndpoint') || import.meta.env.VITE_DEFAULT_BASE_URL;
  config.baseURL = endpoint;

  // 自动加 token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 响应拦截器 —— 统一处理错误 + 只返回 data
http.interceptors.response.use(
  res => res.data, // 直接返回后端 data，不用 res.data.data
  err => {
    return Promise.reject(err);
  }
);

// 导出简单易用的方法
export const get = (url: string, params?: any,endpoint?: string) => {
  if (endpoint) {
    tempEndpoint.value = endpoint;
  }

  return http.get(url, { params }).finally(() => {
    if (endpoint) {
      tempEndpoint.value = ''; // 请求完成后清空
    }
  });
};

export const post = (url: string, data?: any, endpoint?: string) => {
  if (endpoint) tempEndpoint.value = endpoint;

  return http.post(url, data).finally(() => {
    if (endpoint) tempEndpoint.value = '';
  });
};

export const put = (url: string, data?: any, endpoint?: string) => {
  if (endpoint) tempEndpoint.value = endpoint;

  return http.put(url, data).finally(() => {
    if (endpoint) tempEndpoint.value = '';
  });
};

export const del = (url: string, endpoint?: string) => {
  if (endpoint) tempEndpoint.value = endpoint;

  return http.delete(url).finally(() => {
    if (endpoint) tempEndpoint.value = '';
  });
};
// 导出原始实例
export default http;
