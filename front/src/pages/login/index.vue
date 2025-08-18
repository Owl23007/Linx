<template>
    <div class="login-container">
        <button @click="handleClose" class="close-btn">
            <span aria-hidden="true">&times;</span>
        </button>
        <div class="login-tabs">
            <button :class="{ active: isLogin }" @click="isLogin = true">登录</button>
            <button :class="{ active: !isLogin }" @click="isLogin = false">注册</button>
            <div class="login-tabs-indicator" :style="{ left: isLogin ? '0%' : '50%' }"></div>
        </div>
        <div>
            <form v-if="isLogin" class="login-form" @submit.prevent="handleLogin">
                <div class="form-item">
                    <input v-model="loginForm.username" placeholder="请输入账号" required />
                </div>
                <div class="form-item">
                    <input v-model="loginForm.password" type="password" placeholder="请输入密码" required />
                </div>
                <button class="submit-btn" type="submit">登录</button>
            </form>
            <form v-else class="login-form" @submit.prevent="handleRegister">
                <div class="form-item">
                    <input v-model="registerForm.username" placeholder="请输入账号" required />
                </div>
                <div class="form-item">
                    <input v-model="registerForm.password" type="password" placeholder="请输入密码" required />
                </div>
                <div class="form-item">
                    <input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" required />
                </div>
                <button class="submit-btn" type="submit">注册</button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { closeWindow } from '@/utils/electron';

const router = useRouter();
const isLogin = ref(true);

const loginForm = ref({
    username: '',
    password: ''
});
const registerForm = ref({
    username: '',
    password: '',
    confirmPassword: ''
});


function handleClose() {
    closeWindow();
}

function handleLogin() {
    // 登录逻辑
    // TODO: 替换为实际登录API
    if (loginForm.value.username && loginForm.value.password) {
        // 登录成功后跳转
        router.push('/main');
    } else {
        alert('请输入账号和密码');
    }
}
function handleRegister() {
    // 注册逻辑
    if (registerForm.value.password !== registerForm.value.confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    if (registerForm.value.username && registerForm.value.password) {
        // 注册成功后跳转
        router.push('/main');
    } else {
        alert('请填写完整信息');
    }
}
</script>


<style scoped lang="s css">
.login-container {
    width: 350px;
    margin: 64px auto 0 auto;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    padding: 32px 24px 24px 24px;
    position: relative;
}

.close-btn {
    position: absolute;
    right: 16px;
    top: 16px;
    border: none;
    background: none;
    font-size: 22px;
    color: #888;
    cursor: pointer;
}

.login-tabs {
    display: flex;
    position: relative;
    background: #f5f5f5;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 20px;
}

.login-tabs button {
    flex: 1;
    padding: 12px 0;
    border: none;
    background: none;
    font-size: 16px;
    cursor: pointer;
    color: #888;
    transition: color 0.2s;
    z-index: 1;
}

.login-tabs .active {
    color: #1976d2;
    font-weight: bold;
}

.login-tabs-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50%;
    height: 3px;
    background: #1976d2;
    border-radius: 2px;
    transition: left 0.3s;
    z-index: 0;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-item {
    margin-bottom: 0;
}

.login-form input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 15px;
    outline: none;
    box-sizing: border-box;
}

.submit-btn {
    width: 100%;
    padding: 10px 0;
    background: #1976d2;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 6px;
    transition: background 0.2s;
}

.submit-btn:hover {
    background: #145ea8;
}
</style>