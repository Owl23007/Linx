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
