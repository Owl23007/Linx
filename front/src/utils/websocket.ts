import { establishWebSocketSession } from '@/request/auth';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * WebSocket 连接状态
 */
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

/**
 * WebSocket 客户端配置
 */
export interface WebSocketConfig {
  url: string // WebSocket 服务器地址
  token?: string // 认证 token (已弃用,现在通过 HTTP 会话认证)
  reconnectDelay?: number // 重连延迟(ms)
  heartbeatIncoming?: number // 服务端心跳间隔(ms)
  heartbeatOutgoing?: number // 客户端心跳间隔(ms)
  debug?: boolean // 是否启用调试日志
  establishSession?: boolean // 是否在连接前建立 HTTP 会话 (默认: true)
}

/**
 * 内部使用的完整配置类型
 */
interface InternalWebSocketConfig {
  url: string
  token?: string
  reconnectDelay: number
  heartbeatIncoming: number
  heartbeatOutgoing: number
  debug: boolean
  establishSession: boolean
}

/**
 * 订阅回调函数类型
 */
export type MessageCallback = (message: IMessage) => void;

/**
 * 日志工具 (简化版,避免 ESLint 错误)
 */
const logger = {
  log: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error(message, ...args);
  }
};

/**
 * WebSocket 客户端类
 * 封装 STOMP over SockJS 的 WebSocket 连接
 */
export class WebSocketClient {
  private client: Client | null = null;
  private config: InternalWebSocketConfig;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private stateChangeCallbacks: Set<(state: ConnectionState) => void> = new Set();

