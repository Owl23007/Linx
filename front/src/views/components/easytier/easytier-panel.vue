<template>
  <div class="et-wrap">
    <el-card class="et-card" shadow="never">
      <template #header>
        <div class="et-header">
          <div class="et-title-group">
            <div class="et-title-row">
              <el-icon class="et-title-icon">
                <Connection />
              </el-icon>
              <span class="et-title">EasyTier 组网</span>
            </div>
            <p class="et-subtitle">配置节点连接参数并快速启动虚拟网络</p>
          </div>
          <el-tag v-if="status.running" type="success" effect="light" round class="et-status-tag">
            运行中 · PID {{ status.pid }}
          </el-tag>
          <el-tag v-else type="info" effect="light" round class="et-status-tag">
            已停止
          </el-tag>
        </div>
      </template>

      <div v-if="status.running" class="et-running-panel">
        <div class="et-running-summary">
          <div class="et-running-summary-text">
            <span class="et-running-dot"></span>
            <span>服务运行正常，EasyTier 虚拟网络已连接</span>
          </div>
          <div class="et-running-actions">
            <el-button type="danger" @click="stop" :loading="loading" plain>停止服务</el-button>
          </div>
        </div>

        <el-divider content-position="left">Peer 列表</el-divider>
        <div class="mb-3 text-sm text-slate-600">本机虚拟 IP：<strong>{{ localVirtualIp }}</strong></div>
        <el-table :data="peersList" stripe style="width: 100%" v-loading="peersLoading" max-height="360">
          <el-table-column prop="peerId" label="Peer ID" width="140" />
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <el-tag v-if="row.isLocal" type="info" effect="plain" size="small">本机</el-tag>
              <el-tag v-else-if="row.isRelayLike" type="warning" effect="light" size="small">中继</el-tag>
              <el-tag v-else type="success" effect="light" size="small">终端</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="ipv4" label="IPv4" width="160" />
          <el-table-column prop="hostname" label="主机名" />
          <el-table-column prop="cost" label="链路" width="110" />
          <el-table-column prop="latencyMs" label="延迟 (ms)" width="120">
            <template #default="{ row }">
              <span :class="getLatencyClass(row.latencyMs)">
                {{ formatLatency(row.latencyMs) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="lossRatePercent" label="丢包率" width="100">
            <template #default="{ row }">
              {{ formatLossRate(row.lossRatePercent) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else>
        <el-form :model="config" label-position="top" class="et-form">
          <section class="et-section">
            <h4 class="et-section-title">基础配置</h4>
            <div class="et-grid et-grid-basic">
              <el-form-item label="网络名称">
                <el-input v-model="config.networkName" placeholder="例如：team-devnet" clearable />
              </el-form-item>
              <el-form-item label="网络密钥">
                <el-input v-model="config.networkSecret" type="password" show-password placeholder="请输入网络密钥"
                  clearable />
              </el-form-item>
            </div>

            <el-form-item label="服务器地址 (Peers)" required>
              <el-input v-model="peersInput" placeholder="例如：tcp://1.2.3.4:11010" type="textarea" :rows="2"
                resize="none" />
              <div class="et-help">多个地址请用英文逗号分隔</div>
            </el-form-item>
          </section>

          <el-collapse v-model="advancedActive" class="et-collapse">
            <el-collapse-item title="高级设置" name="advanced">
              <section class="et-section et-section-advanced">
                <div class="et-grid et-grid-advanced">
                  <el-form-item label="主机名">
                    <el-input v-model="config.hostname" placeholder="例如：client-node-a" clearable />
                  </el-form-item>
                  <el-form-item label="IPv4 (CIDR)">
                    <el-input v-model="config.ipv4" placeholder="例如：10.144.144.1/24" clearable />
                  </el-form-item>
                  <el-form-item label="监听地址">
                    <el-input v-model="listenersInput" placeholder="例如：tcp://0.0.0.0:11010" clearable />
                  </el-form-item>
                  <el-form-item label="RPC 端口">
                    <el-input-number v-model="config.rpcPort" :min="1" :max="65535" controls-position="right"
                      class="w-full" />
                  </el-form-item>
                  <el-form-item label="设备名称">
                    <el-input v-model="config.devName" placeholder="例如：tun0" clearable />
                  </el-form-item>
                  <el-form-item label="默认协议">
                    <el-select v-model="config.defaultProtocol" placeholder="选择协议" class="w-full">
                      <el-option label="TCP" value="tcp" />
                      <el-option label="UDP" value="udp" />
                      <el-option label="WSS" value="wss" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="日志等级">
                    <el-select v-model="config.fileLogLevel" placeholder="选择等级" class="w-full">
                      <el-option label="Error" value="error" />
                      <el-option label="Warn" value="warn" />
                      <el-option label="Info" value="info" />
                      <el-option label="Debug" value="debug" />
                      <el-option label="Trace" value="trace" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="日志目录">
                    <el-input v-model="config.fileLogDir" placeholder="easytier/logs/" clearable />
                  </el-form-item>
                </div>

                <el-divider content-position="left">功能开关</el-divider>
                <div class="et-switches">
                  <el-checkbox v-model="config.dhcp" label="启用 DHCP" />
                  <el-checkbox v-model="config.multiThread" label="多线程模式" />
                  <el-checkbox v-model="config.latencyFirst" label="低延迟优先" />
                  <el-checkbox v-model="config.useSmoltcp" label="使用 smoltcp" />
                  <el-checkbox v-model="config.relayAllPeerRpc" label="中继所有 RPC" />
                  <el-checkbox v-model="config.enableQuicProxy" label="启用 QUIC 代理" />
                  <el-checkbox v-model="config.privateMode" label="隐私模式" />
                  <el-checkbox v-model="config.disableP2p" label="禁用 P2P" />
                  <el-checkbox v-model="config.disableEncryption" label="禁用加密" />
                  <el-checkbox v-model="config.disableIpv6" label="禁用 IPv6" />
                  <el-checkbox v-model="config.noTun" label="无 TUN 模式" />
                </div>
              </section>
            </el-collapse-item>
          </el-collapse>

          <div class="et-footer-actions">
            <el-button type="primary" size="large" @click="start" :loading="loading" class="et-start-btn">
              启动服务
            </el-button>
          </div>
        </el-form>
      </div>

      <div v-if="error" class="et-error-wrap">
        <el-alert :title="error" type="error" show-icon :closable="false" />
      </div>
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { easyTierService, type EasyTierConfig, type EasyTierStatus } from '@/services/easytierService';
import { Connection } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';

const status = ref<EasyTierStatus>({ running: false, pid: null });
const loading = ref(false);
const config = reactive<EasyTierConfig>({
  networkName: '',
  networkSecret: '',
  peers: [],
  hostname: '',
  ipv4: '',
  dhcp: true,
  listeners: [],
  rpcPort: 11010,
  devName: '',
  defaultProtocol: 'tcp',
  multiThread: false,
  latencyFirst: false,
  useSmoltcp: false,
  relayAllPeerRpc: false,
  fileLogLevel: 'info',
  fileLogDir: '',
  enableQuicProxy: false,
  privateMode: false,
  disableP2p: false,
  disableEncryption: false,
  disableIpv6: false,
  noTun: false
});
const peersInput = ref('');
const listenersInput = ref('');
const error = ref('');
const advancedActive = ref<string[]>([]);

const peersLoading = ref(false);
const localVirtualIp = ref('-');
const peersList = ref<Array<{
  peerId: string
  ipv4: string
  hostname: string
  cost: string
  latencyMs: number | null
  lossRatePercent: number | null
  isLocal: boolean
  isRelayLike: boolean
}>>([]);
let statusTimer: ReturnType<typeof setInterval> | null = null;
let peersTimer: ReturnType<typeof setInterval> | null = null;
let peersFetching = false;
const PEERS_POLL_INTERVAL_MS = 5000;

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'nan') {
      return null;
    }

    const parsed = Number(trimmed);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeText(value: unknown, fallback = '-'): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();

  return text ? text : fallback;
}

function toPercentNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;

    return value > 1 ? value : value * 100;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '-') {
      return null;
    }

    const normalized = trimmed.replace('%', '');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return trimmed.includes('%') ? parsed : parsed > 1 ? parsed : parsed * 100;
  }

  return null;
}

