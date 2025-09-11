import { getCaptcha, register } from '@/request/auth';

/**
 * 用户服务类，封装与主进程的通信
 * 用于auth窗口中进行用户相关操作
 */
class AuthService {
  /**
   * 创建用户（注册）
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} email - 邮箱
   * @param {string} captchaId - 验证码ID
   * @param {string} captchaCode - 验证码
   */
  async register(username: string, password: string, email: string, captchaId: string, captchaCode: string, endpoint: string) {
    const registerRequest = {
      username,
      password,
      email,
      captchaId,
      captchaCode,
      endpoint,
    };
    const res =  await register(registerRequest);
    if (res) return;
  }

  /**
   * 获取验证码
   * @param {string} serverUrl - 服务器URL
   */
  async getCaptcha(serverUrl: string) {
    const response = await getCaptcha(serverUrl);

    return response;
  }
  /**
   * 登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   */

}

const authService = new AuthService();

export default authService;
