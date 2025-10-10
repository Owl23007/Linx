import type { Result } from '@/models/common';
import { post } from '../utils/http';

/**
 * 包装层
 */
function send(url: string, data?: any): Promise<Result> {
  return post(url, data, url);
}

export function getHeartBeat(): Promise<Result> {
  return send('/chat/heartBeat');
}

/**
 * 获取 WebSocket Ticket
 * 用于建立 WebSocket 连接前的身份验证
 * 返回的 ticket 有效期 5 分钟，需要在连接 WebSocket 时作为 URL 参数传递
 */
export function getTicket(): Promise<Result> {
  return post('/api/linx/chat/ticket');
}
