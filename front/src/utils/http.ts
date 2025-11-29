// utils/http.ts
import { useGlobalStore } from '@/stores/global';
import axios, { type AxiosRequestConfig } from 'axios';
import { ref } from 'vue';

const http = axios.create({
  timeout: 10000,
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 启用携带 cookie,用于会话管理
});

const tempEndpoint = ref<string>('');

// 请求拦截器
http.interceptors.request.use(config => {
  const endpoint =
    tempEndpoint.value ||
    useGlobalStore().endpoint ||
    localStorage.getItem('apiEndpoint') ||
    import.meta.env.VITE_DEFAULT_BASE_URL;

  config.baseURL = endpoint;

  const token = localStorage.getItem('token');
  if (token && !config.headers?.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 可选：如果是 FormData，移除 Content-Type
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// 响应拦截器 —— 返回 res.data
http.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err)
);

// 断言 http 为一个“直接返回 T”的客户端
const client = http as {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
};

// 导出的方法基于 `client`
export const get = <T = any>(
  url: string,
  params?: Record<string, any>,
  endpoint?: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  if (endpoint) tempEndpoint.value = endpoint;

  return client.get<T>(url, { params, ...config }).finally(() => {
    if (endpoint) tempEndpoint.value = '';
  });
};

export const post = <T = any>(
  url: string,
  data?: Record<string, any> | FormData,
  endpoint?: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  if (endpoint) tempEndpoint.value = endpoint;

  return client.post<T>(url, data, config).finally(() => {
    if (endpoint) tempEndpoint.value = '';
  });
};

export const put = <T = any>(
  url: string,
  data?: Record<string, any> | FormData,
  endpoint?: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  if (endpoint) tempEndpoint.value = endpoint;

  return client.put<T>(url, data, config).finally(() => {
    if (endpoint) tempEndpoint.value = '';
  });
};

export const del = <T = any>(
  url: string,
  endpoint?: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  if (endpoint) tempEndpoint.value = endpoint;

  return client.delete<T>(url, config).finally(() => {
    if (endpoint) tempEndpoint.value = '';
  });
};

export default http;
