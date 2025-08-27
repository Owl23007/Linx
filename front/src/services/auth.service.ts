import type { LoginForm, RegisterForm, User, ApiResponse, CaptchaResponse } from '@/types/models';
import request from '@/api/request';

/**
 * 认证服务
 * 负责用户认证相关的API调用
 */
export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }

    return AuthService.instance;
  }

  // 用户登录
  async login(loginData: LoginForm): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const response = await request.post('/auth/login', loginData);

      return response.data;
    } catch (error: any) {
      return {
        code: -1,
        message: error.message || '登录失败',
        data: undefined,
      };
    }
  }

  // 用户注册
  async register(registerData: RegisterForm): Promise<ApiResponse<User>> {
    try {
      const response = await request.post('/auth/register', registerData);

      return response.data;
    } catch (error: any) {
      return {
        code: -1,
        message: error.message || '注册失败',
        data: undefined,
      };
    }
  }

  // 获取验证码
  async getCaptcha(): Promise<ApiResponse<CaptchaResponse>> {
    try {
      const response = await request.get('/auth/captcha');

      return response.data;
    } catch (error: any) {
      return {
        code: -1,
        message: error.message || '获取验证码失败',
        data: undefined,
      };
    }
  }

  // 验证令牌
  async validateToken(token: string): Promise<ApiResponse<User>> {
    try {
      const response = await request.get('/auth/validate', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      return {
        code: -1,
        message: error.message || '令牌验证失败',
        data: undefined,
      };
    }
  }

  // 刷新令牌
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    try {
      const response = await request.post('/auth/refresh', { refreshToken });

      return response.data;
    } catch (error: any) {
      return {
        code: -1,
        message: error.message || '刷新令牌失败',
        data: undefined,
      };
    }
  }

  // 用户登出
  async logout(token: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await request.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      return {
        code: -1,
        message: error.message || '登出失败',
        data: false,
      };
    }
  }

  // 获取当前用户信息
  async getCurrentUser(token: string): Promise<ApiResponse<User>> {
    try {
      const response = await request.get('/user/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      return {
        code: -1,
        message: error.message || '获取用户信息失败',
        data: undefined,
      };
    }
  }

  // 更新用户信息
  async updateProfile(token: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await request.put('/user/profile', userData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      return {
        code: -1,
        message: error.message || '更新用户信息失败',
        data: undefined,
      };
    }
  }

  // 修改密码
  async changePassword(token: string, oldPassword: string, newPassword: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await request.post('/user/change-password', {
        oldPassword,
        newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      return {
        code: -1,
        message: error.message || '修改密码失败',
        data: false,
      };
    }
  }
}
