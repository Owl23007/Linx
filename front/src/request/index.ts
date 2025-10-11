/**
 * API统一导出
 */
// 导出请求工具
export * from '../utils/http';

// 导出认证相关API
export * as authApi from './auth';

// 导出聊天相关API
export * as chatApi from './chat';

// 导出好友相关API
export * as friendsApi from './friends';

// 导出群组相关API
export * as groupsApi from './groups';

// 导出用户相关API
export * as userApi from './user';

import { ref } from 'vue';

const route = ref();

export default {
  route,
};