function normalizePeers(raw: unknown) {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as any).peers)
      ? (raw as any).peers
      : [];

  return list.map((item: any) => ({
    peerId: String(item.peer_id ?? item.peerId ?? item.id ?? item.peer ?? '-'),
    ipv4: normalizeText(item.ipv4 ?? item.ip ?? item.virtual_ip),
    hostname: normalizeText(item.hostname ?? item.host_name ?? item.name),
    cost: normalizeText(item.cost),
    latencyMs: toFiniteNumber(item.lat_ms ?? item.latency_ms ?? item.latencyMs ?? item.latency),
    lossRatePercent: toPercentNumber(item.loss_rate ?? item.lossRate ?? item.packet_loss ?? item.loss),
    isLocal: String(item.cost ?? '').toLowerCase() === 'local',
    isRelayLike: /publicserver/i.test(String(item.hostname ?? '')) || /relay|public/i.test(String(item.cost ?? ''))
  }));
}

function findIPv4Like(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  if (!text || text === '-') {
    return null;
  }

  const matched = text.match(/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/);

  return matched ? text : null;
}

function extractVirtualIpFromNodeInfo(raw: unknown): string | null {
  const directCandidates = [
    (raw as any)?.ipv4,
    (raw as any)?.virtual_ipv4,
    (raw as any)?.virtualIp,
    (raw as any)?.my_ipv4,
    (raw as any)?.node_ipv4,
    (raw as any)?.tun_ipv4
  ];

  for (const candidate of directCandidates) {
    const ip = findIPv4Like(candidate);
    if (ip) {
      return ip;
    }
  }

  const walk = (input: unknown): string | null => {
    if (!input || typeof input !== 'object') {
      return null;
    }

    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (/stun|public|listener|rpc|port|endpoint/i.test(key)) {
        continue;
      }

      const shouldCheckThisKey = /virtual|ipv4|tun|node|my/i.test(key);
      if (shouldCheckThisKey) {
        const ip = findIPv4Like(value);
        if (ip) {
          return ip;
        }
      }

      if (value && typeof value === 'object') {
        const child = walk(value);
        if (child) {
          return child;
        }
      }
    }

    return null;
  };

  return walk(raw);
}

