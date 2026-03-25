<template>
  <PanelCard title="联机成员" subtitle="展示当前房间成员的在线状态与连接信息。">
    <div class="space-y-3">
      <div
        v-for="partner in partners"
        :key="partner.id"
        class="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3"
      >
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white"
          :class="partner.isReachable ? 'bg-emerald-500' : 'bg-slate-400'"
        >
          {{ partner.tag }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-3">
            <p class="truncate text-sm font-semibold text-slate-900">{{ partner.name }}</p>
            <span
              class="rounded-full px-2.5 py-1 text-[11px] font-medium"
              :class="partner.isReachable ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'"
            >
              {{ partner.stateLabel }}
            </span>
          </div>
          <p class="mt-1 text-xs text-slate-500">
            {{ partner.latencyLabel }}
          </p>
        </div>
      </div>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import type { LobbyPartnerSummary } from '../types';
import PanelCard from './panel-card.vue';

defineProps<{
  partners: LobbyPartnerSummary[]
}>();
</script>
