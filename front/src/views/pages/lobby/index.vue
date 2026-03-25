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
            <!--LobbyOverviewHeader :title="overviewTitle" :subtitle="overviewSubtitle" :stats="overviewStats" /-->

            <LobbyQuickActions :actions="quickActions" @select="handleQuickAction" />

            <LobbyNetworkPanel class="2xl:hidden" :summary="networkSummary" @refresh="refreshEasyTierStatus"
              @open-settings="handleOpenSettings" @open-diagnostics="handleOpenDiagnostics" />

            <LobbyRoomList :rooms="recentRooms" @copy-code="handleCopyRoomCode" @open-room="handleOpenRoom" />

            <LobbyPanelCard v-if="currentRoom" title="当前房间" subtitle="展示成员、房主、连接模式和我的虚拟 IP。">
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
            </LobbyPanelCard>

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

    <el-dialog v-model="createRoomVisible" title="创建房间" width="520px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="房间名">
          <el-input v-model="createRoomForm.name" maxlength="32" placeholder="例如：周末联机房" />
        </el-form-item>
        <el-form-item label="房间密码（EasyTier 密钥）">
          <el-input v-model="createRoomForm.roomPassword" maxlength="64" show-password placeholder="请输入房间密码" />
        </el-form-item>
        <el-form-item label="中继地址">
          <el-select v-model="createRoomForm.relayPreset" class="w-full">
            <el-option label="使用 woyioii 中继" value="woyioii" />
            <el-option label="使用 EasyTier 社区中继" value="official" />
            <el-option label="同时使用两者" value="both" />
            <el-option label="自定义中继" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="createRoomForm.relayPreset === 'custom'" label="自定义中继地址">
          <el-input v-model="createRoomForm.customRelayAddress" maxlength="128" placeholder="tcp://host:11010" />
        </el-form-item>
        <el-form-item label="游戏名称">
          <el-input v-model="createRoomForm.gameName" maxlength="32" placeholder="例如：Minecraft" />
        </el-form-item>
        <el-form-item label="最大成员数">
          <el-input-number v-model="createRoomForm.maxMembers" :min="2" :max="64" :step="1" class="w-full" />
        </el-form-item>
        <el-form-item label="我的虚拟 IP">
          <el-input v-model="createRoomForm.virtualIp" maxlength="64" placeholder="例如：10.144.12.3" />
        </el-form-item>
        <el-form-item label="连接模式">
          <el-select v-model="createRoomForm.connectionMode" class="w-full">
            <el-option label="P2P" value="P2P" />
            <el-option label="RELAY" value="RELAY" />
            <el-option label="UNKNOWN" value="UNKNOWN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createRoomVisible = false">取消</el-button>
        <el-button type="primary" :loading="roomActionLoading" @click="handleCreateRoomSubmit">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="joinRoomVisible" title="加入房间" width="520px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="房间码">
          <el-input v-model="joinRoomForm.roomCode" maxlength="32" placeholder="例如：ABCD-9K2M" />
        </el-form-item>
        <el-form-item label="我的虚拟 IP">
          <el-input v-model="joinRoomForm.virtualIp" maxlength="64" placeholder="例如：10.144.12.8" />
        </el-form-item>
        <el-form-item label="连接模式">
          <el-select v-model="joinRoomForm.connectionMode" class="w-full">
            <el-option label="P2P" value="P2P" />
            <el-option label="RELAY" value="RELAY" />
            <el-option label="UNKNOWN" value="UNKNOWN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="joinRoomVisible = false">取消</el-button>
        <el-button type="primary" :loading="roomActionLoading" @click="handleJoinRoomSubmit">加入</el-button>
      </template>
    </el-dialog>
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
import LobbyPanelCard from './components/lobby-panel-card.vue';
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

const EASYTIER_RELAY_WOYIOII = 'tcp://www.woyioii.cn:11010';
const EASYTIER_RELAY_OFFICIAL = 'tcp://public.easytier.top:11010';

type RelayPreset = 'woyioii' | 'official' | 'both' | 'custom';

