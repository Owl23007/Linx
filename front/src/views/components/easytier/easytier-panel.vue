<template>
  <div class="p-4 max-w-3xl mx-auto">
    <el-card class="shadow-md">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <el-icon class="text-blue-500">
              <Connection />
            </el-icon>
            <span class="text-lg font-bold text-gray-700">EasyTier 组网</span>
          </div>
          <el-tag v-if="status.running" type="success" effect="dark" round>
            运行中 (PID: {{ status.pid }})
          </el-tag>
          <el-tag v-else type="info" effect="plain" round>已停止</el-tag>
        </div>
      </template>

      <div v-if="status.running" class="flex flex-col items-center justify-center py-8 space-y-4">
        <el-result icon="success" title="服务运行正常" sub-title="EasyTier 虚拟网络已连接">
          <template #extra>
            <div class="flex gap-4">
              <el-button type="primary" @click="showPeers" plain>查看房间成员</el-button>
              <el-button type="danger" @click="stop" :loading="loading" plain>停止服务</el-button>
            </div>
          </template>
        </el-result>
      </div>

      <div v-else>
        <el-form :model="config" label-width="140px" class="max-w-2xl mx-auto">
          <el-form-item label="网络名称">
            <el-input v-model="config.networkName" placeholder="请输入网络名称" clearable />
          </el-form-item>
          <el-form-item label="网络密钥">
            <el-input v-model="config.networkSecret" type="password" show-password placeholder="请输入网络密钥" />
          </el-form-item>
          <el-form-item label="服务器地址 (Peers)" required>
            <el-input v-model="peersInput" placeholder="请输入服务器地址，例如: tcp://1.2.3.4:11010" type="textarea" :rows="2" />
            <div class="text-xs text-gray-400 mt-1">多个地址请用逗号分隔</div>
          </el-form-item>
          <el-collapse class="mb-6">
            <el-collapse-item title="高级设置" name="1">
              <div class="p-4 bg-gray-50">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <el-form-item label="主机名">
                    <el-input v-model="config.hostname" placeholder="Hostname" />
                  </el-form-item>
                  <el-form-item label="IPv4 (CIDR)">
                    <el-input v-model="config.ipv4" placeholder="例如: 10.144.144.1/24" />
                  </el-form-item>
                  <el-form-item label="监听地址">
                    <el-input v-model="listenersInput" placeholder="例如: tcp://0.0.0.0:11010" />
                  </el-form-item>
                  <el-form-item label="RPC 端口">
                    <el-input-number v-model="config.rpcPort" :min="1" :max="65535" controls-position="right"
                      class="w-full" />
                  </el-form-item>
                  <el-form-item label="设备名称">
                    <el-input v-model="config.devName" placeholder="例如: tun0" />
                  </el-form-item>
                  <el-form-item label="默认协议">
                    <el-select v-model="config.defaultProtocol" placeholder="选择协议">
                      <el-option label="TCP" value="tcp" />
                      <el-option label="UDP" value="udp" />
                      <el-option label="WSS" value="wss" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="日志等级">
                    <el-select v-model="config.fileLogLevel" placeholder="选择等级">
                      <el-option label="Error" value="error" />
                      <el-option label="Warn" value="warn" />
                      <el-option label="Info" value="info" />
                      <el-option label="Debug" value="debug" />
                      <el-option label="Trace" value="trace" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="日志目录">
                    <el-input v-model="config.fileLogDir" placeholder="easytier/logs/" />
                  </el-form-item>
                </div>

                <el-divider content-position="left">功能开关</el-divider>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
              </div>
            </el-collapse-item>
          </el-collapse>

          <div class="flex justify-center pt-4">
            <el-button type="primary" size="large" @click="start" :loading="loading" class="w-full md:w-auto px-12">
              启动服务
            </el-button>
          </div>
        </el-form>
      </div>

      <div v-if="error" class="mt-6">
        <el-alert :title="error" type="error" show-icon :closable="false" />
      </div>
    </el-card>

    <!-- Peers Dialog -->
    <el-dialog v-model="peersVisible" title="房间成员列表" width="900px" append-to-body>
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
import { onMounted, reactive, ref } from 'vue';

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

const peersVisible = ref(false);
const peersLoading = ref(false);
const peersList = ref<any[]>([]);

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
    config.peers = peersInput.value.split(',').map(p => p.trim()).filter(p => p);
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
  // Poll status every 5 seconds
  setInterval(updateStatus, 5000);
});
</script>

<style scoped>
/* Tailwind handles most styles, but we can add custom overrides here if needed */
:deep(.el-collapse-item__header) {
  padding-left: 1rem;
  font-weight: 500;
}
</style>
