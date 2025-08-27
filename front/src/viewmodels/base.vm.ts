import type { BaseViewModel } from '@/types/viewmodels';
import { ref, type Ref } from 'vue';

/**
 * 基础 ViewModel 类
 * 提供通用的状态管理和错误处理功能
 */
export abstract class BaseViewModelImpl implements BaseViewModel {
  public loading: Ref<boolean> = ref(false);
  public error: Ref<string | null> = ref(null);

  private cleanupFunctions: Array<() => void> = [];
  private isInitialized = false;

  constructor() {
    // 不在构造函数中初始化，让子类自己控制初始化时机
  }

  // 手动初始化方法
  public init(): void {
    if (!this.isInitialized) {
      this.initialize();
      this.isInitialized = true;
    }
  }

  // 抽象方法，子类需要实现
  protected abstract initialize(): void;

  // 设置加载状态
  protected setLoading(loading: boolean): void {
    this.loading.value = loading;
  }

  // 设置错误信息
  protected setError(error: string | null): void {
    this.error.value = error;
  }

  // 清除错误信息
  protected clearError(): void {
    this.error.value = null;
  }

  // 执行异步操作的包装方法
  protected async executeAsync<T>(
    operation: () => Promise<T>,
    options?: {
      showLoading?: boolean;
      clearErrorOnStart?: boolean;
    }
  ): Promise<T | null> {
    const { showLoading = true, clearErrorOnStart = true } = options || {};

    try {
      if (clearErrorOnStart) {
        this.clearError();
      }

      if (showLoading) {
        this.setLoading(true);
      }

      const result = await operation();

      return result;
    } catch (error: any) {
      this.setError(error.message || '操作失败');

      return null;
    } finally {
      if (showLoading) {
        this.setLoading(false);
      }
    }
  }

  // 添加清理函数
  protected addCleanup(cleanupFn: () => void): void {
    this.cleanupFunctions.push(cleanupFn);
  }

  // 处理API响应
  protected handleApiResponse<T>(response: { code: number; message: string; data?: T }): T | null {
    if (response.code === 0) {
      this.clearError();

      return response.data || null;
    } else {
      this.setError(response.message);

      return null;
    }
  }

  // 验证表单数据
  protected validateRequired(value: any, fieldName: string): boolean {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      this.setError(`${fieldName}不能为空`);

      return false;
    }

    return true;
  }

  // 验证邮箱格式
  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.setError('请输入有效的邮箱地址');

      return false;
    }

    return true;
  }

  // 验证密码强度
  protected validatePassword(password: string, minLength = 6): boolean {
    if (password.length < minLength) {
      this.setError(`密码长度至少为${minLength}个字符`);

      return false;
    }

    return true;
  }

  // 显示成功消息（可以被子类重写以使用具体的消息组件）
  protected showSuccess(): void {
    // 默认实现，子类可以重写
    this.clearError();
    // 这里可以集成具体的消息提示组件
  }

  // 显示警告消息
  protected showWarning(message: string): void {
    this.setError(message);
  }

  // 显示错误消息
  protected showError(message: string): void {
    this.setError(message);
  }

  // 防抖函数
  protected debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // 节流函数
  protected throttle<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let isThrottled = false;

    return (...args: Parameters<T>) => {
      if (!isThrottled) {
        func.apply(this, args);
        isThrottled = true;
        setTimeout(() => { isThrottled = false; }, delay);
      }
    };
  }

  // 重试机制
  protected async retry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    delay = 1000
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxAttempts) {
          this.setError(`操作失败（已重试${maxAttempts}次）: ${lastError.message}`);
          break;
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    return null;
  }

  // 清理资源
  dispose(): void {
    // 执行所有清理函数
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch {
        // 静默处理清理错误
      }
    });

    this.cleanupFunctions = [];
    this.clearError();
    this.setLoading(false);
  }
}
