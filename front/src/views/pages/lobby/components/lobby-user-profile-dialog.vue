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
              <el-button round type="primary" :loading="saving" :disabled="uploadingImage" @click="saveProfile">保存修改</el-button>
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

              <el-form-item label="头像" class="sm:col-span-2">
                <div class="w-full space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <el-button plain :loading="avatarUploading || cropSubmitting" @click="openAvatarFilePicker">上传头像</el-button>
                    <span class="text-xs text-slate-500">支持 JPG/PNG/WEBP/GIF，最大 2MB</span>
                  </div>
                  <p class="text-xs text-slate-500">图片会先裁剪后上传，URL 对用户不可见。</p>
                  <input
                    ref="avatarFileInputRef"
                    type="file"
                    class="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    @change="handleAvatarFileChange"
                  >
                </div>
              </el-form-item>

              <el-form-item label="背景图" class="sm:col-span-2">
                <div class="w-full space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <el-button plain :loading="backgroundUploading || cropSubmitting" @click="openBackgroundFilePicker">上传背景</el-button>
                    <span class="text-xs text-slate-500">支持 JPG/PNG/WEBP/GIF，最大 5MB</span>
                  </div>
                  <p class="text-xs text-slate-500">背景图采用 3:1 裁剪，上传后自动保存到资料。</p>
                  <input
                    ref="backgroundFileInputRef"
                    type="file"
                    class="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    @change="handleBackgroundFileChange"
                  >
                </div>
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

  <el-dialog
    v-model="cropDialogVisible"
    width="min(92vw, 760px)"
    append-to-body
    destroy-on-close
    title="裁剪图片"
    @closed="handleCropDialogClosed"
  >
    <div class="space-y-4">
      <div class="rounded-2xl border border-slate-200 bg-slate-950/90 p-3">
        <div
          ref="cropViewportRef"
          class="relative mx-auto overflow-hidden rounded-xl bg-slate-900"
          :class="cropMode === 'avatar' ? 'h-[320px] w-[320px] max-w-full' : 'h-[220px] w-full max-w-[660px]'"
          @mousedown="handleCropPointerDown"
        >
          <img
            v-if="cropImageUrl"
            ref="cropImageRef"
            :src="cropImageUrl"
            class="pointer-events-none absolute max-w-none select-none"
            :style="cropImageStyle"
            @load="handleCropImageLoaded"
          >
          <div class="pointer-events-none absolute inset-0 border border-white/60" />
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="w-10 shrink-0 text-sm text-slate-500">缩放</span>
        <el-slider v-model="cropZoom" :min="1" :max="3" :step="0.01" @input="handleCropZoomChange" />
        <el-button plain @click="resetCropTransform">重置</el-button>
      </div>

      <p class="text-xs text-slate-500">
        拖拽图片调整位置，头像按 1:1 裁剪，背景图按 3:1 裁剪。
      </p>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <el-button @click="cropDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="cropSubmitting" @click="confirmCropAndUpload">裁剪并上传</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { computed, nextTick, onUnmounted, reactive, ref, watch } from 'vue';
import { useUserStore } from '@/stores/user';

type ProfileForm = {
  nickname: string;
  phone: string;
  signature: string;
  avatarImage: string;
  backgroundImage: string;
};

type CropMode = 'avatar' | 'background';

const AVATAR_CROP_SIZE = 512;
const BACKGROUND_CROP_WIDTH = 1500;
const BACKGROUND_CROP_HEIGHT = 500;

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
const avatarUploading = ref(false);
const backgroundUploading = ref(false);
const avatarFileInputRef = ref<HTMLInputElement>();
const backgroundFileInputRef = ref<HTMLInputElement>();
const formRef = ref<FormInstance>();

const cropDialogVisible = ref(false);
const cropSubmitting = ref(false);
const cropMode = ref<CropMode | null>(null);
const cropSourceFile = ref<File | null>(null);
const cropImageUrl = ref('');
const cropImageRef = ref<HTMLImageElement>();
const cropViewportRef = ref<HTMLElement>();
const cropViewportWidth = ref(0);
const cropViewportHeight = ref(0);
const cropNaturalWidth = ref(0);
const cropNaturalHeight = ref(0);
const cropZoom = ref(1);
const cropOffsetX = ref(0);
const cropOffsetY = ref(0);

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
const uploadingImage = computed(() => avatarUploading.value || backgroundUploading.value || cropSubmitting.value);

