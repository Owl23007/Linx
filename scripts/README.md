# Git Hooks 共享说明

## 📋 概述

本项目使用 Git hooks 来确保代码质量，在每次提交前自动运行 ESLint 检查。

## 🚀 快速安装

### 方法一: 使用安装脚本（推荐）

**Windows (PowerShell):**
```powershell
.\scripts\install-hooks.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/install-hooks.sh
./scripts/install-hooks.sh
```

### 方法二: 手动安装

```bash
# 复制钩子文件
cp scripts/hooks/pre-commit .git/hooks/pre-commit

# Linux/Mac 需要设置执行权限
chmod +x .git/hooks/pre-commit
```

## 📁 钩子文件说明

| 文件名 | 描述 | 推荐用途 |
|--------|------|----------|
| `pre-commit` | 检查整个前端项目 | 初次安装、完整检查 |
| `pre-commit-staged-only` | 只检查即将提交的文件 | 日常开发（更快） |
| `*.ps1` | PowerShell 版本 | Windows 用户 |

## ⚙️ 配置选项

### 切换到快速模式（只检查暂存文件）
```bash
# Windows
Move-Item .git\hooks\pre-commit .git\hooks\pre-commit-full
Move-Item .git\hooks\pre-commit-staged-only .git\hooks\pre-commit

# Linux/Mac
mv .git/hooks/pre-commit .git/hooks/pre-commit-full
mv .git/hooks/pre-commit-staged-only .git/hooks/pre-commit
```

### 临时跳过钩子检查
```bash
git commit --no-verify -m "emergency fix"
```

## 🔧 故障排除

### 钩子没有运行？
1. 确认文件名为 `pre-commit`（无扩展名）
2. 确认文件有执行权限（Linux/Mac）
3. 检查 Git 配置：`git config core.hooksPath`

### ESLint 错误？
```bash
# 进入前端目录
cd front

# 自动修复问题
npm run lint:fix

# 查看所有问题
npm run lint
```

## 👥 团队协作

1. **新成员加入时**: 运行安装脚本即可
2. **更新钩子**: 重新运行安装脚本
3. **自定义钩子**: 修改 `scripts/hooks/` 中的文件，然后重新安装

## 📝 工作流程

```
开发者提交代码
    ↓
Git 执行 pre-commit 钩子
    ↓
运行 ESLint 检查
    ↓
✅ 通过 → 提交成功
❌ 失败 → 显示错误，阻止提交
```

---

💡 **提示**: 建议团队成员都使用相同的钩子配置，以确保代码质量一致性。
