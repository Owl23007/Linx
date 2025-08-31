import { database } from '../database';
import type {
  CreateUserRequest,
  ListResult,
  QueryResult,
  UpdateUserRequest,
  User
} from '../types';

export class UserService {
  /**
   * 创建用户
   */
  async createUser(userData: CreateUserRequest): Promise<QueryResult<User>> {
    try {
      const result = await database.run(
        `INSERT INTO users (username, email, password_hash, avatar)
         VALUES (?, ?, ?, ?)`,
        [userData.username, userData.email, userData.password_hash, userData.avatar]
      );

      const user = await this.getUserById(result.lastID!);

      return {
        data: user!,
        success: true
      };
    } catch (error) {
      return {
        data: {} as User,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id: number): Promise<User | null> {
    try {
      const user = await database.get<User>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      return user || null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取用户失败:', error);

      return null;
    }
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const user = await database.get<User>(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      return user || null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取用户失败:', error);

      return null;
    }
  }

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await database.get<User>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      return user || null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('获取用户失败:', error);

      return null;
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: number, userData: UpdateUserRequest): Promise<QueryResult<User>> {
    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (userData.username !== undefined) {
        updates.push('username = ?');
        values.push(userData.username);
      }
      if (userData.email !== undefined) {
        updates.push('email = ?');
        values.push(userData.email);
      }
      if (userData.avatar !== undefined) {
        updates.push('avatar = ?');
        values.push(userData.avatar);
      }
      if (userData.status !== undefined) {
        updates.push('status = ?');
        values.push(userData.status);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      await database.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      const user = await this.getUserById(id);

      return {
        data: user!,
        success: true
      };
    } catch (error) {
      return {
        data: {} as User,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(id: number): Promise<QueryResult<boolean>> {
    try {
      await database.run('DELETE FROM users WHERE id = ?', [id]);

      return {
        data: true,
        success: true
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 获取所有用户
   */
  async getAllUsers(): Promise<ListResult<User>> {
    try {
      const users = await database.all<User>(
        'SELECT * FROM users ORDER BY created_at DESC'
      );

      return {
        data: users,
        total: users.length,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(query: string): Promise<ListResult<User>> {
    try {
      const users = await database.all<User>(
        'SELECT * FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY username',
        [`%${query}%`, `%${query}%`]
      );

      return {
        data: users,
        total: users.length,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(id: number, status: 'online' | 'away' | 'busy' | 'offline'): Promise<QueryResult<boolean>> {
    try {
      await database.run(
        'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );

      return {
        data: true,
        success: true
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: (error as Error).message
      };
    }
  }
}
