# Auth Service API 文档

## 概述

该文档覆盖 auth-service 项目的主要 HTTP 接口（身份认证、用户资料、验证码、邮件相关、管理员操作、健康检查等）。

Base URL: 127.0.0.1::9080/api

通用响应格式（JSON）:

```json
{
  "code": 0,
  "message": "success",
  "data": { /* payload */ }
}
```

约定：

- code: 0 表示成功，非 0 表示失败；
- 所有受保护接口要求请求头 `Authorization: Bearer {access_token}`（或直接 token）。

---

## 快速索引

- /auth/** - 登录、登出、刷新 token、注册、密码重置
- /profile/** - 用户资料相关（查看、更新、搜索）
- /captcha/** - 图形/短信验证码获取与校验
- /email/** - 邮件发送相关（注册、找回密码邮件模板）
- /admin/** - 管理员相关接口（用户管理、统计）
- /health - 服务健康检查

---

## 1. 身份认证（/auth）

1.1 登录

- 方法: POST
- 路径: /auth/login
- 请求体 (application/json):

```json
{
  "username": "string",
  "password": "string"
}
```

- 成功响应 data:

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 3600
}
```

- 常见错误: 用户名或密码错误、用户被禁用

1.2 刷新 Token

- 方法: POST
- 路径: /auth/refresh
- 请求体:

```json
{ "refreshToken": "string" }
```

- 成功返回新的 accessToken

1.3 登出

- 方法: POST
- 路径: /auth/logout
- 说明: 使当前 accessToken/refreshToken 失效（需认证）

1.4 注册（可选）

- 方法: POST
- 路径: /auth/register
- 请求体:

```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "captcha": "string" // 可选，取决于实现
}
```

1.5 密码重置请求

- 方法: POST
- 路径: /auth/password/reset-request
- 请求体: { "email": "string" }
- 说明: 触发发送重置邮件（如果邮箱存在）

1.6 密码重置确认

- 方法: POST
- 路径: /auth/password/reset
- 请求体:

```json
{
  "token": "string",
  "newPassword": "string"
}
```

---

## 2. 用户资料（/profile）

2.1 获取当前用户完整资料

- 方法: GET
- 路径: /profile/me
- 认证: 必须
- 返回: UserSelfProfileVO（见模型部分）

2.2 根据 ID 获取公开资料

- 方法: GET
- 路径: /profile/{userId}
- 认证: 无
- 返回: UserPublicProfileVO

2.3 根据用户名获取公开资料

- 方法: GET
- 路径: /profile/username/{username}
- 认证: 无
- 返回: UserPublicProfileVO

2.4 搜索用户

- 方法: GET
- 路径: /profile/search
- 查询参数: keyword, pageNum=1, pageSize=10
- 说明: 匹配用户名或昵称，仅返回 ACTIVE 用户

2.5 更新当前用户资料

- 方法: PUT
- 路径: /profile/me
- 认证: 必须
- 请求体: UpdateProfileRequest（部分字段可选）

---

## 3. 验证码（/captcha）

3.1 获取图形验证码

- 方法: GET
- 路径: /captcha/image
- 返回: image/png 或 base64

3.2 校验图形验证码

- 方法: POST
- 路径: /captcha/verify
- 请求体: { "captchaId": "string", "code": "string" }

3.3 发送短信验证码

- 方法: POST
- 路径: /captcha/sms
- 请求体: { "phone": "string", "purpose": "register|reset|login" }

---

## 4. 邮件（/email）

4.1 发送注册/重置邮件（内部/测试）

- 方法: POST
- 路径: /email/send
- 请求体: { "to": "string", "template": "register|reset|welcome", "variables": { ... } }

4.2 获取邮件模板（只读）

- 方法: GET
- 路径: /email/templates/{name}
- 返回: HTML 模板内容

---

## 5. 管理员接口（/admin）

> 这些接口需要管理员权限

5.1 列表用户

- 方法: GET
- 路径: /admin/users
- 查询参数: pageNum, pageSize, status, keyword

5.2 获取用户详情

- 方法: GET
- 路径: /admin/users/{userId}

5.3 修改用户状态（禁用/启用）

- 方法: PUT
- 路径: /admin/users/{userId}/status
- 请求体: { "status": "ACTIVE|INACTIVE|BANNED" }

5.4 重置用户密码（管理员操作）

- 方法: POST
- 路径: /admin/users/{userId}/reset-password
- 请求体: { "newPassword": "string" }

---

## 6. 健康检查与元信息

6.1 健康检查

- 方法: GET
- 路径: /health
- 返回: { "status": "UP" }

6.2 服务版本/信息

- 方法: GET
- 路径: /info
- 返回: 应用名、版本、构建时间等

---

## 模型（简要）

UserSelfProfileVO:

```json
{
  "userId": 0,
  "username": "string",
  "nickname": "string",
  "email": "string",
  "phone": "string",
  "signature": "string",
  "avatarImage": "string",
  "backgroundImage": "string",
  "status": "ACTIVE",
  "role": "USER",
  "lastLoginTime": "2025-10-11T10:30:00",
  "lastLoginIp": "string",
  "createTime": "2025-01-01T08:00:00",
  "updateTime": "2025-10-11T11:00:00"
}
```

UserPublicProfileVO:

```json
{
  "userId": 0,
  "username": "string",
  "nickname": "string",
  "signature": "string",
  "avatarImage": "string",
  "backgroundImage": "string"
}
```

UpdateProfileRequest:

```json
{
  "nickname": "string",
  "signature": "string",
  "avatarImage": "string",
  "backgroundImage": "string",
  "phone": "string"
}
```

AuthResponse:

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 3600
}
```

---

## 常见错误码与说明

- 0: 成功
- 1: 失败（通用错误）
- 401: 未认证或 token 无效
- 403: 无权限
- 404: 资源未找到
- 422: 参数验证失败

---

## 示例（curl）

登录:

```bash
curl -X POST "http://localhost:8080/auth/login" -H "Content-Type: application/json" -d '{"username":"alice","password":"pass"}'
```

获取当前用户资料:

```bash
curl -X GET "http://localhost:8080/profile/me" -H "Authorization: Bearer {accessToken}"
```

搜索用户:

```bash
curl -X GET "http://localhost:8080/profile/search?keyword=john&pageNum=1&pageSize=10"
```

发送邮件（内部）:

```bash
curl -X POST "http://localhost:8080/email/send" -H "Content-Type: application/json" -d '{"to":"u@example.com","template":"register","variables":{}}'
```

---

## 备注与后续建议

- 建议接入 OpenAPI/Swagger 自动生成文档并与代码注释保持同步；
- 可以将 `doc/` 下的模板拆分为多个文件（auth.md、profile.md、admin.md），便于维护；
- 考虑为关键接口增加示例响应与错误码表，便于前端集成与测试。

---

## 变更记录

- 2025-10-11: 初始整合，覆盖原 Profile 文档，扩展到整个服务的接口概览。
