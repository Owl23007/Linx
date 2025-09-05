import { invokeIpc, invokeIpcPaginated, type IpcPaginatedResponse, type IpcResponse } from '../utils/electron';
import type { UserInfo } from './auth';

/**
 * 用户相关 IPC API
 */

/**
 * 获取用户列表
 * @param page 页码，默认为1
 * @param limit 每页数量，默认为20
 * @returns 用户信息列表
 */
export function getUserList(page = 1, limit = 20): Promise<IpcPaginatedResponse<UserInfo[]>> {
  return invokeIpcPaginated<UserInfo[]>('user:getList', page, limit);
}

/**
 * 根据服务器和用户名获取用户
 * @param serverUrl 服务器地址
 * @param username 用户名
 * @returns 用户信息
 */
export function getUserByServerAndUsername(serverUrl: string, username: string): Promise<IpcResponse<UserInfo | null>> {
  return invokeIpc<UserInfo | null>('user:getByServerAndUsername', serverUrl, username);
}

/**
 * 创建用户
 * @param userData 用户数据
 * @returns 创建结果
 */
export function createUser(userData: Partial<UserInfo>): Promise<IpcResponse<{ lastID: number }>> {
  return invokeIpc<{ lastID: number }>('user:create', userData);
}

/**
 * 更新用户信息
 * @param userId 用户ID
 * @param updateData 更新数据
 * @returns 更新结果
 */
export function updateUser(userId: string, updateData: Partial<UserInfo>): Promise<IpcResponse<{ updated: boolean }>> {
  return invokeIpc<{ updated: boolean }>('user:update', userId, updateData);
}

/**
 * 删除用户
 * @param userId 用户ID
 * @returns 删除结果
 */
export function deleteUser(userId: string): Promise<IpcResponse<{ deleted: boolean }>> {
  return invokeIpc<{ deleted: boolean }>('user:delete', userId);
}

/**
 * 检查用户名是否存在
 * @param username 用户名
 * @returns 检查结果
 */
export function checkUsername(username: string): Promise<IpcResponse<{ exists: boolean }>> {
  return invokeIpc<{ exists: boolean }>('user:checkUsername', username);
}

/**
 * 检查邮箱是否存在
 * @param email 邮箱
 * @returns 检查结果
 */
export function checkEmail(email: string): Promise<IpcResponse<{ exists: boolean }>> {
  return invokeIpc<{ exists: boolean }>('user:checkEmail', email);
}

/**
 * 根据用户名获取用户
 * @param username 用户名
 * @returns 用户信息
 */
export function getUserByUsername(username: string): Promise<IpcResponse<UserInfo | null>> {
  return invokeIpc<UserInfo | null>('user:getByUsername', username);
}

/**
 * 根据邮箱获取用户
 * @param email 邮箱
 * @returns 用户信息
 */
export function getUserByEmail(email: string): Promise<IpcResponse<UserInfo | null>> {
  return invokeIpc<UserInfo | null>('user:getByEmail', email);
}

/**
 * 验证用户
 * @param credentials 凭证
 * @returns 验证结果
 */
export function validateUser(credentials: any): Promise<IpcResponse<UserInfo | null>> {
  return invokeIpc<UserInfo | null>('user:validate', credentials);
}

/**
 * 更新最后登录时间
 * @param userId 用户ID
 * @returns 更新结果
 */
export function updateLastLogin(userId: string): Promise<IpcResponse<{ updated: boolean }>> {
  return invokeIpc<{ updated: boolean }>('user:updateLastLogin', userId);
}
