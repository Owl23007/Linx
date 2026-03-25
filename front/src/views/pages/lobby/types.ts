import type { Component } from 'vue';

export interface LobbyNavItem {
  key: string
  routeName: string
  label: string
  description: string
  icon: Component
  badge?: string
  isActive?: boolean
}

export interface LobbySidebarShortcut {
  key: string
  label: string
  helper: string
}

export interface LobbyOverviewStat {
  label: string
  value: string
  helper: string
}

export interface LobbyQuickAction {
  key: string
  title: string
  description: string
  icon: Component
  accent: 'sky' | 'emerald' | 'amber' | 'rose'
}

export interface LobbyRoomSummary {
  id: number
  name: string
  code: string
  game: string
  mode: string
  membersOnline: number
  membersTotal: number
  status: 'ready' | 'gathering' | 'warning'
  statusLabel: string
  lastActive: string
}

export interface LobbyPartnerSummary {
  id: string
  name: string
  tag: string
  stateLabel: string
  latencyLabel: string
  isReachable: boolean
}

export interface LobbyNetworkSummary {
  running: boolean
  statusLabel: string
  statusHint: string
  modeLabel: string
  nodeLabel: string
  peerCountLabel: string
  latencyLabel: string
  issueLabel: string
  pidLabel: string
}