  /**
   * 构造函数
   * @param config WebSocket 配置
   */
  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: false,
      establishSession: true, // 默认开启会话建立
      ...config
    };
  }

  /**
   * 连接到 WebSocket 服务器
   * @returns Promise<void>
   */
  async connect(): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED) {
      logger.warn('[WebSocket] 已经连接,无需重复连接');

      return;
    }

    if (this.connectionState === ConnectionState.CONNECTING) {
      logger.warn('[WebSocket] 正在连接中...');

      return;
    }

    this.updateConnectionState(ConnectionState.CONNECTING);

    try {
      // 如果启用了会话建立,先通过 HTTP 接口建立会话
      if (this.config.establishSession) {
        logger.log('[WebSocket] 正在建立 HTTP 会话...');
        try {
          await establishWebSocketSession();
          logger.log('[WebSocket] HTTP 会话建立成功');
        }
        catch (error) {
          logger.error('[WebSocket] HTTP 会话建立失败:', error);
          this.updateConnectionState(ConnectionState.ERROR);
          throw new Error('建立 WebSocket 会话失败');
        }
      }

      // 使用纯净的 URL,不再附加 token
      const wsUrl = this.config.url;
      logger.log('[WebSocket] 正在连接到:', wsUrl);

      // 创建并连接 STOMP 客户端
      return new Promise<void>((resolve, reject) => {
        // 创建 STOMP 客户端
        this.client = new Client({
          // 使用 SockJS 作为 WebSocket 传输层
          // 不再在 URL 中添加 token,而是依赖 HTTP 会话中的 cookie
          // SockJS 会自动携带同域的 cookie
          webSocketFactory: () => new SockJS(wsUrl, null, {
            // 配置 SockJS 的传输选项
            transports: ['websocket', 'xhr-streaming', 'xhr-polling']
          }) as any,

          // 连接头 - 不再需要 Authorization,因为已经通过 HTTP 会话认证
          connectHeaders: {},

          // 心跳配置
          heartbeatIncoming: this.config.heartbeatIncoming,
          heartbeatOutgoing: this.config.heartbeatOutgoing,

          // 重连配置
          reconnectDelay: this.config.reconnectDelay,

          // 调试日志
          debug: this.config.debug
            ? (str: string) => {
              logger.log('[WebSocket Debug]', str);
            }
            : undefined,

          // 连接成功回调
          onConnect: () => {
            logger.log('[WebSocket] 连接成功');
            this.updateConnectionState(ConnectionState.CONNECTED);
            resolve();
          },

          // 连接错误回调
          onStompError: (frame) => {
            logger.error('[WebSocket] STOMP 错误:', frame.headers.message);
            logger.error('[WebSocket] 错误详情:', frame.body);
            this.updateConnectionState(ConnectionState.ERROR);
            reject(new Error(frame.headers.message || '连接失败'));
          },

          // WebSocket 错误回调
          onWebSocketError: (event) => {
            logger.error('[WebSocket] WebSocket 错误:', event);
            this.updateConnectionState(ConnectionState.ERROR);
          },

          // 断开连接回调
          onDisconnect: () => {
            logger.log('[WebSocket] 连接已断开');
            this.updateConnectionState(ConnectionState.DISCONNECTED);
          }
        });

        // 激活连接
        this.client.activate();
      });
    }
    catch (error) {
      logger.error('[WebSocket] 连接失败:', error);
      this.updateConnectionState(ConnectionState.ERROR);
      throw error;
    }
  }

  /**
   * 订阅消息主题
   * @param destination 订阅的目的地 (如 /topic/messages, /user/queue/reply)
   * @param callback 消息回调函数
   * @returns 订阅ID,可用于取消订阅
   */
  subscribe(destination: string, callback: MessageCallback): string | null {
    if (!this.client || this.connectionState !== ConnectionState.CONNECTED) {
      logger.error('[WebSocket] 未连接,无法订阅:', destination);

      return null;
    }

    try {
      const subscription = this.client.subscribe(destination, (message) => {
        logger.log(`[WebSocket] 收到消息 [${destination}]:`, message.body);
        callback(message);
      });

      this.subscriptions.set(destination, subscription);
      logger.log('[WebSocket] 订阅成功:', destination);

      return subscription.id;
    }
    catch (error) {
      logger.error('[WebSocket] 订阅失败:', destination, error);

      return null;
    }
  }

  /**
   * 取消订阅
   * @param destination 订阅的目的地
   */
  unsubscribe(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
      logger.log('[WebSocket] 取消订阅:', destination);
    }
    else {
      logger.warn('[WebSocket] 未找到订阅:', destination);
    }
  }

  /**
   * 发送消息
   * @param destination 目的地 (如 /app/chat.send)
   * @param body 消息体 (将被 JSON 序列化)
   * @param headers 额外的消息头 (可选)
   */
  send(destination: string, body: any, headers: Record<string, string> = {}): void {
    if (!this.client || this.connectionState !== ConnectionState.CONNECTED) {
      logger.error('[WebSocket] 未连接,无法发送消息');
      throw new Error('WebSocket 未连接');
    }

    try {
      const messageBody = typeof body === 'string' ? body : JSON.stringify(body);
      this.client.publish({
        destination,
        body: messageBody,
        headers: {
          'content-type': 'application/json',
          ...headers
        }
      });
      logger.log(`[WebSocket] 发送消息 [${destination}]:`, body);
    }
    catch (error) {
      logger.error('[WebSocket] 发送消息失败:', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.client) {
        logger.warn('[WebSocket] 客户端未初始化');
        resolve();

        return;
      }

      if (this.connectionState === ConnectionState.DISCONNECTED) {
        logger.warn('[WebSocket] 已经断开连接');
        resolve();

        return;
      }

      logger.log('[WebSocket] 正在断开连接...');

      // 取消所有订阅
      this.subscriptions.forEach((subscription, destination) => {
        subscription.unsubscribe();
        logger.log('[WebSocket] 取消订阅:', destination);
      });
      this.subscriptions.clear();

      // 断开连接
      this.client.deactivate().then(() => {
        logger.log('[WebSocket] 连接已断开');
        this.updateConnectionState(ConnectionState.DISCONNECTED);
        this.client = null;
        resolve();
      });
    });
  }

  /**
   * 获取当前连接状态
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * 判断是否已连接
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * 监听连接状态变化
   * @param callback 状态变化回调函数
   * @returns 取消监听的函数
   */
  onStateChange(callback: (state: ConnectionState) => void): () => void {
    this.stateChangeCallbacks.add(callback);

    // 返回取消监听的函数
    return () => {
      this.stateChangeCallbacks.delete(callback);
    };
  }

  /**
   * 更新连接状态并通知监听器
   * @param newState 新的连接状态
   */
  private updateConnectionState(newState: ConnectionState): void {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      logger.log('[WebSocket] 状态变更:', newState);

      // 通知所有监听器
      this.stateChangeCallbacks.forEach((callback) => {
        try {
          callback(newState);
        }
        catch (error) {
          logger.error('[WebSocket] 状态变化回调执行失败:', error);
        }
      });
    }
  }
}

/**
 * 创建 WebSocket 客户端实例
 * @param config WebSocket 配置
 * @returns WebSocketClient 实例
 */
export function createWebSocketClient(config: WebSocketConfig): WebSocketClient {
  return new WebSocketClient(config);
}
