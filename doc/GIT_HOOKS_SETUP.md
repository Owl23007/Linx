# 🎯 Git hooks快速设置指南

## 开始开发

1. **克隆项目后，立即运行:**

   ```bash
   npm run install-hooks      # 自动检测系统并使用合适的脚本

   # 或手动选择平台
   npm run install-hooks-ps1   # Windows PowerShell
   npm run install-hooks-bash  # Linux/Mac/Git Bash
   ```

2. **一键完整设置:**

   ```bash
   npm run setup  # 安装依赖 + 设置钩子
   ```

3. **开始开发!**

## 日常使用

### 正常提交

```bash
git add .
git commit -m "feat: 添加新功能"
```

### 紧急提交（跳过检查）

```bash
git commit --no-verify -m "hotfix: 紧急修复"
```
