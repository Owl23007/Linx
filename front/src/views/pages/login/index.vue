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
      <Title :size="isElectron() ? 1 : 1.5" />
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
            <!-- 自动登录视图 -->
            <div v-if="savedAccounts.length > 0 && showAccountView" class="flex flex-col items-center pt-4">
              <el-avatar :size="100" :src="currentAccount?.avatar_url"
                class="mb-6 shadow-lg border-4 border-white large-avatar">
                {{ currentAccount?.nickname?.charAt(0) }}
              </el-avatar>

              <el-dropdown trigger="click" @command="handleCommand">
                <div
                  class="flex items-center justify-center cursor-pointer text-gray-700 hover:text-blue-600 mb-8 transition-colors w-full relative">
                  <!-- 左侧占位（宽度 = 右侧箭头宽度） -->
                  <span class="w-5"></span>

                  <!-- 居中的文字（真正居中） -->
                  <span class="text-xl font-medium text-center flex-1 truncate px-2">
                    {{ currentAccount?.nickname }}
                  </span>

                  <!-- 右侧箭头 -->
                  <span class="shrink-0 w-5 flex items-center justify-center">
                    <el-icon :size="18" color="currentColor">
                      <ArrowDown />
                    </el-icon>
                  </span>
                </div>

                <!-- Dropdown Menu -->
                <template #dropdown>
                  <el-dropdown-menu class="min-w-[200px]">
                    <el-dropdown-item v-for="account in savedAccounts" :key="account.user_id" :command="account">
                      <div class="flex items-center w-full py-1 group min-w-60">
                        <div class="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                          <el-avatar :size="28" :src="account.avatar_url" class="shrink-0">
                            {{ account.nickname?.charAt(0) }}
                          </el-avatar>
                          <div class="flex flex-col overflow-hidden">
                            <span class="text-sm font-medium truncate">{{ account.nickname }}</span>
                            <span class="text-xs text-gray-400 truncate">{{ account.server_url }}</span>
                          </div>
                        </div>
                        <div
                          class="shrink-0 w-8 h-8 rounded-full transition-opacity opacity-0 group-hover:opacity-100 group-hover:bg-gray-200 cursor-pointer flex items-center justify-center"
                          @click.stop="handleDeleteAccount(account)">
                          <el-icon class="text-gray-400" :size="16">
                            <Close />
                          </el-icon>
                        </div>
                      </div>
                    </el-dropdown-item>
                    <el-dropdown-item divided command="add_account">
                      <div class="flex items-center gap-2 text-blue-500 py-1">
                        <el-icon>
                          <Plus />
                        </el-icon>
                        <span>添加账号</span>
                      </div>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- 常规登录表单 -->
            <div v-else>
              <div v-if="savedAccounts.length > 0" class="mb-4">
                <el-button link type="primary" @click="showAccountView = true" class="px-0!">
                  <el-icon class="mr-1">
                    <ArrowLeft />
                  </el-icon> 返回账号列表
                </el-button>
              </div>

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
                  <el-input v-model="loginForm.account" clearable placeholder="请输入账号或邮箱" size="large"
                    class="round-input">
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
      <el-form-item v-if="activeTab === 'login' && showAccountView" class="mb-4">
        <el-button type="primary" size="large" class="w-full rounded-lg!" :loading="loading"
          @click="handleAccountLogin(currentAccount)">
          登录
        </el-button>
      </el-form-item>
      <el-form-item v-else-if="activeTab === 'login' && !showAccountView" class="mb-4">
        <el-button type="primary" size="large" class="w-full rounded-lg!" :loading="loading" @click="handleLogin">
          登录
        </el-button>
      </el-form-item>
      <el-form-item v-else-if="activeTab === 'register'" class="mb-0">
        <el-button type="primary" size="large" class="w-full rounded-lg!" :loading="loading" @click="handleRegister">
          注册
        </el-button>
      </el-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
// ========== 导入依赖 ==========
import type { LoginRequest, RegisterRequest } from '@/models/auth';
import { getUserInfo } from '@/request/auth';
import authService from '@/services/authService';
import { useAuthStore } from '@/stores/auth';
import { useGlobalStore } from '@/stores/global';
import dragSetup from '@/utils/drag';
import { closeWindow, isElectron, minimizeWindow } from '@/utils/electron';
import icons from '@/views/components/icons';
import { ArrowDown, ArrowLeft, Close, Key, Lock, Message, Minus, Plus, Refresh, Setting, User } from '@element-plus/icons-vue';
import { type FormInstance, type FormRules, ElMessage, ElMessageBox } from 'element-plus';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Server from './components/server-icon.vue';

const { Title } = icons;

const router = useRouter();

// ========== 常量定义 ==========
const tabs = [
  { label: '登录', name: 'login' },
  { label: '注册', name: 'register' },
];

// ========== 状态管理 ==========
const authStore = useAuthStore();

// 页面状态
const savedAccounts = ref<any[]>([]);
const showAccountView = ref(false);
const currentAccount = ref<any>(null);
const activeTab = ref<'login' | 'register'>('login');
const loading = ref(false);
const captchaLoading = ref(false);
const error = ref<string>('');
const serverUrl = ref(''); // 默认服务器地址
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

