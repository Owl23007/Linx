import { AuthModel } from '@/models/auth';
import { UserModel } from '@/models/user';
import { AuthService } from '@/services/auth.service';
import { StorageService } from '@/services/storage.service';
import type { LoginForm, RegisterForm } from '@/types/models';
import type { LoginViewModel } from '@/types/viewmodels';
import { ref, type Ref } from 'vue';
import { BaseViewModelImpl } from './base.vm';

/**
 * 登录页面 ViewModel
 * 负责登录页面的状态管理和业务逻辑
 */
export class LoginViewModelImpl extends BaseViewModelImpl implements LoginViewModel {
  public loginForm: Ref<LoginForm> = ref({
    username: '',
    password: '',
  });

  public registerForm: Ref<RegisterForm> = ref({
    username: '',
    password: '',
    captchaCode: '',
    captchaId: '',
  });

  public activeTab: Ref<'login' | 'register'> = ref('login');
  public serverUrl: Ref<string> = ref('');
  public captchaImage: Ref<string> = ref('');

  private authService = AuthService.getInstance();
  private storageService: StorageService | null = null;
  private authModel = new AuthModel();
  private userModel = new UserModel();

  constructor() {
    super();
    // 手动初始化，确保属性已经设置
    this.init();
  }

  protected initialize(): void {
    // 安全初始化存储服务
    try {
      this.storageService = StorageService.getInstance();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Storage service not available:', error);
      this.storageService = null;
    }

    this.loadInitialData();
    this.setupValidation();
  }

