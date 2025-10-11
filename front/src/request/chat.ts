import type { Result } from '@/models/common';
import { del, get, post, put } from '../utils/http';

// ==================== WebSocket 连接管理 ====================

/**
 * 获取 WebSocket Ticket
 * 用于建立 WebSocket 连接前的身份验证
 * 返回的 ticket 有效期 5 分钟，需要在连接 WebSocket 时作为 URL 参数传递
 */
export function getTicket(): Promise<Result<string>> {
  return post('/api/linx/chat/ticket');
}

/**
 * 建立 WebSocket 会话
 * 在建立 WebSocket 连接前调用，将用户身份信息存储到 HTTP Session
 */
export function establishWebSocketSession(): Promise<Result> {
  return post('/api/linx/chat/link');
}

// ==================== 聊天历史记录 ====================

/**
 * 获取私聊历史记录（分页）
 * @param otherUserId 对方用户ID
 * @param page 页码，从0开始
 * @param size 每页条数
 */
export function getPrivateChatHistory(
  otherUserId: number,
  page = 0,
  size = 20
): Promise<Result> {
  return get(`/api/linx/chat/history/private/${otherUserId}`, { page, size });
}

/**
 * 获取群聊历史记录（分页）
 * @param groupId 群组ID
 * @param page 页码，从0开始
 * @param size 每页条数
 */
export function getGroupChatHistory(
  groupId: string,
  page = 0,
  size = 20
): Promise<Result> {
  return get(`/api/linx/chat/history/group/${groupId}`, { page, size });
}

/**
 * 获取指定时间之后的私聊消息（增量同步）
 * @param otherUserId 对方用户ID
 * @param afterTime 起始时间（ISO 8601格式）
 */
export function getPrivateMessagesAfter(
  otherUserId: number,
  afterTime: string
): Promise<Result> {
  return get(`/api/linx/chat/history/private/${otherUserId}/after`, { afterTime });
}

/**
 * 获取指定时间之后的群聊消息（增量同步）
 * @param groupId 群组ID
 * @param afterTime 起始时间（ISO 8601格式）
 */
export function getGroupMessagesAfter(
  groupId: string,
  afterTime: string
): Promise<Result> {
  return get(`/api/linx/chat/history/group/${groupId}/after`, { afterTime });
}

// ==================== 未读消息管理 ====================

/**
 * 获取与指定用户的未读消息数量
 * @param otherUserId 对方用户ID
 */
export function getUnreadCount(otherUserId: number): Promise<Result<{ otherUserId: number; unreadCount: number }>> {
  return get(`/api/linx/chat/history/unread/${otherUserId}`);
}

/**
 * 获取所有未读消息总数
 */
export function getTotalUnreadCount(): Promise<Result<{ totalUnreadCount: number }>> {
  return get('/api/linx/chat/history/unread/total');
}

/**
 * 标记单条消息为已读
 * @param messageId 消息ID
 */
export function markMessageAsRead(messageId: string): Promise<Result> {
  return put(`/api/linx/chat/history/read/${messageId}`);
}

/**
 * 批量标记私聊消息为已读
 * 将与指定用户的所有未读消息标记为已读
 * @param otherUserId 对方用户ID
 */
export function markPrivateMessagesAsRead(otherUserId: number): Promise<Result<{ otherUserId: number; updatedCount: number }>> {
  return put(`/api/linx/chat/history/read/batch/${otherUserId}`);
}

// ==================== 消息操作 ====================

/**
 * 删除消息（软删除）
 * @param messageId 消息ID
 */
export function deleteMessage(messageId: string): Promise<Result> {
  return del(`/api/linx/chat/history/${messageId}`);
}

// ==================== 会话管理 ====================

/**
 * 获取最近的聊天会话列表
 * 每个会话显示最后一条消息
 * @param limit 返回的会话数量
 */
export function getRecentConversations(limit = 20): Promise<Result> {
  return get('/api/linx/chat/history/conversations', { limit });
}

// ==================== 消息搜索 ====================

/**
 * 搜索私聊消息
 * @param otherUserId 对方用户ID
 * @param keyword 搜索关键词
 * @param page 页码
 * @param size 每页条数
 */
export function searchPrivateMessages(
  otherUserId: number,
  keyword: string,
  page = 0,
  size = 20
): Promise<Result> {
  return get(`/api/linx/chat/history/search/private/${otherUserId}`, { keyword, page, size });
}

/**
 * 根据消息类型查询私聊消息
 * @param otherUserId 对方用户ID
 * @param type 消息类型（如：IMAGE, FILE, VOICE等）
 * @param page 页码
 * @param size 每页条数
 */
export function getPrivateMessagesByType(
  otherUserId: number,
  type: string,
  page = 0,
  size = 20
): Promise<Result> {
  return get(`/api/linx/chat/history/type/private/${otherUserId}`, { type, page, size });
}
