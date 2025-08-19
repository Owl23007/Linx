<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div class="w-full max-w-sm">
            <!-- 拖动区域和顶部操作按钮 -->
            <div class="absolute top-0 left-0 right-0 h-12 flex justify-between items-center px-3 z-10">
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

            <!-- 标题组件 -->
            <Title />


            <!-- 为固定标题腾出空间 -->
            <div class="h-16"></div>

            <!-- 登录/注册表单卡片 -->

            <!-- 自定义 Tab 头部和滑块 -->
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
            <!-- Tab 内容区 -->
            <div class="tab-content">
                <div v-show="activeTab === 'login'">
                    <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="space-y-4">
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
                        <el-form-item>
                            <el-button type="primary" size="small" class="w-full" :loading="loginLoading">
                                登录
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>
                <div v-show="activeTab === 'register'">
                    <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" class="space-y-4">
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
                        <el-form-item>
                            <el-button type="primary" size="small" class="w-full" :loading="registerLoading">
                                注册
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { closeWindow, minimizeWindow } from '@/utils/electron';
import { type FormInstance, type FormRules } from 'element-plus';
import { Close, User, Lock, Minus } from '@element-plus/icons-vue';
import drag from '@/utils/drag';
import Title from './components/title.vue';

const tabs = [
    { label: '登录', name: 'login' },
    { label: '注册', name: 'register' }
];
const activeTab = ref('login');
const tabRefs = ref<any[]>([]);
const tabListRef = ref<HTMLElement | null>(null);
const sliderStyle = ref({ left: '0px', width: '0px' });
const loginLoading = ref(false);
const registerLoading = ref(false);
const dragAreaRef = ref<HTMLElement>();
let dragCleanup: (() => void) | undefined;

onMounted(() => {
    if (dragAreaRef.value) {
        dragCleanup = drag(dragAreaRef.value);
    }
});

onUnmounted(() => {
    if (dragCleanup) {
        dragCleanup();
    }
});


const loginFormRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();

const loginForm = ref({
    username: '',
    password: ''
});

const registerForm = ref({
    username: '',
    password: '',
    confirmPassword: ''
});

// 表单验证规则
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


function updateSlider(idx: number) {
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

function switchTab(tabName: string, idx: number) {
    activeTab.value = tabName;
    updateSlider(idx);
}

onMounted(() => {
    // ...existing code...
    // 初始化滑块位置
    updateSlider(tabs.findIndex(t => t.name === activeTab.value));
});

function handleClose() {
    closeWindow();
}

function handleMinimize() {
    minimizeWindow();
}
</script>


<style scoped lang="less">
.custom-tabs {
    margin-bottom: 24px;

    .tab-list {
        display: flex;
        position: relative;
        background: #f4f6fa;
        border-radius: 8px;
        padding: 4px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);

        .tab-item {
            flex: 1;
            text-align: center;
            padding: 10px 0;
            font-size: 18px;
            font-weight: 500;
            color: #888;
            cursor: pointer;
            border-radius: 6px;
            position: relative;
            z-index: 1;
            transition: color 0.2s;
        }

        .tab-item.active {
            color: #3b82f6;
        }

        .tab-slider {
            position: absolute;
            bottom: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6 60%, #6366f1 100%);
            border-radius: 2px;
            transition: left 0.3s cubic-bezier(.4, 0, .2, 1), width 0.3s cubic-bezier(.4, 0, .2, 1);
            z-index: 0;
        }
    }
}

.tab-content {
    margin-top: 8px;
}

.drag-area {
    user-select: none;

    &:hover {
        background-color: rgba(255, 255, 255, 0.05);
    }

    &:active {
        cursor: move;
    }
}

.window-btn {
    background-color: rgba(255, 255, 255, 0);
    border: 1px solid rgba(255, 255, 255, 0);
    border-radius: 8px;
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    margin-left: 0.5vh;

    &:hover {
        border-color: rgba(255, 255, 255, 0.5);
    }
}

.minimize-btn:hover {
    background-color: rgba(212, 227, 241, 0.525);
    border-color: rgba(255, 255, 255, 0);
}

.close-btn:hover {
    background-color: rgba(255, 0, 0, 0.689);
    color: rgb(255, 255, 255);
}
</style>