<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div class="w-full max-w-md">
            <!-- 拖动区域和顶部操作按钮 -->
            <div class="absolute top-2.5 padding right-0 flex justify-between items-center px-3">
                <!-- 右侧操作按钮 -->
                <div class="flex">
                    <el-button size="small" @click="handleMinimize" class="window-btn minimize-btn">
                        <el-icon :size="20">
                            <Minus />
                        </el-icon>
                    </el-button>
                    <el-button size="small" @click="handleClose" class="window-btn close-btn">
                        <el-icon :size="20">
                            <Close />
                        </el-icon>
                    </el-button>
                </div>
            </div>

            <!-- Title -->
            <div class="text-center mb-8 mt-16">
                <h1 class="text-3xl font-bold text-gray-800">Let's Talk</h1>
            </div>

            <!-- Login/Register Form Card -->
            <el-card class="shadow-xl">
                <el-tabs v-model="activeTab" class="login-tabs" @tab-change="handleTabChange">
                    <!-- Login Tab -->
                    <el-tab-pane label="登录" name="login">
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
                                <el-button type="primary" size="large" class="w-full" :loading="loginLoading">
                                    登录
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>

                    <!-- Register Tab -->
                    <el-tab-pane label="注册" name="register">
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
                                <el-input v-model="registerForm.password" type="password" placeholder="请输入密码"
                                    size="large" show-password>
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
                                <el-button type="primary" size="large" class="w-full" :loading="registerLoading">
                                    注册
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                </el-tabs>
            </el-card>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { closeWindow, minimizeWindow } from '@/utils/electron';
import { type FormInstance, type FormRules } from 'element-plus';
import { Close, User, Lock, Minus } from '@element-plus/icons-vue';

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

function handleMinimize() {
    minimizeWindow();
}
</script>


<style scoped lang="less">
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
    background-color: rgba(212, 227, 241, 0.416);
    border-color: rgba(255, 255, 255, 0);
}

.close-btn:hover {
    background-color: rgba(255, 0, 0, 0.689);
    color: rgb(255, 255, 255);
}
</style>