<template>
  <div class="min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 relative">
    <!-- Electron 拖动区域 -->
    <header v-if="isElectron()"
      class="fixed top-0 left-0 right-0 h-12 flex justify-between items-center px-3 z-50 shadow-sm bg-white/80 backdrop-blur-sm">
      <!-- 左侧：Logo -->
      <div class="flex-shrink-0 absolute left-[-40px]">
        <Title :size="0.7" />
      </div>

      <div ref="dragAreaRef" class="flex-1 h-full drag-area" />
      <div class="flex flex-shrink-0 no-drag">
        <el-button size="small" class="window-btn minimize-btn" @click="showEasyTierDialog = true">
          <el-icon :size="16">
            <Setting />
          </el-icon>
        </el-button>
        <el-button size="small" class="window-btn minimize-btn" @click="handleMinimizeWindow">
          <el-icon :size="16">
            <Minus />
          </el-icon>
        </el-button>
        <el-button size="small" class="window-btn close-btn" @click="handleCloseWindow">
          <el-icon :size="16">
            <Close />
          </el-icon>
        </el-button>
      </div>
    </header>

    <!-- 主内容区：绝对定位，精准计算高度 -->
    <div class="absolute inset-x-0 top-0 bottom-0" :style="{
      top: isElectron() ? '48px' : '0',
      height: isElectron() ? 'calc(100vh - 48px)' : '100vh'
    }">
      <!-- 左侧侧边栏 + 聊天区域 -->
      <div class="flex h-full">
        <!-- 侧边栏 -->
        <aside class="w-84 bg-white border-r border-gray-200 overflow-y-auto flex flex-row overflow-hidden">
          <div class="w-16">
            <SideBar @add-friend="showAddFriendDialog = true" @create-group="showCreateGroupDialog = true"
              @show-friend-requests="showFriendRequestsDialog = true" />
          </div>
          <div class="w-68">
            <MessageList @select-chat="handleSelectChat" />
          </div>
        </aside>

        <!-- 聊天区域：垂直布局，撑满剩余高度 -->
        <div class="flex-1 flex flex-col bg-white">
          <!-- 未选择会话时的空状态 -->
          <div v-if="!currentChat" class="flex-1 flex items-center justify-center">
            <el-empty description="选择一个会话开始聊天" />
          </div>

          <!-- 已选择会话 -->
          <template v-else>
            <!-- 聊天标题栏 -->
            <div class="border-b border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <el-avatar :size="32">
                  {{ currentChat.name[0] }}
                </el-avatar>
                <div>
                  <h2 class="font-medium text-gray-800">{{ currentChat.name }}</h2>
                  <p class="text-xs text-gray-500">{{ statusText }}</p>
                </div>
              </div>
              <el-button-group>
                <el-button :icon="VideoCamera" circle text @click="handleVideoCall" />
                <el-button :icon="Phone" circle text @click="handleVoiceCall" />
                <el-button :icon="MoreFilled" circle text @click="handleMoreOptions" />
              </el-button-group>
            </div>

            <!-- 消息列表 -->
            <div ref="messageContainer" class="flex-1 p-4 overflow-y-auto space-y-4" @scroll="handleScroll">
              <!-- 加载更多指示器 -->
              <div v-if="loading" class="flex justify-center py-2">
                <el-icon class="is-loading text-blue-500">
                  <Loading />
                </el-icon>
                <span class="ml-2 text-sm text-gray-500">加载中...</span>
              </div>

              <!-- 消息列表 -->
              <message-item v-for="msg in currentMessages" :key="msg.messageId" :message="msg"
                :current-user-id="currentUserId ?? 0" @resend="handleResendMessage" @avatar-click="handleAvatarClick" />

              <!-- 空消息提示 -->
              <div v-if="currentMessages.length === 0 && !loading" class="flex justify-center py-8">
                <el-empty description="暂无消息" />
              </div>
            </div>

            <!-- 输入框：固定在底部 -->
            <message-input :typing-users="typingUsers" @send="handleSendMessage" @typing="handleTyping" />
          </template>
        </div>
      </div>
    </div>

    <!-- 添加好友对话框 -->
    <add-friend-dialog v-model:visible="showAddFriendDialog" @success="handleAddFriendSuccess" />

    <!-- 创建群组对话框 -->
    <create-group-dialog v-model:visible="showCreateGroupDialog" @success="handleCreateGroupSuccess" />

    <!-- 好友请求对话框 -->
    <friend-requests-dialog v-model:visible="showFriendRequestsDialog" />

    <!-- EasyTier 对话框 -->
    <easy-tier-dialog v-model="showEasyTierDialog" />
  </div>
