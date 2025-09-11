import { get, post } from '../utils/http';

// ============ 类型定义 ============

// 登录请求
export interface LoginRequest {
  serverEndpoint?: string
  username: string
  password: string
}

// 注册请求
export interface RegisterRequest {
  serverEndpoint?: string
  username: string
  password: string
  captchaCode: string
  captchaId?: string
}

// 用户信息
export interface UserInfo {
  id: string
  username: string
  email?: string
  avatar?: string
  createTime?: string
}

// 登录响应
export interface LoginResponse {
  token: string
  userInfo: UserInfo
}

export interface Result {
  code: number
  message: string
  data: any
}
// ============ API 函数 ============

/**
 * 获取验证码（base64 字符串）
 */
export function getCaptcha(serverUrl: string): Promise<Result> {
  return get('/auth/captcha', {}, serverUrl);
}

/**
 * 用户登录
 */
export function login(data: LoginRequest): Promise<LoginResponse> {
  return post('/auth/login', data, data.serverEndpoint);
}

/**
 * 用户注册
 */
export function register(data: RegisterRequest): Promise<UserInfo> {
  return post('/auth/register', data, data.serverEndpoint);
}

/**
 * 获取当前用户信息
 */
export function getUserInfo(): Promise<UserInfo> {
  return get('/auth/userinfo');
}

/**
 * 刷新 token
 */
export function refreshToken(): Promise<{ token: string }> {
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
