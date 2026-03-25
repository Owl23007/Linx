# Linx

Linx 是一个面向游戏联机的桌面组网客户端，目标是把“创建房间、加入房间、建立虚拟网络、诊断连接问题”做成一条短路径，而不是继续沿着 IM/聊天应用方向扩展。

当前仓库已经具备这些基础能力：

- `front/`: Vue 3 + TypeScript + Electron 桌面客户端
- `server/`: Spring Boot 后端，当前仍保留登录、好友、群组、聊天等旧域模型
- EasyTier 集成：客户端已具备本地拉起、停止、查询 Peer/Route 的基础能力
- 本地数据库、窗口管理、登录流程、基础路由已经可用

这意味着项目现阶段的重点不是“从零搭产品”，而是把现有聊天壳子重构成联机工具。

## 当前定位

- 产品形态：房间式游戏联机工具
- 核心对象：`user -> device -> room -> peerConnection -> gameProfile`
- 首要页面：联机首页、房间页、诊断入口
- 非目标：优先级上不再把聊天窗口、会话流、已读未读、社交资料卡作为主线

## 目录结构

```text
.
|-- front/   Vue 3 + Electron 客户端
|-- server/  Spring Boot 服务端
|-- doc/     产品、架构、路线图与设计模板
`-- scripts/ 开发脚本与 Git hooks
```

## 快速开始

### 初始化

```bash
npm run setup
```

### 启动后端

```bash
cd server
mvn spring-boot:run
```

### 启动桌面客户端

```bash
cd front
npm install
npm run electron:dev
```

## 文档入口

- [文档索引](./doc/README.md)
- [产品定位](./doc/PRODUCT_DIRECTION.md)
- [信息架构与主流程](./doc/INFORMATION_ARCHITECTURE.md)
- [交互文案规范](./doc/UX_COPY_GUIDE.md)
- [架构基线](./doc/ARCHITECTURE_BASELINE.md)
- [产品路线图](./doc/ROADMAP.md)
- [设计文档模板](./doc/DESIGN_DOC_TEMPLATE.md)
- [ADR 模板](./doc/ADR_TEMPLATE.md)
- [ADR-0001 产品定位调整](./doc/ADR-0001-product-positioning.md)
- [开发 TODO](./doc/TODO.md)

## 仓库现状说明

代码里仍然存在不少聊天域命名，例如：

- `front/src/types/chat.ts`
- `front/src/stores/chat.ts`
- `server/.../ChatController.java`
- `server/.../GroupController.java`

这些属于历史遗留能力。文档已经把后续方向统一到“房间式联机工具”，后续实现应优先新增和迁移 `room`、`connection`、`diagnosis` 等模型，而不是继续加深 IM 语义。
