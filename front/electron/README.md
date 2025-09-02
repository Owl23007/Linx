# Electron 架构重构说明

## 项目结构

```
electron/
├── main.js                     # 主进程入口文件
├── config/
│   └── constants.js           # 应用常量配置
├── managers/
│   ├── window-manager.js      # 窗口管理器
│   └── ipc-manager.js         # IPC 通信管理器
├── preload/
│   └── preload.js             # 预加载脚本
├── services/
│   ├── database/
│   │   └── database-service.js # 数据库服务
│   └── p2p/                   # P2P 相关服务（待实现）
└── utils/
    └── app-utils.js           # 应用工具函数
```

## 架构设计原则

1. **模块化**: 将不同功能分离到独立的模块中
2. **单一职责**: 每个类和模块只负责一个主要功能
3. **可维护性**: 代码结构清晰，易于理解和修改
4. **可扩展性**: 便于添加新功能和服务

## 主要组件说明

### 主进程 (main.js)
- 应用的入口点
- 负责应用的生命周期管理
- 协调各个管理器的工作

### 窗口管理器 (WindowManager)
- 负责所有窗口的创建、配置和管理
- 处理窗口相关的操作（最小化、最大化、关闭等）
- 管理窗口的显示和隐藏

### IPC 管理器 (IpcManager)
- 处理主进程和渲染进程之间的通信
- 注册和管理所有 IPC 频道
- 协调不同服务之间的数据交换

### 预加载脚本 (preload.js)
- 安全地暴露 Electron API 给渲染进程
- 建立主进程和渲染进程之间的安全通信桥梁

### 数据库服务 (DatabaseService)
- 管理 SQLite 数据库连接
- 提供数据库操作的统一接口
- 处理数据持久化

### 配置文件 (constants.js)
- 集中管理应用配置
- 定义 IPC 频道名称
- 设置窗口默认配置

### 工具函数 (app-utils.js)
- 提供通用的工具函数
- 环境检测和配置获取
- 安全配置生成

## 使用方法

1. **启动应用**:
   ```bash
   npm run electron:dev  # 开发环境
   npm run build:electron  # 生产环境构建
   ```

2. **添加新的 IPC 频道**:
   - 在 `constants.js` 中定义新的频道名称
   - 在 `ipc-manager.js` 中添加处理器
   - 在 `preload.js` 中暴露相应的 API

3. **添加新服务**:
   - 在 `services/` 目录下创建新的服务文件
   - 在 `ipc-manager.js` 中集成新服务
   - 更新相关的常量配置

## 与原架构的差异

### 原架构 (main.cjs)
- 所有逻辑集中在一个文件中
- 难以维护和扩展
- 职责不明确

### 新架构 (electron/ 目录)
- 模块化设计，职责分离
- 易于测试和维护
- 便于团队协作开发
- 支持功能扩展

## 迁移指南

1. **更新 package.json**:
   - 将 `main` 字段从 `main.cjs` 改为 `electron/main.js`

2. **更新构建脚本**:
   - 确保所有脚本都指向新的入口文件

3. **测试兼容性**:
   - 验证所有现有功能正常工作
   - 检查 IPC 通信是否正常

## 后续扩展建议

1. **添加日志系统**: 使用 Winston 或类似库
2. **实现自动更新**: 集成 electron-updater
3. **添加错误报告**: 集成 Sentry 或类似服务
4. **性能监控**: 添加性能监控和分析
5. **多语言支持**: 实现 i18n 国际化
