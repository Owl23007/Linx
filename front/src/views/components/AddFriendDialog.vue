<template>
  <el-dialog v-model="dialogVisible" title="添加好友" width="500px" @close="handleClose">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
      <el-form-item label="用户账号" prop="targetUser">
        <el-input v-model="form.targetUser" placeholder="请输入用户名、邮箱或ID" clearable />
      </el-form-item>

      <el-form-item label="验证消息" prop="message">
        <el-input v-model="form.message" type="textarea" :rows="3" placeholder="请输入验证消息（可选）" maxlength="100"
          show-word-limit />
      </el-form-item>

      <el-form-item label="备注名称" prop="remark">
        <el-input v-model="form.remark" placeholder="设置备注名称（可选）" clearable />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          发送请求
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useFriendsStore } from '@/stores/friends';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { reactive, ref, watch } from 'vue';

// Props & Emits
const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

// Store
const friendsStore = useFriendsStore();

// Refs
const formRef = ref<FormInstance>();
const dialogVisible = ref(props.visible);
const loading = ref(false);

// Form
const form = reactive({
  targetUser: '',
  message: '',
  remark: '',
});

// Validation Rules
const rules: FormRules = {
  targetUser: [
    { required: true, message: '请输入用户账号', trigger: 'blur' },
    { min: 3, max: 50, message: '账号长度应为 3-50 个字符', trigger: 'blur' },
  ],
};

// Watch props
watch(() => props.visible, (val) => {
  dialogVisible.value = val;
});

watch(dialogVisible, (val) => {
  emit('update:visible', val);
});

// Methods
async function handleSubmit() {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const success = await friendsStore.sendFriendRequest(
      form.targetUser,
      form.message,
      form.remark
    );

    if (success) {
      ElMessage.success('好友请求已发送');
      emit('success');
      handleClose();
    }
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  formRef.value?.resetFields();
  form.targetUser = '';
  form.message = '';
  form.remark = '';
  dialogVisible.value = false;
}
</script>

<style scoped lang="less">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
