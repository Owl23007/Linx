<template>
    <div
        class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">

        <!-- 拖动区域和顶部操作按钮 -->
        <div v-if="appVM.isElectron.value"
            class="fixed top-0 left-0 right-0 h-12 flex justify-between items-center px-3 z-30">
            <div ref="dragAreaRef" class="flex-1 h-full drag-area" />
            <div class="flex">
                <el-button size="small" class="window-btn minimize-btn">
                    <el-icon :size="16">
                        <Setting />
                    </el-icon>
                </el-button>
                <el-button size="small" class="window-btn minimize-btn" @click="appVM.minimizeWindow()">
                    <el-icon :size="16">
                        <Minus />
                    </el-icon>
                </el-button>
                <el-button size="small" class="window-btn close-btn" @click="appVM.closeWindow()">
                    <el-icon :size="16">
                        <Close />
                    </el-icon>
                </el-button>
            </div>
        </div>

        <!-- 标题图标 -->
        <div class="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
            <TitleIcon :size="appVM.isElectron.value ? '1' : '1.5'" />
        </div>

        <!-- Tab 区域 -->
        <div :class="{ 'scale-120 top-40': !appVM.isElectron.value }"
            class="overflow-hidden w-50 max-w-md absolute top-24 z-10">
            <div class="custom-tabs">
                <div ref="tabListRef" class="tab-list">
                    <div v-for="(tab, idx) in tabs" :key="tab.name"
                        :ref="el => { if (el) tabRefs[idx] = el as HTMLElement }"
                        :class="['tab-item', { active: loginVM.activeTab.value === tab.name }]"
                        @click="switchTab(tab.name, idx)">
                        {{ tab.label }}
                    </div>
                    <div class="tab-slider" :style="sliderStyle" />
                </div>
            </div>
        </div>

        <!-- 表单内容区域 -->
        <div :class="{ 'w-120': !appVM.isElectron.value }"
            class="w-70 max-w-sm absolute mt-3 px-4 py-4 overflow-hidden">
            <div class="form-container relative">
                <Transition :name="transitionName" mode="out-in">
                    <!-- 登录表单 -->
                    <div v-if="loginVM.activeTab.value === 'login'" key="login" class="form-content mt-16">
                        <el-form ref="loginFormRef" :model="loginVM.loginForm.value" :rules="loginRules">
                            <el-form-item>
                                <el-input v-model="loginVM.serverUrl.value" clearable placeholder="输入服务器地址" size="large"
                                    class="round-input">
                                    <template #prefix>
                                        <el-icon>
                                            <Server />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <div class="h-2" />
                            <el-form-item prop="username">
                                <el-input v-model="loginVM.loginForm.value.username" clearable placeholder="请输入账号或邮箱"
                                    size="large" class="round-input">
                                    <template #prefix>
                                        <el-icon>
                                            <User />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <div class="h-2" />
                            <el-form-item prop="password">
                                <el-input v-model="loginVM.loginForm.value.password" clearable type="password"
                                    placeholder="请输入密码" size="large" show-password class="round-input">
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
                    <div v-else-if="loginVM.activeTab.value === 'register'" key="register" class="form-content mt-18">
                        <el-form ref="registerFormRef" :model="loginVM.registerForm.value" :rules="registerRules">
                            <el-form-item>
                                <el-input v-model="loginVM.serverUrl.value" clearable placeholder="输入服务器地址" size="large"
                                    class="round-input">
                                    <template #prefix>
                                        <el-icon>
                                            <ServerIcon />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item prop="username">
                                <el-input v-model="loginVM.registerForm.value.username" placeholder="请输入邮箱" size="large"
                                    class="round-input" clearable>
                                    <template #prefix>
                                        <el-icon>
                                            <User />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item prop="password">
                                <el-input v-model="loginVM.registerForm.value.password" type="password"
                                    placeholder="请输入密码" size="large" show-password class="round-input" clearable>
                                    <template #prefix>
                                        <el-icon>
                                            <Lock />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </el-form-item>
                            <el-form-item prop="captchaCode">
                                <div class="flex gap-2">
                                    <el-input v-model="loginVM.registerForm.value.captchaCode" placeholder="输入验证码"
                                        size="large" class="round-input flex-1">
                                        <template #prefix>
                                            <el-icon>
                                                <Key />
                                            </el-icon>
                                        </template>
                                    </el-input>
                                    <div :class="{ 'w-35': !appVM.isElectron.value }"
                                        class="w-28.5 h-10 bg-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                                        @click="loginVM.refreshCaptcha">
                                        <img v-if="loginVM.captchaImage.value" :src="loginVM.captchaImage.value"
                                            alt="验证码" class="max-w-full max-h-full">
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

                <!-- 错误提示 -->
                <div v-if="loginVM.error.value" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p class="text-red-600 text-sm">{{ loginVM.error.value }}</p>
                </div>
            </div>
        </div>

        <!-- 底部按钮区域 -->
        <div :class="{ 'bottom-25 scale-125': !appVM.isElectron.value }"
            class="px-4 pb-4 overflow-hidden absolute bottom-0 w-55">
            <el-form-item v-if="loginVM.activeTab.value === 'login'" class="mb-4">
                <el-button type="primary" size="large" class="w-full !rounded-lg" :loading="loginVM.loading.value"
                    @click="handleLogin">
                    登录
                </el-button>
            </el-form-item>
            <el-form-item v-else-if="loginVM.activeTab.value === 'register'" class="mb-0">
                <el-button type="primary" size="large" class="w-full !rounded-lg" :loading="loginVM.loading.value"
                    @click="handleRegister">
                    注册
                </el-button>
            </el-form-item>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Close, Key, Lock, Minus, Refresh, Setting, User } from '@element-plus/icons-vue';
