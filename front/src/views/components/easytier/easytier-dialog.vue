<template>
  <el-dialog
    v-model="visible"
    title="EasyTier Settings"
    width="500px"
    :close-on-click-modal="false"
    append-to-body
  >
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
