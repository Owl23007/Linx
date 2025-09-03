// 用户相关类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// 认证相关类型定义
export interface LoginForm {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  captchaCode?: string;
  captchaId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 应用配置类型定义
export interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  serverUrl: string;
  autoLogin: boolean;
  fontSize: number;
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
  };
}

// API 响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 聊天相关类型定义
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: string;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'private' | 'group';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}