const cropBaseScale = computed(() => {
  if (!cropNaturalWidth.value || !cropNaturalHeight.value || !cropViewportWidth.value || !cropViewportHeight.value) {
    return 1;
  }

  return Math.max(
    cropViewportWidth.value / cropNaturalWidth.value,
    cropViewportHeight.value / cropNaturalHeight.value,
  );
});

const cropScale = computed(() => cropBaseScale.value * cropZoom.value);
const cropDisplayWidth = computed(() => cropNaturalWidth.value * cropScale.value);
const cropDisplayHeight = computed(() => cropNaturalHeight.value * cropScale.value);
const cropImageStyle = computed(() => {
  if (!cropNaturalWidth.value || !cropNaturalHeight.value || !cropViewportWidth.value || !cropViewportHeight.value) {
    return { display: 'none' };
  }

  const left = (cropViewportWidth.value - cropDisplayWidth.value) / 2 + cropOffsetX.value;
  const top = (cropViewportHeight.value - cropDisplayHeight.value) / 2 + cropOffsetY.value;

  return {
    width: `${cropDisplayWidth.value}px`,
    height: `${cropDisplayHeight.value}px`,
    left: `${left}px`,
    top: `${top}px`,
  };
});

let cropDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;

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

function openAvatarFilePicker() {
  avatarFileInputRef.value?.click();
}

function openBackgroundFilePicker() {
  backgroundFileInputRef.value?.click();
}

function clearInputFile(input?: HTMLInputElement) {
  if (input) {
    input.value = '';
  }
}

function cleanupCropImageUrl() {
  if (cropImageUrl.value) {
    URL.revokeObjectURL(cropImageUrl.value);
    cropImageUrl.value = '';
  }
}

function resetCropTransform() {
  cropZoom.value = 1;
  cropOffsetX.value = 0;
  cropOffsetY.value = 0;
  clampCropOffset();
}

function syncCropViewportSize() {
  if (!cropViewportRef.value) {
    return;
  }

  cropViewportWidth.value = cropViewportRef.value.clientWidth;
  cropViewportHeight.value = cropViewportRef.value.clientHeight;
}

function clampCropOffset() {
  if (!cropViewportWidth.value || !cropViewportHeight.value) {
    return;
  }

  const maxOffsetX = Math.max(0, (cropDisplayWidth.value - cropViewportWidth.value) / 2);
  const maxOffsetY = Math.max(0, (cropDisplayHeight.value - cropViewportHeight.value) / 2);

  cropOffsetX.value = Math.min(maxOffsetX, Math.max(-maxOffsetX, cropOffsetX.value));
  cropOffsetY.value = Math.min(maxOffsetY, Math.max(-maxOffsetY, cropOffsetY.value));
}

function handleCropZoomChange() {
  clampCropOffset();
}

function stopCropDragging() {
  if (!cropDragging) {
    return;
  }

  cropDragging = false;
  window.removeEventListener('mousemove', handleCropPointerMove);
  window.removeEventListener('mouseup', stopCropDragging);
}

function handleCropPointerDown(event: MouseEvent) {
  if (!cropNaturalWidth.value || !cropNaturalHeight.value) {
    return;
  }

  cropDragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragOffsetX = cropOffsetX.value;
  dragOffsetY = cropOffsetY.value;

  window.addEventListener('mousemove', handleCropPointerMove);
  window.addEventListener('mouseup', stopCropDragging);
  event.preventDefault();
}

function handleCropPointerMove(event: MouseEvent) {
  if (!cropDragging) {
    return;
  }

  cropOffsetX.value = dragOffsetX + event.clientX - dragStartX;
  cropOffsetY.value = dragOffsetY + event.clientY - dragStartY;
  clampCropOffset();
}

function openCropDialog(file: File, mode: CropMode) {
  cleanupCropImageUrl();
  cropMode.value = mode;
  cropSourceFile.value = file;
  cropImageUrl.value = URL.createObjectURL(file);
  cropNaturalWidth.value = 0;
  cropNaturalHeight.value = 0;
  cropViewportWidth.value = 0;
  cropViewportHeight.value = 0;
  resetCropTransform();
  cropDialogVisible.value = true;
}

function handleCropImageLoaded() {
  const img = cropImageRef.value;
  if (!img) {
    return;
  }

  cropNaturalWidth.value = img.naturalWidth;
  cropNaturalHeight.value = img.naturalHeight;

  nextTick(() => {
    syncCropViewportSize();
    resetCropTransform();
  });
}

