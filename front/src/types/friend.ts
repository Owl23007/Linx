// 好友相关类型定义

/**
 * 好友关系状态
 */
export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';

/**
 * 好友请求DTO
 */
export interface FriendRequestDto {
  targetUser: string;
  message?: string;
  remark?: string;
}

/**
 * 好友信息VO
 */
export interface FriendVO {
  friendshipId: number;
  friendId: number;
  friendUsername: string;
  friendNickname?: string;
  friendAvatar?: string;
  remark?: string;
  status: FriendshipStatus;
  onlineStatus?: string;
  lastSeenAt?: string;
  friendsSince: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 好友请求处理参数
 */
export interface HandleFriendRequestParams {
  friendshipId: number;
  accept: boolean;
}

/**
 * 更新好友备注参数
 */
export interface UpdateFriendRemarkParams {
  friendId: number;
  remark: string;
}
