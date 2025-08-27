import { ConfigModel } from '@/models/config';
import { IPCService } from '@/services/ipc.service';
import { StorageService } from '@/services/storage.service';
import type { AppConfig } from '@/types/models';
import type { AppViewModel } from '@/types/viewmodels';
import { ref, type Ref } from 'vue';
import { BaseViewModelImpl } from './base.vm';

/**
 * 应用程序 ViewModel
 * 负责应用程序级别的状态管理和业务逻辑
 */
export class AppViewModelImpl extends BaseViewModelImpl implements AppViewModel {
  public config: Ref<AppConfig> = ref({
    serverUrl: import.meta.env.VITE_DEFAULT_BASE_URL || 'http://localhost:8082',
    theme: 'light',
    language: 'zh-CN',
    autoLogin: false,
  });

  public isElectron: Ref<boolean> = ref(false);

  private ipcService = IPCService.getInstance();
  private storageService = StorageService.getInstance();
  private configModel = new ConfigModel();

  constructor() {
    super();
    // 手动初始化，确保属性已经设置
    this.init();
  }

  protected initialize(): void {
    this.loadInitialConfig();
    this.setupElectronDetection();
    this.setupTheme();
  }

  // 加载初始配置
  private loadInitialConfig(): void {
    const savedConfig = this.storageService.getConfig();
    if (savedConfig) {
      try {
        this.configModel.updateConfig(savedConfig);
        this.config.value = this.configModel.config;
      } catch {
        // 配置无效，使用默认配置
        this.saveCurrentConfig();
      }
    } else {
      this.saveCurrentConfig();
    }
  }

  // 设置 Electron 环境检测
  private setupElectronDetection(): void {
    this.isElectron.value = this.ipcService.isElectron();
  }

  // 设置主题
  private setupTheme(): void {
    const savedTheme = this.storageService.getTheme();
    if (savedTheme) {
      this.config.value.theme = savedTheme;
      this.configModel.setTheme(savedTheme);
    }

    this.applyTheme(this.config.value.theme);
  }

  // 更新配置
  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    await this.executeAsync(async () => {
      this.configModel.updateConfig(updates);
      this.config.value = this.configModel.config;
      this.saveCurrentConfig();

      // 如果更新了主题，应用主题
      if (updates.theme) {
        this.applyTheme(updates.theme);
      }

      // 如果在 Electron 环境中且更新了主题，通知主进程
      if (this.isElectron.value && updates.theme) {
        await this.ipcService.setTheme(updates.theme);
      }
    });
  }

  // 保存当前配置
  private saveCurrentConfig(): void {
    this.storageService.saveConfig(this.config.value);
  }

  // 应用主题
  private applyTheme(theme: 'light' | 'dark'): void {
    const htmlElement = document.documentElement;

    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }

    // 保存主题设置
    this.storageService.saveTheme(theme);
  }

  // 最小化窗口
  minimizeWindow(): void {
    if (this.isElectron.value) {
      this.ipcService.minimizeWindow().catch(error => {
        this.setError('最小化窗口失败: ' + error.message);
      });
    }
  }

  // 关闭窗口
  closeWindow(): void {
    if (this.isElectron.value) {
      this.ipcService.closeWindow().catch(error => {
        this.setError('关闭窗口失败: ' + error.message);
      });
    }
  }

  // 切换主题
  toggleTheme(): void {
    const newTheme = this.config.value.theme === 'light' ? 'dark' : 'light';
    this.updateConfig({ theme: newTheme });
  }

  // 设置拖拽区域
  setupDrag(element: HTMLElement): (() => void) | null {
    if (!this.isElectron.value) {
      return null;
    }

    return this.ipcService.setDraggable(element);
  }

  // 获取应用版本
  async getAppVersion(): Promise<string> {
    return await this.executeAsync(async () => {
      return await this.ipcService.getAppVersion();
    }) || 'Unknown';
  }

  // 获取系统信息
  async getSystemInfo(): Promise<any> {
    return await this.executeAsync(async () => {
      return await this.ipcService.getSystemInfo();
    }) || {};
  }

  // 显示通知
  async showNotification(title: string, body: string): Promise<void> {
    await this.executeAsync(async () => {
      await this.ipcService.showNotification(title, body);
    }, { showLoading: false });
  }

  // 重置配置
  resetConfig(): void {
    this.configModel.reset();
    this.config.value = this.configModel.config;
    this.saveCurrentConfig();
    this.applyTheme(this.config.value.theme);
  }

  // 导出配置
  exportConfig(): string {
    return JSON.stringify(this.config.value, null, 2);
  }

  // 导入配置
  async importConfig(configJson: string): Promise<boolean> {
    return await this.executeAsync(async () => {
      try {
        const config = JSON.parse(configJson);
        this.configModel.updateConfig(config);
        this.config.value = this.configModel.config;
        this.saveCurrentConfig();
        this.applyTheme(this.config.value.theme);

        return true;
      } catch {
        throw new Error('配置格式无效');
      }
    }) || false;
  }

  // 检查配置有效性
  validateConfig(): { isValid: boolean; errors: string[] } {
    return this.configModel.validate();
  }

  // 获取存储使用情况
  getStorageInfo(): { used: number; available: number } {
    return this.storageService.getStorageInfo();
  }

  // 清理缓存
  clearCache(): void {
    // 清除除了配置之外的所有缓存
    const currentConfig = this.config.value;
    this.storageService.clear();
    this.storageService.saveConfig(currentConfig);
  }

  // 设置语言
  async setLanguage(language: string): Promise<void> {
    await this.updateConfig({ language });
    this.storageService.saveLanguage(language);
  }

  // 获取当前语言
  getCurrentLanguage(): string {
    return this.config.value.language;
  }

  // 设置自动登录
  async setAutoLogin(autoLogin: boolean): Promise<void> {
    await this.updateConfig({ autoLogin });
  }

  // 检查更新（仅在 Electron 环境中）
  async checkForUpdates(): Promise<any> {
    if (!this.isElectron.value) {
      return null;
    }

    return await this.executeAsync(async () => {
      return await this.ipcService.sendToMainProcess('check-for-updates');
    });
  }

  // 重启应用（仅在 Electron 环境中）
  async restartApp(): Promise<void> {
    if (!this.isElectron.value) {
      return;
    }

    await this.executeAsync(async () => {
      await this.ipcService.sendToMainProcess('restart-app');
    });
  }

  // 设置开机启动（仅在 Electron 环境中）
  async setAutoStart(enabled: boolean): Promise<void> {
    if (!this.isElectron.value) {
      return;
    }

    await this.executeAsync(async () => {
      await this.ipcService.sendToMainProcess('set-auto-start', enabled);
    });
  }

  // 清理资源
  dispose(): void {
    super.dispose();
    // 保存当前配置
    this.saveCurrentConfig();
  }
}
