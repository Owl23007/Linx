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
 * 建立 WebSocket 会话
 * 通过 HTTP 接口先建立会话,服务器会将用户信息存储在 session 中
 * 之后的 WebSocket 连接会复用这个 session
 */
export function getTicket(): Promise<Result> {
  return post('/linx/ws/ticket');
}
