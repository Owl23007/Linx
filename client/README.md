# ⚠️ DEPRECATED: JavaFX Desktop Client

## 📋 状态: 已弃用，仅用于存档

该 JavaFX 桌面客户端已被弃用，不再进行主动开发或维护。

### 🚫 弃用原因

- **UI 开发复杂度过高**: JavaFX 的界面开发相对复杂，开发效率较低
- **现代化替代方案**: Vue.js + Electron 提供了更好的开发体验和更现代的 UI 框架

### 📦 替代方案

请使用位于 `/front` 目录的现代化前端：
- **技术栈**: Vue 3 + TypeScript + Vite + Electron
- **优势**: 更好的开发体验、丰富的组件库、现代化的构建工具链

### 🗂️ 存档价值

虽然已弃用，但此代码库仍保留用于：

1. **代码复用**: 部分代码按规范编写，可能在未来项目中复用
2. **架构参考**: 配置系统、日志工具等模块化设计可供参考
3. **学习资源**: 作为 JavaFX 开发的学习示例

### 📁 关键组件说明

#### 🔧 工具类 (推荐复用)
- `LogUtil`: 轻量级日志工具
- `AppConfig`: YAML 配置管理
- `ConfigInjector`: 依赖注入配置

#### 🎨 UI 组件 (仅供参考)
- `ClientApplication`: JavaFX 应用程序入口
- `AuthController`: 认证界面控制器
- `ErrorDialogUtil`: 错误对话框工具

#### 📋 配置文件
- `module-info.java`: Java 模块配置
- `application.yml`: 应用配置
- `auth-view.fxml`: UI 布局文件
- `auth-style.css`: 样式文件

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

1. **新项目开发**: 请使用 `/front` 目录的 Vue.js 版本
2. **功能参考**: 可以参考此处的业务逻辑实现
3. **工具类复用**: `util/` 和 `config/` 包下的工具类可以考虑复用

---

**最后更新**: 2025年1月  
**状态**: 🗄️ 存档状态，不再维护  
**推荐**: 使用 Vue.js + Electron 版本 (`/front`)