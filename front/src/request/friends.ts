import type { Result } from '@/models/common';
import { del, get, post, put } from '../utils/http';

// 好友相关接口

/**
 * 发送好友请求
 */
export function sendFriendRequest(data: {
  targetUser: string;
  message?: string;
  remark?: string;
}): Promise<Result> {
  return post('/linx/friends/request', data);
}

/**
 * 处理好友请求（接受/拒绝）
 */
export function handleFriendRequest(friendshipId: number, accept: boolean): Promise<Result> {
  return post(`/linx/friends/request/${friendshipId}/handle`, { accept });
}

/**
 * 获取好友列表
 */
export function getFriends(): Promise<Result> {
  return get('/linx/friends');
}

/**
 * 获取收到的好友请求
 */
export function getReceivedFriendRequests(): Promise<Result> {
  return get('/linx/friends/requests/received');
}

/**
 * 获取发送的好友请求
 */
export function getSentFriendRequests(): Promise<Result> {
  return get('/linx/friends/requests/sent');
}

/**
 * 删除好友
 */
export function removeFriend(friendId: number): Promise<Result> {
  return del(`/linx/friends/${friendId}`);
}

/**
 * 更新好友备注
 */
export function updateFriendRemark(friendId: number, remark: string): Promise<Result> {
  return put(`/linx/friends/${friendId}/remark`, { remark });
}