// ========== 辅助函数 ==========
function formatUrl(url: string): string {
  if (!url) return '';

  let trimmed = url.trim();
  if (!trimmed) return '';

  // 如果已经是完整 URL（含协议），直接用 URL 解析
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      // 如果路径已经是 /api 或 /api/xx，就不再加 /api
      if (!parsed.pathname.startsWith('/api')) {
        parsed.pathname = `/api${parsed.pathname === '/' ? '' : parsed.pathname}`;
      }

      return parsed.toString().replace(/\/+$/, ''); // 移除末尾多余的斜杠
    } catch {
      // 无效 URL，fallback 到简单处理
      return url;
    }
  }

  // 无协议的情况：先补协议，再解析
  const withProtocol = `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.pathname.startsWith('/api')) {
      parsed.pathname = `/api${parsed.pathname === '/' ? '' : parsed.pathname}`;
    }

    return parsed.toString().replace(/\/+$/, '');
  } catch {
    // 仍无效，返回原始
    return url;
  }
}

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
    const formattedUrl = formatUrl(serverUrl.value);
    const response = await authService.getCaptcha(formattedUrl);
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

// 加载已保存的账号
async function loadSavedAccounts() {
  if (isElectron()) {
    try {
      savedAccounts.value = await authService.getSavedAccounts();
      if (savedAccounts.value.length > 0) {
        currentAccount.value = savedAccounts.value[0];
        showAccountView.value = true;
      }
    } catch {
      // 无操作
    }
  }
}

function handleCommand(command: any) {
  if (command === 'add_account') {
    showAccountView.value = false;
  } else {
    currentAccount.value = command;
  }
}

// 点击已保存账号登录
async function handleAccountLogin(account: any) {
  const formattedUrl = formatUrl(account.server_url);
  serverUrl.value = formattedUrl;
  loginForm.value.account = account.username;

  loading.value = true;
  try {
    if (!account.refresh_token) {
      throw new Error('登录凭证不存在');
    }

    // 尝试使用 refreshToken 登录
    const res = await authService.loginWithRefreshToken(account.refresh_token, formattedUrl);

    if (res.code === 0) {
      // 1. 更新 Token
      authStore.token = res.data.accessToken;
      localStorage.setItem('token', res.data.accessToken);

      const newRefreshToken = res.data.refreshToken;
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }

      // 2. 设置 Endpoint
      useGlobalStore().setEndpoint(formattedUrl);

      // 3. 获取用户信息并更新本地存储/数据库
      try {
        const userRes = await getUserInfo();
        if (userRes.code === 0) {
          const userInfo = userRes.data;
          authStore.user = userInfo;
          localStorage.setItem('user', JSON.stringify(userInfo));

          if (isElectron()) {
            await authService.saveAccount({
              server_url: formattedUrl,
              username: userInfo.username,
              nickname: userInfo.nickname || userInfo.username,
              avatar_url: userInfo.avatarImage || '',
              refresh_token: newRefreshToken || account.refresh_token
            });
          }
        }
      } catch {
        showError('获取用户信息失败');
      }

      if (isElectron()) {
        await authService.switchToMainWindow();
      }
      router.push('/main');
    } else {
      ElMessage.warning('登录凭证已过期，请重新输入密码');
      showAccountView.value = false;
      loginForm.value.password = '';
    }
  } catch {
    ElMessage.warning('登录失败');
    showAccountView.value = false;
    loginForm.value.password = '';
  } finally {
    loading.value = false;
  }
}

// 删除已保存账号
async function handleDeleteAccount(account: any) {
  try {
    await ElMessageBox.confirm(
      '确定要删除该账号吗？这将移除本地的数据',
      '删除账号',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await authService.deleteAccount({
      server_url: account.server_url,
      username: account.username
    });
    await loadSavedAccounts();

    // 如果删除的是当前选中的账号，更新选中状态
    if (currentAccount.value?.username === account.username && currentAccount.value?.server_url === account.server_url) {
      if (savedAccounts.value.length > 0) {
        currentAccount.value = savedAccounts.value[0];
      } else {
        showAccountView.value = false;
        currentAccount.value = null;
      }
    }
  } catch {
    // 错误处理
  }
}

// 登录逻辑
async function performLogin(): Promise<boolean> {
  if (loading.value) return false;

  loading.value = true;
  error.value = '';

  try {
    const formattedUrl = formatUrl(serverUrl.value);
    const res: any = await authStore.login(loginForm.value, formattedUrl);
    if (res.code == 0) {
      useGlobalStore().setEndpoint(formattedUrl);
      serverUrl.value = formattedUrl;

      // 获取用户信息并保存账号
      try {
        const userRes = await getUserInfo();
        if (userRes.code === 0 && isElectron()) {
          const userInfo = userRes.data;
          await authService.saveAccount({
            server_url: formattedUrl,
            username: userInfo.username,
            nickname: userInfo.nickname || userInfo.username,
            avatar_url: userInfo.avatarImage || '',
            refresh_token: res.data.refreshToken
          });
        }
      } catch {
        // 无操作
      }

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

    const formattedUrl = formatUrl(serverUrl.value);
    const res = await authService.register(registerForm.value, formattedUrl);
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

  // 加载已保存的账号
  await loadSavedAccounts();

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

:deep(.register-form .el-form-item) {
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

/* 大头像默认文字大小 */
.el-avatar--circle.large-avatar {
  font-size: 2.5rem !important;
}
</style>
