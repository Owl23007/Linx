import type { AppConfig } from '@/types/models';

/**
 * 应用配置模型类
 * 负责应用配置的管理和持久化
 */
export class ConfigModel {
  private _config: AppConfig = {
    serverUrl: import.meta.env.VITE_DEFAULT_BASE_URL || 'http://localhost:8082',
    theme: 'light',
    language: 'zh-CN',
    autoLogin: false,
    fontSize: 0,
    notifications: {
      enabled: false,  // 是否启用通知
      sound: false,    // 是否启用声音
      desktop: false   // 是否启用桌面通知
    },
    privacy: {
      showOnlineStatus: false,
      allowDirectMessages: false
    }
  };

  // 获取配置
  get config(): AppConfig {
    return { ...this._config };
  }

  // 获取服务器地址
  get serverUrl(): string {
    return this._config.serverUrl;
  }

  // 设置服务器地址
  setServerUrl(url: string): void {
    if (this.validateUrl(url)) {
      this._config.serverUrl = url;
    }
  }

  // 获取主题
  get theme(): 'light' | 'dark' | 'auto' {
    return this._config.theme;
  }

  // 设置主题
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this._config.theme = theme;
  }

  // 获取语言
  get language(): string {
    return this._config.language;
  }

  // 设置语言
  setLanguage(language: string): void {
    this._config.language = language;
  }

  // 获取自动登录设置
  get autoLogin(): boolean {
    return this._config.autoLogin;
  }

  // 设置自动登录
  setAutoLogin(autoLogin: boolean): void {
    this._config.autoLogin = autoLogin;
  }

  // 更新配置
  updateConfig(updates: Partial<AppConfig>): void {
    // 验证更新的配置
    if (updates.serverUrl && !this.validateUrl(updates.serverUrl)) {
      throw new Error('无效的服务器地址');
    }

    this._config = {
      ...this._config,
      ...updates,
    };
  }

  // 验证URL格式
  private validateUrl(url: string): boolean {
    try {
      new URL(url);

      return true;
    } catch {
      return false;
    }
  }

  // 重置为默认配置
  reset(): void {
    this._config = {
      serverUrl: import.meta.env.VITE_DEFAULT_BASE_URL || 'http://localhost:8082',
      theme: 'light',
      language: 'zh-CN',
      autoLogin: false,
      fontSize: 0,
      notifications: {
        enabled: false,
        sound: false,
        desktop: false
      },
      privacy: {
        showOnlineStatus: false,
        allowDirectMessages: false
      }
    };
  }

  // 序列化配置
  toJSON(): AppConfig {
    return { ...this._config };
  }

  // 从JSON恢复配置
  static fromJSON(json: any): ConfigModel {
    const config = new ConfigModel();
    if (json) {
      try {
        config.updateConfig(json);
      } catch (error) {
        console.warn('配置数据无效，使用默认配置:', error);
      }
    }

    return config;
  }

  // 验证配置完整性
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateUrl(this._config.serverUrl)) {
      errors.push('服务器地址格式无效');
    }

    if (!['light', 'dark'].includes(this._config.theme)) {
      errors.push('主题设置无效');
    }

    if (!this._config.language || this._config.language.length === 0) {
      errors.push('语言设置无效');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
