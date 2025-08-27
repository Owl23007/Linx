import type { User } from '@/types/models';

/**
 * 用户模型类
 * 负责用户数据的管理和验证
 */
export class UserModel {
  private _data: User | null = null;

  constructor(userData?: Partial<User>) {
    if (userData) {
      this.setData(userData);
    }
  }

  // 获取用户数据
  get data(): User | null {
    return this._data;
  }

  // 设置用户数据
  setData(userData: Partial<User>): void {
    if (this.validateUserData(userData)) {
      this._data = {
        id: userData.id || '',
        username: userData.username || '',
        email: userData.email || '',
        avatar: userData.avatar,
        createdAt: userData.createdAt || new Date(),
        updatedAt: userData.updatedAt || new Date(),
      };
    }
  }

  // 验证用户数据
  private validateUserData(userData: Partial<User>): boolean {
    if (!userData.username || userData.username.length < 3) {
      throw new Error('用户名长度至少为3个字符');
    }
    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new Error('请输入有效的邮箱地址');
    }

    return true;
  }

  // 验证邮箱格式
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
  }

  // 更新用户信息
  updateProfile(updates: Partial<User>): void {
    if (this._data) {
      this._data = {
        ...this._data,
        ...updates,
        updatedAt: new Date(),
      };
    }
  }

  // 清空用户数据
  clear(): void {
    this._data = null;
  }

  // 序列化为JSON
  toJSON(): User | null {
    return this._data ? { ...this._data } : null;
  }

  // 从JSON反序列化
  static fromJSON(json: any): UserModel {
    const user = new UserModel();
    if (json) {
      user.setData({
        ...json,
        createdAt: new Date(json.createdAt),
        updatedAt: new Date(json.updatedAt),
      });
    }

    return user;
  }
}
