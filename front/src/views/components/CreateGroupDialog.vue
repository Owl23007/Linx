<template>
  <el-dialog v-model="dialogVisible" title="创建群组" width="600px" @close="handleClose">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="群组名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入群组名称" clearable maxlength="50" show-word-limit />
      </el-form-item>

      <el-form-item label="群组描述" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入群组描述（可选）" maxlength="200"
          show-word-limit />
      </el-form-item>

      <el-form-item label="群组类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio label="NORMAL">普通群</el-radio>
          <el-radio label="PUBLIC">公开群</el-radio>
          <el-radio label="PRIVATE">私密群</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="加群验证">
        <el-switch v-model="form.requireApproval" />
        <span class="ml-2 text-sm text-gray-500">
          开启后需要管理员审批才能加入
        </span>
      </el-form-item>

      <el-form-item label="最大人数" prop="maxMembers">
        <el-input-number v-model="form.maxMembers" :min="2" :max="500" :step="1" />
      </el-form-item>

      <el-form-item label="邀请成员" prop="initialMembers">
        <el-select v-model="form.initialMembers" multiple filterable placeholder="选择要邀请的好友" style="width: 100%">
          <el-option v-for="friend in friends" :key="friend.friendId" :label="friend.remark || friend.friendUsername"
            :value="friend.friendId">
            <div class="flex items-center">
              <el-avatar :size="24" class="mr-2">
                {{ (friend.remark || friend.friendUsername)[0] }}
              </el-avatar>
              <span>{{ friend.remark || friend.friendUsername }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          创建群组
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useFriendsStore } from '@/stores/friends';
import { useGroupsStore } from '@/stores/groups';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

// Props & Emits
const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success', groupId: number): void;
}>();

// Stores
const friendsStore = useFriendsStore();
const groupsStore = useGroupsStore();

// Refs
const formRef = ref<FormInstance>();
const dialogVisible = ref(props.visible);
const loading = ref(false);

// Computed
const friends = computed(() => friendsStore.acceptedFriends);

// Form
const form = reactive({
  name: '',
  description: '',
  type: 'NORMAL' as 'NORMAL' | 'PUBLIC' | 'PRIVATE',
  requireApproval: false,
  maxMembers: 100,
  initialMembers: [] as number[],
});

// Validation Rules
const rules: FormRules = {
  name: [
    { required: true, message: '请输入群组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '群组名称长度应为 2-50 个字符', trigger: 'blur' },
  ],
  maxMembers: [
    { required: true, message: '请设置最大人数', trigger: 'blur' },
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
    const group = await groupsStore.createGroup(
      form.name,
      form.description,
      form.initialMembers
    );

    if (group) {
      ElMessage.success('群组创建成功');
      emit('success', group.id);
      handleClose();
    }
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  formRef.value?.resetFields();
  form.name = '';
  form.description = '';
  form.type = 'NORMAL';
  form.requireApproval = false;
  form.maxMembers = 100;
  form.initialMembers = [];
  dialogVisible.value = false;
}
</script>

<style scoped lang="less">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.ml-2 {
  margin-left: 0.5rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray-500 {
  color: #6b7280;
}
</style>