function resolveLocalVirtualIp(nodeInfo: unknown, normalizedPeers: Array<{ isLocal: boolean; ipv4: string }>): string {
  const fromNodeInfo = extractVirtualIpFromNodeInfo(nodeInfo);
  if (fromNodeInfo) {
    return fromNodeInfo;
  }

  const fromLocalPeer = normalizedPeers.find((item) => item.isLocal && item.ipv4 !== '-')?.ipv4;
  if (fromLocalPeer) {
    return fromLocalPeer;
  }

  if (config.ipv4 && config.ipv4.trim()) {
    return config.ipv4.trim();
  }

  return '-';
}

const updateStatus = async () => {
  const res = await easyTierService.getStatus();
  if (res.success) {
    status.value = res.data;
  }
};

const start = async () => {
  error.value = '';
  loading.value = true;
  try {
    const peers = peersInput.value.split(',').map(p => p.trim()).filter(p => p);
    if (peers.length === 0) {
      ElMessage.warning('请至少填写一个服务器地址');
      loading.value = false;

      return;
    }

    config.peers = peers;
    config.listeners = listenersInput.value.split(',').map(l => l.trim()).filter(l => l);

    // 使用 JSON.parse(JSON.stringify()) 去除 Vue 的 Proxy 包装，防止 IPC 克隆错误
    const plainConfig = JSON.parse(JSON.stringify(config));
    const res = await easyTierService.start(plainConfig);
    if (res.success) {
      await updateStatus();
    } else {
      error.value = res.error || '启动失败';
    }
  } catch (e: any) {
    error.value = e.message || '发生未知错误';
  } finally {
    loading.value = false;
  }
};

const stop = async () => {
  error.value = '';
  loading.value = true;
  try {
    const res = await easyTierService.stop();
    if (res.success) {
      await updateStatus();
    } else {
      error.value = res.error || '停止失败';
    }
  } catch (e: any) {
    error.value = e.message || '发生未知错误';
  } finally {
    loading.value = false;
  }
};

const fetchPeers = async (silent = false) => {
  if (peersFetching) {
    return;
  }

  peersFetching = true;
  if (!silent) {
    peersLoading.value = true;
  }

  try {
    const [peersRes, nodeInfoRes] = await Promise.all([
      easyTierService.getPeers(),
      easyTierService.getNodeInfo()
    ]);

    if (peersRes.success) {
      const normalized = normalizePeers(peersRes.data);
      peersList.value = normalized;
      localVirtualIp.value = resolveLocalVirtualIp(nodeInfoRes.success ? nodeInfoRes.data : null, normalized);
    } else if (!silent) {
      ElMessage.error(peersRes.error || '获取 Peer 列表失败');
    }
  } catch (e: any) {
    if (!silent) {
      ElMessage.error(e.message || '获取 Peer 列表失败');
    }
  } finally {
    if (!silent) {
      peersLoading.value = false;
    }
    peersFetching = false;
  }
};

