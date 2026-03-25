<template>
  <PanelCard title="最近房间" subtitle="房间是联机容器，列表优先展示状态、成员和房间码。">
    <div class="space-y-3">
      <article
        v-for="room in rooms"
        :key="room.id"
        class="rounded-[26px] border border-slate-200/70 bg-slate-50/80 p-4 transition-all duration-200 hover:border-slate-300 hover:bg-white"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-lg font-semibold text-slate-900">{{ room.name }}</h3>
              <el-tag size="small" round :type="getTagType(room.status)">
                {{ room.statusLabel }}
              </el-tag>
              <span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                {{ room.game }}
              </span>
            </div>
            <p class="mt-2 text-sm text-slate-600">
              房间码 {{ room.code }} · {{ room.mode }} · 最近活跃 {{ room.lastActive }}
            </p>
            <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span class="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                成员 {{ room.membersOnline }}/{{ room.membersTotal }}
              </span>
              <span class="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                状态 {{ room.statusLabel }}
              </span>
            </div>
          </div>

          <div class="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <el-button round class="w-full sm:w-auto" @click="emit('copy-code', room)">
              复制房间码
            </el-button>
            <el-button type="primary" round class="w-full sm:w-auto" @click="emit('open-room', room)">
              进入房间
            </el-button>
          </div>
        </div>
      </article>
    </div>
  </PanelCard>
</template>

<script setup lang="ts">
import type { LobbyRoomSummary } from '../types';
import PanelCard from './panel-card.vue';

defineProps<{
  rooms: LobbyRoomSummary[]
}>();

const emit = defineEmits<{
  (e: 'copy-code', room: LobbyRoomSummary): void
  (e: 'open-room', room: LobbyRoomSummary): void
}>();

function getTagType(status: LobbyRoomSummary['status']) {
  switch (status) {
    case 'ready':
      return 'success';
    case 'warning':
      return 'warning';
    case 'gathering':
    default:
      return 'info';
  }
}
</script>