</template>

<script setup lang="ts">
import { useWebSocket } from '@/composables/useWebSocket';
import { useChatStore } from '@/stores/chat';
import { useFriendsStore } from '@/stores/friends';
import { useGroupsStore } from '@/stores/groups';
import { useUserStore } from '@/stores/user';
import type { ChatMessage, Conversation } from '@/types/chat';
import dragSetup from '@/utils/drag';
import { closeWindow, isElectron, minimizeWindow } from '@/utils/electron';
import AddFriendDialog from '@/views/components/add-friend-dialog.vue';
import CreateGroupDialog from '@/views/components/create-group-dialog.vue';
import EasyTierDialog from '@/views/components/easytier-dialog.vue';
import FriendRequestsDialog from '@/views/components/friend-requests-dialog.vue';
import MessageInput from '@/views/components/message-input.vue';
import MessageItem from '@/views/components/message-item.vue';
import Title from '@/views/components/title-icon.vue';
import {
  Close,
  Loading,
  Minus,
  MoreFilled,
  Phone,
  Setting,
  VideoCamera
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import MessageList from './components/message-list.vue';
import SideBar from './components/side-bar.vue';

// Stores
const chatStore = useChatStore();
const userStore = useUserStore();
const friendsStore = useFriendsStore();
const groupsStore = useGroupsStore();

// WebSocket
const { connect, sendPrivateMessage, sendGroupMessage } = useWebSocket();

// Refs
const dragAreaRef = ref<HTMLElement | null>(null);
const messageContainer = ref<HTMLElement | null>(null);
const showAddFriendDialog = ref(false);
const showCreateGroupDialog = ref(false);
const showFriendRequestsDialog = ref(false);
const showEasyTierDialog = ref(false);
const loading = ref(false);
const typingUsers = ref<string[]>([]);
const currentChat = ref<Conversation | null>(null);
const page = ref(0);

// Computed
const currentUserId = computed(() => userStore.userId);
const currentMessages = computed(() => chatStore.currentMessages);
const statusText = computed(() => {
  if (!currentChat.value) return '';

  if (currentChat.value.type === 'group') {
    return `群聊 • ${currentChat.value.group?.memberCount || 0} 人`;
  }

  return currentChat.value.friend?.onlineStatus === 'ONLINE' ? '在线' : '离线';
});

// Methods
function handleCloseWindow() {
  closeWindow();
}

function handleMinimizeWindow() {
  minimizeWindow();
}

async function handleSelectChat(chat: any) {
  // 重置状态
  page.value = 0;
  loading.value = true;

  try {
    // 根据聊天类型创建会话
    if (chat.type === 'private') {
      // 私聊
      const conversation: Conversation = {
        id: `private_${chat.friendId}`,
        type: 'private',
        name: chat.remark || chat.friendUsername,
        avatar: chat.friendAvatar,
        unreadCount: 0,
        lastActiveAt: new Date().toISOString(),
        friend: chat,
      };

      currentChat.value = conversation;
      chatStore.setCurrentConversation(conversation);

      // 加载聊天历史
      await chatStore.loadPrivateHistory(chat.friendId, page.value, 20);
    } else if (chat.type === 'group') {
      // 群聊
      const conversation: Conversation = {
        id: `group_${chat.id}`,
        type: 'group',
        name: chat.name,
        avatar: chat.avatarUrl,
        unreadCount: 0,
        lastActiveAt: new Date().toISOString(),
        group: chat,
      };

      currentChat.value = conversation;
      chatStore.setCurrentConversation(conversation);

      // 加载群聊历史
      await chatStore.loadGroupHistory(chat.id, page.value, 20);
    }

    // 滚动到底部
    await nextTick();
    scrollToBottom();
  } catch {
    ElMessage.error('加载聊天记录失败');
  } finally {
    loading.value = false;
  }
}

async function handleSendMessage(content: string, type: 'CHAT' | 'IMAGE' | 'FILE' | 'VOICE' = 'CHAT') {
  if (!currentChat.value) return;

  try {
    const message: ChatMessage = {
      messageId: `temp_${Date.now()}`,
      type,
      senderId: currentUserId.value || 0,
      senderName: userStore.username || '我',
      content,
      timestamp: new Date().toISOString(),
    };

    // 添加到消息列表（临时）
    chatStore.addMessage(currentChat.value.id, message);

    // 发送消息
    if (currentChat.value.type === 'private' && currentChat.value.friend) {
      await sendPrivateMessage(currentChat.value.friend.friendId, content, type);
    } else if (currentChat.value.type === 'group' && currentChat.value.group) {
      await sendGroupMessage(currentChat.value.group.id.toString(), content, type);
    }

    // 滚动到底部
    await nextTick();
    scrollToBottom();
  } catch {
    ElMessage.error('发送消息失败');
  }
}

function handleTyping() {
  // TODO: 发送正在输入的状态
  // 暂时不输出日志
}

function handleScroll() {
  if (!messageContainer.value || loading.value) return;

  const { scrollTop } = messageContainer.value;

  // 滚动到顶部时加载更多
  if (scrollTop < 100) {
    loadMoreMessages();
  }
}

async function loadMoreMessages() {
  if (!currentChat.value || loading.value) return;

  loading.value = true;
  page.value++;

  try {
    if (currentChat.value.type === 'private' && currentChat.value.friend) {
      await chatStore.loadPrivateHistory(currentChat.value.friend.friendId, page.value, 20);
    } else if (currentChat.value.type === 'group' && currentChat.value.group) {
      await chatStore.loadGroupHistory(currentChat.value.group.id.toString(), page.value, 20);
    }
  } catch {
    ElMessage.error('加载历史消息失败');
  } finally {
    loading.value = false;
  }
}

function handleResendMessage() {
  ElMessage.info('重新发送功能开发中...');
  // TODO: 实现重新发送消息
}

function handleAvatarClick(userId: number) {
  ElMessage.info(`查看用户 ${userId} 的资料`);
  // TODO: 跳转到用户资料页
}

function handleVideoCall() {
  ElMessage.info('视频通话功能开发中...');
}

function handleVoiceCall() {
  ElMessage.info('语音通话功能开发中...');
}

function handleMoreOptions() {
  ElMessage.info('更多选项功能开发中...');
}

function handleAddFriendSuccess() {
  ElMessage.success('好友请求已发送');
  friendsStore.loadFriends();
}

function handleCreateGroupSuccess() {
  ElMessage.success('群组创建成功');
  // TODO: 跳转到新创建的群组
}

function scrollToBottom() {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
}

// Lifecycle
onMounted(async () => {
  // 设置拖动区域
  if (dragAreaRef.value) {

    const cleanup = dragSetup(dragAreaRef.value);
    if (cleanup) {
      onUnmounted(cleanup);
    }
  }

  // 初始化用户信息
  try {
    await userStore.loadCurrentUser();
  } catch {
    ElMessage.error('获取用户信息失败');

    return;
  }

  // 并行加载好友列表和群组列表
  try {
    await Promise.all([
      friendsStore.loadFriends(),
      groupsStore.loadGroups(),
    ]);
  } catch {
    ElMessage.warning('加载联系人列表时出现问题');
  }

  // 连接 WebSocket
  try {
    const baseUrl = import.meta.env.VITE_DEFAULT_BASE_URL || 'http://localhost:9080';
    await connect(baseUrl);
  } catch {
    ElMessage.error('连接服务器失败');
  }
});

// 监听消息变化，自动滚动到底部
watch(
  () => currentMessages.value.length,
  async () => {
    await nextTick();
    scrollToBottom();
  }
);
</script>

<style lang="less" scoped>
.drag-area {
  user-select: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:active {
    cursor: move;
  }
}

.window-btn {
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  width: 2rem;
  height: 2rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 0.5vh;

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
  }

  &.minimize-btn:hover {
    background-color: rgba(59, 130, 246, 0.1);
    border-color: transparent;
  }

  &.close-btn:hover {
    background-color: #ef4444;
    color: white;
  }
}

.no-drag {
  -webkit-app-region: no-drag;
}
</style>
