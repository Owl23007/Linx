import type { Result } from '@/models/common';
import { del, get, post, put } from '../utils/http';

// 群组相关接口

/**
 * 创建群组
 */
export function createGroup(data: {
  name: string;
  description?: string;
  type?: string;
  requireApproval?: boolean;
  maxMembers?: number;
  initialMembers?: number[];
}): Promise<Result> {
  return post('/linx/groups', data);
}

/**
 * 获取用户加入的群组列表
 */
export function getUserGroups(): Promise<Result> {
  return get('/linx/groups');
}

/**
 * 获取群组详情
 */
export function getGroupDetails(groupId: number): Promise<Result> {
  return get(`/linx/groups/${groupId}`);
}

/**
 * 加入群组
 */
export function joinGroup(groupId: number): Promise<Result> {
  return post(`/linx/groups/${groupId}/join`);
}

/**
 * 退出群组
 */
export function leaveGroup(groupId: number): Promise<Result> {
  return post(`/linx/groups/${groupId}/leave`);
}

/**
 * 解散群组
 */
export function disbandGroup(groupId: number): Promise<Result> {
  return del(`/linx/groups/${groupId}`);
}

/**
 * 获取群组成员列表
 */
export function getGroupMembers(groupId: number): Promise<Result> {
  return get(`/linx/groups/${groupId}/members`);
}

/**
 * 移除群组成员
 */
export function removeMember(groupId: number, userId: number): Promise<Result> {
  return del(`/linx/groups/${groupId}/members/${userId}`);
}

/**
 * 设置成员角色
 */
export function setMemberRole(groupId: number, userId: number, role: string): Promise<Result> {
  return put(`/linx/groups/${groupId}/members/${userId}/role`, { role });
}

/**
 * 搜索群组
 */
export function searchGroups(keyword: string): Promise<Result> {
  return get(`/linx/groups/search?keyword=${encodeURIComponent(keyword)}`);
}
