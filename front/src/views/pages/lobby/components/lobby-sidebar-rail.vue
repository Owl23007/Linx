<template>
  <aside class="flex h-full flex-col items-center justify-between bg-slate-50/90 px-2 py-3">
    <div class="flex flex-col items-center gap-3">
      <el-avatar :size="40" :src="avatarUrl" class="bg-slate-950 text-[13px] font-semibold shadow-lg shadow-slate-300/55">
        {{ userInitials }}
      </el-avatar>

      <nav class="flex flex-col gap-1.5">
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          class="group relative flex h-10 w-10 items-center justify-center rounded-[18px] transition-all duration-200"
          :class="item.isActive ? 'bg-sky-600 text-white shadow-lg shadow-sky-200/80' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100 hover:text-slate-900'"
          @click="emit('select', item)"
        >
          <el-icon :size="17">
            <component :is="item.icon" />
          </el-icon>
          <span v-if="item.badge" class="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
            {{ item.badge }}
          </span>
        </button>
      </nav>
    </div>

    <div class="flex flex-col items-center gap-2">
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-[18px] bg-white text-slate-500 ring-1 ring-slate-200 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900"
        @click="emit('open-settings')"
      >
        <el-icon :size="16">
          <Setting />
        </el-icon>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { LobbyNavItem } from '../types';
import { Setting } from '@element-plus/icons-vue';

defineProps<{
  items: LobbyNavItem[]
  avatarUrl: string
  userInitials: string
}>();

const emit = defineEmits<{
  (e: 'select', item: LobbyNavItem): void
  (e: 'open-settings'): void
}>();
</script>
