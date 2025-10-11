// 用户相关类型定义

/**
 * 用户状态
 */
export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'DND' | 'HIDDEN';

/**
 * 用户信息
 */
export interface UserVO {
  userId: number;
  username: string;
  nickname?: string;
  avatar?: string;
  status: UserStatus;
  lastSeenAt?: string;
  createdAt?: string;
}

/**
 * 用户搜索参数
 */
export interface UserSearchParams {
  keyword: string;
  page?: number;
  size?: number;
}

/**
 * 批量获取用户参数
 */
export interface BatchGetUsersParams {
  userIds: number[];
}
