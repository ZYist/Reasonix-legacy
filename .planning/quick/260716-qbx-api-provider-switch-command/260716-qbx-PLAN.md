---
quick: 260716-qbx
phase: quick-260716-qbx
plan: "01"
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: []
files_modified:
  - .planning/quick/260716-qbx-api-provider-switch-command/260716-qbx-SUMMARY.md
  - .planning/STATE.md
---

<objective>
评估 Reasonix 是否应新增 API 供应商切换能力，并给出兼顾稳定性与易用性的命令、配置和客户端抽象建议。

本 quick task 只形成证据化设计建议，不直接修改运行时代码；重点回答现有能力缺口、推荐交互、MVP 边界、兼容迁移和实施风险。
</objective>

<context>
@src/config.ts
@src/client.ts
@src/cli/index.ts
@src/cli/commands/doctor.ts
@src/cli/commands/setup.tsx
@src/cli/ui/Wizard.tsx
@src/cli/ui/App.tsx
@tests/config.test.ts
@docs/configuration.md
@docs/getting-started.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: 评估供应商切换的必要性与现状</name>
  <files>.planning/quick/260716-qbx-api-provider-switch-command/260716-qbx-SUMMARY.md</files>
  <action>检查当前 endpoint/model/key 配置优先级、OpenAI-compatible 兼容入口、DeepSeek 特有假设、doctor/setup/TUI/各命令的客户端构造方式，区分“已经能手工接入”与“尚无一等用户体验”。</action>
  <verify>关键判断能追溯到当前源码或测试，不把未经验证的第三方供应商兼容性当作既成事实。</verify>
  <done>明确是否值得新增命令，以及为什么不能只做一个覆盖全局 baseUrl 的简单开关。</done>
</task>

<task type="auto">
  <name>Task 2: 提出稳定、可迁移的 provider profile 方案</name>
  <files>.planning/quick/260716-qbx-api-provider-switch-command/260716-qbx-SUMMARY.md</files>
  <action>设计命令面、配置模型、运行时客户端边界、能力协商、迁移优先级、错误处理、测试矩阵和分阶段交付范围；明确首期只承诺 OpenAI-compatible Chat Completions profiles。</action>
  <verify>方案覆盖 code/chat/run/commit/acp、doctor/setup、TUI 与渠道命令的统一解析，并保留现有 DeepSeek 配置兼容。</verify>
  <done>形成可进入后续 phase planning 的建议与验收标准，同时列出明确非目标。</done>
</task>

</tasks>

<verification>
- 仅修改 quick artifacts 与 STATE.md，不修改产品源码。
- 结论同时考虑稳定性、易用性、向后兼容和跨命令一致性。
- 不承诺“所有模型供应商均兼容”；协议/能力边界写清楚。
</verification>

<success_criteria>
- 回答“是否需要新增指令”。
- 给出推荐命令名称和基本用法。
- 给出配置/profile 结构与兼容迁移策略。
- 明确 MVP、后续扩展与不建议现在做的事项。
- 给出进入正式实施阶段前的关键验收标准。
</success_criteria>
