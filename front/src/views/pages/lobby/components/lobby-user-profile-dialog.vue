<template>
  <el-dialog
    :model-value="modelValue"
    width="min(92vw, 960px)"
    append-to-body
    destroy-on-close
    class="lobby-user-profile-dialog"
    @close="handleClose"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3 pr-8">
        <div>
          <p class="text-lg font-semibold text-slate-900">个人资料</p>
          <p class="mt-1 text-sm text-slate-500">点击头像查看信息，并可直接修改当前账号资料。</p>
        </div>
        <el-tag round type="info" effect="plain">Profile</el-tag>
      </div>
    </template>

    <div class="space-y-5" v-loading="loading">
      <section class="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#38bdf8_100%)] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <el-avatar :size="76" :src="previewAvatar" class="shrink-0 border-2 border-white/20 bg-slate-900 text-2xl font-semibold">
              {{ initials }}
            </el-avatar>
            <div class="min-w-0">
              <p class="truncate text-2xl font-semibold">{{ displayName }}</p>
              <p class="mt-1 truncate text-sm text-sky-100">@{{ profile.username || 'unknown' }}</p>
              <p class="mt-3 text-sm leading-6 text-slate-100">
                {{ profile.signature || '还没有设置签名，可以在编辑模式里补充一句个人说明。' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 self-start sm:self-center">
            <el-button v-if="!editing" round type="primary" @click="startEdit">编辑资料</el-button>
            <template v-else>
              <el-button round @click="cancelEdit">取消</el-button>
              <el-button round type="primary" :loading="saving" @click="saveProfile">保存修改</el-button>
            </template>
          </div>
        </div>
      </section>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <section class="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-base font-semibold text-slate-900">资料详情</p>
              <p class="mt-1 text-sm text-slate-500">基础身份信息与个人展示字段。</p>
            </div>
            <el-tag round :type="editing ? 'warning' : 'success'" effect="plain">
              {{ editing ? '编辑中' : '只读' }}
            </el-tag>
          </div>

          <div v-if="!editing" class="mt-5 grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">昵称</p>
              <p class="mt-2 break-all text-sm font-medium text-slate-900">{{ profile.nickname || '-' }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">用户名</p>
              <p class="mt-2 break-all text-sm font-medium text-slate-900">{{ profile.username || '-' }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">邮箱</p>
              <p class="mt-2 break-all text-sm font-medium text-slate-900">{{ profile.email || '-' }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">手机号</p>
              <p class="mt-2 break-all text-sm font-medium text-slate-900">{{ profile.phone || '-' }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">头像地址</p>
              <p class="mt-2 break-all text-sm font-medium text-slate-900">{{ profile.avatarImage || '-' }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
              <p class="text-xs uppercase tracking-[0.18em] text-slate-400">背景地址</p>
              <p class="mt-2 break-all text-sm font-medium text-slate-900">{{ profile.backgroundImage || '-' }}</p>
            </div>
          </div>

          <el-form
            v-else
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            class="mt-5"
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="form.nickname" maxlength="50" clearable placeholder="请输入昵称" />
              </el-form-item>

              <el-form-item label="手机号" prop="phone">
                <el-input v-model="form.phone" maxlength="20" clearable placeholder="请输入手机号" />
              </el-form-item>

              <el-form-item label="头像地址" prop="avatarImage" class="sm:col-span-2">
                <el-input
                  v-model="form.avatarImage"
                  maxlength="500"
                  clearable
                  placeholder="请输入头像图片 URL"
                />
              </el-form-item>

              <el-form-item label="背景地址" prop="backgroundImage" class="sm:col-span-2">
                <el-input
                  v-model="form.backgroundImage"
                  maxlength="500"
                  clearable
                  placeholder="请输入背景图片 URL"
                />
              </el-form-item>

              <el-form-item label="个性签名" prop="signature" class="sm:col-span-2">
                <el-input
                  v-model="form.signature"
                  type="textarea"
                  :rows="4"
                  maxlength="255"
                  show-word-limit
                  placeholder="介绍一下自己"
                />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section class="space-y-5">
          <div class="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
            <div
              class="h-32 bg-cover bg-center"
              :style="{ backgroundImage: previewBackground ? `url(${previewBackground})` : defaultBackground }"
            />
            <div class="px-5 pb-5 pt-4">
              <p class="text-base font-semibold text-slate-900">卡片预览</p>
              <p class="mt-1 text-sm text-slate-500">保存前会先按当前表单内容预览展示效果。</p>
              <div class="mt-4 rounded-[22px] bg-slate-950 px-4 py-4 text-white">
                <div class="flex items-center gap-3">
                  <el-avatar :size="44" :src="previewAvatar" class="bg-slate-700 text-base font-semibold">
                    {{ initials }}
                  </el-avatar>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold">{{ displayName }}</p>
                    <p class="mt-1 truncate text-xs text-slate-300">@{{ profile.username || 'unknown' }}</p>
                  </div>
                </div>
                <p class="mt-3 text-sm leading-6 text-slate-300">{{ previewSignature }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
            <p class="text-base font-semibold text-slate-900">账号信息</p>
            <div class="mt-4 space-y-3 text-sm text-slate-600">
              <div class="flex items-center justify-between gap-3">
                <span>用户 ID</span>
                <span class="font-medium text-slate-900">{{ profile.userId ?? '-' }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span>角色</span>
                <span class="font-medium text-slate-900">{{ profile.role || '-' }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span>状态</span>
                <span class="font-medium text-slate-900">{{ profile.accountStatus || profile.status || '-' }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span>最近更新</span>
                <span class="font-medium text-slate-900">{{ profile.updatedAt || '-' }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';
import { useUserStore } from '@/stores/user';

type ProfileForm = {
  nickname: string;
  phone: string;
  signature: string;
  avatarImage: string;
  backgroundImage: string;
};

const props = defineProps<{
  modelValue: boolean
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>();

const userStore = useUserStore();

const loading = ref(false);
const saving = ref(false);
const editing = ref(false);
const formRef = ref<FormInstance>();
const form = reactive<ProfileForm>({
  nickname: '',
  phone: '',
  signature: '',
  avatarImage: '',
  backgroundImage: '',
});

const rules: FormRules<ProfileForm> = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 1, max: 50, message: '昵称长度需要在 1 到 50 个字符之间', trigger: 'blur' },
  ],
  phone: [
    { max: 20, message: '手机号长度不能超过 20 个字符', trigger: 'blur' },
  ],
  signature: [
    { max: 255, message: '个性签名长度不能超过 255 个字符', trigger: 'blur' },
  ],
  avatarImage: [
    { max: 500, message: '头像地址长度不能超过 500 个字符', trigger: 'blur' },
  ],
  backgroundImage: [
    { max: 500, message: '背景地址长度不能超过 500 个字符', trigger: 'blur' },
  ],
};

const defaultBackground = 'linear-gradient(135deg, rgba(15,23,42,0.88), rgba(29,78,216,0.58), rgba(148,163,184,0.28))';

const profile = computed(() => userStore.currentUser || {});

const displayName = computed(() => {
  const nickname = editing.value ? form.nickname.trim() : (profile.value.nickname || '');
  return nickname || profile.value.username || '联机玩家';
});

const initials = computed(() => displayName.value.slice(0, 1).toUpperCase() || 'L');
const previewAvatar = computed(() => (editing.value ? form.avatarImage.trim() : '') || profile.value.avatarImage || profile.value.avatar || '');
const previewBackground = computed(() => (editing.value ? form.backgroundImage.trim() : '') || profile.value.backgroundImage || '');
const previewSignature = computed(() => {
  const signature = editing.value ? form.signature.trim() : (profile.value.signature || '');
  return signature || '还没有设置签名，可以在编辑模式里补充一句个人说明。';
});

function syncForm() {
  form.nickname = profile.value.nickname || '';
  form.phone = profile.value.phone || '';
  form.signature = profile.value.signature || '';
  form.avatarImage = profile.value.avatarImage || profile.value.avatar || '';
  form.backgroundImage = profile.value.backgroundImage || '';
}

async function ensureProfileLoaded() {
  if (userStore.currentUser) {
    syncForm();
    return;
  }

  loading.value = true;
  try {
    await userStore.initialize(true);
    syncForm();
  } finally {
    loading.value = false;
  }
}

function startEdit() {
  syncForm();
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
  syncForm();
  formRef.value?.clearValidate();
}

function handleClose() {
  editing.value = false;
  formRef.value?.clearValidate();
  emit('update:modelValue', false);
}

async function saveProfile() {
  if (!formRef.value) {
    return;
  }

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  saving.value = true;
  try {
    const success = await userStore.updateProfile({
      nickname: form.nickname.trim(),
      phone: form.phone.trim(),
      signature: form.signature.trim(),
      avatarImage: form.avatarImage.trim(),
      backgroundImage: form.backgroundImage.trim(),
    });

    if (!success) {
      return;
    }

    editing.value = false;
    syncForm();
    formRef.value.clearValidate();
    ElMessage.success('个人资料已更新');
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) {
      return;
    }

    await ensureProfileLoaded();
  },
  { immediate: true },
);
</script>
