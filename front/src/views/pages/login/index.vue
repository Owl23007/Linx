<template>
  <div
    class="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">

    <!-- 拖动区域和顶部操作按钮 -->
    <div v-if="isElectron()" class="fixed top-0 left-0 right-0 h-12 flex justify-between items-center px-3 z-30">
      <div ref="dragAreaRef" class="flex-1 h-full drag-area" />
      <div class="flex">
        <el-button size="small" class="window-btn minimize-btn" @click="handleTest">
          <el-icon :size="16">
            <Setting />
          </el-icon>
        </el-button>
        <el-button size="small" class="window-btn minimize-btn" @click="handleMinimizeWindow">
          <el-icon :size="16">
            <Minus />
          </el-icon>
        </el-button>
        <el-button size="small" class="window-btn close-btn" @click="handleCloseWindow">
          <el-icon :size="16">
            <Close />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 标题图标 -->
    <div v-if="!(isElectron() && activeTab === 'register')"
      class="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
      <TitleLogo :size="isElectron() ? 1 : 1.5" />
    </div>

    <!-- Tab 区域 -->
    <div :class="[
      { 'scale-120 top-40': !isElectron() },
      { 'tab-shift-up': isElectron() && activeTab === 'register' },
      { 'tab-shift-down': isElectron() && activeTab === 'login' }
    ]" class="overflow-hidden w-50 max-w-md absolute top-24 z-10">
      <div class="custom-tabs">
        <div ref="tabListRef" class="tab-list">
          <div v-for="(tab, idx) in tabs" :key="tab.name" :ref="el => { if (el) tabRefs[idx] = el as HTMLElement }"
            :class="['tab-item', { active: activeTab === tab.name }]" @click="switchTab(tab.name, idx)">
            {{ tab.label }}
          </div>
          <div class="tab-slider" :style="sliderStyle" />
        </div>
      </div>
    </div>

    <!-- 表单内容区域 -->
    <div :class="{ 'w-120': !isElectron() }" class="w-70 max-w-sm absolute mt-3 px-4 py-4 overflow-hidden">
      <div class="form-container relative">
        <Transition :name="transitionName" mode="out-in">
          <!-- 登录表单 -->
          <div v-if="activeTab === 'login'" key="login" class="form-content mt-16">
            <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules">
              <el-form-item>
                <el-input v-model="serverUrl" clearable placeholder="输入服务器地址" size="large" class="round-input">
                  <template #prefix>
                    <el-icon>
                      <Server />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <div class="h-2" />
              <el-form-item prop="account">
                <el-input v-model="loginForm.account" clearable placeholder="请输入账号或邮箱" size="large" class="round-input">
                  <template #prefix>
                    <el-icon>
                      <User />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <div class="h-2" />
              <el-form-item prop="password">
                <el-input v-model="loginForm.password" clearable type="password" placeholder="请输入密码" size="large"
                  show-password class="round-input">
                  <template #prefix>
                    <el-icon>
                      <Lock />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </el-form>
          </div>

          <!-- 注册表单 -->
          <div v-else-if="activeTab === 'register'" key="register"
            :class="['form-content mt-18', { 'form-shift-up': isElectron() }]">
            <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules"
              :class="[{ 'register-form': isElectron() }]">
              <el-form-item>
                <el-input v-model="serverUrl" clearable placeholder="输入服务器地址" size="large" class="round-input">
                  <template #prefix>
                    <el-icon>
                      <Server />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item prop="username">
                <el-input v-model="registerForm.username" placeholder="请输入用户名" size="large" class="round-input"
                  clearable>
                  <template #prefix>
                    <el-icon>
                      <User />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item prop="email">
                <el-input v-model="registerForm.email" placeholder="请输入邮箱" size="large" class="round-input" clearable>
                  <template #prefix>
                    <el-icon>
                      <Message />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item prop="password">
                <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" size="large" show-password
                  class="round-input" clearable>
                  <template #prefix>
                    <el-icon>
                      <Lock />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item prop="captchaCode">
                <div class="flex gap-2">
                  <el-input v-model="registerForm.captchaCode" placeholder="输入验证码" size="large"
                    class="round-input flex-1">
                    <template #prefix>
                      <el-icon>
                        <Key />
                      </el-icon>
                    </template>
                  </el-input>

                  <div :class="{ 'w-35': !isElectron() }"
                    class="w-28.5 h-10 bg-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    v-loading="captchaLoading" @click="refreshCaptcha">
                    <img v-if="captchaImage" :src="captchaImage" alt="验证码" class="max-w-full max-h-full">
                    <span v-else class="flex items-center justify-center text-xs text-gray-500">
                      <el-icon :size="16" class="mr-1">
                        <Refresh />
                      </el-icon>
                      获取验证码
                    </span>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </Transition>
      </div>
    </div>

    <!-- 底部按钮区域 -->
    <div :class="{ 'bottom-25 scale-125': !isElectron() }" class="px-4 pb-4 overflow-hidden absolute bottom-0 w-55">
      <el-form-item v-if="activeTab === 'login'" class="mb-4">
        <el-button type="primary" size="large" class="w-full !rounded-lg" :loading="loading" @click="handleLogin">
          登录
        </el-button>
      </el-form-item>
      <el-form-item v-else-if="activeTab === 'register'" class="mb-0">
        <el-button type="primary" size="large" class="w-full !rounded-lg" :loading="loading" @click="handleRegister">
          注册
        </el-button>
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
// ========== 导入依赖 ==========
import type { LoginRequest, RegisterRequest } from '@/models/auth';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/auth';
import { useGlobalStore } from '@/stores/global';
import dragSetup from '@/utils/drag';
import { closeWindow, isElectron, minimizeWindow } from '@/utils/electron';
import TitleLogo from '@/views/components/title-icon.vue';
import { Close, Key, Lock, Message, Minus, Refresh, Setting, User } from '@element-plus/icons-vue';
import { type FormInstance, type FormRules, ElMessage } from 'element-plus';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Server from './components/server-icon.vue';

