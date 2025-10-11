import type { Result } from '@/models/common';
import { get, post } from '../utils/http';

// ==================== 用户信息查询 ====================

/**
 * 根据用户ID获取用户状态
 * 返回用户的在线状态、最后活跃时间等信息
 * @param userId 用户ID
 */
export function getUserById(userId: number): Promise<Result> {
  return get(`/profile/${userId}`);
}

/**
 * 获取当前登录用户信息
 * 基于 Authorization: Bearer <token> 自动识别当前用户
 */
export function getCurrentUser(): Promise<Result> {
  return get('/profile/me');
}

// ==================== 用户状态管理 ====================

/**
 * 更新用户在线状态
 * @param status 状态：online（在线）、offline（离线）、away（离开）、dnd（勿扰）、hidden（隐身）
 */
export function updateUserStatus(status: 'online' | 'offline' | 'away' | 'dnd' | 'hidden'): Promise<Result> {
  return post('/profile/user/status', { status });
}

// ==================== 用户搜索（待后端实现） ====================

/**
 * 搜索用户
 * @param keyword 搜索关键词（用户名、昵称、邮箱等）
 */
export function searchUsers(keyword: string): Promise<Result> {
  // TODO: 等待后端实现此接口
  return get('/profile/search', { keyword });
}

/**
 * 批量获取用户信息
 * @param userIds 用户ID数组
 */
export function getUsersByIds(userIds: number[]): Promise<Result> {
  // TODO: 等待后端实现此接口
  return post('/profile/batch', { userIds });
}
