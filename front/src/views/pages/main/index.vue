<template>
    <div class="min-h-screen h-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col p-4 relative">
      <!-- Electron 拖动区域 -->
      <header v-if="isElectron()" class="fixed top-0 left-0 right-0 h-12 flex justify-between items-center px-3 z-30">
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

     <!-- 主内容区 -->
      <div class="flex-1 flex overflow-hidden min-h-0" :class="{ 'mt-6': isElectron() }">
       <!-- 侧边栏：联系人/会话列表 -->
    <!-- 左侧侧边栏 -->
    <aside class="w-80 bg-white border-r border-gray-200 overflow-y-auto flex flex-row">
      <!-- 个人信息卡片 -->
       <div class="w-1">
            <SideBar />
      </div>

      <!-- 消息列表 -->
      <MessageList />
    </aside>

       <!-- 聊天区域 -->
        <div class="flex-1 flex flex-col bg-white min-h-0">
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

         <!-- 消息列表 -->
                <div ref="messageContainer" class="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
           <div v-for="msg in mockMessages" :key="msg.id" class="flex" :class="msg.sender === 'me' ? 'justify-end' : 'justify-start'">
             <div
               class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
               :class="msg.sender === 'me'
                 ? 'bg-blue-500 text-white rounded-br-none'
                 : 'bg-gray-200 text-gray-800 rounded-bl-none'"
             >
               <p class="text-sm">{{ msg.text }}</p>
               <p class="text-xs mt-1 opacity-80 text-right" :class="msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'">
                 {{ formatTime(msg.timestamp) }}
               </p>
             </div>
           </div>
         </div>

         <!-- 输入框 -->
         <div class="border-t border-gray-200 p-4 bg-white">
           <div class="flex items-end space-x-2">
             <el-button  circle text />
             <el-input
               v-model="inputMessage"
               type="textarea"
               placeholder="输入消息..."
               :autosize="{ minRows: 1, maxRows: 4 }"
               @keydown.enter="handleSend"
               class="!rounded-full"
             />
             <el-button type="primary"  circle @click="handleSend" :disabled="!inputMessage.trim()" />
           </div>
         </div>
       </div>
     </div>
   </div>
 </template>

<script setup lang="ts">
import dragSetup from '@/utils/drag';
import { closeWindow, isElectron, minimizeWindow } from '@/utils/electron';
import {
  Close,
  Minus,
  MoreFilled,
  Phone,
  Setting,
  VideoCamera
} from '@element-plus/icons-vue';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

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

// 自动滚动到底部
const messageContainer = ref<HTMLElement | null>(null);
const dragAreaRef = ref<HTMLElement | null>(null);
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

onMounted(() => {
  scrollToBottom();
  // 初始化 Electron 拖拽区域
  if (dragAreaRef.value) {
    const cleanup = dragSetup(dragAreaRef.value);
    if (cleanup) {
      onUnmounted(cleanup);
    }
  }
});

// 发送消息（仅 UI 演示）
const handleSend = () => {
  if (!inputMessage.value.trim()) return;

  mockMessages.value.push({
    id: Date.now().toString(),
    text: inputMessage.value,
    sender: 'me',
    timestamp: new Date()
  });

  inputMessage.value = '';
  scrollToBottom();
};

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

</script>

<style lang="less" scoped>
/* 拖动区域样式（来自 login） */
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

/* 窗口控制按钮样式（来自 login） */
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