const router = useRouter();

// ========== 常量定义 ==========
const tabs = [
  { label: '登录', name: 'login' },
  { label: '注册', name: 'register' },
];

// ========== 状态管理 ==========
const authStore = useAuthStore();

// 页面状态
const activeTab = ref<'login' | 'register'>('login');
const loading = ref(false);
const captchaLoading = ref(false);
const error = ref<string>('');
const serverUrl = ref('http://localhost:9080/api/linx'); // 默认服务器地址
const captchaImage = ref<string>('');
const captchaId = ref<string>('');

// 表单数据
const loginForm = ref<LoginRequest>({
  account: '',
  password: ''
});

const registerForm = ref<RegisterRequest>({
  username: '',
  email: '',
  password: '',
  captchaCode: '',
  captchaId: ''
});

// ========== 窗口操作函数 ==========
function handleCloseWindow() {
  closeWindow();
}

function handleMinimizeWindow() {
  minimizeWindow();
}

function setupDragArea(element: HTMLElement) {
  if (isElectron()) {
    return dragSetup(element);
  }

  return null;
}

// ========== 业务逻辑函数 ==========
// Tab 切换
function switchTabLogic(tab: 'login' | 'register') {
  activeTab.value = tab;
  error.value = '';
}

// 验证码相关
async function refreshCaptcha() {
  try {
    captchaLoading.value = true;
    const response = await authService.getCaptcha(serverUrl.value);
    if (response) {
      captchaId.value = response.data.split(':')[0];
      captchaImage.value = response.data.substring(response.data.indexOf(':') + 1);
    }
  } catch (e: any) {
    if (e.message.includes('Network Error')) {
      error.value = '无法连接到服务器，请检查地址是否正确';
      showError(error.value);

      return;
    }

    error.value = '获取验证码失败，请重试:';
    showError(error.value + e);
    // 清除旧的验证码
    captchaImage.value = '';
    captchaId.value = '';
  } finally {
    captchaLoading.value = false;
  }
}

