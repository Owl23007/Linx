import type { AppConfig, AuthState, User } from '@/types/models';

/**
 * 本地存储服务
 * 负责数据的本地持久化存储
 */
export class StorageService {
  private static instance: StorageService;
  private readonly prefix = 'linx_app_';

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }

    return StorageService.instance;
  }

  // 生成带前缀的键名
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // 保存数据到 localStorage
  setItem<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serializedValue);
    } catch (error) {
      throw new Error(`Failed to save data to localStorage: ${error}`);
    }
  }

  // 从 localStorage 获取数据
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) {
        return defaultValue || null;
      }

      return JSON.parse(item) as T;
    } catch {
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      return null;
    }
  }

  // 删除 localStorage 中的数据
  removeItem(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  // 清空所有应用相关的数据
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // 保存应用配置
  saveConfig(config: AppConfig): void {
    this.setItem('config', config);
  }

  // 获取应用配置
  getConfig(): AppConfig | null {
    return this.getItem<AppConfig>('config');
  }

  // 保存认证状态
  saveAuthState(authState: AuthState): void {
    // 不保存敏感信息到 localStorage，只保存必要的状态
    const safeAuthState = {
      isAuthenticated: authState.isAuthenticated,
      user: authState.user,
      // 不保存 token，token 应该存储在更安全的地方或者使用 httpOnly cookie
    };
    this.setItem('authState', safeAuthState);
  }

  // 获取认证状态
  getAuthState(): Partial<AuthState> | null {
    return this.getItem<Partial<AuthState>>('authState');
  }

  // 保存用户信息
  saveUser(user: User): void {
    this.setItem('user', user);
  }

  // 获取用户信息
  getUser(): User | null {
    return this.getItem<User>('user');
  }

  // 保存令牌（建议使用更安全的存储方式）
  saveToken(token: string): void {
    // 注意：在生产环境中，建议使用 httpOnly cookie 或其他更安全的方式存储 token
    this.setItem('token', token);
  }

  // 获取令牌
  getToken(): string | null {
    return this.getItem<string>('token');
  }

  // 清除认证相关信息
  clearAuth(): void {
    this.removeItem('authState');
    this.removeItem('user');
    this.removeItem('token');
  }

  // 保存最后登录的服务器地址
  saveLastServerUrl(url: string): void {
    this.setItem('lastServerUrl', url);
  }

  // 获取最后登录的服务器地址
  getLastServerUrl(): string | null {
    return this.getItem<string>('lastServerUrl');
  }

  // 保存窗口状态（仅在 Electron 环境中使用）
  saveWindowState(state: { width: number; height: number; x: number; y: number; isMaximized: boolean }): void {
    this.setItem('windowState', state);
  }

  // 获取窗口状态
  getWindowState(): { width: number; height: number; x: number; y: number; isMaximized: boolean } | null {
    return this.getItem('windowState');
  }

  // 保存应用主题
  saveTheme(theme: 'light' | 'dark'): void {
    this.setItem('theme', theme);
  }

  // 获取应用主题
  getTheme(): 'light' | 'dark' | null {
    return this.getItem<'light' | 'dark'>('theme');
  }

  // 保存语言设置
  saveLanguage(language: string): void {
    this.setItem('language', language);
  }

  // 获取语言设置
  getLanguage(): string | null {
    return this.getItem<string>('language');
  }

  // 检查存储空间
  getStorageInfo(): { used: number; available: number } {
    let used = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key) && key.startsWith(this.prefix)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }

    // localStorage 通常有 5-10MB 的限制
    const totalAvailable = 5 * 1024 * 1024; // 5MB

    return {
      used,
      available: totalAvailable - used,
    };
  }

  // 导出所有应用数据
  exportData(): Record<string, any> {
    const data: Record<string, any> = {};
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key) && key.startsWith(this.prefix)) {
        const appKey = key.replace(this.prefix, '');
        try {
          data[appKey] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          data[appKey] = localStorage.getItem(key);
        }
      }
    }

    return data;
  }

  // 导入应用数据
  importData(data: Record<string, any>): void {
    Object.keys(data).forEach(key => {
      this.setItem(key, data[key]);
    });
  }
}
