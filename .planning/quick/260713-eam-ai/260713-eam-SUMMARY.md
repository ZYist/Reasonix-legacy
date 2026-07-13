---
quick: 260713-eam
status: complete
branch: dev
commits:
  - b8f02b1d
---

# Quick Task 260713-eam — 高风险 AI 修改指南

## What shipped

新增长期指导文档：`.planning/HIGH-RISK-AI-GUIDE.md`。

该文档把上一轮项目健康评估中的高风险项转换成可执行的 AI 修改契约，包含：

- 当前证据基线与必须保护的系统不变量；
- AI 开工、fresh baseline、测试、提交和停止协议；
- 四个必须由人决定的 HUMAN GATES：版本权威、公开仓库身份、开发分支策略、coverage policy；
- WP-00 到 WP-05 的强制实施顺序；
- 对外版本/README 收敛、内部事实源清理、关键路径特征测试、CI/flaky 可见性、大型模块拆分的逐包指导；
- 每个 work package 的目标文件、修改边界、推荐步骤、验证命令、验收和回滚条件；
- 后续 AI 可直接复制的任务模板和最终完成定义。

## Key safety decisions

- 后续 AI 不得自行决定版本、repo identity、branch policy 或 coverage threshold。
- 禁止无特征测试的一次性 App.tsx 重写。
- 禁止把历史 CHANGELOG、合法 stats dashboard 与已删除 Web dashboard 混淆。
- 删除 desktop/Tauri 残留前必须通过 live grep 证明无 consumer，并防止测试数量/coverage 虚假改善。
- 强制按 `决策 → 事实源 → 特征测试/CI → 小步重构` 顺序实施。

## Verification

- 验证报告引用的 23 个关键 live paths 全部存在。
- `docs/qq-connect*.md` 匹配 2 个当前文档。
- 报告包含 14 个二级章节、6 个 work-package 章节。
- HUMAN GATE、禁止事项、验收与停止条件均已覆盖。
- `git diff --check` 通过。
- pre-commit `npm run lint` 通过：684 files，0 fixes。
- 产品源码未修改。

## Commit

- `b8f02b1d docs: add high-risk AI remediation guide`
