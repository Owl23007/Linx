<template>
  <header v-if="isElectronEnv"
    class="fixed top-0 left-0 right-0 h-12 flex justify-between items-center px-3 z-50 bg-white/92 backdrop-blur-sm border-b border-slate-200/70">
    <!-- 左侧：Logo/标题 -->
    <div class="flex items-center no-drag ml-2">
      <Title :size="0.8" />
    </div>

    <div class="flex-1 h-full drag-area" />

    <div class="flex shrink-0 no-drag items-center">
      <el-button size="small" class="window-btn minimize-btn" @click="handleMinimizeWindow">
        <el-icon :size="16">
          <Minus />
        </el-icon>
      </el-button>
      <el-button size="small" class="window-btn minimize-btn" @click="handleMaximizeWindow">
        <el-icon :size="16">
          <FullscreenExit v-if="isMaximized" />
          <Fullscreen v-else />
        </el-icon>
      </el-button>
      <el-button size="small" class="window-btn close-btn" @click="handleCloseWindow">
        <el-icon :size="16">
          <Close />
        </el-icon>
      </el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { closeWindow, getWindowMaximized, isElectron, maximizeWindow, minimizeWindow, onWindowMaximizedStateChanged } from '@/utils/electron';
import icons from '@/views/components/icons';
import {
  Close,
  Minus
} from '@element-plus/icons-vue';
import { onMounted, onUnmounted, ref } from 'vue';

const { Fullscreen, FullscreenExit, Title } = icons;

const isElectronEnv = isElectron();
const isMaximized = ref(false);
let cleanupListener: (() => void) | undefined;

onMounted(async () => {
  if (isElectronEnv) {
    isMaximized.value = await getWindowMaximized();

    // 监听窗口最大化状态变化
    cleanupListener = onWindowMaximizedStateChanged((state) => {
      isMaximized.value = state;
    });
  }
});

onUnmounted(() => {
  if (cleanupListener) {
    cleanupListener();
  }
});

function handleCloseWindow() {
  closeWindow();
}

function handleMinimizeWindow() {
  minimizeWindow();
}

async function handleMaximizeWindow() {
  maximizeWindow();
}
</script>

<style scoped>
.drag-area {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
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
    border-color: rgba(0, 0, 0, 0.1);
    background-color: rgba(0, 0, 0, 0.05);
  }

  &.close-btn:hover {
    background-color: #ef4444;
    color: white;
    border-color: #ef4444;
  }
}
</style>