  // 加载初始数据
  private loadInitialData(): void {
    // 加载保存的服务器地址
    try {
      const savedServerUrl = this.storageService?.getLastServerUrl?.();
      if (savedServerUrl) {
        this.serverUrl.value = savedServerUrl;
      } else {
        this.serverUrl.value = import.meta.env.VITE_DEFAULT_BASE_URL || 'http://localhost:8082';
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load server URL from storage:', error);
      this.serverUrl.value = import.meta.env.VITE_DEFAULT_BASE_URL || 'http://localhost:8082';
    }

    // 加载验证码
    this.refreshCaptcha();
  }

  // 设置表单验证
  private setupValidation(): void {
    // 可以在这里设置实时验证逻辑
    // 例如：监听表单字段变化，进行实时验证
  }

  // 用户登录
  async login(): Promise<boolean> {
    return await this.executeAsync(async () => {
      // 验证表单
      if (!this.validateLoginForm()) {
        return false;
      }

      // 保存服务器地址
      if (this.storageService) {
        this.storageService.saveLastServerUrl(this.serverUrl.value);
      }

      // 调用登录 API
      const response = await this.authService.login(this.loginForm.value);
      const result = this.handleApiResponse(response);

      if (result) {
        // 保存认证信息
        this.authModel.setToken(result.token);
        this.authModel.setAuthState({
          isAuthenticated: true,
          user: result.user,
          token: result.token,
        });

        // 保存用户信息
        this.userModel.setData(result.user);

        // 持久化存储
        if (this.storageService) {
          this.storageService.saveToken(result.token);
          this.storageService.saveUser(result.user);
          this.storageService.saveAuthState(this.authModel.state);
        }

        this.showSuccess('登录成功');

        return true;
      }

      return false;
    }) ?? false;
  }

  // 用户注册
  async register(): Promise<boolean> {
    return await this.executeAsync(async () => {
      // 验证表单
      if (!this.validateRegisterForm()) {
        return false;
      }

      // 保存服务器地址
      if (this.storageService) {
        this.storageService.saveLastServerUrl(this.serverUrl.value);
      }

      // 调用注册 API
      const response = await this.authService.register(this.registerForm.value);
      const result = this.handleApiResponse(response);

      if (result) {
        this.showSuccess('注册成功，请登录');

        // 清空注册表单
        this.resetRegisterForm();

        // 切换到登录页面
        this.switchTab('login');

        return true;
      }

      // 注册失败，刷新验证码
      await this.refreshCaptcha();

      return false;
    }) ?? false;
  }

  // 刷新验证码
  async refreshCaptcha(): Promise<void> {
    await this.executeAsync(async () => {
      const response = await this.authService.getCaptcha();
      const result = this.handleApiResponse(response);

      if (result) {
        // 解析验证码数据
        if (typeof result === 'string') {
          const parts = (result as string).split(':');
          if (parts.length >= 2) {
            this.registerForm.value.captchaId = parts[0];
            this.captchaImage.value = parts.slice(1).join(':');
          }
        } else if (typeof result === 'object' && result !== null && 'captchaId' in result && 'imageData' in result) {
          this.registerForm.value.captchaId = (result as any).captchaId;
          this.captchaImage.value = (result as any).imageData;
        }
      }
    }, { showLoading: false });
  }

  // 切换标签页
  switchTab(tab: 'login' | 'register'): void {
    this.activeTab.value = tab;
    this.clearError();

    // 如果切换到注册页面且没有验证码，则获取验证码
    if (tab === 'register' && !this.captchaImage.value) {
      this.refreshCaptcha();
    }
  }

  // 验证登录表单
  validateForm(): boolean {
    if (this.activeTab.value === 'login') {
      return this.validateLoginForm();
    } else {
      return this.validateRegisterForm();
    }
  }

  // 验证登录表单
  private validateLoginForm(): boolean {
    const form = this.loginForm.value;

    if (!this.validateRequired(form.username, '用户名')) {
      return false;
    }

    if (!this.validateRequired(form.password, '密码')) {
      return false;
    }

    if (form.username.length < 3) {
      this.setError('用户名长度至少为3个字符');

      return false;
    }

    if (!this.validatePassword(form.password)) {
      return false;
    }

    return true;
  }

  // 验证注册表单
  private validateRegisterForm(): boolean {
    const form = this.registerForm.value;

    if (!this.validateRequired(form.username, '邮箱')) {
      return false;
    }

    if (!this.validateEmail(form.username)) {
      return false;
    }

    if (!this.validateRequired(form.password, '密码')) {
      return false;
    }

    if (!this.validatePassword(form.password)) {
      return false;
    }

    if (!this.validateRequired(form.captchaCode, '验证码')) {
      return false;
    }

    if (!form.captchaId) {
      this.setError('验证码已失效，请刷新');

      return false;
    }

    return true;
  }

  // 重置登录表单
  private resetLoginForm(): void {
    this.loginForm.value = {
      username: '',
      password: '',
    };
  }

  // 重置注册表单
  private resetRegisterForm(): void {
    this.registerForm.value = {
      username: '',
      password: '',
      captchaCode: '',
      captchaId: '',
    };
    this.captchaImage.value = '';
  }

  // 自动填充表单（用于开发测试）
  fillTestData(): void {
    if (this.activeTab.value === 'login') {
      this.loginForm.value = {
        username: 'test@example.com',
        password: '123456',
      };
    } else {
      this.registerForm.value = {
        ...this.registerForm.value,
        username: 'test@example.com',
        password: '123456',
      };
    }
  }

  // 清空所有表单
  clearAllForms(): void {
    this.resetLoginForm();
    this.resetRegisterForm();
    this.clearError();
  }

  // 重写基类方法以使用具体的消息组件
  protected showSuccess(message: string): void {
    this.clearError();
    // 这里可以集成 Element Plus 的消息组件
    // ElMessage.success(message);
    // 开发环境下输出成功信息
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('Success:', message);
    }
  }

  protected showError(message: string): void {
    this.setError(message);
    // 这里可以集成 Element Plus 的消息组件
    // ElMessage.error(message);
  }

  // 清理资源
  dispose(): void {
    super.dispose();
    this.clearAllForms();
  }
}
