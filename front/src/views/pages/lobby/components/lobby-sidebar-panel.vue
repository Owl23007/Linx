<template>
  <section class="flex h-full min-h-0 flex-col bg-white/78">
    <div class="border-b border-slate-200/70 px-4 py-4">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-base font-semibold text-slate-900">{{ activeItem.label }}</p>
          <p class="mt-1 text-[13px] leading-6 text-slate-500">{{ activeItem.description }}</p>
        </div>
        <button
          type="button"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[18px] bg-slate-100 text-slate-600 transition-all duration-200 hover:bg-slate-200"
          @click="emit('quick-action', 'join-room')"
        >
          <el-icon :size="16">
            <Plus />
          </el-icon>
        </button>
      </div>

      <div class="mt-3 rounded-[20px] bg-slate-100/90 px-4 py-3">
        <div class="flex items-center gap-2 text-slate-500">
          <el-icon :size="15">
            <Search />
          </el-icon>
          <span class="text-[13px]">搜索房间、联机伙伴或诊断记录</span>
        </div>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-3 py-3">
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            class="rounded-[20px] bg-sky-600 px-3.5 py-3.5 text-left text-white shadow-lg shadow-sky-200/70 transition-all duration-200 hover:bg-sky-500"
            @click="emit('quick-action', 'create-room')"
          >
            <p class="text-[11px] uppercase tracking-[0.18em] text-sky-100">Action</p>
            <p class="mt-2.5 text-base font-semibold">创建房间</p>
            <p class="mt-2 text-[12px] leading-5 text-sky-100">快速建立网络并生成房间码</p>
          </button>

          <button
            type="button"
            class="rounded-[20px] bg-emerald-50 px-3.5 py-3.5 text-left text-emerald-950 ring-1 ring-emerald-100 transition-all duration-200 hover:bg-emerald-100"
            @click="emit('quick-action', 'join-room')"
          >
            <p class="text-[11px] uppercase tracking-[0.18em] text-emerald-500">Action</p>
            <p class="mt-2.5 text-base font-semibold">加入房间</p>
            <p class="mt-2 text-[12px] leading-5 text-emerald-700">优先处理已有房间码的联机入口</p>
          </button>
        </div>

        <div class="rounded-[22px] bg-slate-950 px-4 py-3.5 text-white">
          <div class="flex items-center gap-3">
            <el-avatar :size="38" :src="avatarUrl" class="shrink-0 bg-slate-800 text-sm font-semibold">
              {{ userInitials }}
            </el-avatar>
            <div class="min-w-0">
              <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Workspace</p>
              <p class="mt-1 truncate text-base font-semibold">{{ userName }}</p>
            </div>
          </div>
          <p class="mt-3 break-all text-[13px] text-slate-300">{{ endpointLabel }}</p>
        </div>

        <div class="rounded-[22px] border border-slate-200/70 bg-slate-50/80 p-3">
          <p class="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">联机空间</p>
          <div class="mt-2.5 space-y-2">
            <button
              v-for="item in items"
              :key="item.key"
              type="button"
              class="flex w-full items-start justify-between gap-3 rounded-[18px] px-3 py-2.5 text-left transition-all duration-200"
              :class="item.isActive ? 'bg-white text-slate-950 ring-1 ring-slate-200 shadow-sm' : 'text-slate-600 hover:bg-white/80'"
              @click="emit('select', item)"
            >
              <div class="min-w-0">
                <p class="truncate text-[13px] font-semibold">{{ item.label }}</p>
                <p class="mt-1 text-[12px] leading-5 text-slate-500">{{ item.description }}</p>
              </div>
              <span v-if="item.badge" class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                {{ item.badge }}
              </span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div class="rounded-[20px] border border-slate-200/70 bg-white px-3.5 py-3.5">
            <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">在线伙伴</p>
            <p class="mt-2.5 text-xl font-semibold text-slate-900">{{ onlinePartners }}</p>
            <p class="mt-1 text-[12px] leading-5 text-slate-500">当前仍可建立连接的成员</p>
          </div>
          <div class="rounded-[20px] border border-slate-200/70 bg-white px-3.5 py-3.5">
            <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">最近房间</p>
            <p class="mt-2.5 text-xl font-semibold text-slate-900">{{ recentRoomCount }}</p>
            <p class="mt-1 text-[12px] leading-5 text-slate-500">可直接回到最近的联机上下文</p>
          </div>
        </div>

        <div class="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-3.5 text-amber-900">
          <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">当前状态</p>
          <p class="mt-2 text-[13px] leading-6">
            {{ networkHint }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { LobbyNavItem } from '../types';
import { Plus, Search } from '@element-plus/icons-vue';

defineProps<{
  items: LobbyNavItem[]
  activeItem: LobbyNavItem
  userName: string
  avatarUrl: string
  userInitials: string
  endpointLabel: string
  onlinePartners: number
  recentRoomCount: number
  networkHint: string
}>();

const emit = defineEmits<{
  (e: 'select', item: LobbyNavItem): void
  (e: 'quick-action', actionKey: string): void
}>();
</script>
