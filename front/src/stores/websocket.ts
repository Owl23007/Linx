import { ConnectionState, WebSocketClient, createWebSocketClient } from '@/utils/websocket';
import type { IMessage } from '@stomp/stompjs';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * WebSocket Store
 * 管理 WebSocket 连接状态、用户信息和订阅列表
 */
export const useWebSocketStore = defineStore('websocket', () => {
  // ===== 状态 =====

  /** WebSocket 客户端实例 */
  const client = ref<WebSocketClient | null>(null);

  /** 连接状态 */
  const connectionState = ref<ConnectionState>(ConnectionState.DISCONNECTED);

  /** 当前用户信息 */
  const currentUserId = ref<string | null>(null);

  /** 订阅列表 (destination -> subscriptionId) */
  const subscriptions = ref<Map<string, string>>(new Map());

  /** 错误消息 */
  const errorMessage = ref<string | null>(null);

  // ===== 计算属性 =====

  /** 是否已连接 */
  const isConnected = computed(() => connectionState.value === ConnectionState.CONNECTED);

  /** 是否正在连接 */
  const isConnecting = computed(() => connectionState.value === ConnectionState.CONNECTING);

  /** 是否已断开 */
  const isDisconnected = computed(() => connectionState.value === ConnectionState.DISCONNECTED);

  /** 是否有错误 */
  const hasError = computed(() => connectionState.value === ConnectionState.ERROR);

  // ===== 操作方法 =====

  /**
   * 连接到 WebSocket 服务器
   * @param url WebSocket 服务器地址
   * @param token 认证 token (可选)
   * @param userId 用户ID
   */
  async function connect(url: string, userId: string, token?: string): Promise<void> {
    try {
      // 如果已经连接或正在连接,不重复连接
      if (isConnected.value || isConnecting.value) {
        return;
      }

      // 清除之前的错误
      errorMessage.value = null;
      currentUserId.value = userId;

      // 创建 WebSocket 客户端
      if (!client.value) {
        client.value = createWebSocketClient({
          url,
          token,
          reconnectDelay: 5000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          debug: import.meta.env.DEV
        });

        // 监听连接状态变化
        client.value.onStateChange((state) => {
          connectionState.value = state;
        });
      }

      // 连接到服务器
      await client.value.connect();
    }
    catch (error: any) {
      errorMessage.value = error?.message || '连接失败';
      connectionState.value = ConnectionState.ERROR;
      throw error;
    }
  }

  /**
   * 断开 WebSocket 连接
   */
  async function disconnect(): Promise<void> {
    try {
      if (client.value) {
        await client.value.disconnect();
        client.value = null;
      }

      // 清空状态
      subscriptions.value.clear();
      currentUserId.value = null;
      errorMessage.value = null;
      connectionState.value = ConnectionState.DISCONNECTED;
    }
    catch (error: any) {
      errorMessage.value = error?.message || '断开连接失败';
      throw error;
    }
  }

  /**
   * 订阅消息主题
   * @param destination 订阅的目的地 (如 /topic/messages, /user/queue/reply)
   * @param callback 消息回调函数
   * @returns 是否订阅成功
   */
  function subscribe(
    destination: string,
    callback: (message: IMessage) => void
  ): boolean {
    if (!client.value || !isConnected.value) {
      errorMessage.value = '未连接到服务器,无法订阅';

      return false;
    }

    try {
      const subscriptionId = client.value.subscribe(destination, callback);
      if (subscriptionId) {
        subscriptions.value.set(destination, subscriptionId);

        return true;
      }

      return false;
    }
    catch (error: any) {
      errorMessage.value = error?.message || '订阅失败';

      return false;
    }
  }

  /**
   * 取消订阅
   * @param destination 订阅的目的地
   */
  function unsubscribe(destination: string): void {
    if (!client.value) {
      return;
    }

    try {
      client.value.unsubscribe(destination);
      subscriptions.value.delete(destination);
    }
    catch (error: any) {
      errorMessage.value = error?.message || '取消订阅失败';
    }
  }

  /**
   * 发送消息
   * @param destination 目的地 (如 /app/chat.send)
   * @param body 消息体
   * @param headers 额外的消息头 (可选)
   */
  function send(destination: string, body: any, headers?: Record<string, string>): void {
    if (!client.value || !isConnected.value) {
      errorMessage.value = '未连接到服务器,无法发送消息';
      throw new Error('未连接到服务器');
    }

    try {
      client.value.send(destination, body, headers);
    }
    catch (error: any) {
      errorMessage.value = error?.message || '发送消息失败';
      throw error;
    }
  }

  /**
   * 清除错误消息
   */
  function clearError(): void {
    errorMessage.value = null;
  }

  /**
   * 获取所有订阅列表
   */
  function getSubscriptions(): string[] {
    return Array.from(subscriptions.value.keys());
  }

  // ===== 返回 =====

  return {
    // 状态
    client,
    connectionState,
    currentUserId,
    subscriptions,
    errorMessage,

    // 计算属性
    isConnected,
    isConnecting,
    isDisconnected,
    hasError,

    // 方法
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    clearError,
    getSubscriptions
  };
});
