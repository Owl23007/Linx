// 群组相关类型定义

/**
 * 群组类型
 */
export type GroupType = 'NORMAL' | 'TEMPORARY' | 'PUBLIC' | 'PRIVATE';

/**
 * 群组状态
 */
export type GroupStatus = 'ACTIVE' | 'DISBANDED' | 'SUSPENDED';

/**
 * 群成员角色
 */
export type GroupMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

/**
 * 创建群组DTO
 */
export interface CreateGroupDto {
  name: string;
  description?: string;
  type?: GroupType;
  requireApproval?: boolean;
  maxMembers?: number;
  initialMembers?: number[];
}

/**
 * 群组信息VO
 */
export interface GroupVO {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  ownerName: string;
  avatarUrl?: string;
  memberCount: number;
  maxMembers: number;
  type: GroupType;
  status: GroupStatus;
  requireApproval: boolean;
  myRole?: GroupMemberRole;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 群成员信息VO
 */
export interface GroupMemberVO {
  membershipId: number;
  userId: number;
  username: string;
  nickname?: string;
  groupNickname?: string;
  avatar?: string;
  role: GroupMemberRole;
  onlineStatus?: string;
  joinedAt: string;
  lastActiveAt?: string;
  isMuted: boolean;
  muteUntil?: string;
}

/**
 * 设置成员角色参数
 */
export interface SetMemberRoleParams {
  groupId: number;
  userId: number;
  role: GroupMemberRole;
}

/**
 * 群组搜索参数
 */
export interface GroupSearchParams {
  keyword: string;
  page?: number;
  size?: number;
}
