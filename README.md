# Linx - 聊天应用

一个现代化的聊天应用，支持多种客户端形式。

## 📦 项目结构

``` tree
├── server/   # 🚀 Spring Boot 后端服务
├── front/    # 💻 Vue.js + Electron 桌面客户端
└── client/   # ⚠️  JavaFX 桌面客户端 (已弃用，仅存档)
```

> 网关服务另见:https://github.com/Owl23007/infra-local
> auth 服务另见: https://github.com/Owl23007/auth-service/tree/develop

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

### ⚡ 首次设置（重要）

**一键完整设置:**

```bash
npm run setup
```

**或分步设置:**

```bash
# 1. 安装前端依赖
npm run setup:front

# 2. 安装 Git hooks（代码质量检查）
npm run install-hooks    # 自动检测系统
# 或手动选择
npm run install-hooks-ps1   # Windows PowerShell
npm run install-hooks-bash  # Linux/Mac/Git Bash
```

> 💡 Git hooks 会在每次提交前自动运行 ESLint 检查，确保代码质量

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
