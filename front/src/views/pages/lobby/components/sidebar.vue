<template>
  <aside class="h-full overflow-hidden">
    <div class="grid h-full" :class="hidePanel ? 'grid-cols-[60px]' : 'grid-cols-[60px_minmax(0,1fr)]'">
      <div class="border-r border-slate-200/70">
        <SidebarRail :items="items" :avatar-url="avatarUrl" :user-initials="userInitials"
          :settings-active="settingsActive" @select="emit('select', $event)" @open-settings="emit('open-settings')"
          @open-profile="emit('open-profile')" />
      </div>

      <SidebarPanel v-if="!hidePanel" :items="items" :active-item="activeItem" :user-name="userName"
        :avatar-url="avatarUrl" :user-initials="userInitials" :endpoint-label="endpointLabel"
        :online-partners="onlinePartners" :recent-room-count="recentRoomCount" :network-hint="networkHint"
        @select="emit('select', $event)" @quick-action="emit('quick-action', $event)"
        @open-profile="emit('open-profile')" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { LobbyNavItem } from '../types';
import SidebarPanel from './sidebar-panel.vue';
import SidebarRail from './sidebar-rail.vue';

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
  hidePanel?: boolean
  settingsActive?: boolean
}>();

const emit = defineEmits<{
  (e: 'select', item: LobbyNavItem): void
  (e: 'quick-action', actionKey: string): void
  (e: 'open-settings'): void
  (e: 'open-profile'): void
}>();
</script>
