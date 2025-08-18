<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <!-- 关闭按钮 -->
        <el-button @click="handleClose" circle size="large" class="absolute top-4 right-4 z-10" type="danger"
            :icon="Close" />

        <!-- 登录卡片 -->
        <el-card class="w-full max-w-md shadow-2xl border-0">
            <template #header>
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-gray-800 mb-2">Let's Talk</h1>
                    <p class="text-gray-600 text-sm">欢迎使用聊天应用</p>
                </div>
            </template>

            <!-- 选项卡 -->
            <el-tabs v-model="activeTab" class="login-tabs" @tab-change="handleTabChange">
                <el-tab-pane label="登录" name="login">
                    <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="space-y-4"
                        @submit.prevent="handleLogin">
                        <el-form-item prop="username">
                            <el-input v-model="loginForm.username" placeholder="请输入账号" size="large" :prefix-icon="User"
                                clearable />
                        </el-form-item>

                        <el-form-item prop="password">
                            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large"
                                :prefix-icon="Lock" show-password clearable />
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" size="large" class="w-full" :loading="loginLoading"
                                @click="handleLogin">
                                {{ loginLoading ? '登录中...' : '登录' }}
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>

                <el-tab-pane label="注册" name="register">
                    <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" class="space-y-4"
                        @submit.prevent="handleRegister">
                        <el-form-item prop="username">
                            <el-input v-model="registerForm.username" placeholder="请输入账号" size="large"
                                :prefix-icon="User" clearable />
                        </el-form-item>

                        <el-form-item prop="password">
                            <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" size="large"
                                :prefix-icon="Lock" show-password clearable />
                        </el-form-item>

                        <el-form-item prop="confirmPassword">
                            <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码"
                                size="large" :prefix-icon="Lock" show-password clearable />
                        </el-form-item>

                        <el-form-item>
                            <el-button type="primary" size="large" class="w-full" :loading="registerLoading"
                                @click="handleRegister">
                                {{ registerLoading ? '注册中...' : '注册' }}
                            </el-button>
                        </el-form-item>
                    </el-form>
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { closeWindow } from '@/utils/electron';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock, Close } from '@element-plus/icons-vue';

const router = useRouter();
const activeTab = ref('login');
const loginLoading = ref(false);
const registerLoading = ref(false);

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

function handleTabChange(tabName: string) {
    activeTab.value = tabName;
}

function handleClose() {
    closeWindow();
}

async function handleLogin() {
    if (!loginFormRef.value) return;

    const isValid = await loginFormRef.value.validate().catch(() => false);
    if (!isValid) return;

    loginLoading.value = true;

    try {
        // 模拟登录API调用
        await new Promise(resolve => setTimeout(resolve, 1000));

        // TODO: 替换为实际登录API
        if (loginForm.value.username && loginForm.value.password) {
            ElMessage.success('登录成功！');
            // 登录成功后跳转
            router.push('/main');
        }
    } catch (error) {
        ElMessage.error('登录失败，请重试');
    } finally {
        loginLoading.value = false;
    }
}

async function handleRegister() {
    if (!registerFormRef.value) return;

    const isValid = await registerFormRef.value.validate().catch(() => false);
    if (!isValid) return;

    registerLoading.value = true;

    try {
        // 模拟注册API调用
        await new Promise(resolve => setTimeout(resolve, 1000));

        // TODO: 替换为实际注册API
        if (registerForm.value.username && registerForm.value.password) {
            ElMessage.success('注册成功！');
            // 注册成功后跳转
            router.push('/main');
        }
    } catch (error) {
        ElMessage.error('注册失败，请重试');
    } finally {
        registerLoading.value = false;
    }
}
</script>


<style scoped lang="less">
// Element Plus 选项卡自定义样式
.login-tabs {
    :deep(.el-tabs__header) {
        margin: 0 0 20px 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
        display: none;
    }

    :deep(.el-tabs__item) {
        font-size: 16px;
        font-weight: 500;
        padding: 0 20px;
        color: #6b7280;

        &.is-active {
            color: #3b82f6;
        }
    }

    :deep(.el-tabs__active-bar) {
        background-color: #3b82f6;
    }
}

// 卡片阴影动画
.el-card {
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
}

// 背景渐变动画
@keyframes gradient {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

.min-h-screen {
    background: linear-gradient(-45deg, #dbeafe, #e0e7ff, #f0f9ff, #fef3cd);
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
}

// 表单项间距
.space-y-4> :not([hidden])~ :not([hidden]) {
    margin-top: 1rem;
}

// 自定义按钮样式
.el-button--primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;

    &:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    &:active {
        transform: translateY(0);
    }
}

// 关闭按钮样式
.absolute.top-4.right-4 {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);

    &:hover {
        background: rgba(239, 68, 68, 0.9);
        transform: scale(1.1);
    }
}
</style>