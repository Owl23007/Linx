# Linx API Gateway

最后更新：2026-03-25

## 目标

这份文档定义 `Linx` 前端通过 APISIX 访问各后端服务时的公开路由约定。

当前前端不是直接请求单个微服务，而是统一请求网关入口。登录页和请求拦截器会把服务地址规范化为：

- 输入 `http://127.0.0.1:9080`
- 或输入 `http://127.0.0.1:9080/api`
- 最终前端统一使用 `http://127.0.0.1:9080/api` 作为 `baseURL`

这意味着前端代码里的请求路径必须和 APISIX 的公开路由保持一致。

## APISIX 路由摘要

### 1. 通用服务路由

适用服务：

- `linx`
- `synapse`
- `audit`

公开路由：

- `/api/linx/*`
- `/api/synapse/*`
- `/api/audit/*`

网关行为：

- `proxy-rewrite.regex_uri = ^/api/$svc/(.*) -> /$1`
- 开启 `jwks-auth`
- 开启 `cors`

前端调用规则：

- 请求 `linx` 服务时，前端路径必须写成 `/linx/...`
- 请求 `synapse` 服务时，前端路径必须写成 `/synapse/...`
- 请求 `audit` 服务时，前端路径必须写成 `/audit/...`

示例：

- 前端写 `/linx/user/me`
- 实际公开 URL 为 `/api/linx/user/me`
- 转发到 `linx` 服务内部路径 `/user/me`

### 2. Auth 服务公开路由

公开路由：

- `/api/auth/*`
- `/api/.well-known/*`
- `/api/password/*`
- `/api/registration/*`
- `/api/profile/*`

网关行为：

- `proxy-rewrite.regex_uri = ^/api/(.*) -> /$1`
- 开启 `cors`

前端调用规则：

- 认证接口继续使用 `/auth/...`
- 注册接口继续使用 `/registration/...`
- 个人资料接口继续使用 `/profile/...`
- JWKS 元数据继续使用 `/.well-known/...`

示例：

- 前端写 `/auth/login`
- 实际公开 URL 为 `/api/auth/login`
- 转发到 `auth` 服务内部路径 `/auth/login`

## 当前用户相关接口约定

### 认证域用户资料

来源：`auth-service`

推荐用途：

- 登录后获取基础身份信息
- 展示 `username`、`nickname`、`avatarImage`
- 展示邮箱、签名、角色等资料字段

公开接口：

- `GET /profile/me`
- `GET /profile/{userId}`
- `GET /auth/userinfo`

字段特点：

- `nickname`
- `avatarImage`
- `email`
- `phone`
- `signature`
- `backgroundImage`
- `role`

说明：

- `GET /profile/me` 优先作为当前用户资料入口
- `GET /auth/userinfo` 可作为兼容入口

### 联机域用户状态

来源：本地 `linx` 服务

推荐用途：

- 在线状态
- 最近活跃时间
- 联机 Presence

公开接口：

- `GET /linx/user/me`
- `GET /linx/user/{userId}`
- `POST /linx/user/status`

字段特点：

- `id`
- `status`
- `lastSeenAt`

说明：

- 在 APISIX 模式下，不应直接请求 `/user/me`
- 应写成 `/linx/user/me`
- 网关会把它重写为 `linx` 服务内部的 `/user/me`

## 前端实现约定

### 1. Endpoint 约定

前端持久化的 `endpoint` 必须是网关根路径：

- 推荐：`http://127.0.0.1:9080/api`

不要把服务内部地址直接存进前端，例如：

- `http://127.0.0.1:8081`
- `http://127.0.0.1:8081/auth`

### 2. 用户资料读取顺序

当前前端采用以下顺序加载当前用户：

1. `/profile/me`
2. `/auth/userinfo`
3. `/linx/user/me`

目的：

- 优先拿到昵称、头像等完整身份资料
- 在认证资料不可用时，仍能回退到本地 `linx` Presence 信息

### 3. 用户状态更新路径

当前前端优先使用：

1. `/linx/user/status`
2. `/user/status`
3. `/profile/user/status`

说明：

- 第一条是 APISIX 模式下的标准路径
- 后两条仅用于兼容旧直连模式或历史代码

## WebSocket 路由

公开路由：

- `/stomp`

网关行为：

- `enable_websocket = true`
- 转发到 `linx` 服务

说明：

- 该路径不带 `/api`
- 前端建立 WebSocket 连接时应直接使用 `/stomp`

## CORS 约定

当前 CORS 插件配置：

- `allow_origins = http://localhost:5173`
- `allow_methods = GET,POST,PUT,DELETE,OPTIONS`
- `allow_headers = Content-Type,Authorization,Origin,Refresh-Token`
- `allow_credential = true`

说明：

- 桌面端 Electron 不依赖浏览器跨域行为
- Web 开发态 `Vite` 页面需要满足以上来源约束

## 已知边界

1. 目前只有 `auth/profile` 和 `linx/user` 路径已经按 APISIX 约定明确收口。
2. 旧的 `chat / friends / groups` 请求若继续通过网关访问，也应逐步补上 `/linx` 或对应服务前缀。
3. 如果未来新增新的微服务公开路由，前端请求路径必须先在这份文档里登记，再进入实现。
