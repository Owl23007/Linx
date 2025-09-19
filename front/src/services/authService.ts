import type { LoginRequest, RegisterRequest } from '@/models/auth';
import auth from '@/request/auth';
import { useGlobalStore } from '@/stores/global';
import { isElectron, sendIpc } from '@/utils/electron';

/**
 * 用户服务类，封装与主进程的通信
 * 用于auth窗口中进行用户相关操作
 */
class AuthService {
  /**
   * 创建用户（注册）
    * @param {RegisterRequest} data - 注册请求数据
    * @param {string} endpoint - 服务器URL
    *
    * @return {Promise<void>}
   */
  async register(data:RegisterRequest, endpoint: string) {
    const res =  await auth.register(data, endpoint);

    return res;
  }

  /**
   * 获取验证码
   * @param {string} serverUrl - 服务器URL
   */
  async getCaptcha(serverUrl: string) {
    const response = await auth.getCaptcha(serverUrl);

    return response;
  }

  /**
   * 登录
   * @param {string} account - 账号
   * @param {string} password - 密码
   */
  async login(data: LoginRequest, endpoint: string) {
    const res = await auth.login(data, endpoint);

    return res;
  }

  /**
   * 获取路由
   * @return {Promise<void>}
   */
  async getRouters() {
    const res = await auth.getRouters();
    if (res.code === 0) {
      useGlobalStore().setRoutes(res.data);
    }

    return res;
  }

  /**
   * 切换为主窗口
   * @return {Promise<void>}
   */
  async switchToMainWindow() {
    if (isElectron()) {
      await sendIpc('set-main-window');
    }
  }
}

const authService = new AuthService();

export default authService;
