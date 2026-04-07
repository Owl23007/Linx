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
        <el-result icon="success" title="服务运行正常" sub-title="EasyTier 虚拟网络已连接">
          <template #extra>
            <div class="et-running-actions">
              <el-button type="primary" @click="showPeers">查看房间成员</el-button>
              <el-button type="danger" @click="stop" :loading="loading" plain>停止服务</el-button>
            </div>
          </template>
        </el-result>
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

    <el-dialog v-model="peersVisible" title="房间成员列表" width="min(900px, 92vw)" append-to-body>
      <el-table :data="peersList" stripe style="width: 100%" v-loading="peersLoading">
        <el-table-column prop="peer_id" label="Peer ID" width="120" />
        <el-table-column prop="ipv4" label="IPv4" width="140" />
        <el-table-column prop="hostname" label="主机名" />
        <el-table-column prop="latency_ms" label="延迟 (ms)" width="100">
          <template #default="{ row }">
            <span :class="getLatencyClass(row.latency_ms)">
              {{ row.latency_ms !== null && row.latency_ms !== undefined ? row.latency_ms.toFixed(1) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="loss_rate" label="丢包率" width="100">
          <template #default="{ row }">
            {{ row.loss_rate !== null && row.loss_rate !== undefined ? (row.loss_rate * 100).toFixed(1) + '%' : '0%' }}
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-4">
        <el-button @click="showPeers" :loading="peersLoading" icon="Refresh">刷新</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { easyTierService, type EasyTierConfig, type EasyTierStatus } from '@/services/easytierService';
import { Connection } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { onMounted, onUnmounted, reactive, ref } from 'vue';

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

const peersVisible = ref(false);
const peersLoading = ref(false);
const peersList = ref<any[]>([]);
let statusTimer: ReturnType<typeof setInterval> | null = null;

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

const showPeers = async () => {
  peersVisible.value = true;
  peersLoading.value = true;
  try {
    const res = await easyTierService.getPeers();
    if (res.success) {
      const data: any = res.data;
      if (Array.isArray(data)) {
        peersList.value = data;
      } else if (data && Array.isArray(data.peers)) {
        peersList.value = data.peers;
      } else {
        peersList.value = [];
      }
    } else {
      ElMessage.error(res.error || '获取成员列表失败');
    }
  } catch (e: any) {
    ElMessage.error(e.message || '获取成员列表失败');
  } finally {
    peersLoading.value = false;
  }
};

const getLatencyClass = (latency: number) => {
  if (!latency) return '';
  if (latency < 50) return 'text-green-500 font-bold';
  if (latency < 150) return 'text-yellow-500 font-bold';

  return 'text-red-500 font-bold';
};

onMounted(() => {
  updateStatus();
  statusTimer = setInterval(updateStatus, 5000);
});

onUnmounted(() => {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }
});
</script>

<style scoped>
.et-wrap {
  padding: 16px;
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
  font-size: 30px;
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
  padding: 10px 0 2px;
}

.et-running-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
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
    font-size: 24px;
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
  padding: 14px 16px;
  border-bottom: 1px solid #e7edf6;
}

:deep(.el-card__body) {
  padding: 14px 16px 16px;
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
