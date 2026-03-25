<template>
  <section
    class="overflow-hidden rounded-4xl border border-sky-200/70 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.72),rgba(255,255,255,0.94)_45%,rgba(240,249,255,0.98)_100%)] p-4 shadow-[0_24px_60px_rgba(14,165,233,0.14)] sm:p-6">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-2xl">
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700/80">
          Lobby Overview
        </p>
        <h1 class="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
          {{ title }}
        </h1>
        <p class="mt-3 max-w-xl text-sm leading-6 text-slate-600 lg:text-base">
          {{ subtitle }}
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-3">
        <div v-for="stat in stats" :key="stat.label"
          class="min-w-37 rounded-2xl border border-white/80 bg-white/78 px-4 py-4 shadow-sm backdrop-blur">
          <p class="text-xs uppercase tracking-[0.18em] text-slate-400">{{ stat.label }}</p>
          <p class="mt-2 text-2xl font-semibold text-slate-900">{{ stat.value }}</p>
          <p class="mt-1 text-xs text-slate-500">{{ stat.helper }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { LobbyOverviewStat } from '../types';

defineProps<{
  title: string
  subtitle: string
  stats: LobbyOverviewStat[]
}>();
</script>
