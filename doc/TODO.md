# TODO List - Linx 项目

> **项目**: Linx - 现代化聊天应用
> **仓库**: [Linx](https://github.com/Owl23007/Linx)
> **当前分支**: develop
> **最后更新**: 2025年10月11日

## 📋 目录

- [优先级说明](#-优先级说明)
- [后端开发](#-后端开发-server)
- [前端开发](#-前端开发-front)
- [DevOps & 部署](#-devops--部署)
- [文档与测试](#-文档与测试)
- [已完成](#-已完成)

---

## 🎯 优先级说明

- 🔴 **P0 - 紧急**: 阻塞性问题，影响核心功能
- 🟠 **P1 - 高优先级**: 重要功能，需要尽快完成
- 🟡 **P2 - 中优先级**: 优化和改进
- 🟢 **P3 - 低优先级**: 增强功能，可延后

---

## 🚀 后端开发 (Server)

### 🔴 P0 - 核心功能

- [ ] **实时消息系统**
  - [ ] WebSocket 连接稳定性优化
  - [ ] 消息持久化到数据库
  - [ ] 离线消息推送机制
  - 截止日期: _待定_

### 🟠 P1 - 重要功能

- [ ] **好友系统**
  - [ ] 好友申请通知功能
  - [ ] 好友在线状态实时同步
  - [ ] 好友分组管理
  - 相关文件: `server/src/main/java/top/contins/linx/controller/FriendshipController.java`

- [ ] **群组功能**
  - [ ] 群组创建和管理权限
  - [ ] 群组成员管理（踢出、禁言）
  - [ ] 群组消息已读状态
  - 相关文件: `server/src/main/java/top/contins/linx/controller/GroupController.java`

- [ ] **文件传输**
  - [ ] 图片上传和压缩
  - [ ] 文件上传进度显示
  - [ ] 文件类型和大小限制

### 🟡 P2 - 优化改进（后端）

- [ ] **性能优化**
  - [ ] Redis 缓存策略优化
  - [ ] 数据库查询优化（添加索引）
  - [ ] WebSocket 消息队列优化

- [ ] **API 文档**
  - [ ] 完善 Swagger/OpenAPI 注解
  - [ ] 添加 API 使用示例
  - [ ] 接口版本控制策略
  - 相关文件: `server/src/main/java/top/contins/linx/controller/`

### 🟢 P3 - 增强功能

- [ ] **消息功能增强**
  - [ ] 消息撤回功能
  - [ ] 消息@提及功能
  - [ ] 消息引用回复
  - [ ] 富文本消息支持

- [ ] **用户体验**
  - [ ] 多语言支持（i18n）
  - [ ] 表情包系统
  - [ ] 消息搜索功能

---

## 💻 前端开发 (Front)

### 🔴 P0 - 核心功能

- [ ] **Electron 客户端优化**
  - [ ] 窗口拖拽性能优化
  - [ ] 数据库加密实现完善
  - [ ] 应用启动速度优化
  - 相关文件: `front/electron/main.js`, `front/electron/managers/`

- [ ] **聊天界面**
  - [ ] 消息列表虚拟滚动优化
  - [ ] 图片预览和下载功能
  - [ ] 消息发送失败重试机制
  - 相关目录: `front/src/views/`

### 🟠 P1 - 重要功能

- [ ] **用户管理界面**
  - [ ] 用户个人资料编辑
  - [ ] 头像上传和裁剪
  - [ ] 账号安全设置

- [ ] **P2P 通信**
  - [ ] P2P 连接建立逻辑
  - [ ] 文件点对点传输
  - [ ] P2P 消息加密
  - 相关文件: `front/electron/services/p2p/`

- [ ] **本地数据库**
  - [ ] SQLite 数据迁移机制
  - [ ] 消息本地缓存策略
  - [ ] 数据清理和导出功能
  - 相关文件: `front/electron/managers/database.js`

### 🟡 P2 - 优化改进（前端）

- [ ] **UI/UX 优化**
  - [ ] 主题切换功能（亮色/暗色）
  - [ ] 响应式布局优化
  - [ ] 动画效果流畅度提升

- [ ] **代码质量**
  - [ ] TypeScript 类型定义完善
  - [ ] ESLint 规则调整和修复
  - [ ] 组件单元测试覆盖
  - 相关文件: `front/eslint.config.js`, `front/tsconfig.json`

### 🟢 P3 - 增强功能

- [ ] **通知系统**
  - [ ] 系统托盘通知
  - [ ] 消息提示音自定义
  - [ ] 免打扰模式

- [ ] **快捷键支持**
  - [ ] 全局快捷键配置
  - [ ] 聊天窗口快捷操作

---

## 🔧 DevOps & 部署

### 🟠 P1 - 重要任务

- [ ] **CI/CD 流程**
  - [ ] GitHub Actions 自动构建
  - [ ] 自动化测试集成
  - [ ] 自动发布流程

- [ ] **打包与分发**
  - [ ] Electron 打包优化（减小体积）
  - [ ] 自动更新机制实现
  - [ ] 多平台打包配置（Windows/Mac/Linux）
  - 相关文件: `front/package.json` (electron-builder 配置)

### 🟡 P2 - 优化改进（DevOps）

- [ ] **服务器部署**
  - [ ] Docker 容器化部署
  - [ ] 服务器监控和日志
  - [ ] 数据库备份策略

- [ ] **开发环境**
  - [ ] Git Hooks 完善（已部分实现）
  - [ ] 开发文档更新
  - [ ] 团队协作规范文档
  - 相关文件: `scripts/hooks/`, `doc/GIT_HOOKS_SETUP.md`

---

## 📚 文档与测试

### 🟡 P2 - 文档与测试

- [ ] **技术文档**
  - [ ] 架构设计文档
  - [ ] API 接口文档
  - [ ] 数据库设计文档

- [ ] **测试覆盖**
  - [ ] 后端单元测试（目标覆盖率 >70%）
  - [ ] 前端组件测试
  - [ ] E2E 端到端测试

### 🟢 P3 - 低优先级

- [ ] **用户文档**
  - [ ] 用户使用手册
  - [ ] 常见问题 FAQ
  - [ ] 安装配置指南

---

## ✅ 已完成

### 2025年10月前完成

- [x] **项目初始化**
  - [x] 前端 Vue 3 + Vite + Electron 架构搭建
  - [x] 后端 Spring Boot 基础架构
  - [x] Git Hooks 集成（ESLint 代码检查）

- [x] **基础功能**
  - [x] 用户注册和登录接口（UserController）
  - [x] WebSocket 基础连接（WebSocketController）
  - [x] 好友系统基础接口（FriendshipController）
  - [x] 群组系统基础接口（GroupController）
  - [x] 聊天基础功能（ChatController）

- [x] **认证授权**
  - [x] JWT 认证机制（已在网关完成）
  - [x] 用户登录状态管理
  - [x] 密码加密和安全校验

- [x] **前端基础**
  - [x] Electron 窗口管理
  - [x] 本地 SQLite 数据库集成
  - [x] 基础路由和状态管理（Pinia）
  - [x] Element Plus UI 集成

- [x] **开发工具**
  - [x] ESLint + Prettier 代码规范
  - [x] 跨平台脚本支持
  - [x] 项目构建脚本

---

## 📝 备注

### 开发规范

- 提交代码前必须通过 ESLint 检查
- 遵循 Git 提交信息规范（Conventional Commits）
- 重要功能需要编写单元测试
- API 变更需要更新文档

### 技术栈

- **后端**: Spring Boot 3.5.3 + MySQL + Redis + WebSocket + JWT
- **前端**: Vue 3 + TypeScript + Vite + Electron + Element Plus
- **数据库**: MySQL (服务端) + SQLite (客户端本地)
- **构建工具**: Maven (后端) + npm/Vite (前端)
- 分支策略: develop (开发) → main (生产)

---

**模板说明**:

- 使用 `- [ ]` 标记未完成任务
- 使用 `- [x]` 标记已完成任务
