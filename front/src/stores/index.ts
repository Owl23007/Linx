import { database } from '@/database/database';
import { UserService } from '@/database/services/user-service';
import type { User } from '@/database/types';
import { isElectron } from '@/utils/electron';
import { createPinia } from 'pinia';

// 创建 Pinia 实例
export const pinia = createPinia();

// 用户服务实例
const userService = new UserService();

// 初始化应用
export async function initApp(): Promise<void> {
  // Electron 环境下初始化数据库
  await initElectronEnvironment();

  // 其他初始化逻辑可以在这里添加
}

// Electron 环境下初始化数据库
export async function initElectronEnvironment(): Promise<void> {
  if (isElectron()) {
    try {
      // 初始化数据库
      await database.init();
    } catch {
      // 处理初始化失败的情况
    }
  }
}

// 获取用户列表并在 AuthView 中显示
export async function loadUserList(): Promise<User[]> {
  try {
    const result = await userService.getAllUsers();
    if (result.success) {
      return result.data;
    }
  } catch {
    // 处理获取用户列表异常
  }

  return [];
}

export default pinia;
