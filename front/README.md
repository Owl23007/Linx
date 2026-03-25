# Linx Frontend

`front/` 是 Linx 的桌面客户端，基于 Vue 3 + TypeScript + Vite + Electron。

## 当前职责

- 登录与账号切换
- 桌面窗口能力
- EasyTier 本地组网能力接入
- 联机首页、房间页和诊断入口的主要承载层

## 启动方式

```bash
npm install
npm run electron:dev
```

如果只需要下载 EasyTier：

```bash
npm run download:easytier
```

## 关键目录

- `src/views/pages/login/`: 登录与注册页
- `src/views/pages/lobby/`: 联机主页面入口（已接入创建/加入房间、最近房间、成员信息、网络状态）
- `src/views/components/easytier/`: EasyTier 相关 UI
- `src/services/easytierService.ts`: 前端到 Electron 的 EasyTier 调用封装
- `electron/managers/easytier.js`: EasyTier 子进程管理
- `electron/ipc/easytierHandler.js`: EasyTier IPC 暴露

## 当前前端问题

- 还没有 `connectionStore` / `diagnosisStore`
- `MainHome` / `MainRooms` / `MainDiagnostics` 仍复用同一个页面，后续需要拆分
- 仍保留较多聊天域命名

## 设计文档

- [产品定位](../doc/PRODUCT_DIRECTION.md)
- [信息架构](../doc/INFORMATION_ARCHITECTURE.md)
- [交互文案规范](../doc/UX_COPY_GUIDE.md)
- [架构基线](../doc/ARCHITECTURE_BASELINE.md)

后续新增联机功能时，优先遵循 `doc/` 下的文档，而不是继续沿用默认 Vue 模板说明。
