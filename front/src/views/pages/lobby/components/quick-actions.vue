<template>
  <PanelCard title="快速操作" subtitle="常用联机动作集中在这里，支持快速创建、加入、刷新和网络设置。">
    <div class="grid gap-3 md:grid-cols-2">
      <button
        v-for="action in actions"
        :key="action.key"
        type="button"
        class="group rounded-[24px] border border-slate-200/70 px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        :class="getActionClasses(action.accent)"
        @click="emit('select', action.key)"
      >
        <div class="flex items-start justify-between gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
            :class="getIconClasses(action.accent)"
          >
            <el-icon :size="20">
              <component :is="action.icon" />
            </el-icon>
          </div>
          <span class="rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Action
          </span>
        </div>

        <h3 class="mt-4 text-base font-semibold text-slate-900">
          {{ action.title }}
        </h3>
        <p class="mt-2 text-sm leading-6 text-slate-600">
          {{ action.description }}
        </p>
      </button>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import type { LobbyQuickAction } from '../types';
import PanelCard from './panel-card.vue';

defineProps<{
  actions: LobbyQuickAction[]
}>();

const emit = defineEmits<{
  (e: 'select', actionKey: string): void
}>();

function getActionClasses(accent: LobbyQuickAction['accent']) {
  switch (accent) {
    case 'emerald':
      return 'bg-emerald-50/80 hover:border-emerald-200';
    case 'amber':
      return 'bg-amber-50/80 hover:border-amber-200';
    case 'rose':
      return 'bg-rose-50/80 hover:border-rose-200';
    case 'sky':
    default:
      return 'bg-sky-50/80 hover:border-sky-200';
  }
}

function getIconClasses(accent: LobbyQuickAction['accent']) {
  switch (accent) {
    case 'emerald':
      return 'bg-emerald-500 shadow-emerald-200/80';
    case 'amber':
      return 'bg-amber-500 shadow-amber-200/80';
    case 'rose':
      return 'bg-rose-500 shadow-rose-200/80';
    case 'sky':
    default:
      return 'bg-sky-500 shadow-sky-200/80';
  }
}
</script>
