import linxApi from '@/services/linxApiService';
import type { ChatMessage, Conversation } from '@/types/chat';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * 聊天管理 Store
 */
export const useChatStore = defineStore('chat', () => {
  // ==================== 状态 ====================
  const conversations = ref<Conversation[]>([]);
  const currentConversation = ref<Conversation | null>(null);
  const messages = ref<Map<string, ChatMessage[]>>(new Map());
  const unreadCounts = ref<Map<string | number, number>>(new Map());
  const totalUnreadCount = ref(0);
  const loading = ref(false);
  const wsConnected = ref(false);
  const wsTicket = ref<string | null>(null);

  // ==================== 计算属性 ====================
  const currentMessages = computed(() => {
    if (!currentConversation.value) return [];

    return messages.value.get(currentConversation.value.id) || [];
  });

  const hasUnread = computed(() => totalUnreadCount.value > 0);

  // ==================== WebSocket 相关 ====================

  /**
   * 准备 WebSocket 连接
   */
  async function prepareWebSocket() {
    try {
      // 建立会话
      const sessionRes = await linxApi.chat.connection.establishSession();
      if (sessionRes.code !== 0) {
        ElMessage.error('建立会话失败');

        return null;
      }

      // 获取ticket
      const ticketRes = await linxApi.chat.connection.getTicket();
      if (ticketRes.code === 0) {
        wsTicket.value = ticketRes.data;

        return ticketRes.data;
      }
      ElMessage.error('获取ticket失败');

      return null;
    } catch {
      ElMessage.error('准备WebSocket连接失败');

      return null;
    }
  }

  /**
   * 设置 WebSocket 连接状态
   */
  function setWsConnected(connected: boolean) {
    wsConnected.value = connected;
  }

  // ==================== 会话管理 ====================

  /**
   * 加载最近会话列表
   */
  async function loadConversations(limit = 20) {
    loading.value = true;
    try {
      const res = await linxApi.chat.conversation.getRecent(limit);
      if (res.code === 0) {
        // TODO: 需要后端返回正确的会话格式
        // conversations.value = res.data || [];
      } else {
        ElMessage.error(res.message);
      }
    } finally {
      loading.value = false;
    }
  }

  /**
   * 设置当前会话
   */
  function setCurrentConversation(conversation: Conversation | null) {
    currentConversation.value = conversation;

    // 标记该会话的消息为已读
    if (conversation) {
      markConversationAsRead(conversation.id);
    }
  }

  /**
   * 创建或获取会话
   */
  function getOrCreateConversation(
    id: string,
    type: 'private' | 'group',
    name: string,
    avatar?: string
  ): Conversation {
    let conversation = conversations.value.find(c => c.id === id);

    if (!conversation) {
      conversation = {
        id,
        type,
        name,
        avatar,
        unreadCount: 0,
        lastActiveAt: new Date().toISOString(),
      };
      conversations.value.unshift(conversation);
    }

    return conversation;
  }

  // ==================== 消息管理 ====================

  /**
   * 加载私聊历史记录
   */
  async function loadPrivateHistory(otherUserId: number, page = 0, size = 20) {
    try {
      const res = await linxApi.chat.history.getPrivateHistory(
        otherUserId,
        page,
        size
      );
      if (res.code === 0) {
        const conversationId = `private_${otherUserId}`;
        const existingMessages = messages.value.get(conversationId) || [];
        const newMessages = res.data.messages || [];

        // 合并消息（去重）
        const merged = [...existingMessages];
        newMessages.forEach((msg: ChatMessage) => {
          if (!merged.find(m => m.messageId === msg.messageId)) {
            merged.push(msg);
          }
        });

        // 按时间排序
        merged.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        messages.value.set(conversationId, merged);

        return res.data;
      }
      ElMessage.error(res.message);
    } catch {
      ElMessage.error('加载聊天记录失败');
    }
  }

  /**
   * 加载群聊历史记录
   */
  async function loadGroupHistory(groupId: string, page = 0, size = 20) {
    try {
      const res = await linxApi.chat.history.getGroupHistory(groupId, page, size);
      if (res.code === 0) {
        const conversationId = `group_${groupId}`;
        const existingMessages = messages.value.get(conversationId) || [];
        const newMessages = res.data.messages || [];

        const merged = [...existingMessages];
        newMessages.forEach((msg: ChatMessage) => {
          if (!merged.find(m => m.messageId === msg.messageId)) {
            merged.push(msg);
          }
        });

        merged.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        messages.value.set(conversationId, merged);

        return res.data;
      }
      ElMessage.error(res.message);
    } catch {
      ElMessage.error('加载群聊记录失败');
    }
  }

  /**
   * 添加消息到会话
   */
  function addMessage(conversationId: string, message: ChatMessage) {
    const conversationMessages = messages.value.get(conversationId) || [];

    // 检查消息是否已存在
    if (!conversationMessages.find(m => m.messageId === message.messageId)) {
      conversationMessages.push(message);
      messages.value.set(conversationId, conversationMessages);

      // 更新会话的最后消息
      const conversation = conversations.value.find(c => c.id === conversationId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.lastActiveAt = message.timestamp;

        // 如果不是当前会话，增加未读数
        if (currentConversation.value?.id !== conversationId) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
          updateUnreadCount();
        }
      }
    }
  }

  /**
   * 搜索私聊消息
   */
  async function searchPrivateMessages(
    otherUserId: number,
    keyword: string,
    page = 0,
    size = 20
  ) {
    try {
      const res = await linxApi.chat.message.searchPrivate(
        otherUserId,
        keyword,
        page,
        size
      );
      if (res.code === 0) {
        return res.data;
      }
      ElMessage.error(res.message);
    } catch {
      ElMessage.error('搜索消息失败');
    }
  }

  // ==================== 未读消息管理 ====================

  /**
   * 更新未读消息总数
   */
  function updateUnreadCount() {
    totalUnreadCount.value = conversations.value.reduce(
      (sum, conv) => sum + (conv.unreadCount || 0),
      0
    );
  }

  /**
   * 加载未读消息总数
   */
  async function loadTotalUnreadCount() {
    try {
      const res = await linxApi.chat.unread.getTotalCount();
      if (res.code === 0) {
        totalUnreadCount.value = res.data.totalUnreadCount;
      }
    } catch {
      // 静默失败
    }
  }

  /**
   * 标记会话为已读
   */
  async function markConversationAsRead(conversationId: string) {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (!conversation) return;

    // 更新本地状态
    conversation.unreadCount = 0;
    updateUnreadCount();

    // 调用API
    if (conversation.type === 'private') {
      const parts = conversationId.split('_');
      if (!parts[1]) return;
      const userId = Number.parseInt(parts[1]);
      if (!userId) return;
      try {
        await linxApi.chat.unread.markPrivateAsRead(userId);
      } catch {
        // 静默失败
      }
    }
  }

  /**
   * 删除消息
   */
  async function deleteMessage(messageId: string, conversationId: string) {
    try {
      const res = await linxApi.chat.message.delete(messageId);
      if (res.code === 0) {
        // 从本地消息列表中移除
        const conversationMessages = messages.value.get(conversationId) || [];
        const filtered = conversationMessages.filter(
          m => m.messageId !== messageId
        );
        messages.value.set(conversationId, filtered);

        ElMessage.success('消息已删除');

        return true;
      }
      ElMessage.error(res.message);

      return false;
    } catch {
      ElMessage.error('删除消息失败');

      return false;
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 初始化
   */
  async function initialize() {
    await Promise.all([loadConversations(), loadTotalUnreadCount()]);
  }

  /**
   * 清空状态
   */
  function reset() {
    conversations.value = [];
    currentConversation.value = null;
    messages.value.clear();
    unreadCounts.value.clear();
    totalUnreadCount.value = 0;
    loading.value = false;
    wsConnected.value = false;
    wsTicket.value = null;
  }

  return {
    // 状态
    conversations,
    currentConversation,
    messages,
    unreadCounts,
    totalUnreadCount,
    loading,
    wsConnected,
    wsTicket,

    // 计算属性
    currentMessages,
    hasUnread,

    // WebSocket
    prepareWebSocket,
    setWsConnected,

    // 会话管理
    loadConversations,
    setCurrentConversation,
    getOrCreateConversation,

    // 消息管理
    loadPrivateHistory,
    loadGroupHistory,
    addMessage,
    searchPrivateMessages,

    // 未读消息
    updateUnreadCount,
    loadTotalUnreadCount,
    markConversationAsRead,

    // 其他
    deleteMessage,
    initialize,
    reset,
  };
});
