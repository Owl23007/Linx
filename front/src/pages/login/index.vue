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
        <div class=" overflow-hidden w-70 max-w-md absolute top-26 z-10">
            <div class="custom-tabs">
                <div class="tab-list" ref="tabListRef">
                    <div v-for="(tab, idx) in tabs" :key="tab.name"
                        :class="['tab-item', { active: activeTab === tab.name }]" @click="switchTab(tab.name, idx)"
                        ref="el => tabRefs[idx] = el">
                        {{ tab.label }}
                    </div>
                    <div class="tab-slider" :style="sliderStyle"></div>
                </div>
            </div>
        </div>


        <!-- 表单内容区域 -->
        <div class="w-full max-w-sm absolute rounded-xl mt-2 px-4 py-4">
            <div v-show="activeTab === 'login'">
                <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules">
                    <el-form-item prop="username">
                        <el-input v-model="loginForm.username" placeholder="请输入账号" size="large">
                            <template #prefix>
                                <el-icon>
                                    <User />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item prop="password">
                        <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large"
                            show-password>
                            <template #prefix>
                                <el-icon>
                                    <Lock />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                </el-form>
            </div>
            <div v-show="activeTab === 'register'">
                <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules">
                    <el-form-item prop="username">
                        <el-input v-model="registerForm.username" placeholder="请输入账号" size="large">
                            <template #prefix>
                                <el-icon>
                                    <User />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item prop="password">
                        <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" size="large"
                            show-password>
                            <template #prefix>
                                <el-icon>
                                    <Lock />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item prop="confirmPassword">
                        <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码"
                            size="large" show-password>
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

        <!-- 底部按钮区域 -->
        <div class="px-4 pb-4 overflow-hidden absolute bottom-0 w-55">
            <el-form-item v-if="activeTab === 'login'" class="mb-0">
                <el-button type="primary" size="large" class="w-full" :loading="loginLoading">
                    登录
                </el-button>
            </el-form-item>
            <el-form-item v-if="activeTab === 'register'" class="mb-0">
                <el-button type="primary" size="large" class="w-full" :loading="registerLoading">
                    注册
                </el-button>
            </el-form-item>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { type FormInstance, type FormRules } from 'element-plus';
import { Close, User, Lock, Minus } from '@element-plus/icons-vue';
import { closeWindow, minimizeWindow } from '@/utils/electron';
import drag from '@/utils/drag';
import Title from './components/title.vue';

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
    confirmPassword: ''
});

let dragCleanup: (() => void) | undefined; // 拖动清理函数

// ==================== 表单验证 ====================
const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
    if (value !== registerForm.value.password) {
        callback(new Error('两次输入的密码不一致'));
    } else {
        callback();
    }
};

const loginRules: FormRules = {
    username: [
        { required: true, message: '请输入账号', trigger: 'blur' },
        { min: 3, max: 20, message: '账号长度应为 3-20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度应为 6-20 个字符', trigger: 'blur' }
    ]
};

const registerRules: FormRules = {
    username: [
        { required: true, message: '请输入账号', trigger: 'blur' },
        { min: 3, max: 20, message: '账号长度应为 3-20 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码长度应为 6-20 个字符', trigger: 'blur' }
    ],
    confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
    ]
};

// ==================== 事件处理 ====================
// Tab相关方法
function updateSlider(idx: number): void {
    nextTick(() => {
        const el = tabRefs.value[idx];
        if (el && tabListRef.value) {
            const parentRect = tabListRef.value.getBoundingClientRect();
            const rect = el.getBoundingClientRect();
            sliderStyle.value = {
                left: rect.left - parentRect.left + 'px',
                width: rect.width + 'px'
            };
        }
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

// ==================== 生命周期钩子 ====================
onMounted(() => {
    // 初始化拖动功能
    if (dragAreaRef.value) {
        dragCleanup = drag(dragAreaRef.value);
    }

    // 初始化滑块位置
    updateSlider(tabs.findIndex(t => t.name === activeTab.value));
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
                color: #2563eb;
            }

            &:hover:not(.active) {
                color: #374151;
            }
        }

        .tab-slider {
            position: absolute;
            bottom: 0.25rem;
            height: 0.25rem;
            background: linear-gradient(to right, #3b82f6, #2563eb);
            border-radius: 9999px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 0;
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