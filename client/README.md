# ⚠️ DEPRECATED: JavaFX Desktop Client

## 📋 状态: 已弃用，仅用于存档

该 JavaFX 桌面客户端已被弃用，不再进行主动开发或维护。


### 📦 替代方案

请使用位于 `/front` 目录的前端：
- **技术栈**: Vue 3 + TypeScript + Vite + Electron
- **优势**: 更好的开发体验、丰富的组件库、现代化的构建工具链


### ⚡ 快速开始 (仅用于参考)

如果需要运行此弃用版本（不推荐）：

```bash
# 注意：需要 Java 21+
cd client
mvn clean compile
mvn javafx:run
```

### 🔄 迁移建议

如果你正在查看此代码：

 **新项目开发**: 请使用 `/front` 目录的 Vue.js 版本

---

**最后更新**: 2025年8月  
**状态**: 🗄️ 存档状态，不再维护  
**推荐**: 使用 Vue.js + Electron 版本 (`/front`)