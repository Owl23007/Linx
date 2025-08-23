<template>
  <!-- 标题 -->
  <div class="text-center w-auto min-w-max select-none" :style="{ zIndex: zIndex, scale: size }">
    <div class="relative px-6 py-2">
      <!-- 艺术字logo -->
      <h1 class="logo-art">
        <span class="logo-art-talk">{{ appTitle }}</span>
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps({
    size: {
      type: String,
      default: '1',
    },
    zIndex: {
      type: Number,
      default: 20,
    },
  })

  const appTitle = import.meta.env.APP_TITLE || 'LinX'
</script>

<style scoped lang="less">
  .logo-art {
    font-family: 'Segoe Script', 'Comic Sans MS', 'Brush Script MT', cursive, sans-serif;
    font-size: 1.75rem;
    letter-spacing: 0.12em;
    font-weight: bold;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow:
      2px 2px 8px rgba(60, 60, 120, 0.2),
      0 2px 16px rgba(255, 255, 255, 0.1),
      0 0 20px rgba(59, 130, 246, 0.1);
    padding: 0.25em 0.75em;
    border-radius: 0.5em;
    display: inline-block;
    margin: 0 auto;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: inherit;
      z-index: -1;
    }
  }

  .logo-art-talk {
    font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
    font-style: italic;
    font-size: 1.1em;
    letter-spacing: 0.18em;
    font-weight: 400;
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow:
      2px 2px 12px rgba(244, 63, 94, 0.3),
      0 2px 16px rgba(255, 255, 255, 0.1);
    position: relative;
  }
</style>
