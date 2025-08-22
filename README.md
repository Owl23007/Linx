# Linx - 聊天应用

一个现代化的聊天应用，支持多种客户端形式。

## 📦 项目结构

```
├── server/   # 🚀 Spring Boot 后端服务
├── front/    # 💻 Vue.js + Electron 桌面客户端 (推荐)
└── client/   # ⚠️  JavaFX 桌面客户端 (已弃用，仅存档)
```

## ✨ 推荐使用

### 🎯 前端客户端 (主要开发)
- **路径**: `/front`
- **技术栈**: Vue 3 + TypeScript + Vite + Electron
- **状态**: ✅ 活跃开发中
- **特点**: 现代化UI，开发效率高

### 🔧 后端服务
- **路径**: `/server`  
- **技术栈**: Spring Boot
- **状态**: ✅ 活跃开发中

## ⚠️ 已弃用组件

### JavaFX 客户端 (存档)
- **路径**: `/client`
- **状态**: 🗄️ 已弃用，仅用于代码参考
- **原因**: UI 开发复杂度过高
- **价值**: 部分规范化代码可供复用

详见 [`client/README.md`](./client/README.md) 了解更多信息。

## 🚀 快速开始

### 启动后端服务
```bash
cd server
mvn spring-boot:run
```

### 启动前端客户端
```bash
cd front
npm install
npm run electron:dev
```

---

💡 **提示**: 建议使用 Vue.js 版本进行新功能开发，JavaFX 版本仅作为参考。
