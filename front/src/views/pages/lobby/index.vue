<template>
  <div
    class="relative h-screen overflow-hidden bg-[linear-gradient(135deg,#eef6ff_0%,#f8fafc_42%,#f6f1e8_100%)] text-slate-900">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute left-[-12%] top-[-10%] h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
      <div class="absolute bottom-[-18%] right-[-8%] h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
    </div>

    <TopBar @open-settings="handleOpenSettings" />

    <div class="relative h-full px-0 pb-0 pt-0" :class="{ 'border-t border-slate-200/70': !isElectronEnv }"
      :style="{ paddingTop: isElectronEnv ? '48px' : '0px' }">
      <div
        class="grid h-full overflow-hidden border-b border-slate-200/70 bg-white/56 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl"
        :class="shellGridClass">
        <div class="min-h-0 border-r border-slate-200/70 bg-white/72">
          <Sidebar :user-name="displayName" :avatar-url="avatarUrl" :user-initials="userInitials"
            :endpoint-label="endpointLabel" :items="sidebarItems" :active-item="activeSidebarItem"
            :online-partners="onlinePartnerCount" :recent-room-count="recentRooms.length"
            :network-hint="sidebarNetworkHint" :hide-panel="hideSidebarPanel" @select="handleSelectNav" @quick-action="handleQuickAction"
            @open-settings="handleOpenSettings" @open-profile="handleOpenProfile" />
        </div>

        <main class="min-h-0 overflow-auto bg-white/14 p-2.5 sm:p-3.5 md:p-4">
          <div class="space-y-4">
            <QuickActions v-if="isHomeView" :actions="quickActions" @select="handleQuickAction" />

            <PanelCard v-if="isRoomsView" title="房间检索" subtitle="通过关键词和状态快速定位房间。">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <el-input v-model="roomKeyword" clearable placeholder="搜索房间名 / 房间码" class="lg:max-w-sm" />
                <div class="flex flex-wrap gap-2">
                  <el-button round :type="roomStatusFilter === 'all' ? 'primary' : 'default'"
                    @click="roomStatusFilter = 'all'">
                    全部
                  </el-button>
                  <el-button round :type="roomStatusFilter === 'ready' ? 'primary' : 'default'"
                    @click="roomStatusFilter = 'ready'">
                    已就绪
                  </el-button>
                  <el-button round :type="roomStatusFilter === 'gathering' ? 'primary' : 'default'"
                    @click="roomStatusFilter = 'gathering'">
                    等待中
                  </el-button>
                  <el-button round :type="roomStatusFilter === 'warning' ? 'primary' : 'default'"
                    @click="roomStatusFilter = 'warning'">
                    需处理
                  </el-button>
                </div>
              </div>
            </PanelCard>

            <NetworkPanel v-if="isHomeView || isRoomsView" class="2xl:hidden" :summary="networkSummary"
              @refresh="refreshEasyTierStatus" @open-settings="handleOpenSettings"
              @open-diagnostics="handleOpenDiagnostics" />

            <NetworkPanel v-if="isDiagnosticsView" :summary="networkSummary" @refresh="refreshEasyTierStatus"
              @open-settings="handleOpenSettings" @open-diagnostics="handleOpenDiagnostics" />

            <PanelCard v-if="isDiagnosticsView" title="连接诊断" subtitle="按顺序检查服务状态、房间状态和成员可见性。">
              <div class="grid gap-3 md:grid-cols-2">
                <article v-for="item in diagnosticChecks" :key="item.key" class="rounded-2xl border px-4 py-3" :class="item.state === 'ok'
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-amber-200 bg-amber-50/70'">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold text-slate-900">{{ item.title }}</p>
                      <p class="mt-1 text-xs text-slate-600">{{ item.description }}</p>
                    </div>
                    <el-tag size="small" round :type="item.state === 'ok' ? 'success' : 'warning'">
                      {{ item.state === 'ok' ? '正常' : '待处理' }}
                    </el-tag>
                  </div>
                  <el-button v-if="item.actionLabel && item.actionKey" class="mt-3" size="small" round
                    @click="handleDiagnosticAction(item.actionKey as DiagnosticActionKey)">
                    {{ item.actionLabel }}
                  </el-button>
                </article>
              </div>
            </PanelCard>

            <RoomList v-if="!isDiagnosticsView && visibleRooms.length > 0" :rooms="visibleRooms"
              @copy-code="handleCopyRoomCode" @open-room="handleOpenRoom" />

            <PanelCard v-if="!isDiagnosticsView && visibleRooms.length === 0" title="房间列表"
              subtitle="没有匹配结果，尝试清空筛选条件或创建新房间。">
              <div class="flex flex-wrap gap-2">
                <el-button round type="primary" @click="createRoomVisible = true">创建房间</el-button>
                <el-button round @click="roomKeyword = ''; roomStatusFilter = 'all'">清空筛选</el-button>
              </div>
            </PanelCard>

            <PanelCard v-if="currentRoom && !isDiagnosticsView" title="当前房间" subtitle="展示成员、房主、连接模式和我的虚拟 IP。">
              <div class="space-y-3">
                <div class="rounded-[20px] border border-slate-200/70 bg-slate-50/80 p-4">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 class="text-lg font-semibold text-slate-900">{{ currentRoom.name }}</h3>
                      <p class="mt-1 text-sm text-slate-600">
                        房间码 {{ currentRoom.roomCode }} · 房主 {{ currentRoom.ownerName }} · 成员 {{ currentRoom.memberCount
                        }}/{{
                          currentRoom.maxMembers }}
                      </p>
                    </div>
                    <el-tag type="info" round>
                      {{ currentRoom.myConnectionMode || 'UNKNOWN' }}
                    </el-tag>
                  </div>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <el-button round @click="handleCopyRoomCodeFromCurrent">
                      复制房间码
                    </el-button>
                    <el-button round type="primary" @click="handleCopyMyVirtualIp">
                      复制我的虚拟 IP
                    </el-button>
                  </div>
                </div>

                <div class="space-y-2">
                  <article v-for="member in currentRoomMembers" :key="member.membershipId"
                    class="rounded-[18px] border border-slate-200/70 bg-white px-3 py-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p class="text-sm font-semibold text-slate-900">
                          {{ member.displayName }}
                        </p>
                        <p class="text-xs text-slate-500">
                          虚拟 IP {{ member.virtualIp || '未上报' }} · 模式 {{ member.connectionMode || 'UNKNOWN' }}
                        </p>
                      </div>
                      <el-tag size="small" :type="member.role === 'OWNER' ? 'warning' : 'info'" round>
                        {{ member.role }}
                      </el-tag>
                    </div>
                  </article>
                </div>
              </div>
            </PanelCard>

            <PartnerList v-if="isHomeView && partners.length > 0" class="2xl:hidden" :partners="partners" />
          </div>
        </main>

        <aside class="hidden min-h-0 overflow-auto border-l border-slate-200/70 bg-white/40 p-3 2xl:block">
          <div class="space-y-4">
            <NetworkPanel v-if="!isDiagnosticsView" :summary="networkSummary" @refresh="refreshEasyTierStatus"
              @open-settings="handleOpenSettings" @open-diagnostics="handleOpenDiagnostics" />

            <PanelCard v-if="isDiagnosticsView" title="诊断动作" subtitle="优先刷新状态，其次核对房间和网络配置。">
              <div class="flex flex-col gap-2">
                <el-button round type="primary" @click="refreshAll">刷新全部状态</el-button>
                <el-button round @click="handleOpenSettings">打开网络设置</el-button>
                <el-button round @click="handleReloadRooms">重新加载房间</el-button>
              </div>
            </PanelCard>

            <PartnerList v-if="!isDiagnosticsView && partners.length > 0" :partners="partners" />

            <PanelCard v-if="!isDiagnosticsView && partners.length === 0" title="联机成员"
              subtitle="当前房间暂无可展示成员，加入房间后会在这里显示。">
              <el-button round type="primary" @click="joinRoomVisible = true">
                加入房间
              </el-button>
            </PanelCard>
          </div>
        </aside>
      </div>
    </div>

    <EasyTierDialog v-model="settingsVisible" />
    <UserProfileDialog v-model="profileVisible" />

    <CreateRoomDialog v-model="createRoomVisible" :loading="roomActionLoading" @submit="handleCreateRoomSubmit" />

    <JoinRoomDialog v-model="joinRoomVisible" :loading="roomActionLoading" @submit="handleJoinRoomSubmit" />
  </div>
