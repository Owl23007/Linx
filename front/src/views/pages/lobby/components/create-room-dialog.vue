<template>
  <el-dialog v-model="visible" title="创建房间" width="520px" class="create-room-dialog" destroy-on-close>
    <el-form label-position="top">
      <div class="grid gap-x-3 sm:grid-cols-2">
        <el-form-item label="房间名">
          <el-input v-model="form.name" maxlength="32" placeholder="例如：周末联机房" />
        </el-form-item>
        <el-form-item label="房间密码">
          <el-input v-model="form.roomPassword" maxlength="64" show-password placeholder="请输入房间密码" />
        </el-form-item>
      </div>

      <div class="grid gap-x-3 sm:grid-cols-2">
        <el-form-item label="中继地址">
          <el-select
            v-model="form.relayAddresses"
            multiple
            filterable
            allow-create
            default-first-option
            clearable
            collapse-tags
            collapse-tags-tooltip
            class="w-full"
            placeholder="可多选，回车可添加自定义地址"
          >
            <el-option v-for="item in relayAddressOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="最大成员数">
          <el-input-number v-model="form.maxMembers" :min="2" :max="64" :step="1" class="w-full" />
        </el-form-item>
      </div>

      <div class="grid gap-x-3 sm:grid-cols-2">
        <el-form-item label="游戏名称">
          <el-input v-model="form.gameName" maxlength="32" placeholder="例如：Minecraft" />
        </el-form-item>
        <el-form-item label="我的虚拟 IP">
          <el-input v-model="form.virtualIp" maxlength="64" placeholder="例如：10.144.12.3" />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { computed, reactive } from 'vue';

export interface CreateRoomSubmitPayload {
  name: string
  roomPassword: string
  relayAddresses: string[]
  gameName?: string
  maxMembers: number
  virtualIp?: string
  connectionMode: 'P2P'
}

const EASYTIER_RELAY_WOYIOII = 'tcp://www.woyioii.cn:11010';
const EASYTIER_RELAY_OFFICIAL = 'tcp://public.easytier.top:11010';
const EASYTIER_RELAY_COMMUNITY = 'tcp://public.easytier.net:11010';

const relayAddressOptions = [
  { label: 'www.woyioii.cn:11010', value: EASYTIER_RELAY_WOYIOII },
  { label: 'public.easytier.top:11010', value: EASYTIER_RELAY_OFFICIAL },
  { label: 'public.easytier.net:11010', value: EASYTIER_RELAY_COMMUNITY }
];

const props = defineProps<{
  modelValue: boolean
  loading: boolean
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: CreateRoomSubmitPayload): void
}>();

const form = reactive({
  name: '',
  roomPassword: '',
  relayAddresses: [EASYTIER_RELAY_WOYIOII, EASYTIER_RELAY_OFFICIAL] as string[],
  gameName: '',
  maxMembers: 8,
  virtualIp: ''
});

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

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

function handleSubmit() {
  const name = form.name.trim();
  const roomPassword = form.roomPassword.trim();
  const relayAddresses = Array.from(
    new Set(form.relayAddresses.map((item) => normalizeRelayAddress(item)).filter(Boolean))
  );

  if (!name) {
    ElMessage.warning('请输入房间名');
    return;
  }
  if (!roomPassword) {
    ElMessage.warning('请输入房间密码');
    return;
  }
  if (relayAddresses.length === 0) {
    ElMessage.warning('请至少选择一个中继地址');
    return;
  }

  emit('submit', {
    name,
    roomPassword,
    relayAddresses,
    gameName: form.gameName.trim() || undefined,
    maxMembers: form.maxMembers,
    virtualIp: form.virtualIp.trim() || undefined,
    connectionMode: 'P2P'
  });
}
</script>

<style scoped>
:deep(.create-room-dialog .el-dialog__body) {
  max-height: 62vh;
  overflow-y: auto;
  padding-top: 12px;
  padding-bottom: 12px;
}

:deep(.create-room-dialog .el-form-item) {
  margin-bottom: 14px;
}

:deep(.create-room-dialog .el-form-item__label) {
  margin-bottom: 6px;
  line-height: 20px;
}
</style>
