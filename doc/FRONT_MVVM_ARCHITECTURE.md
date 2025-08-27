# Electron MVVM 架构设计指南

## 概述

MVVM（Model-View-ViewModel）是一种非常适合 Electron 应用的架构模式，它能有效分离业务逻辑、数据管理和用户界面，使代码更加模块化、可测试和可维护。

## 架构结构

```
front/src/
├── models/           # Model 层 - 数据模型和业务实体
│   ├── user.ts      # 用户数据模型
│   ├── auth.ts      # 认证模型
│   └── config.ts    # 配置模型
├── viewmodels/       # ViewModel 层 - 视图逻辑
│   ├── base.vm.ts   # 基础 ViewModel
│   ├── login.vm.ts  # 登录页面 ViewModel
│   └── app.vm.ts    # 应用程序 ViewModel
├── services/         # Service 层 - 业务服务
│   ├── auth.service.ts    # 认证服务
│   ├── ipc.service.ts     # IPC 通信服务
│   └── storage.service.ts # 存储服务
├── stores/           # 状态管理
│   ├── user.store.ts
│   └── app.store.ts
├── types/            # TypeScript 类型定义
│   ├── models.ts
│   └── viewmodels.ts
└── views/            # View 层 - Vue 组件
    ├── components/
    └── pages/
```

## 各层职责

### 1. Model 层
- **职责**: 数据模型、业务实体、数据验证
- **特点**: 不依赖于 UI，纯粹的数据和业务逻辑

```typescript
// models/user.ts
export class UserModel {
  private _data: User | null = null;

  setData(userData: Partial<User>): void {
    if (this.validateUserData(userData)) {
      this._data = { ...userData };
    }
  }

  private validateUserData(userData: Partial<User>): boolean {
    // 数据验证逻辑
    return true;
  }
}
```

### 2. ViewModel 层
- **职责**: 连接 View 和 Model，处理 UI 逻辑，状态管理
- **特点**: 响应式数据、用户交互处理、表单验证

```typescript
// viewmodels/login.vm.ts
export class LoginViewModel extends BaseViewModel {
  public loginForm: Ref<LoginForm> = ref({ username: '', password: '' });
  public loading: Ref<boolean> = ref(false);

  async login(): Promise<boolean> {
    return await this.executeAsync(async () => {
      const response = await this.authService.login(this.loginForm.value);
      return this.handleApiResponse(response);
    });
  }
}
```

### 3. Service 层
- **职责**: API 调用、IPC 通信、外部服务集成
- **特点**: 单例模式、异步操作、错误处理

```typescript
// services/auth.service.ts
export class AuthService {
  private static instance: AuthService;
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(loginData: LoginForm): Promise<ApiResponse> {
    return await request.post('/auth/login', loginData);
  }
}
```

### 4. View 层
- **职责**: 用户界面、用户交互、数据展示
- **特点**: 绑定 ViewModel，声明式渲染

```vue
<!-- views/login/index.vue -->
<template>
  <div>
    <el-input v-model="loginVM.loginForm.value.username" />
    <el-button @click="handleLogin" :loading="loginVM.loading.value">
      登录
    </el-button>
  </div>
</template>

<script setup lang="ts">
const loginVM = new LoginViewModel();

async function handleLogin() {
  const success = await loginVM.login();
  if (success) {
    router.push('/dashboard');
  }
}
</script>
```

## 核心特性

### 1. 响应式数据绑定
- 使用 Vue 3 的 `ref` 和 `reactive` 实现双向数据绑定
- ViewModel 中的数据变化自动反映到 View

### 2. 统一错误处理
- BaseViewModel 提供统一的错误处理机制
- 异步操作包装，自动处理加载状态和错误状态

### 3. 类型安全
- 完整的 TypeScript 类型定义
- 编译时类型检查，减少运行时错误

### 4. 资源管理
- 自动清理机制，防止内存泄漏
- 组件卸载时自动调用 dispose 方法

## Electron 特有功能

### 1. IPC 通信管理
```typescript
// services/ipc.service.ts
export class IPCService {
  async minimizeWindow(): Promise<void> {
    if (this.isElectron()) {
      await window.electronAPI.minimize();
    }
  }

  setDraggable(element: HTMLElement): () => void {
    // 窗口拖拽逻辑
  }
}
```

### 2. 主进程通信
```typescript
// 在 ViewModel 中使用
async handleWindowAction() {
  await this.ipcService.minimizeWindow();
}
```

### 3. 原生功能集成
- 文件系统访问
- 系统通知
- 窗口管理
- 自动更新

## 最佳实践

### 1. 依赖注入
```typescript
export class LoginViewModel {
  constructor(
    private authService = AuthService.getInstance(),
    private storageService = StorageService.getInstance()
  ) {}
}
```

### 2. 异步操作模式
```typescript
// 统一的异步操作包装
async executeAsync<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    this.setLoading(true);
    return await operation();
  } catch (error) {
    this.setError(error.message);
    return null;
  } finally {
    this.setLoading(false);
  }
}
```

### 3. 表单验证
```typescript
// 在 ViewModel 中集中处理验证
validateLoginForm(): boolean {
  if (!this.validateRequired(this.form.username, '用户名')) return false;
  if (!this.validateEmail(this.form.username)) return false;
  return true;
}
```

### 4. 状态持久化
```typescript
// 自动保存和恢复状态
onMounted(() => {
  const savedState = storageService.getAuthState();
  if (savedState) {
    this.restoreState(savedState);
  }
});
```

## 优势

1. **关注点分离**: 各层职责清晰，便于维护
2. **可测试性**: ViewModel 和 Service 层易于单元测试
3. **可重用性**: 组件和服务可以在不同页面间复用
4. **类型安全**: 完整的类型系统减少错误
5. **响应式**: 自动更新 UI，提升用户体验
6. **扩展性**: 易于添加新功能和模块

## 与传统架构对比

| 特性 | 传统组件架构 | MVVM 架构 |
|------|-------------|-----------|
| 业务逻辑位置 | 分散在组件中 | 集中在 ViewModel |
| 可测试性 | 依赖 DOM，难测试 | 纯逻辑，易测试 |
| 代码复用 | 组件级复用 | 逻辑级复用 |
| 状态管理 | 本地状态 | 集中管理 |
| 错误处理 | 各自处理 | 统一处理 |

这种架构特别适合复杂的 Electron 应用，能够有效管理应用状态、用户交互和系统集成，提供良好的开发体验和代码质量。
