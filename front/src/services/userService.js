import { hashSHA256 } from '../utils/hash';

/**
 * 用户服务类，封装与主进程的通信
 * 用于auth窗口中进行用户相关操作
 */
export class UserService {
  /**
   * 创建用户（注册）
   * @param {Object} userData - 用户数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.password - 密码（已加密）
   * @param {string} [userData.email] - 邮箱
   * @param {string} [userData.avatar] - 头像
   */
  async createUser(userData) {
    return await window.electronAPI.invoke('user:create', userData);
  }

  /**
   * 用户登录验证
   * @param {string} username - 用户名
   * @param {string} password - 密码（已加密）
   */
  async validateUser(username, password) {
    return await window.electronAPI.invoke('user:validate', username, password);
  }

  /**
   * 根据用户名获取用户
   * @param {string} username - 用户名
   */
  async getUserByUsername(username) {
    return await window.electronAPI.invoke('user:getByUsername', username);
  }

  /**
   * 根据邮箱获取用户
   * @param {string} email - 邮箱
   */
  async getUserByEmail(email) {
    return await window.electronAPI.invoke('user:getByEmail', email);
  }

  /**
   * 检查用户名是否存在
   * @param {string} username - 用户名
   */
  async checkUsername(username) {
    return await window.electronAPI.invoke('user:checkUsername', username);
  }

  /**
   * 检查邮箱是否存在
   * @param {string} email - 邮箱
   */
  async checkEmail(email) {
    return await window.electronAPI.invoke('user:checkEmail', email);
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} updates - 更新的字段
   */
  async updateUser(id, updates) {
    return await window.electronAPI.invoke('user:update', id, updates);
  }

  /**
   * 删除用户
   * @param {number} id - 用户ID
   */
  async deleteUser(id) {
    return await window.electronAPI.invoke('user:delete', id);
  }

  /**
   * 获取用户列表（分页）
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   */
  async getUserList(page = 1, limit = 10) {
    return await window.electronAPI.invoke('user:getList', page, limit);
  }

  /**
   * 更新用户最后登录时间
   * @param {number} id - 用户ID
   */
  async updateLastLogin(id) {
    return await window.electronAPI.invoke('user:updateLastLogin', id);
  }

  /**
   * 密码加密（客户端）
   * @param {string} password - 原始密码
   */
  hashPassword(password) {
    // 使用SHA-256加密
    return hashSHA256(password);
  }

  /**
   * 用户登录（完整流程）
   * @param {string} username - 用户名
   * @param {string} password - 原始密码
   */
  async login(username, password) {
    try {
      const hashedPassword = this.hashPassword(password);
      const result = await this.validateUser(username, hashedPassword);

      if (result.success && result.data) {
        // 更新最后登录时间
        await this.updateLastLogin(result.data.id);

        return {
          success: true,
          user: result.data,
          message: '登录成功'
        };
      } else {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '登录失败: ' + error.message
      };
    }
  }

  /**
   * 用户注册
   * @param {Object} userData - 用户数据
   */
  async register(userData) {
    try {
      // 检查用户名是否已存在
      const usernameCheck = await this.checkUsername(userData.username);
      if (usernameCheck.success && usernameCheck.data.exists) {
        return {
          success: false,
          message: '用户名已存在'
        };
      }

      // 检查邮箱是否已存在（如果提供了邮箱）
      if (userData.email) {
        const emailCheck = await this.checkEmail(userData.email);
        if (emailCheck.success && emailCheck.data.exists) {
          return {
            success: false,
            message: '邮箱已被使用'
          };
        }
      }

      // 加密密码
      const hashedPassword = this.hashPassword(userData.password);

      // 创建用户
      const result = await this.createUser({
        ...userData,
        password: hashedPassword
      });

      if (result.success) {
        return {
          success: true,
          message: '注册成功',
          userId: result.data.lastID
        };
      } else {
        return {
          success: false,
          message: '注册失败: ' + result.error
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '注册失败: ' + error.message
      };
    }
  }
}

// 导出单例实例
export const userService = new UserService();
