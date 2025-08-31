# Electron 前端架构设计

## 架构结构

```
front/src/
├── models/          # Model 层 - 数据模型和业务实体
│   ├── user.ts         # 用户数据模型
│   ├── auth.ts         # 认证模型
│   └── config.ts       # 配置模型
├── stores/          # 状态管理 (Pinia)
│   ├── auth.ts         # 认证状态管理
│   ├── electron.ts     # Electron 功能状态管理
│   ├── system.ts       # 系统功能状态管理
│   └── app.ts       # 应用程序状态管理
├── api/             # API 接口层
│   ├── index.ts        # API 统一导出
│   ├── request.ts      # 请求封装
│   └── auth.ts         # 认证相关 API
├── utils/           # 工具函数
│   ├── electron.ts     # Electron 工具函数
│   └── drag.ts         # 拖拽工具
└── views/           # View 层 - Vue 组件
    ├── components/
    └── pages/
```

## 各层职责

### 1. Model 层
- **职责**: 数据模型、业务实体、数据验证
- **特点**: 不依赖于 UI，纯粹的数据对象

```typescript
// models/user.ts
export class UserModel {
  private _data: User | null = null;

  setData(userData: Partial<User>): void {
    if (this.validateUserData(userData)) {
      this._data = { ...userData };
    }
  }
}

```

### 2. Store 层
- **职责**: 全局状态管理、响应式数据、跨组件通信
- **特点**:
  1. 基于 Pinia 的状态管理、自动持久化、类型安全
  2. Electron 使用 SqlLite 进行数据存储

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserInfo | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  async function login(form: LoginRequest) {
    loading.value = true;
    try {
      const response = await authApi.login(form);
      token.value = response.data.token;
      user.value = response.data.userInfo;
      return response;
    } finally {
      loading.value = false;
    }
  }

  return { user, token, loading, isAuthenticated, login };
});
```

### 3. View 层
- **职责**: 用户界面、用户交互、数据展示
- **特点**: 实现具体的 UI 逻辑和交互

```vue
<!-- views/login/index.vue -->
<template>
  <div>
    <el-input v-model="authStore.loginForm.username" />
    <el-button @click="handleLogin" :loading="authStore.loading">
      登录
    </el-button>
    <el-button @click="electronStore.minimizeWindow" v-if="electronStore.isElectronEnv">
      最小化
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useElectronStore } from '@/stores/electron';

const authStore = useAuthStore();
const electronStore = useElectronStore();

async function handleLogin() {
  const success = await authStore.login(authStore.loginForm);
  if (success) {
    router.push('/dashboard');
  }
}
</script>
```
