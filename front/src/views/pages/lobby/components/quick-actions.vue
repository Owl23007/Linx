<template>
  <PanelCard borderless>
    <div class="grid gap-2.5 md:grid-cols-2">
      <button v-for="action in displayActions" :key="action.key" type="button"
        class="group rounded-2xl border border-slate-200/70 px-3.5 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        :class="getActionClasses(action.accent)" @click="emit('select', action.key)">
        <div class="flex items-start justify-between gap-2">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg"
            :class="getIconClasses(action.accent)">
            <el-icon :size="18">
              <component :is="action.icon" />
            </el-icon>
          </div>
          <span
            class="rounded-full border border-white/80 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {{ getActionLabel(action.key) }}
          </span>
        </div>

        <div class="mt-2.5 flex items-start justify-between gap-2.5">
          <h3 class="shrink-0 text-[15px] font-semibold text-slate-900">
            {{ action.title }}
          </h3>
          <p class="max-w-[68%] text-right text-[13px] leading-5 text-slate-600">
            {{ action.description }}
          </p>
        </div>
      </button>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LobbyQuickAction } from '../types';
import PanelCard from './panel-card.vue';

const props = defineProps<{
  actions: LobbyQuickAction[]
}>();

const emit = defineEmits<{
  (e: 'select', actionKey: string): void
}>();

const displayActions = computed(() => props.actions.slice(0, 4));

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

function getActionLabel(actionKey: string) {
  switch (actionKey) {
    case 'create-room':
      return 'Create';
    case 'join-room':
      return 'Join';
    case 'refresh-rooms':
      return 'Sync';
    case 'network-settings':
      return 'Settings';
    default:
      return 'Action';
  }
}
</script>