</template>

<script setup lang="ts">
import { easyTierService, type EasyTierConfig } from '@/services/easytierService';
import { useAuthStore } from '@/stores/auth';
import { useGlobalStore } from '@/stores/global';
import { useRoomStore } from '@/stores/room';
import { useUserStore } from '@/stores/user';
import type { RoomMemberVO, RoomVO } from '@/types/room';
import { formatRelativeTime } from '@/utils/datetime';
import { isElectron } from '@/utils/electron';
import EasyTierDialog from '@/views/components/easytier/easytier-dialog.vue';
import TopBar from '@/views/components/top-bar.vue';
import {
  FolderOpened,
  House,
  Monitor,
  Plus,
  Promotion,
  RefreshRight,
  Setting
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CreateRoomDialog, { type CreateRoomSubmitPayload } from './components/create-room-dialog.vue';
import JoinRoomDialog, { type JoinRoomSubmitPayload } from './components/join-room-dialog.vue';
import NetworkPanel from './components/network-panel.vue';
import PanelCard from './components/panel-card.vue';
import PartnerList from './components/partner-list.vue';
import QuickActions from './components/quick-actions.vue';
import RoomList from './components/room-list.vue';
import Sidebar from './components/sidebar.vue';
import UserProfileDialog from './components/user-profile-dialog.vue';
import type {
  LobbyNavItem,
  LobbyNetworkSummary,
  LobbyPartnerSummary,
  LobbyQuickAction,
  LobbyRoomSummary
} from './types';

const authStore = useAuthStore();
const globalStore = useGlobalStore();
const roomStore = useRoomStore();
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

const isElectronEnv = isElectron();
const settingsVisible = ref(false);
const profileVisible = ref(false);
const createRoomVisible = ref(false);
const joinRoomVisible = ref(false);
const roomActionLoading = ref(false);
const easyTierRunning = ref(false);
const easyTierPid = ref<number | null>(null);
const peerCount = ref(0);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const sidebarKeyByRouteName: Record<string, string> = {
  MainHome: 'home',
  MainRooms: 'rooms',
  MainDiagnostics: 'diagnostics'
};

const activeSidebarKey = computed(() => {
  if (typeof route.name !== 'string') {
    return 'home';
  }

  return sidebarKeyByRouteName[route.name] || 'home';
});

type LobbyViewMode = 'home' | 'rooms' | 'diagnostics';
type RoomStatusFilter = 'all' | LobbyRoomSummary['status'];
type DiagnosticActionKey = 'refresh' | 'open-settings' | 'reload-rooms';

interface DiagnosticCheck {
  key: string
  title: string
  description: string
  state: 'ok' | 'warn'
  actionLabel?: string
  actionKey?: DiagnosticActionKey
}

const roomKeyword = ref('');
const roomStatusFilter = ref<RoomStatusFilter>('all');
const props = defineProps<{
  view?: LobbyViewMode
}>();

const currentView = computed<LobbyViewMode>(() => {
  if (props.view) {
    return props.view;
  }

  if (activeSidebarKey.value === 'rooms') {
    return 'rooms';
  }
  if (activeSidebarKey.value === 'diagnostics') {
    return 'diagnostics';
  }

  return 'home';
});

const isHomeView = computed(() => currentView.value === 'home');
const isRoomsView = computed(() => currentView.value === 'rooms');
const isDiagnosticsView = computed(() => currentView.value === 'diagnostics');
const hideSidebarPanel = true;
const shellGridClass = computed(() => {
  if (hideSidebarPanel) {
    return 'grid-cols-[60px_minmax(0,1fr)] 2xl:grid-cols-[60px_minmax(0,1fr)_320px]';
  }

  return 'grid-cols-[252px_minmax(0,1fr)] sm:grid-cols-[284px_minmax(0,1fr)] 2xl:grid-cols-[284px_minmax(0,1fr)_320px]';
});

const sidebarBaseItems: Omit<LobbyNavItem, 'isActive'>[] = [
  {
    key: 'home',
    routeName: 'MainHome',
    label: '联机首页',
    description: '创建房间、加入房间和查看主状态。',
    icon: House
  },
  {
    key: 'rooms',
    routeName: 'MainRooms',
    label: '房间列表',
    description: '管理最近房间和常用联机入口。',
    icon: FolderOpened
  },
  {
    key: 'diagnostics',
    routeName: 'MainDiagnostics',
    label: '连接诊断',
    description: '快速定位虚拟网络、权限和中继问题。',
    icon: Monitor
  }
];

const sidebarItems = computed<LobbyNavItem[]>(() => {
  return sidebarBaseItems.map((item) => ({
    ...item,
    isActive: item.key === activeSidebarKey.value
  }));
});

const activeSidebarItem = computed<LobbyNavItem>(() => {
  const matchedItem = sidebarItems.value.find((item) => item.key === activeSidebarKey.value);

  if (matchedItem) {
    return matchedItem;
  }

  return {
    key: 'home',
    routeName: 'MainHome',
    label: '联机首页',
    description: '创建房间、加入房间和查看主状态。',
    icon: House,
    isActive: true
  };
});

const quickActions: LobbyQuickAction[] = [
  {
    key: 'create-room',
    title: '创建房间',
    description: '立即创建联机房间并生成房间码。',
    icon: Plus,
    accent: 'sky'
  },
  {
    key: 'join-room',
    title: '加入房间',
    description: '输入房间码快速入房，自动拉取连接信息。',
    icon: Promotion,
    accent: 'emerald'
  },
  {
    key: 'refresh-rooms',
    title: '同步房间',
    description: '拉取最新房间列表并刷新当前房间详情。',
    icon: RefreshRight,
    accent: 'amber'
  },
  {
    key: 'network-settings',
    title: '网络设置',
    description: '查看 EasyTier 参数、节点状态。',
    icon: Setting,
    accent: 'rose'
  }
];

const recentRooms = computed<LobbyRoomSummary[]>(() => {
  return roomStore.rooms.map((room) => {
    const isWarning = room.status !== 'ACTIVE';
    const roomStatus: LobbyRoomSummary['status'] = isWarning
      ? 'warning'
      : room.memberCount > 1
        ? 'ready'
        : 'gathering';

    return {
      id: room.id,
      name: room.name,
      code: room.roomCode,
      game: room.gameName || '未设置游戏',
      mode: room.myConnectionMode || 'UNKNOWN',
      membersOnline: room.memberCount,
      membersTotal: room.maxMembers,
      status: roomStatus,
      statusLabel: isWarning ? '已关闭' : room.memberCount > 1 ? '已就绪' : '等待中',
      lastActive: room.updatedAt ? formatRelativeTime(room.updatedAt) : '刚刚'
    };
  });
});

const currentRoom = computed(() => roomStore.currentRoom);
const currentRoomMembers = computed<RoomMemberVO[]>(() => currentRoom.value?.members || []);

const filteredRooms = computed<LobbyRoomSummary[]>(() => {
  const keyword = roomKeyword.value.trim().toLowerCase();

  return recentRooms.value.filter((room) => {
    const matchesKeyword = !keyword
      || room.name.toLowerCase().includes(keyword)
      || room.code.toLowerCase().includes(keyword);
    const matchesStatus = roomStatusFilter.value === 'all' || room.status === roomStatusFilter.value;

    return matchesKeyword && matchesStatus;
  });
});

const visibleRooms = computed<LobbyRoomSummary[]>(() => {
  if (isHomeView.value) {
    return recentRooms.value.slice(0, 4);
  }

  return filteredRooms.value;
});

function toInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'U';
  }

  return trimmed.slice(0, 2).toUpperCase();
}