function resolveFileExtensionByType(contentType: string): string {
  if (contentType === 'image/jpeg') {
    return 'jpg';
  }

  if (contentType === 'image/png') {
    return 'png';
  }

  if (contentType === 'image/webp') {
    return 'webp';
  }

  if (contentType === 'image/gif') {
    return 'gif';
  }

  return 'png';
}

async function buildCroppedFile(): Promise<File | null> {
  if (!cropMode.value || !cropSourceFile.value || !cropImageRef.value) {
    return null;
  }

  if (!cropViewportWidth.value || !cropViewportHeight.value || !cropDisplayWidth.value || !cropDisplayHeight.value || !cropScale.value) {
    return null;
  }

  const outputWidth = cropMode.value === 'avatar' ? AVATAR_CROP_SIZE : BACKGROUND_CROP_WIDTH;
  const outputHeight = cropMode.value === 'avatar' ? AVATAR_CROP_SIZE : BACKGROUND_CROP_HEIGHT;
  const imageLeft = (cropViewportWidth.value - cropDisplayWidth.value) / 2 + cropOffsetX.value;
  const imageTop = (cropViewportHeight.value - cropDisplayHeight.value) / 2 + cropOffsetY.value;
  const sourceX = Math.max(0, (0 - imageLeft) / cropScale.value);
  const sourceY = Math.max(0, (0 - imageTop) / cropScale.value);
  const sourceWidth = Math.min(cropNaturalWidth.value, cropViewportWidth.value / cropScale.value);
  const sourceHeight = Math.min(cropNaturalHeight.value, cropViewportHeight.value / cropScale.value);

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    cropImageRef.value,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  const fileType = cropSourceFile.value.type.startsWith('image/') ? cropSourceFile.value.type : 'image/png';
  const extension = resolveFileExtensionByType(fileType);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), fileType, 0.92);
  });

  if (!blob) {
    return null;
  }

  return new File([blob], `${cropMode.value}-${Date.now()}.${extension}`, { type: fileType });
}

async function confirmCropAndUpload() {
  if (!cropMode.value || !cropSourceFile.value) {
    return;
  }

  cropSubmitting.value = true;
  try {
    const croppedFile = await buildCroppedFile();
    if (!croppedFile) {
      ElMessage.error('裁剪失败，请重新选择图片');

      return;
    }

    if (cropMode.value === 'avatar') {
      avatarUploading.value = true;
      try {
        const uploadedUrl = await userStore.uploadAvatar(croppedFile);
        if (uploadedUrl) {
          form.avatarImage = uploadedUrl;
        }
      } finally {
        avatarUploading.value = false;
      }
    } else {
      backgroundUploading.value = true;
      try {
        const uploadedUrl = await userStore.uploadBackground(croppedFile);
        if (uploadedUrl) {
          form.backgroundImage = uploadedUrl;
        }
      } finally {
        backgroundUploading.value = false;
      }
    }

    cropDialogVisible.value = false;
  } finally {
    cropSubmitting.value = false;
  }
}

function handleCropDialogClosed() {
  stopCropDragging();
  cleanupCropImageUrl();
  cropMode.value = null;
  cropSourceFile.value = null;
  cropZoom.value = 1;
  cropOffsetX.value = 0;
  cropOffsetY.value = 0;
  cropNaturalWidth.value = 0;
  cropNaturalHeight.value = 0;
  cropViewportWidth.value = 0;
  cropViewportHeight.value = 0;
}

async function handleAvatarFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  clearInputFile(input);

  if (!file) {
    return;
  }

  openCropDialog(file, 'avatar');
}

async function handleBackgroundFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  clearInputFile(input);

  if (!file) {
    return;
  }

  openCropDialog(file, 'background');
}

function handleClose() {
  editing.value = false;
  cropDialogVisible.value = false;
  formRef.value?.clearValidate();
  emit('update:modelValue', false);
}

async function saveProfile() {
  if (uploadingImage.value) {
    ElMessage.warning('图片上传中，请稍后再保存');

    return;
  }

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

watch(cropDialogVisible, (visible) => {
  if (!visible) {
    return;
  }

  nextTick(() => {
    syncCropViewportSize();
    clampCropOffset();
  });
});

onUnmounted(() => {
  stopCropDragging();
  cleanupCropImageUrl();
});
</script>
