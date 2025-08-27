// 用户相关类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 登录表单类型
export interface LoginForm {
  username: string;
  password: string;
}

// 注册表单类型
export interface RegisterForm {
  username: string;
  password: string;
  captchaCode: string;
  captchaId: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// 验证码响应类型
export interface CaptchaResponse {
  captchaId: string;
  imageData: string;
}

// 认证状态类型
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// 应用配置类型
export interface AppConfig {
  serverUrl: string;
  theme: 'light' | 'dark';
  language: string;
  autoLogin: boolean;
}
