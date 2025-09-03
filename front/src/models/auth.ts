import type { AuthState, LoginForm, RegisterForm } from '@/types/models';

/**
 * 认证模型类
 * 负责认证相关的数据管理和验证
 */
export class AuthModel {
  private _state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
  };

  // 获取认证状态
  get state(): AuthState {
    return { ...this._state };
  }

  // 获取是否已认证
  get isAuthenticated(): boolean {
    return this._state.isAuthenticated && !!this._state.token;
  }

  // 获取令牌
  get token(): string | null {
    return this._state.token;
  }

  // 设置认证状态
  setAuthState(authData: Partial<AuthState>): void {
    this._state = {
      ...this._state,
      ...authData,
    };
  }

  // 设置令牌
  setToken(token: string): void {
    this._state.token = token;
    this._state.isAuthenticated = true;
  }

  // 清除认证信息
  clearAuth(): void {
    this._state = {
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    };
  }

  // 验证登录表单
  validateLoginForm(form: LoginForm): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!form.username || form.username.trim().length < 3) {
      errors.push('用户名长度至少为3个字符');
    }

    if (!form.password || form.password.length < 6) {
      errors.push('密码长度至少为6个字符');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 验证注册表单
  validateRegisterForm(form: RegisterForm): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!form.username || form.username.trim().length < 3) {
      errors.push('用户名长度至少为3个字符');
    }

    if (!form.password || form.password.length < 6) {
      errors.push('密码长度至少为6个字符');
    }

    if (!form.captchaCode || form.captchaCode.trim().length === 0) {
      errors.push('请输入验证码');
    }

    if (!form.captchaId || form.captchaId.trim().length === 0) {
      errors.push('验证码已失效，请刷新');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.username)) {
      errors.push('请输入有效的邮箱地址');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 序列化认证状态
  toJSON(): AuthState {
    return { ...this._state };
  }

  // 从JSON恢复认证状态
  static fromJSON(json: any): AuthModel {
    const auth = new AuthModel();
    if (json) {
      auth.setAuthState(json);
    }

    return auth;
  }
}
