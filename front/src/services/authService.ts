import type { LoginRequest, RegisterRequest } from '@/models/auth';
import * as auth from '@/request/auth';
import * as localAccount from '@/request/local/account';
import { isElectron, sendIpc } from '@/utils/electron';

/**
 * 用户服务类，封装与主进程的通信
 * 用于auth窗口中进行用户相关操作
 */
class AuthService {
  /**
   * 获取本地保存的账号列表
   */
  async getSavedAccounts() {
    if (!isElectron()) return [];

    return await localAccount.getSavedAccounts();
  }

  /**
   * 保存账号信息到本地
   */
  async saveAccount(account: any) {
    if (!isElectron()) return;
    await localAccount.saveAccount(account);
  }

  /**
   * 删除本地账号
   */
  async deleteAccount(account: { server_url: string; username: string }) {
    if (!isElectron()) return;
    await localAccount.deleteAccount(account);
  }

  /**
   * 创建用户（注册）
    * @param {RegisterRequest} data - 注册请求数据
    * @param {string} endpoint - 服务器URL
    *
    * @return {Promise<void>}
   */
  async register(data: RegisterRequest, endpoint: string) {
    const res = await auth.register(data, endpoint);

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
   * 使用 Refresh Token 登录
   * @param {string} token - Refresh Token
   * @param {string} endpoint - 服务器URL
   */
  async loginWithRefreshToken(token: string, endpoint: string) {
    const res = await auth.loginWithRefreshToken(token, endpoint);

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