import { type FormInstance, type FormRules, ElMessage } from 'element-plus';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Server from './components/server-icon.vue';
import TitleIcon from './components/title-icon.vue';

// 导入 ViewModels
import { AppViewModelImpl } from '@/viewmodels/app.vm';
import { LoginViewModelImpl } from '@/viewmodels/login.vm';

// 创建 ViewModel 实例
const loginVM = new LoginViewModelImpl();
const appVM = new AppViewModelImpl();
const router = useRouter();

// 常量定义
const tabs = [
  { label: '登录', name: 'login' },
  { label: '注册', name: 'register' },
];// DOM refs
const tabRefs = ref<HTMLElement[]>([]);
const tabListRef = ref<HTMLElement | null>(null);
const dragAreaRef = ref<HTMLElement>();
const loginFormRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();

// 状态
const transitionName = ref('slide-left');
const sliderStyle = ref({ left: '0px', width: '0px' });

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, trigger: 'none' },
    { min: 3, max: 50, message: '账号长度应为 3-50 个字符', trigger: 'none' },
  ],
  password: [
    { required: true, trigger: 'none' },
    { min: 6, max: 20, message: '密码长度应为 6-20 个字符', trigger: 'none' },
  ],
};

const registerRules: FormRules = {
  username: [
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

// 事件处理函数
function updateSlider(idx: number): void {
  nextTick(() => {
    setTimeout(() => {
      const el = tabRefs.value[idx];
      if (el && tabListRef.value) {
        const parentRect = tabListRef.value.getBoundingClientRect();
        const rect = el.getBoundingClientRect();

        const scaleFactor = !appVM.isElectron.value ? 1.2 : 1;
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
  const currentIndex = tabs.findIndex(t => t.name === loginVM.activeTab.value);
  const newIndex = idx;

  if (newIndex > currentIndex) {
    transitionName.value = 'slide-left';
  } else {
    transitionName.value = 'slide-right';
  }

  loginVM.switchTab(tabName as 'login' | 'register');
  updateSlider(idx);
}

// 处理登录
async function handleLogin(): Promise<void> {
  if (loginFormRef.value) {
    const valid = await loginFormRef.value.validate().catch(() => false);
    if (!valid) return;
  }

  const success = await loginVM.login();
  if (success) {
    ElMessage.success('登录成功');
    router.push('/main-panel');
  }
}

// 处理注册
async function handleRegister(): Promise<void> {
  if (registerFormRef.value) {
    const valid = await registerFormRef.value.validate().catch(() => false);
    if (!valid) return;
  }

  const success = await loginVM.register();
  if (success) {
    ElMessage.success('注册成功，请登录');
  }
}

// 生命周期
onMounted(() => {
  // 初始化拖动功能
  if (dragAreaRef.value) {
    const cleanup = appVM.setupDrag(dragAreaRef.value);
    if (cleanup) {
      // 保存清理函数，在组件卸载时调用
      onUnmounted(cleanup);
    }
  }

  // 初始化滑块位置
  updateSlider(tabs.findIndex(t => t.name === loginVM.activeTab.value));
});

onUnmounted(() => {
  // 清理 ViewModels
  loginVM.dispose();
  appVM.dispose();
});
</script>

<style scoped lang="less">
// 表单切换动画 - 向左滑动（登录->注册）
.slide-left-enter-active,
.slide-left-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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

// 表单切换动画 - 向右滑动（注册->登录）
.slide-right-enter-active,
.slide-right-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
</style>
