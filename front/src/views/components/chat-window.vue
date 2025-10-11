<template>
  <div class="chat-window">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="chat-header-info">
        <el-avatar :size="40" class="mr-3">
          {{ chatName[0] }}
        </el-avatar>
        <div class="chat-header-text">
          <div class="chat-name">{{ chatName }}</div>
          <div class="chat-status">{{ statusText }}</div>
        </div>
      </div>
      <div class="chat-header-actions">
        <el-button text @click="emit('more')">
          <el-icon>
            <MoreFilled />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="chat-messages" ref="messagesRef" @scroll="handleScroll">
      <div v-if="loading" class="loading-more">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>加载中...</span>
      </div>

      <div v-for="msg in messages" :key="msg.messageId"
        :class="['message-item', msg.senderId === currentUserId ? 'message-sent' : 'message-received']">
        <el-avatar :size="36" class="message-avatar">
          {{ msg.senderName[0] }}
        </el-avatar>

        <div class="message-content">
          <div class="message-info">
            <span class="message-sender">{{ msg.senderName }}</span>
            <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div class="message-bubble">
            <div v-if="msg.type === 'CHAT'" class="message-text">
              {{ msg.content }}
            </div>
            <div v-else-if="msg.type === 'IMAGE'" class="message-image">
              <el-image :src="msg.content" fit="cover" />
            </div>
            <div v-else-if="msg.type === 'FILE'" class="message-file">
              <el-icon>
                <Document />
              </el-icon>
              <span>{{ msg.content }}</span>
            </div>
            <div v-else class="message-system">
              {{ msg.content }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="messages.length === 0" class="empty-messages">
        <el-empty description="暂无消息" />
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input">
      <div class="chat-input-toolbar">
        <el-button text @click="handleEmojiClick">
          <el-icon>
            <ChatDotRound />
          </el-icon>
        </el-button>
        <el-button text>
          <el-icon>
            <Picture />
          </el-icon>
        </el-button>
        <el-button text>
          <el-icon>
            <Paperclip />
          </el-icon>
        </el-button>
      </div>

      <div class="chat-input-area">
        <el-input v-model="inputText" type="textarea" :rows="3" placeholder="输入消息..."
          @keydown.enter.exact.prevent="handleSend" @keydown.ctrl.enter.exact="inputText += '\n'" />
      </div>

      <div class="chat-input-actions">
        <el-button type="primary" @click="handleSend" :disabled="!inputText.trim()">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chat';
import { useUserStore } from '@/stores/user';
import { formatChatTime } from '@/utils/datetime';
import {
  ChatDotRound,
  Document,
  Loading,
  MoreFilled,
  Paperclip,
  Picture,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

// Props & Emits
const props = defineProps<{
  conversationId: string;
  conversationType: 'private' | 'group';
  chatName: string;
  receiverId?: number;
  groupId?: string;
}>();

const emit = defineEmits<{
  (e: 'send', message: string): void;
  (e: 'more'): void;
}>();

// Stores
const chatStore = useChatStore();
const userStore = useUserStore();

// Refs
const messagesRef = ref<HTMLDivElement>();
const inputText = ref('');
const loading = ref(false);
const page = ref(0);

// Computed
const currentUserId = computed(() => userStore.userId);
const messages = computed(() => chatStore.currentMessages);
const statusText = computed(() => {
  if (props.conversationType === 'group') {
    return '群聊';
  }

  return '在线';
});

// Methods
function formatTime(timestamp: string) {
  return formatChatTime(timestamp);
}

async function loadMessages() {
  if (loading.value) return;

  loading.value = true;
  try {
    if (props.conversationType === 'private' && props.receiverId) {
      await chatStore.loadPrivateHistory(props.receiverId, page.value, 20);
    } else if (props.conversationType === 'group' && props.groupId) {
      await chatStore.loadGroupHistory(props.groupId, page.value, 20);
    }
  } finally {
    loading.value = false;
  }
}

function handleSend() {
  const text = inputText.value.trim();
  if (!text) return;

  emit('send', text);
  inputText.value = '';
}

function handleEmojiClick() {
  ElMessage.info('表情功能开发中...');
}

function handleScroll() {
  if (!messagesRef.value) return;

  const { scrollTop } = messagesRef.value;
  if (scrollTop === 0) {
    // 滚动到顶部，加载更多
    page.value++;
    loadMessages();
  }
}

async function scrollToBottom() {
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
}

// Watch
watch(() => props.conversationId, () => {
  page.value = 0;
  loadMessages();
  scrollToBottom();
}, { immediate: true });

watch(() => messages.value.length, () => {
  scrollToBottom();
});

// Lifecycle
onMounted(() => {
  scrollToBottom();
});
</script>

<style scoped lang="less">
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;

  &-info {
    display: flex;
    align-items: center;
  }

  &-text {
    display: flex;
    flex-direction: column;
  }

  .chat-name {
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }

  .chat-status {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;

  .loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    color: #999;
    font-size: 14px;
  }

  .message-item {
    display: flex;
    gap: 10px;

    &.message-sent {
      flex-direction: row-reverse;

      .message-content {
        align-items: flex-end;
      }

      .message-bubble {
        background: #409eff;
        color: #fff;
      }
    }

    &.message-received {
      .message-bubble {
        background: #fff;
        color: #333;
      }
    }
  }

  .message-avatar {
    flex-shrink: 0;
  }

  .message-content {
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-width: 60%;
  }

  .message-info {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #999;

    .message-sender {
      font-weight: 500;
    }
  }

  .message-bubble {
    padding: 10px 15px;
    border-radius: 8px;
    word-break: break-word;
  }

  .message-text {
    white-space: pre-wrap;
  }

  .message-image {
    max-width: 200px;
    border-radius: 4px;
    overflow: hidden;
  }

  .message-file {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .message-system {
    text-align: center;
    color: #999;
    font-size: 12px;
  }

  .empty-messages {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.chat-input {
  background: #fff;
  border-top: 1px solid #e0e0e0;

  &-toolbar {
    display: flex;
    gap: 5px;
    padding: 10px 15px;
    border-bottom: 1px solid #f0f0f0;
  }

  &-area {
    padding: 0 15px;

    :deep(.el-textarea__inner) {
      border: none;
      box-shadow: none;
      padding: 10px 0;
      resize: none;
    }
  }

  &-actions {
    display: flex;
    justify-content: flex-end;
    padding: 10px 15px;
  }
}

.mr-3 {
  margin-right: 12px;
}
</style>
