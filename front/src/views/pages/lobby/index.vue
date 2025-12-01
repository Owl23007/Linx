<template>
  <div class="h-screen w-full bg-gray-100 overflow-hidden relative">
    <!-- 顶部控制栏 -->
    <TopBar @open-settings="handleOpenSettings" />

    <!-- 主内容区域 -->
    <div class="flex w-full h-full overflow-hidden" :style="{ paddingTop: isElectronEnv ? '48px' : '0' }">
      <div class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-700 mb-4">游戏大厅</h2>
          <p class="text-gray-500">正在建设中...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isElectron } from '@/utils/electron';
import TopBar from '@/views/components/top-bar.vue';

const isElectronEnv = isElectron();

function handleOpenSettings() {
  console.log('Open settings');
}
</script>
