// 聊天相关类型定义
export interface Friend {
  friendshipId: number;
  friendId: number;
  friendUsername: string;
  friendNickname: string;
  friendAvatar?: string;
  remark?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  onlineStatus?: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE';
  lastSeenAt?: string;
  friendsSince: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  ownerName: string;
  avatarUrl?: string;
  memberCount: number;
  maxMembers: number;
  type: 'NORMAL' | 'TEMPORARY' | 'PUBLIC' | 'PRIVATE';
  status: 'ACTIVE' | 'DISBANDED' | 'SUSPENDED';
  requireApproval: boolean;
  myRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: string;
  updatedAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  membershipId: number;
  userId: number;
  username: string;
  nickname: string;
  groupNickname?: string;
  avatar?: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  onlineStatus?: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE';
  joinedAt: string;
  lastActiveAt?: string;
  isMuted: boolean;
  muteUntil?: string;
}

export interface ChatMessage {
  messageId: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'HEARTBEAT' | 'SYSTEM' | 'TYPING' | 'READ_RECEIPT' | 'FILE' | 'IMAGE' | 'VOICE' | 'VIDEO';
  senderId: number;
  senderName: string;
  receiverId?: number;
  groupId?: string;
  content: string;
  timestamp: string;
  extra?: string;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  type: 'private' | 'group';
  name: string;
  avatar?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  lastActiveAt: string;
  // 私聊时的好友信息
  friend?: Friend;
  // 群聊时的群组信息
  group?: Group;
}
