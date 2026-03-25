# Linx 架构基线

最后更新：2026-03-25

## 当前技术栈

- 前端：Vue 3 + TypeScript + Vite + Electron + Pinia + Element Plus
- 网关：APISIX + Nacos 服务发现 + JWKS 鉴权
- 后端：Spring Boot + MyBatis Plus + WebSocket + Redis
- 本地能力：SQLite、本地账号存储、窗口管理、EasyTier 子进程管理

## 当前仓库能力盘点

### 前端

已具备：

- 登录与注册页
- 本地已保存账号切换
- Electron 主窗口切换
- EasyTier 面板：启动、停止、查询状态、查看 Peer
- 基础路由：`/login`、`/main`

不足：

- `MainHome` / `MainRooms` / `MainDiagnostics` 仍复用同一视图，信息架构尚未彻底拆分
- 没有统一连接状态中心
- `connection` / `diagnosis` 状态还未完全收敛到独立 store
- 类型和 store 仍偏向 `chat / friend / group`

### Electron

已具备：

- `easytierHandler.js` 暴露 IPC
- `EasyTierManager` 管理子进程
- `getPeers()` / `getRoute()` 基础查询

不足：

- 尚未形成统一诊断接口
- 错误分类和可操作修复建议还没有收敛
- EasyTier 生命周期和房间生命周期尚未打通

### 服务端

已具备：

- 用户认证
- 网关统一入口：`/api/auth/*`、`/api/profile/*`、`/api/linx/*`
- WebSocket 基础能力
- 好友、群组、聊天相关接口

不足：

- 缺少 `room`、`roomMember`、`roomInvite` 等域模型
- 缺少围绕联机房间的 API
- 旧的聊天语义与产品方向存在偏差

## 目标分层

## 1. 表现层

- 登录页
- 联机首页
- 房间页
- 诊断抽屉

## 2. 前端状态层

推荐最终拆分为：

- `authStore`: 登录态
- `globalStore`: 全局配置
- `connectionStore`: EasyTier 状态、虚拟 IP、Peer、Route、连接模式
- `roomStore`: 当前房间、成员列表、房间码、最近房间
- `diagnosisStore`: 最近错误、诊断结果、修复动作

## 3. 桌面适配层

- Electron IPC
- EasyTier 生命周期管理
- 本地数据库与账号缓存
- 后续可加入日志采集和权限检测

## 4. 服务端领域层

建议逐步从：

- `friendship`
- `group`
- `chat`

迁移到：

- `room`
- `room_member`
- `room_invite`
- `presence`
- `connection_session`

## 推荐迁移策略

### 第一阶段

- 不急着删除旧聊天代码
- 在前端新增联机首页和连接状态中心
- 房间使用最小闭环模型先跑通

### 第二阶段

- 服务端新增房间相关实体与接口
- 把原本“群组”的部分承载能力迁移到房间

### 第三阶段

- 逐步下线或边缘化纯 IM 结构
- 重命名高频领域对象和接口

## 当前风险

- `/main` 已接入真实房间链路，但三条子路由仍复用单页，后续扩展容易耦合
- `chat`、`group`、`friend` 命名继续扩散，会抬高后续迁移成本
- 连接失败还没有统一诊断出口，用户体验会直接卡死在“失败但不知道为什么”

## 当前优先实现建议

1. 抽 `connectionStore` 并统一连接状态来源
2. 新增 `diagnosisStore`，把失败原因和修复动作结构化
3. 将 `MainHome` / `MainRooms` / `MainDiagnostics` 拆为独立视图
4. 持续收敛 `chat / group / friend` 命名到 `room / connection / diagnosis`
