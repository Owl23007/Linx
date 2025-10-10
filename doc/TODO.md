# 📝 WebSocket MVP 开发 Todo List

## 🎯 Phase 1: 核心认证与连接

### 后端任务

- [x] **Task 1.1**: 完善 WebSocket 握手拦截器
  - [x] 在 `WebSocketConfig.java` 中添加 `HandshakeInterceptor`
  - [x] 从请求参数提取 ticket 并验证
  - [x] 验证 ticket 有效性并存储用户信息到 WebSocket 会话

- [x] **Task 1.2**: 配置 STOMP 消息代理
  - [x] 配置 `/app` 应用前缀
  - [x] 配置 `/topic` 广播前缀
  - [x] 配置 `/queue` 点对点前缀
  - [x] 配置 user 用户特定前缀

- [ ] **Task 1.3**: 修复 STOMP 安全配置
  - [ ] 修改 `StompConfig.java` 中的跨域配置为具体域名
  - [ ] 为不同环境配置不同的允许源
  - [ ] 移除生产环境的通配符配置

- [ ] **Task 1.4**: 修复群聊消息路由
  - [ ] 修改 `WebSocketController.java` 中的群聊方法
  - [ ] 改为动态路由发送而非 `@SendTo` 注解
  - [ ] 测试群聊消息正确分发

- [ ] **Task 1.5**: 完善异常处理
  - [ ] 在所有 WebSocket 方法中添加统一异常处理
  - [ ] 返回友好的错误消息给客户端
  - [ ] 添加详细的日志记录

- [ ] **Task 1.6**: 创建消息代理抽象层 (为 RabbitMQ 迁移准备)
  - [ ] 定义统一的消息发送接口 (`MessageBrokerService.java`)
  - [ ] 实现当前 STOMP 版本
  - [ ] 添加配置驱动的实现切换

### 前端任务

- [ ] **Task 1.7**: 优化 WebSocket 连接处理
  - [ ] 适配当前的 ticket 认证机制
  - [ ] 添加连接重试逻辑
  - [ ] 实现心跳保活机制

- [ ] **Task 1.8**: 完善前端 WebSocket 状态管理
  - [ ] 定义连接状态 (CONNECTING, CONNECTED, DISCONNECTED) (`websocket.ts`)
  - [ ] 存储当前用户信息
  - [ ] 管理订阅列表

- [ ] **Task 1.9**: 在登录流程中集成 WebSocket
  - [ ] 登录成功后自动连接 WebSocket
  - [ ] 连接失败时显示错误提示
  - [ ] 登出时断开 WebSocket 连接

---

## 💬 Phase 2: 消息功能优化

### 后端任务

- [x] **Task 2.1**: 创建消息 DTO
  - [x] 定义消息类型、发送者、接收者等字段 (`ChatMessage.java`)
  - [x] 添加时间戳和已读状态
  - [x] 定义消息类型枚举

- [x] **Task 2.2**: 创建 WebSocket 消息控制器
  - [x] `@MessageMapping("/chat.private")` - 私聊消息 (`WebSocketController.java`)
  - [x] `@MessageMapping("/chat.group")` - 群聊消息
  - [x] `@MessageMapping("/chat.heartbeat")` - 心跳检测
  - [x] `@MessageMapping("/chat.typing")` - 输入状态
  - [x] `@MessageMapping("/chat.read")` - 已读回执

- [x] **Task 2.3**: 创建 WebSocket 统一服务
  - [x] 用户上线/下线管理 (`WebsocketService.java`)
  - [x] 会话管理和心跳刷新
  - [x] ticket 创建和验证
  - [x] 统一的消息发送方法

- [x] **Task 2.4**: 创建 WebSocket 事件监听器
  - [x] 监听用户连接事件 (`WebSocketEventListener.java`)
  - [x] 监听用户断开事件
  - [x] 记录连接日志

- [ ] **Task 2.5**: 创建消息实体类和持久化
  - [ ] 定义基本字段 (id, senderId, recipientId, content) (`Message.java`)
  - [ ] 添加时间戳和已读状态
  - [ ] 创建对应的 Repository

- [ ] **Task 2.6**: 实现消息持久化服务
  - [ ] 实现保存消息方法 (`MessageService.java`)
  - [ ] 实现查询历史消息方法
  - [ ] 实现消息已读标记方法
  ```java
  // filepath: server/src/main/java/top/contins/linx/listener/WebSocketEventListener.java
  ```
  - [ ] 监听用户连接事件
  - [ ] 监听用户断开事件
  - [ ] 记录连接日志

### 前端任务

- [ ] **Task 2.7**: 创建消息类型定义
  - [ ] 定义 Message 接口 (`message.ts`)
  - [ ] 定义 MessageType 枚举
  - [ ] 定义 ChatUser 接口

- [ ] **Task 2.8**: 创建消息 Store
  - [ ] 存储消息列表 (`message.ts`)
  - [ ] 添加消息方法
  - [ ] 更新已读状态方法
  - [ ] 清空消息方法

- [ ] **Task 2.9**: 创建聊天窗口组件
  - [ ] 消息列表展示区域 (`ChatWindow.vue`)
  - [ ] 滚动到底部逻辑
  - [ ] 发送/接收消息样式区分
  - [ ] 时间戳格式化显示

- [ ] **Task 2.10**: 创建消息输入组件
  - [ ] 文本输入框 (`MessageInput.vue`)
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
  - [ ] `setOnline(userId)` - 设置用户在线 (`PresenceService.java`)
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
  - [ ] 定义 ACK DTO (`MessageAck.java`)
  - [ ] 发送方接收 ACK
  - [ ] 更新消息状态

### 前端任务

- [ ] **Task 3.6**: 实现断线重连
  - [ ] 检测连接断开
  - [ ] 指数退避重连策略
  - [ ] 最大重连次数限制
  - [ ] 显示重连状态

- [ ] **Task 3.7**: 创建在线用户列表组件
  - [ ] 显示在线用户列表 (`OnlineUsers.vue`)
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
