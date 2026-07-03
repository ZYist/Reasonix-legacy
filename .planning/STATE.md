---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 2
current_phase_name: not yet planned
status: verifying
stopped_at: Phase 2 02-02 complete — reasonix qq mounts QQ on HeadlessHost (BOT-01)
last_updated: "2026-07-03T08:53:23.515Z"
last_activity: 2026-07-03
last_activity_desc: Phase 01 complete (goal verified 4/4, code review clean), transitioned to Phase 2
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 5
  completed_plans: 4
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-02)

**Core value:** 在终端里跑一个低成本、不中断的 DeepSeek 编程 agent——缓存优先压低成本,工具调用 JSON 自修复保证 loop 不被打断。
**Current focus:** Phase 02 — Bot Decoupling to Standalone CLI

## Current Position

Phase: 2 — Bot Decoupling to Standalone CLI (in progress)
Plans: Phase 01 complete (2/2 — 01-01, 01-02); Phase 02 in progress (2/3 — 02-01 headless host, 02-02 reasonix qq; 02-03 telegram/weixin pending)
Status: Phase 02 02-02 complete — reasonix qq mounts QQ on HeadlessHost (BOT-01); next is 02-03
Last activity: 2026-07-03 — Phase 02 02-02 complete (QQ decoupled from Tauri sidecar)

Progress: [███░░░░░░░] 25% milestone (1/4 phases)

## Performance Metrics

**Velocity:**

- Total plans completed: 2
- Average duration: ~69 min (01-01: 57min, 01-02: ~24min incl. human smoke)
- Total execution time: ~1.35 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Web Panel Removal | 2/2 | ~81 min | ~69 min |
| 2. Bot Decoupling | 0/3 | — | — |
| 3. Desktop GUI Removal | 0/1 | — | — |
| 4. Build Chain & Regression | 0/2 | — | — |

**Recent Trend:**

- Last 5 plans: —
- Trend: — (not started)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- M1: 放弃 Web 面板 + Tauri 桌面 GUI,走纯 CLI(聚焦 CLI 体验)
- M1: 机器人接入解耦为独立 CLI 命令(删 GUI 前必须先解耦 QQ)
- M1: phase 依赖序锁定为 1(Web 剥离) → 2(机器人解耦) → 3(删桌面) → 4(构建清理 + 回归)
- 01-01: 保留 dist/cli ESM marker(拆为 write-cli-package-marker.mjs)避免静默回归
- 01-01: i18n 面板死串(93 条)+ 叙事注释交由 01-02 清理,本计划只切除代码耦合
- 01-01: 删除 12 个面板专属测试(仅覆盖已删 server/bridge 表面,无核心逻辑存活)
- 01-02 Task 1: 移除面板 i18n 死串(types.ts 契约 + 5 locale 同步,handlers/slash 索引签名段一并清理),收敛基线 116→24;顺手清理 plan-store.ts 事故叙事与 App.tsx 过期面板引用注释
- 01-02 Task 1: 剩余 24 处 "dashboard" 字面量为合法 stats CLI 功能命名(reasonix stats 的 dashboard()/renderDashboard)与带 issue 锚点的隐藏约束注释,作为 Phase 4 drift 基线保留

### Pending Todos

None yet.

### Blockers/Concerns

- 关键约束(贯穿所有 phase):`scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` 必须保留,任何 phase 的删除清单不得包含它们(服务 CLI 代码符号搜索)。
- 关键依赖:Phase 3(删 desktop sidecar)必须在 Phase 2(QQ 解耦到无头宿主)之后,否则 QQ 无宿主。
- 不回归红线:核心 loop / 工具 / 记忆 / MCP / AcP 零回归;每个 phase 保持纯 CLI 可用(MVP 模式垂直切片)。

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| i18n | 93 条面板死串(/dashboard、--no-dashboard、dashboardPortInvalid、dashboardAutoStartFailed 等) | 已清理(01-02 Task 1, commit cff185e7) | 01-01 |
| 叙事注释 | 23 处 src/ 内描述性 "dashboard" 注释(非耦合代码) | 事故叙事已清理(plan-store.ts/App.tsx);合法 stats 命名 + 隐藏约束注释作基线保留(01-02 Task 1) | 01-01 |
| 运行时冒烟 | TUI 一轮对话冒烟(需交互式 TTY + DeepSeek key) | 已通过(01-02 Task 2:code 模式 read_file → 0.55.0) | 01-01 |

## Session Continuity

Last session: 2026-07-03T08:52:58.286Z
Stopped at: Phase 2 02-02 complete — reasonix qq mounts QQ on HeadlessHost (BOT-01)
Resume file: .planning/phases/02-bot-decoupling-to-standalone-cli/02-02-SUMMARY.md
