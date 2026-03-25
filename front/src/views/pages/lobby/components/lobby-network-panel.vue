<template>
  <LobbyPanelCard title="网络状态" subtitle="右侧集中展示当前设备的联机状态和诊断入口。">
    <template #action>
      <el-button link type="primary" @click="emit('refresh')">
        刷新
      </el-button>
    </template>

    <div class="rounded-[26px] bg-slate-950 px-5 py-5 text-white">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">EasyTier</p>
          <p class="mt-2 text-xl font-semibold">{{ summary.statusLabel }}</p>
          <p class="mt-2 text-sm leading-6 text-slate-300">{{ summary.statusHint }}</p>
        </div>
        <div class="rounded-full px-3 py-1 text-xs font-semibold"
          :class="summary.running ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20' : 'bg-white/10 text-slate-300 ring-1 ring-white/10'">
          {{ summary.pidLabel }}
        </div>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl bg-white/6 px-4 py-3">
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">联机模式</p>
          <p class="mt-2 text-sm font-semibold text-white">{{ summary.modeLabel }}</p>
        </div>
        <div class="rounded-2xl bg-white/6 px-4 py-3">
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">服务节点</p>
          <p class="mt-2 text-sm font-semibold text-white">{{ summary.nodeLabel }}</p>
        </div>
        <div class="rounded-2xl bg-white/6 px-4 py-3">
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">成员可见性</p>
          <p class="mt-2 text-sm font-semibold text-white">{{ summary.peerCountLabel }}</p>
        </div>
        <div class="rounded-2xl bg-white/6 px-4 py-3">
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">链路提示</p>
          <p class="mt-2 text-sm font-semibold text-white">{{ summary.latencyLabel }}</p>
        </div>
      </div>
    </div>

    <div class="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
      <p class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">诊断提示</p>
      <p class="mt-2 text-sm leading-6">
        {{ summary.issueLabel }}
      </p>
      <div class="mt-4 flex flex-col gap-2 sm:flex-row">
        <el-button type="warning" round class="w-full sm:w-auto" @click="emit('open-diagnostics')">
          打开诊断
        </el-button>
        <el-button round class="w-full sm:w-auto" @click="emit('open-settings')">
          网络设置
        </el-button>
      </div>
    </div>
  </LobbyPanelCard>
</template>

<script setup lang="ts">
import type { LobbyNetworkSummary } from '../types';
import LobbyPanelCard from './lobby-panel-card.vue';

defineProps<{
  summary: LobbyNetworkSummary
}>();

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'open-settings'): void
  (e: 'open-diagnostics'): void
}>();
</script>
