// 用户相关类型定义

/**
 * 用户状态
 */
export type UserStatus = 'ONLINE' | 'OFFLINE' | 'AWAY' | 'DND' | 'HIDDEN';

/**
 * 用户信息
 */
export interface UserVO {
  userId?: number;
  id?: number;
  username?: string;
  nickname?: string;
  avatar?: string;
  avatarImage?: string;
  email?: string;
  phone?: string;
  signature?: string;
  backgroundImage?: string;
  role?: string;
  status?: UserStatus;
  accountStatus?: string;
  lastSeenAt?: string;
  updatedAt?: string;
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
