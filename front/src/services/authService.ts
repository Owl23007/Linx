import { getCaptcha, register } from '@/request/auth';

/**
 * 用户服务类，封装与主进程的通信
 * 用于auth窗口中进行用户相关操作
 */
class AuthService {

  endpoint = '';
  constructor() {
    this.endpoint = import.meta.env.VITE_DEFAULT_BASE_URL;
  }

  /**
   * 创建用户（注册）
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} email - 邮箱
   * @param {string} captchaId - 验证码ID
   * @param {string} captchaCode - 验证码
   */
  async register(username: string, password: string, email: string, captchaId: string, captchaCode: string) {
    const registerRequest = {
      username,
      password,
      email,
      captchaId,
      captchaCode,
    };
    const res =  await register(registerRequest);
    if (res) return;
  }

  async getCaptcha(serverUrl: string) {
    const response = await getCaptcha(serverUrl);

    return response;
  }
}

const authService = new AuthService();

export default authService;
