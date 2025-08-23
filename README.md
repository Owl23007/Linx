# Linx - 聊天应用

一个现代化的聊天应用，支持多种客户端形式。

## 📦 项目结构

```
├── server/   # 🚀 Spring Boot 后端服务
├── front/    # 💻 Vue.js + Electron 桌面客户端 (推荐)
└── client/   # ⚠️  JavaFX 桌面客户端 (已弃用，仅存档)
```

## ✨ 推荐使用

### 🎯 前端客户端 
- **路径**: `/front`
- **技术栈**: Vue 3 + TypeScript + Vite + Electron
- **状态**: ✅ 活跃开发中
- **特点**: 现代化UI，开发效率高

### 🔧 后端服务
- **路径**: `/server`  
- **技术栈**: Spring Boot
- **状态**: ✅ 活跃开发中

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
