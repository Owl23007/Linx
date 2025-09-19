<template>
  <div class="min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 relative">
    <!-- Electron 拖动区域 -->
    <header v-if="isElectron()"
      class="fixed top-0 left-0 right-0 h-12 flex justify-between items-center px-3 z-3 shadow-sm">
      <!-- 左侧：Logo -->
      <div class="flex-shrink-0 absolute left-[-40px]">
        <Title :size="0.7" />
      </div>

      <div ref="dragAreaRef" class="flex-1 h-full drag-area" />
      <div class="flex">
        <el-button size="small" class="window-btn minimize-btn">
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
      <div class="flex h-full ">
        <!-- 侧边栏 -->
        <aside class="w-84 bg-white border-r border-gray-200 overflow-y-auto flex flex-row overflow-hidden">
          <div class="w-16">
            <SideBar />
          </div>
          <div class="w-68">
            <MessageList />
          </div>
        </aside>

        <!-- 聊天区域：垂直布局，撑满剩余高度 -->
        <div class="flex-1 flex flex-col bg-white ">
          <!-- 聊天标题栏 -->
          <div class="border-b border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <el-avatar :size="32" src="https://via.placeholder.com/32/3b82f6/ffffff?text=李" />
              <h2 class="font-medium text-gray-800">李四</h2>
            </div>
            <el-button-group>
              <el-button :icon="VideoCamera" circle text />
              <el-button :icon="Phone" circle text />
              <el-button :icon="MoreFilled" circle text />
            </el-button-group>
          </div>

          <!-- 消息列表  -->
          <div ref="messageContainer" class="flex-1 p-4 overflow-y-auto space-y-4 ">
            <div v-for="msg in mockMessages" :key="msg.id" class="flex"
              :class="msg.sender === 'me' ? 'justify-end' : 'justify-start'">
              <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg" :class="msg.sender === 'me'
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'">
                <p class="text-sm">{{ msg.text }}</p>
                <p class="text-xs mt-1 opacity-80 text-right"
                  :class="msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'">
                  {{ formatTime(msg.timestamp) }}
                </p>
              </div>
            </div>
          </div>

          <!-- 输入框：固定在底部，不随内容伸缩 -->
          <div class="border-t border-gray-200 p-4 bg-white flex-shrink-0">
            <div class="flex items-end space-x-2">
              <el-button circle text />
              <el-input v-model="inputMessage" type="textarea" placeholder="输入消息..."
                :autosize="{ minRows: 1, maxRows: 4 }" @keydown.enter="handleSend" class="!rounded-full flex-1" />
              <el-button type="primary" circle @click="handleSend" :disabled="!inputMessage.trim()" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dragSetup from '@/utils/drag';
import { closeWindow, isElectron, minimizeWindow } from '@/utils/electron';
import Title from '@/views/components/title-icon.vue';
import {
  Close,
  Minus,
  MoreFilled,
  Phone,
  Setting,
  VideoCamera
} from '@element-plus/icons-vue';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import MessageList from './components/message-list.vue';
import SideBar from './components/side-bar.vue';

const mockMessages = ref([
  { id: '1', text: '你好啊！', sender: 'other', timestamp: new Date(Date.now() - 60000) },
  { id: '2', text: '在写 Vue 3 + Tailwind 的聊天界面~', sender: 'me', timestamp: new Date(Date.now() - 30000) },
  { id: '3', text: '太棒了！求分享代码', sender: 'other', timestamp: new Date(Date.now() - 10000) },
  { id: '4', text: '没问题，稍后发你 GitHub', sender: 'me', timestamp: new Date() }
]);

const inputMessage = ref('');

function handleCloseWindow() {
  closeWindow();
}

function handleMinimizeWindow() {
  minimizeWindow();
}

const messageContainer = ref<HTMLElement | null>(null);

const scrollToBottom = () => {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

watch(mockMessages, () => {
  scrollToBottom();
}, { immediate: true });

onMounted(() => {
  scrollToBottom();

  if (dragAreaRef.value) {
    const cleanup = dragSetup(dragAreaRef.value);
    if (cleanup) {
      onUnmounted(cleanup);
    }
  }
});

const dragAreaRef = ref<HTMLElement | null>(null);

const handleSend = () => {
  if (!inputMessage.value.trim()) return;

  mockMessages.value.push({
    id: Date.now().toString(),
    text: inputMessage.value,
    sender: 'me',
    timestamp: new Date()
  });

  inputMessage.value = '';
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};
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
</style>
