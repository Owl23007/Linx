<template>
  <aside class="h-full overflow-hidden">
    <div class="grid h-full grid-cols-[60px_minmax(0,1fr)]">
      <div class="border-r border-slate-200/70">
      <LobbySidebarRail
        :items="items"
        :avatar-url="avatarUrl"
        :user-initials="userInitials"
        @select="emit('select', $event)"
        @open-settings="emit('open-settings')"
      />
      </div>

      <LobbySidebarPanel
        :items="items"
        :active-item="activeItem"
        :user-name="userName"
        :avatar-url="avatarUrl"
        :user-initials="userInitials"
        :endpoint-label="endpointLabel"
        :online-partners="onlinePartners"
        :recent-room-count="recentRoomCount"
        :network-hint="networkHint"
        @select="emit('select', $event)"
        @quick-action="emit('quick-action', $event)"
      />
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { LobbyNavItem } from '../types';
import LobbySidebarPanel from './lobby-sidebar-panel.vue';
import LobbySidebarRail from './lobby-sidebar-rail.vue';

defineProps<{
  userName: string
  avatarUrl: string
  userInitials: string
  endpointLabel: string
  items: LobbyNavItem[]
  activeItem: LobbyNavItem
  onlinePartners: number
  recentRoomCount: number
  networkHint: string
}>();

const emit = defineEmits<{
  (e: 'select', item: LobbyNavItem): void
  (e: 'quick-action', actionKey: string): void
  (e: 'open-settings'): void
}>();
</script>
