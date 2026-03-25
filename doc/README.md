# Linx 文档索引

最后更新：2026-03-25

## 1. 产品与设计

- [PRODUCT_DIRECTION.md](./PRODUCT_DIRECTION.md)
  - 产品定位、目标用户、主流程、非目标
- [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md)
  - 页面结构、核心实体、状态中心、关键流程
- [UX_COPY_GUIDE.md](./UX_COPY_GUIDE.md)
  - 交互语言、状态文案、错误文案规范
- [ROADMAP.md](./ROADMAP.md)
  - M1 到 M4 的里程碑拆分

## 2. 技术与架构

- [ARCHITECTURE_BASELINE.md](./ARCHITECTURE_BASELINE.md)
  - 当前代码基线、目标分层、迁移重点、风险
- [API_GATEWAY.md](./API_GATEWAY.md)
  - APISIX 公开路由、前端请求前缀、用户资料与本地服务对接约定
- [ADR-0001-product-positioning.md](./ADR-0001-product-positioning.md)
  - “从聊天应用转向联机组网工具”的首个架构决策记录

## 3. 过程与模板

- [DESIGN_DOC_TEMPLATE.md](./DESIGN_DOC_TEMPLATE.md)
  - 新功能设计文档模板
- [DESIGN_REVIEW_CHECKLIST.md](./DESIGN_REVIEW_CHECKLIST.md)
  - 设计评审检查清单
- [ADR_TEMPLATE.md](./ADR_TEMPLATE.md)
  - 架构决策记录模板

## 4. 执行与跟踪

- [TODO.md](./TODO.md)
  - 当前任务池和阶段性优先级
- [GIT_HOOKS_SETUP.md](./GIT_HOOKS_SETUP.md)
  - 本地开发和提交前检查配置

## 文档使用约定

1. 新功能进入开发前，先判断是否影响主流程、信息架构或核心实体。
2. 如果影响主流程，先新增或更新设计文档，再进入实现。
3. 如果影响核心技术边界、域模型或长期维护成本，补一份 ADR。
4. README 只保留项目级概览，详细说明沉淀到 `doc/`。
5. TODO 记录执行项，不替代设计文档。
