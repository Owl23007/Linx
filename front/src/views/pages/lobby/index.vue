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
        class="grid h-full overflow-hidden border-b border-slate-200/70 bg-white/56 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl grid-cols-[252px_minmax(0,1fr)] sm:grid-cols-[284px_minmax(0,1fr)] 2xl:grid-cols-[284px_minmax(0,1fr)_320px]">
        <div class="min-h-0 border-r border-slate-200/70 bg-white/72">
          <LobbySidebar :user-name="displayName" :avatar-url="avatarUrl" :user-initials="userInitials"
            :endpoint-label="endpointLabel" :items="sidebarItems" :active-item="activeSidebarItem"
            :online-partners="onlinePartnerCount" :recent-room-count="recentRooms.length"
            :network-hint="sidebarNetworkHint" @select="handleSelectNav" @quick-action="handleQuickAction"
            @open-settings="handleOpenSettings" @open-profile="handleOpenProfile" />
        </div>

        <main class="min-h-0 overflow-auto bg-white/14 p-2.5 sm:p-3.5 md:p-4">
          <div class="space-y-4">
            <LobbyOverviewHeader :title="overviewTitle" :subtitle="overviewSubtitle" :stats="overviewStats" />

            <LobbyQuickActions :actions="quickActions" @select="handleQuickAction" />

            <LobbyNetworkPanel class="2xl:hidden" :summary="networkSummary" @refresh="refreshEasyTierStatus"
              @open-settings="handleOpenSettings" @open-diagnostics="handleOpenDiagnostics" />

            <LobbyRoomList :rooms="recentRooms" @copy-code="handleCopyRoomCode" @open-room="handleOpenRoom" />

            <LobbyPartnerList class="2xl:hidden" :partners="partners" />
          </div>
        </main>

        <aside class="hidden min-h-0 overflow-auto border-l border-slate-200/70 bg-white/40 p-3 2xl:block">
          <div class="space-y-4">
            <LobbyNetworkPanel :summary="networkSummary" @refresh="refreshEasyTierStatus"
              @open-settings="handleOpenSettings" @open-diagnostics="handleOpenDiagnostics" />

            <LobbyPartnerList :partners="partners" />
          </div>
        </aside>
      </div>
    </div>

    <EasyTierDialog v-model="settingsVisible" />
    <LobbyUserProfileDialog v-model="profileVisible" />
  </div>
</template>

<script setup lang="ts">
import { easyTierService } from '@/services/easytierService';
import { useAuthStore } from '@/stores/auth';
import { useGlobalStore } from '@/stores/global';
import { useUserStore } from '@/stores/user';
import { isElectron } from '@/utils/electron';
import EasyTierDialog from '@/views/components/easytier/easytier-dialog.vue';
import TopBar from '@/views/components/top-bar.vue';
import {
  FolderOpened,
  House,
  Link,
  Monitor,
  Plus,
  Promotion,
  Setting
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LobbyNetworkPanel from './components/lobby-network-panel.vue';
import LobbyOverviewHeader from './components/lobby-overview-header.vue';
import LobbyPartnerList from './components/lobby-partner-list.vue';
import LobbyQuickActions from './components/lobby-quick-actions.vue';
import LobbyRoomList from './components/lobby-room-list.vue';
import LobbySidebar from './components/lobby-sidebar.vue';
import LobbyUserProfileDialog from './components/lobby-user-profile-dialog.vue';
import type {
  LobbyNavItem,
  LobbyNetworkSummary,
  LobbyOverviewStat,
  LobbyPartnerSummary,
  LobbyQuickAction,
  LobbyRoomSummary
} from './types';

const authStore = useAuthStore();
const globalStore = useGlobalStore();
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

const isElectronEnv = isElectron();
const settingsVisible = ref(false);
const profileVisible = ref(false);
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
    description: '新建一个联机房间，生成房间码并初始化网络配置。',
    icon: Plus,
    accent: 'sky'
  },
  {
    key: 'join-room',
    title: '加入房间',
    description: '输入房间码后快速加入房间，后续接真实校验流程。',
    icon: Promotion,
    accent: 'emerald'
  },
  {
    key: 'launch-game',
    title: '启动游戏',
    description: '预留给后续游戏预设和一键启动能力。',
    icon: Link,
    accent: 'amber'
  },
  {
    key: 'network-settings',
    title: '网络设置',
    description: '查看 EasyTier 参数、节点状态和调试入口。',
    icon: Setting,
    accent: 'rose'
  }
];

