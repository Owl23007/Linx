// 用户相关接口
export interface User {
  id: number;
  username: string;
  email?: string;
  password_hash?: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  password_hash?: string;
  avatar?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatar?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
}

// 消息相关接口
export interface Message {
  id: number;
  sender_id: number;
  receiver_id?: number;
  group_id?: number;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  file_path?: string;
  timestamp: string;
  is_read: boolean;
}

export interface CreateMessageRequest {
  sender_id: number;
  receiver_id?: number;
  group_id?: number;
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'audio' | 'video';
  file_path?: string;
}

// 群组相关接口
export interface Group {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  creator_id: number;
  created_at: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  avatar?: string;
  creator_id: number;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

// 好友关系接口
export interface Friendship {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface CreateFriendshipRequest {
  requester_id: number;
  addressee_id: number;
}

// 应用设置接口
export interface AppSetting {
  id: number;
  key: string;
  value: string;
  updated_at: string;
}

// 查询结果的包装类型
export interface QueryResult<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface ListResult<T> {
  data: T[];
  total: number;
  success: boolean;
  error?: string;
}
