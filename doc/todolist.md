# 📝 WebSocket MVP 开发 Todo List

## 🎯 Phase 1: 核心认证与连接

### 后端任务

- [ ] **Task 1.1**: 完善 WebSocket 握手拦截器
  - [ ] 在 `WebSocketConfig.java` 中添加 `HandshakeInterceptor`
  - [ ] 从请求参数/Header 提取 JWT token
  - [ ] 验证 token 有效性并存储用户信息到 WebSocket 会话

- [ ] **Task 1.2**: 配置 STOMP 消息代理
  - [ ] 配置 `/app` 应用前缀
  - [ ] 配置 `/topic` 广播前缀
  - [ ] 配置 `/queue` 点对点前缀
  - [ ] 配置 user 用户特定前缀

- [ ] **Task 1.3**: 测试 WebSocket 连接
  - [ ] 使用 Postman/WebSocket 客户端测试连接
  - [ ] 验证认证流程
  - [ ] 检查连接日志

### 前端任务

- [ ] **Task 1.5**: 安装 WebSocket 依赖
  ```bash
  npm install @stomp/stompjs sockjs-client
  npm install --save-dev @types/sockjs-client
  ```

- [ ] **Task 1.6**: 创建 WebSocket 客户端封装
  ```typescript
  // filepath: front/src/utils/websocket.ts
  ```
  - [ ] 实现 `connect()` 方法
  - [ ] 实现 `subscribe()` 方法
  - [ ] 实现 `send()` 方法
  - [ ] 实现 `disconnect()` 方法
  - [ ] 集成现有的 Logger 系统

- [ ] **Task 1.7**: 创建 WebSocket 状态管理
  ```typescript
  // filepath: front/src/stores/websocket.ts
  ```
  - [ ] 定义连接状态 (CONNECTING, CONNECTED, DISCONNECTED)
  - [ ] 存储当前用户信息
  - [ ] 管理订阅列表

- [ ] **Task 1.8**: 在登录流程中集成 WebSocket
  - [ ] 登录成功后自动连接 WebSocket
  - [ ] 连接失败时显示错误提示
  - [ ] 登出时断开 WebSocket 连接

---

## 💬 Phase 2: 基础消息功能

### 后端任务

- [ ] **Task 2.1**: 创建消息实体类
  ```java
  // filepath: server/src/main/java/top/contins/linx/model/entity/Message.java
  ```
  - [ ] 定义基本字段 (id, senderId, recipientId, content)
  - [ ] 添加时间戳和已读状态
  - [ ] 定义消息类型枚举 (TEXT, IMAGE, FILE)

- [ ] **Task 2.2**: 创建消息 DTO
  ```java
  // filepath: server/src/main/java/top/contins/linx/model/dto/ChatMessage.java
  ```
  - [ ] 请求 DTO (发送消息)
  - [ ] 响应 DTO (接收消息)
  - [ ] 添加验证注解

- [ ] **Task 2.3**: 创建消息 Repository
  ```java
  // filepath: server/src/main/java/top/contins/linx/repository/MessageRepository.java
  ```
  - [ ] 继承 JpaRepository
  - [ ] 添加按用户查询消息方法
  - [ ] 添加按时间范围查询方法

- [ ] **Task 2.4**: 创建消息服务层
  ```java
  // filepath: server/src/main/java/top/contins/linx/service/MessageService.java
  ```
  - [ ] 实现保存消息方法
  - [ ] 实现查询历史消息方法
  - [ ] 实现消息已读标记方法

- [ ] **Task 2.5**: 创建聊天控制器
  ```java
  // filepath: server/src/main/java/top/contins/linx/controller/ChatController.java
  ```
  - [ ] `@MessageMapping("/chat.send")` - 群发消息
  - [ ] `@MessageMapping("/chat.private")` - 私聊消息
  - [ ] 消息持久化到数据库
  - [ ] 添加消息发送日志

- [ ] **Task 2.6**: 创建 WebSocket 事件监听器
  ```java
  // filepath: server/src/main/java/top/contins/linx/listener/WebSocketEventListener.java
  ```
  - [ ] 监听用户连接事件
  - [ ] 监听用户断开事件
  - [ ] 记录连接日志

### 前端任务

- [ ] **Task 2.7**: 创建消息类型定义
  ```typescript
  // filepath: front/src/types/message.ts
  ```
  - [ ] 定义 Message 接口
  - [ ] 定义 MessageType 枚举
  - [ ] 定义 ChatUser 接口

- [ ] **Task 2.8**: 创建消息 Store
  ```typescript
  // filepath: front/src/stores/message.ts
  ```
  - [ ] 存储消息列表
  - [ ] 添加消息方法
  - [ ] 更新已读状态方法
  - [ ] 清空消息方法

- [ ] **Task 2.9**: 创建聊天窗口组件
  ```vue
  // filepath: front/src/components/ChatWindow.vue
  ```
  - [ ] 消息列表展示区域
  - [ ] 滚动到底部逻辑
  - [ ] 发送/接收消息样式区分
  - [ ] 时间戳格式化显示

- [ ] **Task 2.10**: 创建消息输入组件
  ```vue
  // filepath: front/src/components/MessageInput.vue
  ```
  - [ ] 文本输入框
  - [ ] 发送按钮
  - [ ] Enter 键发送
  - [ ] Shift+Enter 换行