const recentRooms = ref<LobbyRoomSummary[]>([
  {
    id: 'room-ashen',
    name: 'Ashen Valley 联机房',
    code: 'ASHN-72QF',
    game: 'Minecraft',
    mode: 'P2P 优先',
    membersOnline: 3,
    membersTotal: 4,
    status: 'ready',
    statusLabel: '联机已就绪',
    lastActive: '12 分钟前'
  },
  {
    id: 'room-rally',
    name: 'Rally Night',
    code: 'RLY-88DT',
    game: 'Euro Truck',
    mode: '中继模式',
    membersOnline: 2,
    membersTotal: 5,
    status: 'gathering',
    statusLabel: '等待成员',
    lastActive: '35 分钟前'
  },
  {
    id: 'room-expedition',
    name: 'Expedition Squad',
    code: 'EXP-41LK',
    game: 'Terraria',
    mode: '需要诊断',
    membersOnline: 1,
    membersTotal: 4,
    status: 'warning',
    statusLabel: '连接异常',
    lastActive: '昨天'
  }
]);

const partners = ref<LobbyPartnerSummary[]>([
  {
    id: 'partner-1',
    name: 'NorthFox',
    tag: 'NF',
    stateLabel: '可联机',
    latencyLabel: '延迟 28 ms · 直连',
    isReachable: true
  },
  {
    id: 'partner-2',
    name: 'Rin',
    tag: 'RN',
    stateLabel: '中继中',
    latencyLabel: '延迟 96 ms · 当前使用中继',
    isReachable: true
  },
  {
    id: 'partner-3',
    name: 'StoneCat',
    tag: 'SC',
    stateLabel: '不可达',
    latencyLabel: '最近一次连接失败，需要重新授权虚拟网卡',
    isReachable: false
  }
]);

const displayName = computed(() => userStore.displayName || authStore.user?.nickname || authStore.user?.username || '联机玩家');
const avatarUrl = computed(() => userStore.avatarUrl || authStore.user?.avatarImage || '');
const userInitials = computed(() => userStore.initials || displayName.value.slice(0, 1).toUpperCase() || 'L');

const endpointLabel = computed(() => {
  return globalStore.endpoint || import.meta.env.VITE_DEFAULT_BASE_URL || '未配置服务节点';
});

const onlinePartnerCount = computed(() => {
  return partners.value.filter((item) => item.isReachable).length;
});

const overviewTitle = computed(() => `${displayName.value}，准备开房`);

const overviewSubtitle = computed(() => {
  if (easyTierRunning.value) {
    return '当前设备已经进入联机待命状态。你可以直接创建房间、邀请伙伴，或者继续检查链路质量。';
  }

  return '左侧现在是固定双层侧边栏，主区只负责联机动作和内容本身，布局会更接近桌面客户端的稳定分栏。';
});

const overviewStats = computed<LobbyOverviewStat[]>(() => [
  {
    label: '最近房间',
    value: `${recentRooms.value.length}`,
    helper: '可直接进入已使用过的联机房间'
  },
  {
    label: '联机伙伴',
    value: `${partners.value.filter(item => item.isReachable).length}`,
    helper: '当前仍可建立连接的成员'
  },
  {
    label: '网络状态',
    value: easyTierRunning.value ? '在线' : '未启动',
    helper: easyTierRunning.value ? 'EasyTier 正在运行' : '等待启动组网服务'
  }
]);

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

function handleQuickAction(actionKey: string) {
  switch (actionKey) {
    case 'network-settings':
      handleOpenSettings();

      return;
    case 'create-room':
      ElMessage.success('主页布局已预留创建房间入口，下一步可直接接入房间表单。');

      return;
    case 'join-room':
      ElMessage.success('加入房间入口已预留，后续可接房间码校验与网络加入流程。');

      return;
    case 'launch-game':
      ElMessage.info('一键启动游戏需要先定义 gameProfile 和启动参数。');

      return;
    default:
      ElMessage.info('该动作暂未绑定。');
  }
}

async function handleCopyRoomCode(room: LobbyRoomSummary) {
  try {
    await navigator.clipboard.writeText(room.code);
    ElMessage.success(`已复制房间码 ${room.code}`);
  } catch {
    ElMessage.warning(`房间码为 ${room.code}`);
  }
}

function handleOpenRoom(room: LobbyRoomSummary) {
  ElMessage.info(`房间 "${room.name}" 的详情视图还未接入，这里先保留入口。`);
}

onMounted(async () => {
  if (!authStore.user || !authStore.token) {
    authStore.initAuth();
  }

  await userStore.initialize();
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