const partners = computed<LobbyPartnerSummary[]>(() => {
  return currentRoomMembers.value.map((member) => {
    const mode = member.connectionMode || 'UNKNOWN';
    const reachable = mode !== 'UNKNOWN' || !!member.virtualIp;

    return {
      id: `${member.membershipId}`,
      name: member.displayName,
      tag: toInitials(member.displayName),
      stateLabel: reachable ? '在线' : '待同步',
      latencyLabel: member.virtualIp
        ? `虚拟 IP ${member.virtualIp} · ${mode}`
        : `虚拟 IP 未上报 · ${mode}`,
      isReachable: reachable
    };
  });
});

const displayName = computed(() => userStore.displayName || authStore.user?.nickname || authStore.user?.username || '联机玩家');
const avatarUrl = computed(() => userStore.avatarUrl || authStore.user?.avatarImage || '');
const userInitials = computed(() => userStore.initials || displayName.value.slice(0, 1).toUpperCase() || 'L');

const endpointLabel = computed(() => {
  return globalStore.endpoint || import.meta.env.VITE_DEFAULT_BASE_URL || '未配置服务节点';
});

const onlinePartnerCount = computed(() => {
  return partners.value.filter((item) => item.isReachable).length;
});

const diagnosticChecks = computed<DiagnosticCheck[]>(() => {
  return [
    {
      key: 'service',
      title: '组网服务',
      description: easyTierRunning.value ? 'EasyTier 进程运行中。' : 'EasyTier 尚未启动。',
      state: easyTierRunning.value ? 'ok' : 'warn',
      actionLabel: easyTierRunning.value ? '刷新状态' : '打开网络设置',
      actionKey: easyTierRunning.value ? 'refresh' : 'open-settings'
    },
    {
      key: 'rooms',
      title: '房间同步',
      description: recentRooms.value.length > 0
        ? `已同步 ${recentRooms.value.length} 个房间。`
        : '没有可用房间，建议先创建或加入。',
      state: recentRooms.value.length > 0 ? 'ok' : 'warn',
      actionLabel: '重新加载房间',
      actionKey: 'reload-rooms'
    },
    {
      key: 'members',
      title: '成员可见性',
      description: onlinePartnerCount.value > 0
        ? `当前可见 ${onlinePartnerCount.value} 位成员。`
        : '暂无可见成员，检查成员是否已加入同一网络。',
      state: onlinePartnerCount.value > 0 ? 'ok' : 'warn'
    },
    {
      key: 'selection',
      title: '当前房间',
      description: currentRoom.value
        ? `已选择房间：${currentRoom.value.name}`
        : '尚未选中房间，建议从房间列表打开。',
      state: currentRoom.value ? 'ok' : 'warn',
      actionLabel: currentRoom.value ? '刷新状态' : '重新加载房间',
      actionKey: currentRoom.value ? 'refresh' : 'reload-rooms'
    }
  ];
});

