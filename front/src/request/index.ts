/**
 * API统一导出
 */
// 导出请求工具
export * from '../utils/http';

// 导出认证相关API
export * from './auth';

import { ref } from 'vue';
import requestApi from '../utils/http';
import authApi from './auth';

const route = ref();

export default {
  auth: authApi,
  request: requestApi,
  route,
};
