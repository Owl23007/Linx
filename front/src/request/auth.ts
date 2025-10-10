import type { RegisterRequest } from '@/models/auth';
import type { Result } from '@/models/common';
import { get, post } from '../utils/http';

/**
 * 获取验证码（base64 字符串）
 */
export function getCaptcha(serverUrl: string): Promise<Result> {
  return get('/auth/captcha', {}, serverUrl);
}

/**
 * 用户登录
 */
export function login(data:any, endpoint: string): Promise<Result> {
  return post('/auth/login', data, endpoint);
}

/**
 * 用户注册
 */
export function register(data: RegisterRequest, endpoint: string): Promise<Result> {
  return post('/registration/register', data, endpoint);
}

/**
 * 获取当前用户信息
 */
export function getUserInfo(): Promise<Result> {
  return get('/auth/userinfo');
}

/**
 * 刷新 token
 */
export function refreshToken(): Promise<Result> {
  return post('/auth/refresh');
}

/**
 * 用户登出
 */
export function logout(): Promise<void> {
  return post('/auth/logout');
}

/**
 * 建立 WebSocket 会话
 * 通过 HTTP 接口先建立会话,服务器会将用户信息存储在 session 中
 * 之后的 WebSocket 连接会复用这个 session
 */
export function establishWebSocketSession(): Promise<Result> {
  return post('/auth/ws-session');
}

export default {
  getCaptcha,
  login,
  register,
  getUserInfo,
  refreshToken,
  logout
};