const createRoomForm = ref({
  name: '',
  roomPassword: '',
  relayPreset: 'both' as RelayPreset,
  customRelayAddress: '',
  gameName: '',
  maxMembers: 8,
  virtualIp: '',
  connectionMode: 'P2P'
});

const joinRoomForm = ref({
  roomCode: '',
  virtualIp: '',
  connectionMode: 'P2P'
});

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
      createRoomVisible.value = true;

      return;
    case 'join-room':
      joinRoomVisible.value = true;

      return;
    case 'launch-game':
      ElMessage.info('启动游戏前请先定义 gameProfile。');

      return;
    default:
      ElMessage.info('该操作暂未绑定。');
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

function normalizeRelayAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('://')) {
    return trimmed;
  }

  return `tcp://${trimmed}`;
}

function resolveRelayAddresses(preset: RelayPreset, customAddress: string): string[] {
  const addresses: string[] = [];

  if (preset === 'woyioii' || preset === 'both') {
    addresses.push(EASYTIER_RELAY_WOYIOII);
  }
  if (preset === 'official' || preset === 'both') {
    addresses.push(EASYTIER_RELAY_OFFICIAL);
  }
  if (preset === 'custom') {
    const custom = normalizeRelayAddress(customAddress);
    if (custom) {
      addresses.push(custom);
    }
  }

  return Array.from(new Set(addresses));
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

function buildEasyTierConfigFromRoom(room: RoomVO): EasyTierConfig | null {
  const networkName = room.networkName?.trim() || '';
  const networkSecret = room.networkSecret?.trim() || '';
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
      ElMessage.warning(stopRes.error || '???? EasyTier ?????');
      return false;
    }
  }

  const startRes = await easyTierService.start(config);
  if (!startRes.success) {
    ElMessage.error(startRes.error || '?? EasyTier ???');
    return false;
  }

  await refreshEasyTierStatus();
  return true;
}

async function handleCreateRoomSubmit() {
  if (!createRoomForm.value.name.trim()) {
    ElMessage.warning('???????');

    return;
  }
  if (!createRoomForm.value.roomPassword.trim()) {
    ElMessage.warning('????????');

    return;
  }

  const relayAddresses = resolveRelayAddresses(
    createRoomForm.value.relayPreset,
    createRoomForm.value.customRelayAddress
  );
  if (relayAddresses.length === 0) {
    ElMessage.warning('????????????');

    return;
  }

  roomActionLoading.value = true;
  try {
    const room = await roomStore.createRoom({
      name: createRoomForm.value.name.trim(),
      gameName: createRoomForm.value.gameName.trim() || undefined,
      maxMembers: createRoomForm.value.maxMembers,
      networkName: createRoomForm.value.name.trim(),
      networkSecret: createRoomForm.value.roomPassword.trim(),
      relayAddresses,
      virtualIp: createRoomForm.value.virtualIp.trim() || undefined,
      connectionMode: createRoomForm.value.connectionMode
    });
    if (room) {
      const easyTierConfig = buildEasyTierConfigFromRoom(room);
      if (easyTierConfig) {
        const switched = await switchEasyTierNetwork(easyTierConfig);
        if (!switched) {
          ElMessage.warning('?????,? EasyTier ????,????????');
        }
      } else {
        ElMessage.warning('?????,????????');
      }

      createRoomVisible.value = false;
      await roomStore.openRoom(room.id);
    }
  } finally {
    roomActionLoading.value = false;
  }
}

async function handleJoinRoomSubmit() {
  if (!joinRoomForm.value.roomCode.trim()) {
    ElMessage.warning('???????');

    return;
  }

  roomActionLoading.value = true;
  try {
    const room = await roomStore.joinRoom({
      roomCode: joinRoomForm.value.roomCode.trim(),
      virtualIp: joinRoomForm.value.virtualIp.trim() || undefined,
      connectionMode: joinRoomForm.value.connectionMode
    });
    if (room) {
      const easyTierConfig = buildEasyTierConfigFromRoom(room);
      if (easyTierConfig) {
        const switched = await switchEasyTierNetwork(easyTierConfig);
        if (!switched) {
          ElMessage.warning('?????,? EasyTier ????,????????');
        }
      } else {
        ElMessage.error('????????????,?????? EasyTier?');
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