// 登录逻辑
async function performLogin(): Promise<boolean> {
  if (loading.value) return false;

  loading.value = true;
  error.value = '';

  try {
    const res: any = await authStore.login(loginForm.value, serverUrl.value);
    if (res.code == 0) {
      useGlobalStore().setEndpoint(serverUrl.value);

      return true;
    }

    error.value = res.message;
    showError(error.value);

    return false;
  } catch (err: any) {
    error.value = err.message || '登录失败，请重试';
    showError(error.value);

    return false;
  } finally {
    loading.value = false;
  }
}

// 注册逻辑
async function performRegister(): Promise<boolean> {
  if (loading.value) return false;

  loading.value = true;
  error.value = '';

  try {
    if (captchaId.value) {
      registerForm.value.captchaId = captchaId.value;
    }

    const res = await authService.register(registerForm.value, serverUrl.value);
    if (res.code == 0) {
      switchTab('login', 0);

      return true;
    }
    error.value = res.message;
    showError(error.value);
    refreshCaptcha();

    return false;
  } catch (err: any) {
    error.value = err.message || '注册失败，请重试';
    showError(error.value);
    refreshCaptcha();

    return false;
  } finally {
    loading.value = false;
  }
}

// 清理函数
function cleanup() {
  loginForm.value = { account: '', password: '' };
  registerForm.value = { username: '', email: '', password: '', captchaCode: '', captchaId: '' };
  error.value = '';
  captchaImage.value = '';
  captchaId.value = '';
}

// ========== DOM Refs ==========
const tabRefs = ref<HTMLElement[]>([]);
const tabListRef = ref<HTMLElement | null>(null);
const dragAreaRef = ref<HTMLElement>();
const loginFormRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();

// ========== 响应式状态 ==========
const transitionName = ref('slide-left');
const sliderStyle = ref({ left: '0px', width: '0px' });

// ========== 表单验证规则 ==========
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入账号/用户名或邮箱', trigger: 'none' },
    { min: 3, max: 50, message: '账号长度应为 3-50 个字符', trigger: 'none' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'none' },
    { min: 6, max: 20, message: '密码长度应为 6-20 个字符', trigger: 'none' },
  ],
};

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'none' },
    { min: 3, max: 50, message: '账号长度应为 3-50 个字符', trigger: 'none' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'none' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'none' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'none' },
    { min: 6, max: 20, message: '密码长度应为 6-20 个字符', trigger: 'none' },
  ],
  captchaCode: [
    { required: true, message: '请输入验证码', trigger: 'none' }
  ],
};

// ========== UI 交互函数 ==========
function updateSlider(idx: number): void {
  nextTick(() => {
    setTimeout(() => {
      const el = tabRefs.value[idx];
      if (el && tabListRef.value) {
        const parentRect = tabListRef.value.getBoundingClientRect();
        const rect = el.getBoundingClientRect();

        const scaleFactor = !isElectron() ? 1.2 : 1;
        const adjustedLeft = (rect.left - parentRect.left) / scaleFactor;
        const adjustedWidth = rect.width / scaleFactor;

        sliderStyle.value = {
          left: adjustedLeft + 'px',
          width: adjustedWidth + 'px',
        };
      }
    }, 10);
  });
}

function switchTab(tabName: string, idx: number): void {
  const currentIndex = tabs.findIndex(t => t.name === activeTab.value);
  const newIndex = idx;

  if (newIndex > currentIndex) {
    transitionName.value = 'slide-left';
  } else {
    transitionName.value = 'slide-right';
  }

  switchTabLogic(tabName as 'login' | 'register');
  updateSlider(idx);
}

const showError = (message: string) => {
  ElMessage.error({ message, offset: 50, customClass: 'message' });
};

