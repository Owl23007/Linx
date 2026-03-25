<template>
  <el-dialog
    v-model="visible"
    title="加入房间"
    width="520px"
    class="join-room-dialog"
    destroy-on-close
  >
    <el-form label-position="top">
      <el-form-item label="房间码">
        <el-input v-model="form.roomCode" maxlength="32" placeholder="例如：ABCD-9K2M" />
      </el-form-item>
      <el-form-item label="我的虚拟 IP">
        <el-input v-model="form.virtualIp" maxlength="64" placeholder="例如：10.144.12.8" />
      </el-form-item>
      <el-form-item label="连接方式">
        <el-input value="P2P" disabled />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">加入</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { computed, reactive } from 'vue';

export interface JoinRoomSubmitPayload {
  roomCode: string
  virtualIp?: string
  connectionMode: 'P2P'
}

const props = defineProps<{
  modelValue: boolean
  loading: boolean
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', payload: JoinRoomSubmitPayload): void
}>();

const form = reactive({
  roomCode: '',
  virtualIp: ''
});

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

function handleSubmit() {
  const roomCode = form.roomCode.trim();
  if (!roomCode) {
    ElMessage.warning('请输入房间码');
    return;
  }

  emit('submit', {
    roomCode,
    virtualIp: form.virtualIp.trim() || undefined,
    connectionMode: 'P2P'
  });
}
</script>

<style scoped>
:deep(.join-room-dialog .el-form-item) {
  margin-bottom: 14px;
}

:deep(.join-room-dialog .el-form-item__label) {
  margin-bottom: 6px;
  line-height: 20px;
}
</style>
