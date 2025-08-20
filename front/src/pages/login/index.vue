<template>
    <div
        class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
        <!-- 拖动区域和顶部操作按钮 - 固定到屏幕右上角 -->
        <div class="fixed top-0 left-0 right-0 h-12 flex justify-between items-center px-3 z-30">
            <!-- 左侧拖动区域 -->
            <div ref="dragAreaRef" class="flex-1 h-full drag-area"></div>
            <!-- 右侧操作按钮 -->
            <div class="flex">
                <el-button size="small" @click="handleMinimize" class="window-btn minimize-btn">
                    <el-icon :size="16">
                        <Minus />
                    </el-icon>
                </el-button>
                <el-button size="small" @click="handleClose" class="window-btn close-btn">
                    <el-icon :size="16">
                        <Close />
                    </el-icon>
                </el-button>
            </div>
        </div>

        <Title />

        <!-- Tab 区域 -->
        <div class=" overflow-hidden w-50 max-w-md absolute top-27 z-10">
            <div class="custom-tabs">
                <div class="tab-list" ref="tabListRef">
                    <div v-for="(tab, idx) in tabs" :key="tab.name"
                        :class="['tab-item', { active: activeTab === tab.name }]" @click="switchTab(tab.name, idx)"
                        :ref="(el) => { if (el) tabRefs[idx] = el as HTMLElement }">
                        {{ tab.label }}
                    </div>
                    <div class="tab-slider" :style="sliderStyle"></div>
                </div>
            </div>
        </div>


        <!-- 表单内容区域 -->
        <div class="w-70 max-w-sm absolute mt-5 px-4 py-4 overflow-hidden">
            <div v-show="activeTab === 'login'" class="mt-6">
                <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules">
                    <el-form-item prop="username">
                        <el-input v-model="loginForm.username" clearable placeholder="请输入账号或邮箱" size="large"
                            class="round-input">
                            <template #prefix>
                                <el-icon>
                                    <User />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <div class="h-4" />
                    <el-form-item prop="password">
                        <el-input v-model="loginForm.password" clearable type="password" placeholder="请输入密码"
                            size="large" show-password class="round-input">
                            <template #prefix>
                                <el-icon>
                                    <Lock />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                </el-form>
            </div>
            <div v-show="activeTab === 'register'" class="mt-8">
                <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules">
                    <el-form-item prop="username">
                        <el-input v-model="registerForm.username" placeholder="请输入邮箱" size="large" class="round-input"
                            clearable>
                            <template #prefix>
                                <el-icon>
                                    <User />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item prop="password">
                        <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" size="large"
                            show-password class="round-input" clearable>
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
                            <div class="w-28.5 h-10 bg-white rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                                @click="refreshCaptcha">
                                <img v-if="captchaImage" :src="captchaImage" alt="验证码" class="max-w-full max-h-full " />
                                <span v-else class="flex items-center justify-center text-xs text-gray-500">
                                    <el-icon :size="16" class="mr-1">
                                        <Refresh />
                                    </el-icon>
                                    刷新验证码
                                </span>
                            </div>
                        </div>
                    </el-form-item>
                </el-form>
            </div>
        </div>

        <!-- 底部按钮区域 -->
        <div class="px-4 pb-14 overflow-hidden absolute bottom-0 w-55">
            <el-form-item v-if="activeTab === 'login'" class="mb-0">
                <el-button type="primary" size="large" class="w-full !rounded-lg" :loading="loginLoading">
                    登录
                </el-button>
            </el-form-item>
            <el-form-item v-if="activeTab === 'register'" class="mb-0">
                <el-button type="primary" size="large" class="w-full !rounded-lg" :loading="registerLoading">
                    注册
                </el-button>
            </el-form-item>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { type FormInstance, type FormRules } from 'element-plus';
import { Close, User, Lock, Minus, Key, Refresh } from '@element-plus/icons-vue';
import { closeWindow, minimizeWindow } from '@/utils/electron';
import drag from '@/utils/drag';
import Title from './components/title.vue';
import { getCaptcha } from '@/api/auth';

// ==================== 常量定义 ====================
const tabs = [
    { label: '登录', name: 'login' },
    { label: '注册', name: 'register' }
];

// ==================== Refs 定义 ====================
// DOM元素refs
const tabRefs = ref<HTMLElement[]>([]);
const tabListRef = ref<HTMLElement | null>(null);
const dragAreaRef = ref<HTMLElement>();
const loginFormRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();

// 状态refs
const activeTab = ref('login');
const sliderStyle = ref({ left: '0px', width: '0px' });
const loginLoading = ref(false);
const registerLoading = ref(false);

// 表单数据refs
const loginForm = ref({
    username: '',
    password: ''
});

const registerForm = ref({
    username: '',
    password: '',
    captchaCode: '',
    captchaId: ''
});

// 验证码相关状态
const captchaImage = ref<string>('');
const captchaLoading = ref(false);

let dragCleanup: (() => void) | undefined; // 拖动清理函数

// ==================== 表单验证 ====================
const loginRules: FormRules = {
    username: [
        { required: true, trigger: 'none' },
        { min: 3, max: 20, message: '账号长度应为 3-20 个字符', trigger: 'none' }
    ],
    password: [
        { required: true, trigger: 'none' },
        { min: 6, max: 20, message: '请输入正确的密码', trigger: 'none' }
    ]
};

const registerRules: FormRules = {
    username: [
        { required: true, message: '请输入账号', trigger: 'none' },
        { min: 3, max: 20, message: '账号长度应为 3-20 个字符', trigger: 'none' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'none' },
        { min: 6, max: 20, message: '密码长度应为 6-20 个字符', trigger: 'none' }
    ],
    captchaCode: [
        { required: true, message: '请输入验证码', trigger: 'none' },
    ]
};

// ==================== 事件处理 ====================
// Tab相关方法
function updateSlider(idx: number): void {
    nextTick(() => {
        setTimeout(() => {
            const el = tabRefs.value[idx];
            if (el && tabListRef.value) {
                const parentRect = tabListRef.value.getBoundingClientRect();
                const rect = el.getBoundingClientRect();
                sliderStyle.value = {
                    left: rect.left - parentRect.left + 'px',
                    width: rect.width + 'px'
                };
            }
        }, 10);
    });
}

function switchTab(tabName: string, idx: number): void {
    activeTab.value = tabName;
    updateSlider(idx);
}

// 窗口控制方法
function handleClose(): void {
    closeWindow();
}

function handleMinimize(): void {
    minimizeWindow();
}

// 验证码相关方法
async function refreshCaptcha(): Promise<void> {
    try {
        captchaLoading.value = true;
        const response = await getCaptcha();
        if (response.code === 0 && response.data) {
            const dataStr = response.data as string;
            const [captchaId, ...imageDataParts] = dataStr.split(':');
            const imageData = imageDataParts.join(':');
            captchaImage.value = imageData;
            registerForm.value.captchaId = captchaId;
        }
    } catch (error) {
        console.error('获取验证码失败:', error);
    } finally {
        captchaLoading.value = false;
    }
}

// ==================== 生命周期钩子 ====================
onMounted(() => {
    // 初始化拖动功能
    if (dragAreaRef.value) {
        dragCleanup = drag(dragAreaRef.value);
    }

    // 初始化滑块位置
    updateSlider(tabs.findIndex(t => t.name === activeTab.value));

    // 获取验证码
    refreshCaptcha();
});

onUnmounted(() => {
    // 清理拖动事件监听器
    if (dragCleanup) {
        dragCleanup();
    }
});
</script>


<style scoped lang="less">
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