- [ ] **Task 2.11**: 实现消息发送逻辑
  - [ ] 调用 WebSocket send 方法
  - [ ] 本地立即显示消息(乐观更新)
  - [ ] 发送失败回滚
  - [ ] 消息重试机制

- [ ] **Task 2.12**: 实现消息接收逻辑
  - [ ] 订阅消息主题
  - [ ] 收到消息后添加到 Store
  - [ ] 播放消息提示音(可选)
  - [ ] 桌面通知(Electron)

---

## 🟢 Phase 3: 在线状态与优化

### 后端任务

- [ ] **Task 3.1**: 配置 Redis
  - [ ] 检查 `application.yml` Redis 配置
  - [ ] 测试 Redis 连接
  - [ ] 配置 RedisTemplate

- [ ] **Task 3.2**: 创建在线状态服务
  ```java
  // filepath: server/src/main/java/top/contins/linx/service/PresenceService.java
  ```
  - [ ] `setOnline(userId)` - 设置用户在线
  - [ ] `setOffline(userId)` - 设置用户离线
  - [ ] `isOnline(userId)` - 检查用户是否在线
  - [ ] `getOnlineUsers()` - 获取在线用户列表
  - [ ] 使用 Redis 过期机制(30分钟)

- [ ] **Task 3.3**: 集成在线状态到 WebSocket 事件
  - [ ] 连接时调用 `setOnline()`
  - [ ] 断开时调用 `setOffline()`
  - [ ] 广播在线状态变更

- [ ] **Task 3.4**: 创建心跳机制
  - [ ] 客户端定时发送心跳
  - [ ] 服务端更新在线状态过期时间
  - [ ] 超时自动离线

- [ ] **Task 3.5**: 添加消息送达确认
  ```java
  // filepath: server/src/main/java/top/contins/linx/model/dto/MessageAck.java
  ```
  - [ ] 定义 ACK DTO
  - [ ] 发送方接收 ACK
  - [ ] 更新消息状态

### 前端任务

- [ ] **Task 3.6**: 实现断线重连
  - [ ] 检测连接断开
  - [ ] 指数退避重连策略
  - [ ] 最大重连次数限制
  - [ ] 显示重连状态

- [ ] **Task 3.7**: 创建在线用户列表组件
  ```vue
  // filepath: front/src/components/OnlineUsers.vue
  ```
  - [ ] 显示在线用户列表
  - [ ] 在线状态指示器(绿点)
  - [ ] 点击用户打开聊天窗口

- [ ] **Task 3.8**: 实现心跳机制
  - [ ] 每 25 秒发送一次心跳
  - [ ] 使用 STOMP heartbeat 配置
  - [ ] 记录心跳日志

- [ ] **Task 3.9**: 添加消息状态显示
  - [ ] 发送中 (loading)
  - [ ] 已发送 (单勾)
  - [ ] 已送达 (双勾)
  - [ ] 发送失败 (红色感叹号)

- [ ] **Task 3.10**: 优化错误处理
  - [ ] 集成现有 Logger 系统
  - [ ] 网络错误提示
  - [ ] 认证失败提示
  - [ ] 消息发送失败提示

- [ ] **Task 3.11**: 性能优化
  - [ ] 消息列表虚拟滚动
  - [ ] 防抖输入
  - [ ] 懒加载历史消息
  - [ ] 图片压缩上传(预留)

---

## 🧪 Phase 4: 测试与文档

### 测试任务

- [ ] **Task 4.1**: 单元测试
  - [ ] 后端 Service 层测试
  - [ ] 前端工具类测试
  - [ ] WebSocket 连接测试

- [ ] **Task 4.2**: 集成测试
  - [ ] 完整登录->连接->发消息流程
  - [ ] 多用户并发测试
  - [ ] 断线重连测试
  - [ ] 消息持久化验证

- [ ] **Task 4.3**: 压力测试
  - [ ] 1000 并发连接测试
  - [ ] 高频消息发送测试
  - [ ] 长时间运行稳定性测试

### 文档任务

- [ ] **Task 4.4**: API 文档
  - [ ] WebSocket 端点文档
  - [ ] 消息格式文档
  - [ ] 错误码说明

- [ ] **Task 4.5**: 部署文档
  - [ ] 环境配置说明
  - [ ] Redis 部署步骤
  - [ ] MySQL 初始化脚本
  - [ ] Nginx 配置(如需要)

- [ ] **Task 4.6**: 用户手册
  - [ ] 功能使用说明
  - [ ] 常见问题 FAQ
  - [ ] 故障排查指南

---

## 📊 进度追踪

### 统计
- **总任务数**: 53 个
- **Phase 1**: 8 个任务 (15%)
- **Phase 2**: 19 个任务 (36%)
- **Phase 3**: 17 个任务 (32%)
- **Phase 4**: 9 个任务 (17%)

### 里程碑
- [ ] **M1**: WebSocket 连接成功 (完成 Phase 1)
- [ ] **M2**: 基础消息收发功能 (完成 Phase 2)
- [ ] **M3**: 在线状态与稳定性 (完成 Phase 3)
- [ ] **M4**: MVP 上线就绪 (完成 Phase 4)

---
