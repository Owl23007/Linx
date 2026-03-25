---
name: conventional-commit-message
description: 生成并校验符合 feat/fix/chore(scope): desc 的提交信息，优先产出简洁、可审查、可追踪的提交标题。
---

# Conventional Commit Generator

## 目标
为当前改动生成符合以下格式的提交标题：

type(scope): desc

其中：
- type 仅允许 feat / fix / chore
- scope 必填，使用小写短词（可用连字符）
- desc 支持中文或英文，使用现在时、简洁明确，不以句号结尾,通过用户触发时的输入语言与项目习惯保持一致，避免中英混杂和口语化缩写。

## 适用场景
- 需要快速生成标准化提交标题
- 提交前希望自动检查格式与语义质量
- 不确定改动应归类为 feat / fix / chore

## 输入
最少提供以下信息：
- 改动摘要（做了什么）
- 改动动机（为什么）
- 影响范围（哪个模块）

可选输入：
- 是否包含破坏性变更
- 是否需要关联 issue
- 是否偏好中文解释 + 英文提交标题
- body 里是否需要 issue 编号或变更背景

## 工作流
1. 识别改动类型
- 新功能或能力增强: feat
- 缺陷修复或错误修正: fix
- 杂项维护（配置、脚本、依赖、重构但无行为变化）: chore

2. 提取 scope
- 从受影响模块中选一个最核心范围
- scope 使用小写，如 auth, lobby, build-tools, ci
- 不确定时，默认 app

3. 生成 desc
- 使用动词开头，如 add, fix, refactor, update, remove
- 说明可观察结果，而非实现细节
- 长度建议 8-60 个字符

4. 组装提交标题
- 输出为: type(scope): desc
- 冒号后保留一个空格

5. 质量检查
- type 是否为 feat/fix/chore 之一
- scope 是否存在且为小写短词
- desc 是否清晰、无句号、无无意义词（stuff, update things）
- desc 允许中文或英文，但需避免中英混乱和口语化缩写
- 标题总长度是否易读（建议 <= 72 字符）

## 分支决策
- 同时包含功能与修复时：按主要用户价值选择 type；若难以判断，优先 fix。
- 改动跨多个模块时：scope 取主要变更模块；不要写多个 scope。
- 仅格式化代码但无行为变化：chore。
- 仅重命名/清理但无行为变化：chore。

## 输出要求
默认输出 3 个候选（标题 + body），按推荐度排序：
1. 最推荐提交标题
2. 备选提交标题 A
3. 备选提交标题 B

并附加：
- 一句话说明为何选择该 type
- 一句话说明 scope 的依据
- 每个候选附 1-2 行 body，说明变更动机或用户可感知影响

## 快速提示词
- 根据当前暂存改动生成 3 条 feat/fix/chore(scope): desc 提交标题
- 这次改动是修复登录超时，scope 在 auth，请给出 3 条合规提交标题
- 帮我检查这条提交是否合规: fix(Auth): fix timeout.
- 基于当前改动生成 3 组提交（标题 + body），desc 可用中文

## 完成标准
当且仅当满足以下条件，任务视为完成：
- 至少给出 1 条完全合规标题
- 给出 type 与 scope 的判断依据
- 若用户提供标题不合规，明确指出错误并给出修正版
