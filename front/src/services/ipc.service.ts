import drag from '@/utils/drag';
import { closeWindow, isElectron, maximizeWindow, minimizeWindow } from '@/utils/electron';

/**
 * IPC 通信服务
 * 负责主进程和渲染进程之间的通信
 */
export class IPCService {
  private static instance: IPCService;

  private constructor() {}

  static getInstance(): IPCService {
    if (!IPCService.instance) {
      IPCService.instance = new IPCService();
    }

    return IPCService.instance;
  }

  // 检查是否在 Electron 环境中
  isElectron(): boolean {
    return isElectron();
  }

  // 最小化窗口
  async minimizeWindow(): Promise<void> {
    minimizeWindow();
  }

  // 关闭窗口
  async closeWindow(): Promise<void> {
    closeWindow();
  }

  // 最大化/还原窗口
  async toggleMaximize(): Promise<void> {
    maximizeWindow();
  }

  // 设置窗口可拖拽
  setDraggable(element: HTMLElement): () => void {
    if (!this.isElectron()) {
      return () => {};
    }

    return drag(element) || (() => {});
  }

  // 发送通知
  async showNotification(title: string, body: string): Promise<void> {
    if (this.isElectron()) {
      await window.electronApi?.invoke('showNotification', title, body);
    } else {
      // Web 环境下使用浏览器通知
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    }
  }

  // 获取应用版本
  async getAppVersion(): Promise<string> {
    if (this.isElectron()) {
      return await window.electronApi?.invoke('getVersion') || 'Electron App';
    }

    return 'Web Version';
  }

  // 设置应用主题
  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    if (this.isElectron()) {
      await window.electronApi?.invoke('setTheme', theme);
    }
  }

  // 获取系统信息
  async getSystemInfo(): Promise<any> {
    if (this.isElectron()) {
      return await window.electronApi?.invoke('getSystemInfo') || {};
    }

    return {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
    };
  }

  // 监听主进程事件
  onMainProcessEvent(event: string, callback: (data: any) => void): () => void {
    if (!this.isElectron()) {
      return () => {};
    }

    // 注意：这个功能需要在preload.js中实现对应的方法
    const cleanupFn = window.electronApi?.invoke('on', event, callback);

    return () => {
      if (cleanupFn) {
        window.electronApi?.invoke('removeListener', event, callback);
      }
    };
  }

  // 向主进程发送事件
  async sendToMainProcess(event: string, data?: any): Promise<any> {
    if (this.isElectron()) {
      return await window.electronApi?.invoke(event, data);
    }

    return null;
  }
}
