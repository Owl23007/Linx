/**
 * API统一导出
 */

// 导出请求工具
export * from './request';

// 导出认证相关API
export * from './auth';

// 默认导出
import authApi from './auth';
import requestApi from './request';

export default {
    auth: authApi,
    request: requestApi,
};
