/**
 * WebSocket 聊天服务使用示例
 * 展示如何使用 WebSocket 客户端进行聊天功能
 */

import type { IMessage } from '@stomp/stompjs';
import { ConnectionState, createWebSocketClient, type WebSocketClient } from '../utils/websocket';

/**
 * 聊天消息类型
 */
export type MessageType = 'CHAT' | 'JOIN' | 'LEAVE' | 'PRIVATE';

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  type: MessageType
  content: string
  senderId?: string
  senderLongId?: number
  senderName?: string
  recipientId?: string
  timestamp?: string
}

/**
 * 聊天服务类
 */
export class ChatService {
  private wsClient: WebSocketClient | null = null;
  private messageCallbacks: Set<(message: ChatMessage) => void> = new Set();
  private privateMessageCallbacks: Set<(message: ChatMessage) => void> = new Set();

  /**
   * 连接到聊天服务器
   * @param token JWT token
   * @param wsUrl WebSocket 服务器地址 (默认: http://localhost:8080/ws)
   */
  async connect(token: string, wsUrl = 'http://localhost:8080/ws'): Promise<void> {
    // 创建 WebSocket 客户端
    this.wsClient = createWebSocketClient({
      url: wsUrl,
      token,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: import.meta.env.DEV // 开发环境启用调试
    });

    // 监听连接状态变化
    this.wsClient.onStateChange((state: ConnectionState) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[ChatService] 连接状态:', state);
      }

      // 连接成功后自动订阅
      if (state === ConnectionState.CONNECTED) {
        this.subscribeToTopics();
      }
    });

    // 建立连接
    await this.wsClient.connect();
  }

  /**
   * 订阅消息主题
   */
  private subscribeToTopics(): void {
    if (!this.wsClient) return;

    // 订阅公共频道 (群发消息)
    this.wsClient.subscribe('/topic/public', (message: IMessage) => {
      const chatMessage = JSON.parse(message.body) as ChatMessage;
      this.notifyMessageCallbacks(chatMessage);
    });

    // 订阅私人消息队列
    this.wsClient.subscribe('/user/queue/messages', (message: IMessage) => {
      const chatMessage = JSON.parse(message.body) as ChatMessage;
      this.notifyPrivateMessageCallbacks(chatMessage);
    });

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[ChatService] 已订阅消息主题');
    }
  }

  /**
   * 发送群发消息
   * @param content 消息内容
   * @param senderName 发送者名称
   */
  sendMessage(content: string, senderName: string): void {
    if (!this.wsClient || !this.wsClient.isConnected()) {
      throw new Error('WebSocket 未连接');
    }

    const message: ChatMessage = {
      type: 'CHAT',
      content,
      senderName
    };

    this.wsClient.send('/app/chat.send', message);
  }

  /**
   * 发送私聊消息
   * @param content 消息内容
   * @param recipientId 接收者 ID
   * @param senderName 发送者名称
   */
  sendPrivateMessage(content: string, recipientId: string, senderName: string): void {
    if (!this.wsClient || !this.wsClient.isConnected()) {
      throw new Error('WebSocket 未连接');
    }

    const message: ChatMessage = {
      type: 'PRIVATE',
      content,
      recipientId,
      senderName
    };

    this.wsClient.send('/app/chat.private', message);
  }

  /**
   * 加入聊天
   * @param username 用户名
   */
  joinChat(username: string): void {
    if (!this.wsClient || !this.wsClient.isConnected()) {
      throw new Error('WebSocket 未连接');
    }

    const message: ChatMessage = {
      type: 'JOIN',
      content: '',
      senderName: username
    };

    this.wsClient.send('/app/chat.join', message);
  }

  /**
   * 监听群发消息
   * @param callback 消息回调函数
   * @returns 取消监听的函数
   */
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.add(callback);

    return () => {
      this.messageCallbacks.delete(callback);
    };
  }

  /**
   * 监听私聊消息
   * @param callback 消息回调函数
   * @returns 取消监听的函数
   */
  onPrivateMessage(callback: (message: ChatMessage) => void): () => void {
    this.privateMessageCallbacks.add(callback);

    return () => {
      this.privateMessageCallbacks.delete(callback);
    };
  }

  /**
   * 通知所有群发消息监听器
   */
  private notifyMessageCallbacks(message: ChatMessage): void {
    this.messageCallbacks.forEach((callback) => {
      try {
        callback(message);
      }
      catch (error) {
        // eslint-disable-next-line no-console
        console.error('[ChatService] 消息回调执行失败:', error);
      }
    });
  }

  /**
   * 通知所有私聊消息监听器
   */
  private notifyPrivateMessageCallbacks(message: ChatMessage): void {
    this.privateMessageCallbacks.forEach((callback) => {
      try {
        callback(message);
      }
      catch (error) {
        // eslint-disable-next-line no-console
        console.error('[ChatService] 私聊消息回调执行失败:', error);
      }
    });
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.wsClient) {
      await this.wsClient.disconnect();
      this.wsClient = null;
    }
    this.messageCallbacks.clear();
    this.privateMessageCallbacks.clear();
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): ConnectionState | null {
    return this.wsClient?.getConnectionState() || null;
  }

  /**
   * 判断是否已连接
   */
  isConnected(): boolean {
    return this.wsClient?.isConnected() || false;
  }
}

/**
 * 创建聊天服务实例
 */
export function createChatService(): ChatService {
  return new ChatService();
}

// ============================================
// Vue 3 Composable 示例
// ============================================

import { onUnmounted, ref } from 'vue';

export function useChatService() {
  const chatService = ref<ChatService | null>(null);
  const isConnected = ref(false);
  const messages = ref<ChatMessage[]>([]);
  const privateMessages = ref<ChatMessage[]>([]);

  /**
   * 初始化聊天服务
   */
  const initChatService = async (token: string, wsUrl?: string) => {
    chatService.value = createChatService();

    // 监听消息
    chatService.value.onMessage((message) => {
      messages.value.push(message);
    });

    chatService.value.onPrivateMessage((message) => {
      privateMessages.value.push(message);
    });

    // 连接
    await chatService.value.connect(token, wsUrl);
    isConnected.value = true;
  };

  /**
   * 发送消息
   */
  const sendMessage = (content: string, senderName: string) => {
    chatService.value?.sendMessage(content, senderName);
  };

  /**
   * 发送私聊消息
   */
  const sendPrivateMessage = (content: string, recipientId: string, senderName: string) => {
    chatService.value?.sendPrivateMessage(content, recipientId, senderName);
  };

  /**
   * 加入聊天
   */
  const joinChat = (username: string) => {
    chatService.value?.joinChat(username);
  };

  /**
   * 断开连接
   */
  const disconnect = async () => {
    await chatService.value?.disconnect();
    isConnected.value = false;
  };

  // 组件卸载时自动断开连接
  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    messages,
    privateMessages,
    initChatService,
    sendMessage,
    sendPrivateMessage,
    joinChat,
    disconnect
  };
}
