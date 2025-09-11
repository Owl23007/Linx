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

export default {
  getCaptcha,
  login,
  register,
  getUserInfo,
  refreshToken,
  logout,
};
