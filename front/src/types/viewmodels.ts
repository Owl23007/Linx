import type { Ref } from 'vue';
import type { LoginForm, RegisterForm, User, AppConfig } from './models';

// 基础 ViewModel 接口
export interface BaseViewModel {
  loading: Ref<boolean>;
  error: Ref<string | null>;
  dispose(): void;
}

// 登录 ViewModel 接口
export interface LoginViewModel extends BaseViewModel {
  loginForm: Ref<LoginForm>;
  registerForm: Ref<RegisterForm>;
  activeTab: Ref<'login' | 'register'>;
  serverUrl: Ref<string>;
  captchaImage: Ref<string>;

  // 方法
  login(): Promise<boolean>;
  register(): Promise<boolean>;
  refreshCaptcha(): Promise<void>;
  switchTab(tab: 'login' | 'register'): void;
  validateForm(): boolean;
}

// 用户 ViewModel 接口
export interface UserViewModel extends BaseViewModel {
  user: Ref<User | null>;
  isAuthenticated: Ref<boolean>;

  // 方法
  getCurrentUser(): Promise<User | null>;
  updateProfile(data: Partial<User>): Promise<boolean>;
  logout(): Promise<void>;
}

// 应用 ViewModel 接口
export interface AppViewModel extends BaseViewModel {
  config: Ref<AppConfig>;
  isElectron: Ref<boolean>;

  // 方法
  updateConfig(config: Partial<AppConfig>): Promise<void>;
  minimizeWindow(): void;
  closeWindow(): void;
  toggleTheme(): void;
}
