import axios from 'axios';

/**
 * 基础请求封装
 */

// 响应数据接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 创建axios实例
const instance = axios.create({
  baseURL: 'http://localhost:8081',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// 响应拦截器
instance.interceptors.response.use(
  response => {
    const { data } = response;

    // 这里可以根据后端的响应格式进行调整
    if (data.code === 200 || data.code === 0) {
      return response; // 返回完整的响应对象
    } else {
      return Promise.reject(new Error(data.message || '请求失败'));
    }
  },
  error => {
    // HTTP错误处理
    if (error.response) {
      const { status, data } = error.response;

      console.error(`HTTP ${status}:`, data?.message || error.message);

      // 可以根据状态码进行特殊处理
      switch (status) {
        case 401:
        // 未授权，可以跳转到登录页
          break;
        case 403:
        // 禁止访问
          break;
        case 404:
        // 资源不存在
          break;
        case 500:
        // 服务器错误
          break;
      }
    } else {
      console.error('Network Error:', error.message);
    }

    return Promise.reject(error);
  },
);

/**
 * GET 请求
 */
export function get<T = any>(url: string, params?: any, config?: any): Promise<T> {
  return instance.get(url, { params, ...config }).then(res => res.data);
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, data?: any, config?: any): Promise<T> {
  return instance.post(url, data, config).then(res => res.data);
}

/**
 * PUT 请求
 */
export function put<T = any>(url: string, data?: any, config?: any): Promise<T> {
  return instance.put(url, data, config).then(res => res.data);
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, params?: any, config?: any): Promise<T> {
  return instance.delete(url, { params, ...config }).then(res => res.data);
}

// 导出实例，以便在其他地方直接使用
export { instance as axiosInstance };

export default {
  get,
  post,
  put,
  delete: del,
  instance,
};