const networkSummary = computed<LobbyNetworkSummary>(() => {
  const node = endpointLabel.value.replace(/^https?:\/\//, '').replace(/\/api$/, '');

  if (!easyTierRunning.value) {
    return {
      running: false,
      statusLabel: '组网服务未启动',
      statusHint: '当前还没有建立虚拟网络。你可以先打开网络设置，确认节点与本机权限正常。',
      modeLabel: '尚未连接',
      nodeLabel: node,
      peerCountLabel: '0 个成员可见',
      latencyLabel: '等待链路建立',
      issueLabel: '未检测到联机网络。优先检查 EasyTier 是否已启动，以及虚拟网卡权限是否正常。',
      pidLabel: 'Stopped'
    };
  }

  return {
    running: true,
    statusLabel: '组网服务运行中',
    statusHint: '桌面端已经接入 EasyTier 进程。当前布局会把房间状态和诊断信息稳定收敛到右侧栏。',
    modeLabel: peerCount.value > 0 ? '已发现其他成员' : '等待成员加入',
    nodeLabel: node,
    peerCountLabel: `${peerCount.value} 个成员可见`,
    latencyLabel: peerCount.value > 0 ? '链路已建立，可继续检查房间质量' : '服务正常，尚未看到其他 Peer',
    issueLabel: peerCount.value > 0 ? '当前网络已建立。建议下一步接入真实房间状态、P2P/中继标识和错误分类。' : '虽然服务已启动，但还没有发现其他成员。可能是房间未建立，或成员尚未进入同一网络。',
    pidLabel: easyTierPid.value ? `PID ${easyTierPid.value}` : 'Running'
  };
});

const sidebarNetworkHint = computed(() => {
  if (easyTierRunning.value) {
    return peerCount.value > 0
      ? `已发现 ${peerCount.value} 个成员，可以继续进入房间或检查连接质量。`
      : '组网服务已启动，但还没有发现其他成员。';
  }

  return '当前尚未建立联机网络，建议先打开网络设置检查节点和虚拟网卡状态。';
});

async function refreshEasyTierStatus() {
  if (!isElectronEnv) {
    easyTierRunning.value = false;
    easyTierPid.value = null;
    peerCount.value = 0;

    return;
  }

  const statusRes = await easyTierService.getStatus();
  if (!statusRes.success) {
    easyTierRunning.value = false;
    easyTierPid.value = null;
    peerCount.value = 0;

    return;
  }

  easyTierRunning.value = !!statusRes.data.running;
  easyTierPid.value = statusRes.data.pid;

  if (!easyTierRunning.value) {
    peerCount.value = 0;

    return;
  }

  const peersRes = await easyTierService.getPeers();
  if (!peersRes.success) {
    peerCount.value = 0;

    return;
  }

  const peersData = peersRes.data as any;
  if (Array.isArray(peersData)) {
    peerCount.value = peersData.length;

    return;
  }

  if (Array.isArray(peersData?.peers)) {
    peerCount.value = peersData.peers.length;

    return;
  }

  peerCount.value = 0;
}

function handleOpenSettings() {
  settingsVisible.value = true;
}

function handleOpenProfile() {
  profileVisible.value = true;
}

function handleOpenDiagnostics() {
  void router.push({ name: 'MainDiagnostics' });
}

function handleSelectNav(item: LobbyNavItem) {
  if (route.name === item.routeName) {
    return;
  }

  void router.push({ name: item.routeName });
}

async function handleReloadRooms() {
  await roomStore.loadRooms();
  if (!roomStore.currentRoom && roomStore.rooms.length > 0) {
    await roomStore.openRoom(roomStore.rooms[0].id);
  }
}

async function refreshAll() {
  await Promise.all([
    refreshEasyTierStatus(),
    handleReloadRooms()
  ]);
}

async function handleDiagnosticAction(actionKey: DiagnosticActionKey) {
  switch (actionKey) {
    case 'open-settings':
      handleOpenSettings();
      return;
    case 'reload-rooms':
      await handleReloadRooms();
      return;
    case 'refresh':
    default:
      await refreshAll();
  }
}

function handleQuickAction(actionKey: string) {
  switch (actionKey) {
    case 'network-settings':
      handleOpenSettings();

      return;
    case 'refresh-rooms':
      void refreshAll();

      return;
    case 'create-room':
      createRoomVisible.value = true;

      return;
    case 'join-room':
      joinRoomVisible.value = true;

      return;
    default:
      ElMessage.info('该操作暂未绑定');
  }
}

async function copyText(content: string, successText: string, fallbackText: string) {
  if (!content) {
    ElMessage.warning(fallbackText);

    return;
  }

  try {
    await navigator.clipboard.writeText(content);
    ElMessage.success(successText);
  } catch {
    ElMessage.warning(fallbackText);
  }
}

async function handleCopyRoomCode(room: LobbyRoomSummary) {
  await copyText(room.code, `已复制房间码：${room.code}`, `房间码：${room.code}`);
}

async function handleCopyRoomCodeFromCurrent() {
  await copyText(
    currentRoom.value?.roomCode || '',
    `已复制房间码：${currentRoom.value?.roomCode || ''}`,
    '当前房间没有可复制的房间码。'
  );
}

async function handleCopyMyVirtualIp() {
  await copyText(
    currentRoom.value?.myVirtualIp || '',
    `已复制虚拟 IP：${currentRoom.value?.myVirtualIp || ''}`,
    '当前房间没有可复制的虚拟 IP。'
  );
}
async function handleOpenRoom(room: LobbyRoomSummary) {
  await roomStore.openRoom(room.id);
}

function buildEasyTierConfig(
  networkName: string,
  networkSecret: string,
  relayAddresses: string[]
): EasyTierConfig {
  return {
    networkName,
    networkSecret,
    peers: relayAddresses,
    dhcp: true,
    defaultProtocol: 'tcp',
    rpcPort: 11010
  };
}

function buildEasyTierConfigFromRoom(room: RoomVO, networkSecretInput?: string): EasyTierConfig | null {
  const networkName = room.networkName?.trim() || '';
  const networkSecret = (networkSecretInput || '').trim();
  const relayAddresses = (room.relayAddresses || []).map((item) => item.trim()).filter(Boolean);

  if (!networkName || !networkSecret || relayAddresses.length === 0) {
    return null;
  }

  return buildEasyTierConfig(networkName, networkSecret, relayAddresses);
}

async function switchEasyTierNetwork(config: EasyTierConfig): Promise<boolean> {
  if (!isElectronEnv) {
    return true;
  }

  const statusRes = await easyTierService.getStatus();
  if (statusRes.success && statusRes.data.running) {
    const stopRes = await easyTierService.stop();
    if (!stopRes.success) {
      ElMessage.warning(stopRes.error || '停止 EasyTier 失败');
      return false;
    }
  }

  const startRes = await easyTierService.start(config);
  if (!startRes.success) {
    ElMessage.error(startRes.error || '启动 EasyTier 失败');
    return false;
  }

  await refreshEasyTierStatus();
  return true;
}

async function handleCreateRoomSubmit(payload: CreateRoomSubmitPayload) {
  roomActionLoading.value = true;
  try {
    const room = await roomStore.createRoom({
      name: payload.name,
      gameName: payload.gameName,
      maxMembers: payload.maxMembers,
      networkSecret: payload.roomPassword,
      relayAddresses: payload.relayAddresses,
      virtualIp: payload.virtualIp,
      connectionMode: 'P2P'
    });
    if (room) {
      const easyTierConfig = buildEasyTierConfigFromRoom(room, payload.roomPassword);
      if (easyTierConfig) {
        const switched = await switchEasyTierNetwork(easyTierConfig);
        if (!switched) {
          ElMessage.warning('房间已创建，但切换 EasyTier 网络失败，请检查网络设置');
        }
      } else {
        ElMessage.warning('房间已创建，但缺少组网信息');
      }

      createRoomVisible.value = false;
      await roomStore.openRoom(room.id);
    }
  } finally {
    roomActionLoading.value = false;
  }
}

async function handleJoinRoomSubmit(payload: JoinRoomSubmitPayload) {
  roomActionLoading.value = true;
  try {
    const room = await roomStore.joinRoom({
      roomCode: payload.roomCode,
      virtualIp: payload.virtualIp,
      connectionMode: 'P2P'
    });
    if (room) {
      const easyTierConfig = buildEasyTierConfigFromRoom(room);
      if (easyTierConfig) {
        const switched = await switchEasyTierNetwork(easyTierConfig);
        if (!switched) {
          ElMessage.warning('已加入房间，但切换 EasyTier 网络失败，请检查网络设置');
        }
      } else {
        ElMessage.warning('已加入房间，但缺少必要的 EasyTier 配置');
      }

      joinRoomVisible.value = false;
      await roomStore.openRoom(room.id);
    }
  } finally {
    roomActionLoading.value = false;
  }
}
onMounted(async () => {
  if (!authStore.user || !authStore.token) {
    authStore.initAuth();
  }

  await userStore.initialize();
  await roomStore.loadRooms();
  if (!roomStore.currentRoom && roomStore.rooms.length > 0) {
    await roomStore.openRoom(roomStore.rooms[0].id);
  }
  await refreshEasyTierStatus();

  if (isElectronEnv) {
    refreshTimer = setInterval(() => {
      void refreshEasyTierStatus();
    }, 10000);
  }
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});
</script>