// ========== 事件处理函数 ==========
async function handleLogin(): Promise<void> {
  if (loginFormRef.value) {
    const valid = await loginFormRef.value.validate().catch(() => false);
    if (!valid) return;
  }

  const success = await performLogin();
  if (success) {
    ElMessage.success({ message: '登录成功', offset: 50, customClass: 'message' });
    if (isElectron()) {
      await authService.switchToMainWindow();
    }
    router.push('/main');
  }
}

async function handleTest(): Promise<void> {
  if (isElectron()) {
    await authService.switchToMainWindow();
  }
  router.push('/main');
}

async function handleRegister(): Promise<void> {
  if (registerFormRef.value) {
    const valid = await registerFormRef.value.validate().catch(() => false);
    if (!valid) return;
  }

  const success = await performRegister();
  if (success) {
    ElMessage.success('注册成功，请前往邮箱验证');
  }
}

// ========== 生命周期 ==========
onMounted(async () => {

  // 初始化拖动功能
  if (dragAreaRef.value) {
    const cleanup = setupDragArea(dragAreaRef.value);
    if (cleanup) {
      onUnmounted(cleanup);
    }
  }

  // 初始化滑块位置
  updateSlider(tabs.findIndex(t => t.name === activeTab.value));

  // 设置默认服务器地址
  serverUrl.value = import.meta.env.VITE_DEFAULT_BASE_URL || 'http://localhost:8081';

  // 获取用户列表
  // await getUserList();
});

onUnmounted(() => {
  // 清理数据
  cleanup();
});
</script>

<style scoped lang="less">
// 表单切换动画 - 向左滑动（登录->注册）
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 表单切换动画 - 向右滑动（注册->登录）
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-shift-up {
  transform: translateY(-50px);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 30;
}

/* 注册表单在 Electron 下上移并添加过渡动画 */
.form-shift-up {
  transform: translateY(-32px);
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 25;
}

/* 切换到登录时的回落动画 */
.tab-shift-down {
  transform: translateY(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;
}

::v-deep .register-form .el-form-item {
  margin-bottom: 15px !important;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-left-enter-to,
.slide-left-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.slide-right-enter-to,
.slide-right-leave-from {
  opacity: 1;
  transform: translateX(0);
}

// 表单容器
.form-container {
  position: relative;
  min-height: 200px;
}

.form-content {
  width: 100%;
}

// Tab 样式
.custom-tabs {
  .tab-list {
    display: flex;
    position: relative;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    padding: 0.25rem;

    .tab-item {
      flex: 1;
      text-align: center;
      padding: 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      border-radius: 0.375rem;
      position: relative;
      z-index: 10;
      transition: color 0.2s ease;
      user-select: none;

      &.active {
        color: #ffffff;
      }

      &:hover:not(.active) {
        color: #374151;
      }
    }

    .tab-slider {
      position: absolute;
      top: 0.25rem;
      bottom: 0.25rem;
      background: linear-gradient(to right, #3b82f6, #2563eb);
      border-radius: 0.375rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 5;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }
}

// 拖动区域样式
.drag-area {
  user-select: none;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:active {
    cursor: move;
  }
}

// 窗口控制按钮样式
.window-btn {
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  width: 2rem;
  height: 2rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 0.5vh;

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
  }

  &.minimize-btn:hover {
    background-color: rgba(59, 130, 246, 0.1);
    border-color: transparent;
  }

  &.close-btn:hover {
    background-color: #ef4444;
    color: white;
  }
}
</style>

<style lang="less">
.round-input {
  border-radius: 0.45rem !important;

  .el-input-group__prepend {
    border-radius: 0.45rem;
    border: 0;
    box-shadow: 0 0 0 0px;
  }

  .el-input__wrapper {
    border-radius: 0.45rem;
    border: 0;
    box-shadow: 0 0 0 0px;
  }

  .el-input-group__append {
    border-radius: 0.45rem;
    border: 0;
    box-shadow: 0 0 0 0px;
  }
}

.message {
  width: 70%;
  max-width: 300px;
}
</style>
