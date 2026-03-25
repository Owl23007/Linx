export interface LoginRequest{
  account: string;
  password: string;
}

export interface RegisterRequest{
  username: string;
  email: string;
  password: string;
  captchaCode: string;
  captchaId: string;
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * 用户信息
 */
export interface UserInfo {
  userId?: number;
  username?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  signature?: string;
  avatarImage?: string;
  backgroundImage?: string;
  status?: string;
  role?: string;
}
