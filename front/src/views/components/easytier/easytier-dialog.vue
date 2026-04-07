<template>
  <el-dialog v-model="visible" title="EasyTier 设置" width="min(760px, 94vw)" :close-on-click-modal="false"
    class="easytier-dialog" append-to-body>
    <EasyTierPanel />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import EasyTierPanel from './easytier-panel.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});
</script>

<style scoped>
:deep(.easytier-dialog .el-dialog) {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18);
}

:deep(.easytier-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 18px 22px;
  border-bottom: 1px solid #e8edf5;
}

:deep(.easytier-dialog .el-dialog__title) {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: 0.2px;
}

:deep(.easytier-dialog .el-dialog__body) {
  padding: 0;
}
</style>
