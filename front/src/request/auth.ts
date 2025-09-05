import type { ApiResponse } from '../utils/http';
import { get, post } from '../utils/http';

/**
 * 认证相关API
 */

export type CaptchaResponse = string;

// 登录请求数据类型
export interface LoginRequest {
  serverEndpoint?: string
  username: string
  password: string
}

// 注册请求数据类型
export interface RegisterRequest {
  serverEndpoint?: string
  username: string
  password: string
  captchaCode: string
  captchaId?: string
}

// 用户信息类型
export interface UserInfo {
  id: string
  username: string
  email?: string
  avatar?: string
  createTime?: string
}

// 登录响应数据类型
export interface LoginResponse {
  token: string
  userInfo: UserInfo
}

/**
 * 获取验证码
 */
export function getCaptcha(): Promise<ApiResponse<CaptchaResponse>> {
  return get<ApiResponse<CaptchaResponse>>('/auth/captcha');
}

/**
 * 用户登录
 */
export function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return post<ApiResponse<LoginResponse>>('/auth/login', data);
}

/**
 * 用户注册
 */
export function register(data: RegisterRequest) {
  return post<ApiResponse<UserInfo>>('/auth/register', data);
}

/**
 * 获取用户信息
 */
export function getUserInfo(): Promise<ApiResponse<UserInfo>> {
  return get<ApiResponse<UserInfo>>('/auth/userinfo');
}

/**
 * 刷新token
 */
export function refreshToken(): Promise<ApiResponse<{ token: string }>> {
  return post<ApiResponse<{ token: string }>>('/auth/refresh');
}

/**
 * 用户登出
 */
export function logout(): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/auth/logout');
}

export default {
  getCaptcha,
  login,
  register,
  getUserInfo,
  refreshToken,
  logout,
};