const stopPeersPolling = () => {
  if (peersTimer) {
    clearInterval(peersTimer);
    peersTimer = null;
  }
};

const startPeersPolling = () => {
  stopPeersPolling();
  void fetchPeers(false);
  peersTimer = setInterval(() => {
    if (!status.value.running) {
      return;
    }
    void fetchPeers(true);
  }, PEERS_POLL_INTERVAL_MS);
};

watch(() => status.value.running, (running) => {
  if (running) {
    startPeersPolling();
  } else {
    stopPeersPolling();
    peersList.value = [];
    localVirtualIp.value = '-';
  }
});

const getLatencyClass = (latency: number | null) => {
  if (latency === null || latency === undefined || !Number.isFinite(latency)) return '';
  if (latency < 50) return 'text-green-500 font-bold';
  if (latency < 150) return 'text-yellow-500 font-bold';

  return 'text-red-500 font-bold';
};

const formatLatency = (latency: number | null) => {
  if (latency === null || !Number.isFinite(latency)) {
    return '-';
  }

  return latency.toFixed(1);
};

const formatLossRate = (lossRatePercent: number | null) => {
  if (lossRatePercent === null || !Number.isFinite(lossRatePercent)) {
    return '-';
  }

  return `${lossRatePercent.toFixed(1)}%`;
};

onMounted(() => {
  updateStatus();
  statusTimer = setInterval(updateStatus, 5000);
  if (status.value.running) {
    startPeersPolling();
  }
});

onUnmounted(() => {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }
  stopPeersPolling();
});
</script>

<style scoped>
.et-wrap {
  padding: 12px;
}

.et-card {
  border: 1px solid #dfe6f2;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.et-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.et-title-group {
  min-width: 0;
}

.et-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.et-title-icon {
  color: #3b82f6;
}

.et-title {
  font-size: 24px;
  line-height: 1.2;
  font-weight: 700;
  color: #1f2937;
}

.et-subtitle {
  margin-top: 4px;
  margin-bottom: 0;
  font-size: 13px;
  color: #6b7280;
}

.et-status-tag {
  flex-shrink: 0;
  font-weight: 600;
}

.et-running-panel {
  padding: 6px 0 0;
}

.et-running-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 10px;
  border: 1px solid #e5f4df;
  background: #f6fff2;
  border-radius: 10px;
}

.et-running-summary-text {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2f6f35;
  font-size: 14px;
  font-weight: 600;
}

.et-running-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #67c23a;
  box-shadow: 0 0 0 4px rgba(103, 194, 58, 0.2);
}

.et-running-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.et-form {
  padding-top: 4px;
}

.et-section {
  border: 1px solid #e7edf6;
  border-radius: 10px;
  padding: 14px 14px 6px;
  background: #f9fbff;
}

.et-section-title {
  margin: 0 0 10px;
  font-size: 14px;
  color: #374151;
  font-weight: 600;
}

.et-section-advanced {
  margin-top: 10px;
}

.et-grid {
  display: grid;
  gap: 10px;
}

.et-grid-basic {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.et-grid-advanced {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.et-help {
  margin-top: 6px;
  font-size: 12px;
  color: #8b97aa;
}

.et-collapse {
  margin-top: 12px;
}

.et-switches {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 12px;
}

.et-footer-actions {
  display: flex;
  justify-content: center;
  padding-top: 14px;
}

.et-start-btn {
  min-width: 180px;
}

.et-error-wrap {
  margin-top: 14px;
}

@media (max-width: 768px) {
  .et-wrap {
    padding: 12px;
  }

  .et-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .et-title {
    font-size: 22px;
  }

  .et-running-summary {
    padding: 8px;
  }

  :deep(.el-table__inner-wrapper) {
    font-size: 12px;
  }

  .et-grid-basic,
  .et-grid-advanced,
  .et-switches {
    grid-template-columns: 1fr;
  }

  .et-start-btn {
    width: 100%;
  }
}

:deep(.el-card__header) {
  padding: 12px 14px;
  border-bottom: 1px solid #e7edf6;
}

:deep(.el-card__body) {
  padding: 12px 14px 14px;
}

:deep(.el-collapse-item__header) {
  font-weight: 600;
  color: #374151;
  background: #ffffff;
  border-radius: 8px;
  padding-left: 10px;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

:deep(.el-form-item) {
  margin-bottom: 10px;
}
</style>
