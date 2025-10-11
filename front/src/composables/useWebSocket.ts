import { useChatStore } from '@/stores/chat';
import type { ChatMessage } from '@/types/chat';
import { Client, type IMessage } from '@stomp/stompjs';
import { ElMessage } from 'element-plus';
import { onUnmounted, ref } from 'vue';

/**
 * WebSocket 连接管理
 * 使用 STOMP 协议进行消息通信
 */
export function useWebSocket() {
  const chatStore = useChatStore();
  const client = ref<Client | null>(null);
  const connected = ref(false);
  const connecting = ref(false);

  /**
   * 连接 WebSocket
   */
  async function connect(baseUrl: string) {
    if (connected.value || connecting.value) {
      return;
    }

    connecting.value = true;

    try {
      // 1. 准备连接（获取ticket）
      const ticket = await chatStore.prepareWebSocket();
      if (!ticket) {
        throw new Error('获取ticket失败');
      }

      // 2. 创建 STOMP 客户端
      const wsUrl = baseUrl.replace('http', 'ws') + `/ws?ticket=${ticket}`;

      client.value = new Client({
        brokerURL: wsUrl,
        connectHeaders: {},
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      // 3. 连接成功回调
      client.value.onConnect = () => {
        console.log('WebSocket 连接成功');
        connected.value = true;
        connecting.value = false;
        chatStore.setWsConnected(true);

        // 订阅私聊消息
        subscribePrivateMessages();

        // 订阅群聊消息（根据需要）
        subscribeGroupMessages();

        ElMessage.success('连接成功');
      };

      // 4. 连接错误回调
      client.value.onStompError = (frame) => {
        console.error('STOMP 错误:', frame);
        connected.value = false;
        connecting.value = false;
        chatStore.setWsConnected(false);
        ElMessage.error('连接失败');
      };

      // 5. WebSocket 错误回调
      client.value.onWebSocketError = (event) => {
        console.error('WebSocket 错误:', event);
        connected.value = false;
        connecting.value = false;
        chatStore.setWsConnected(false);
      };

      // 6. 断开连接回调
      client.value.onDisconnect = () => {
        console.log('WebSocket 已断开');
        connected.value = false;
        chatStore.setWsConnected(false);
      };

      // 7. 激活连接
      client.value.activate();
    } catch (error) {
      console.error('连接 WebSocket 失败:', error);
      connecting.value = false;
      ElMessage.error('连接失败');
    }
  }

  /**
   * 订阅私聊消息
   */
  function subscribePrivateMessages() {
    if (!client.value) return;

    client.value.subscribe('/user/queue/messages', (message: IMessage) => {
      try {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        console.log('收到私聊消息:', chatMessage);

        // 添加到消息列表
        const conversationId = `private_${chatMessage.senderId}`;
        chatStore.addMessage(conversationId, chatMessage);
      } catch (error) {
        console.error('解析私聊消息失败:', error);
      }
    });
  }

  /**
   * 订阅群聊消息
   */
  function subscribeGroupMessages() {
    if (!client.value) return;

    // 订阅所有已加入的群组
    // TODO: 根据实际的群组列表动态订阅
    // groupStore.groups.forEach(group => {
    //   client.value?.subscribe(`/topic/group.${group.id}`, (message: IMessage) => {
    //     // 处理群聊消息
    //   });
    // });
  }

  /**
   * 发送私聊消息
   */
  function sendPrivateMessage(receiverId: number, content: string, type = 'CHAT') {
    if (!client.value || !connected.value) {
      ElMessage.error('未连接到服务器');

      return;
    }

    const message: Partial<ChatMessage> = {
      receiverId,
      content,
      type: type as any,
    };

    client.value.publish({
      destination: '/app/chat.private',
      body: JSON.stringify(message),
    });
  }

  /**
   * 发送群聊消息
   */
  function sendGroupMessage(groupId: string, content: string, type = 'CHAT') {
    if (!client.value || !connected.value) {
      ElMessage.error('未连接到服务器');

      return;
    }

    const message: Partial<ChatMessage> = {
      groupId,
      content,
      type: type as any,
    };

    client.value.publish({
      destination: '/app/chat.group',
      body: JSON.stringify(message),
    });
  }

  /**
   * 发送输入状态
   */
  function sendTypingStatus(receiverId: number) {
    if (!client.value || !connected.value) return;

    const message: Partial<ChatMessage> = {
      receiverId,
      type: 'TYPING',
    };

    client.value.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(message),
    });
  }

  /**
   * 发送已读回执
   */
  function sendReadReceipt(messageId: string, senderId: number) {
    if (!client.value || !connected.value) return;

    const message: Partial<ChatMessage> = {
      messageId,
      senderId,
      type: 'READ_RECEIPT',
    };

    client.value.publish({
      destination: '/app/chat.read',
      body: JSON.stringify(message),
    });
  }

  /**
   * 断开连接
   */
  function disconnect() {
    if (client.value) {
      client.value.deactivate();
      client.value = null;
      connected.value = false;
      chatStore.setWsConnected(false);
    }
  }

  // 组件卸载时自动断开连接
  onUnmounted(() => {
    disconnect();
  });

  return {
    connected,
    connecting,
    connect,
    disconnect,
    sendPrivateMessage,
    sendGroupMessage,
    sendTypingStatus,
    sendReadReceipt,
  };
}
