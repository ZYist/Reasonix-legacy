---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 1
current_phase_name: Web Panel Removal
status: planning
stopped_at: ROADMAP.md / STATE.md created; REQUIREMENTS.md traceability populated
last_updated: "2026-07-02T14:04:23.311Z"
last_activity: 2026-07-02
last_activity_desc: Roadmap created for Milestone M1「精简为纯 CLI」
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 8
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-02)

**Core value:** 在终端里跑一个低成本、不中断的 DeepSeek 编程 agent——缓存优先压低成本,工具调用 JSON 自修复保证 loop 不被打断。
**Current focus:** Phase 1 — Web Panel Removal

## Current Position

Phase: 1 of 4 (Web Panel Removal)
Plans: 2 planned (0 executed) in current phase — 01-01 (wave 1), 01-02 (wave 2)
Status: Ready to execute Phase 1
Last activity: 2026-07-02 — Phase 1 planned: 2 plans written, plan-checker PASS (0 blockers)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: — min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Web Panel Removal | 0/2 | — | — |
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

### Pending Todos

None yet.

### Blockers/Concerns

- 关键约束(贯穿所有 phase):`scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` 必须保留,任何 phase 的删除清单不得包含它们(服务 CLI 代码符号搜索)。
- 关键依赖:Phase 3(删 desktop sidecar)必须在 Phase 2(QQ 解耦到无头宿主)之后,否则 QQ 无宿主。
- 不回归红线:核心 loop / 工具 / 记忆 / MCP / AcP 零回归;每个 phase 保持纯 CLI 可用(MVP 模式垂直切片)。

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-07-02
Stopped at: Phase 1 planned (01-01-PLAN.md, 01-02-PLAN.md created; plan-checker PASS)
Resume file: .planning/phases/01-web-panel-removal/01-01-PLAN.md
