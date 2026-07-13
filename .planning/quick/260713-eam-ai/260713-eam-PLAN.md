---
quick: 260713-eam
phase: quick-260713-eam
plan: "01"
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: []
files_modified:
  - .planning/HIGH-RISK-AI-GUIDE.md
  - .planning/quick/260713-eam-ai/260713-eam-SUMMARY.md
---

<objective>
把 quick 260713-e2u 识别出的高风险项转化为一份后续 AI 可直接执行的治理与修改指南。

报告必须提供风险证据、决策门、修改边界、推荐顺序、文件入口、测试策略、停止条件和验收标准；它指导修改，但本任务不修改产品源码。
</objective>

<context>
@.planning/quick/260713-e2u-assess-current-project/260713-e2u-SUMMARY.md
@.planning/STATE.md
@.planning/PROJECT.md
@.planning/ROADMAP.md
@package.json
@vitest.config.ts
@.github/workflows/ci.yml
@src/cli/ui/App.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: 编写高风险 AI 修改指南</name>
  <files>.planning/HIGH-RISK-AI-GUIDE.md, .planning/quick/260713-eam-ai/260713-eam-SUMMARY.md</files>
  <action>按风险建立独立 work package，说明哪些判断必须由人决定、AI 可以修改哪些文件、不得修改什么、应先补哪些测试、每个包如何验证和回滚。加入统一执行协议和可复制的任务模板，避免后续 AI 进行大爆炸式重构。</action>
  <verify>所有关键路径在当前仓库存在；报告与上一轮实测数据一致；Markdown 结构完整；产品源码无改动。</verify>
  <done>后续 AI 能只读该指南和指定事实源，按 P0→P2 顺序安全实施高风险整改。</done>
</task>

</tasks>

<verification>
- 检查报告引用的路径和命令。
- 检查风险包具有输入、边界、步骤、验收和停止条件。
- `git diff --check` 通过，且无产品源码改动。
</verification>

<success_criteria>
- 生成 `.planning/HIGH-RISK-AI-GUIDE.md`。
- 明确 human decision gates，AI 不擅自决定版本/分支政策。
- 禁止无特征测试的 App.tsx 大重构。
- 每个高风险项都有可执行的验证门禁。
</success_criteria>
