# reasonix-legacy

## What This Is

DeepSeek 原生的命令行编程 agent。通过 CLI/TUI 暴露一个**缓存优先(cache-first)**的 agentic loop,自动修复模型输出的工具调用 JSON,并在 token 预算内折叠上下文。面向希望在终端内用 DeepSeek 完成编程任务、并严格控制 token 成本的开发者。

本仓库是上游的 fork,首个 fork release 为 v0.55.0。

## Core Value

在终端里跑一个**低成本、不中断**的 DeepSeek 编程 agent——缓存优先把 token 成本压到最低,工具调用 JSON 自修复保证 loop 不被坏输出打断。这是面板/UI 都可以失败、唯独不能失败的那一件事。

## Requirements

### Validated

<!-- 从既有代码(.planning/codebase/)推断,已上线且被依赖 -->

- ✓ **cache-first agentic loop** — 缓存优先的对话循环,降低 token 成本 — existing
- ✓ **工具调用 JSON 自修复** — flatten/scavenge/storm/truncation,修复模型坏输出 — existing
- ✓ **上下文折叠与 token 预算防御** — ContextManager 分层阈值折叠 — existing
- ✓ **完整工具集** — 文件/shell/web/plan/todo/memory/subagent/skills/java-source/code-query + MCP 桥接 — existing
- ✓ **会话持久化与恢复** — append-only 日志、session resume/healing — existing
- ✓ **ACP JSON-RPC** — IDE/编辑器集成入口 — existing
- ✓ **多语言 i18n** — zh/EN/ja/de/ru — existing
- ✓ **tree-sitter 代码符号语义检索** — code-query 工具 — existing
- ✓ **Web 面板剥离** — `dashboard/` + `src/server/` + CLI 内部面板适配代码完全切除,CLI/TUI 无面板运行 — Validated in Phase 1: Web Panel Removal (2026-07-03)
- ✓ **机器人接入解耦为独立 CLI 命令** — QQ/Telegram/微信 channel 经传输协议无关的 HeadlessHost 作为独立 CLI 命令运行,复用核心 CacheFirstLoop/PauseGate/完整 ToolRegistry,脱离桌面 sidecar 与 Tauri JSON-RPC — Validated in Phase 2: Bot Decoupling to Standalone CLI (2026-07-04)

### Active

<!-- 当前里程碑:精简为纯 CLI -->

- [ ] 剥离 Tauri 桌面 GUI(`desktop/` + sidecar 外壳)
- [ ] 清理面板相关死代码、config 项与构建链(build / files / postinstall / typecheck)
- [ ] 保证纯 CLI 路径(chat/code/run/acp 等)功能不回归

### Out of Scope

- Web 面板(`dashboard/`) — 用户不再维护,聚焦 CLI
- Tauri 桌面 GUI(`desktop/`) — 用户不再维护,聚焦 CLI
- 重写聊天机器人 channel 协议 — `src/qq|telegram|weixin` 已是独立模块,只需换宿主,不改协议

## Context

- 架构是 **multi-surface single-core**:核心 `CacheFirstLoop`(`src/loop.ts`)与所有 surface 单向依赖,核心不反向 import 任何 surface。详细地图见 `.planning/codebase/`(ARCHITECTURE / STACK / STRUCTURE / CONVENTIONS / INTEGRATIONS / TESTING / CONCERNS)。
- 耦合分析结论(本次精简的事实基础):
  - 核心指向 `src/server/` 仅 5 处,其中 4 处是 `import type`,唯一运行时引用是 `App.tsx` 的动态 `await import`(不触发不加载)。
  - `dashboard/` 对核心是磁盘静态资源(`assets.ts` 用 `readFileSync` 读),非代码依赖。
  - `src/cli/commands/desktop.ts`(sidecar)是 QQ 接入的宿主,与 Tauri JSON-RPC 协议纠缠——删 GUI 前必须先把 QQ 解耦。
  - `src/qq|telegram|weixin` 已是独立 channel 模块,解耦成本低;目前只有 QQ 接进了 sidecar。
- ⚠️ `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` 服务于 CLI 代码符号搜索,**与面板无关,任何阶段必须保留**。
- **当前进度(2026-07-03):** Phase 1(Web Panel Removal)完成 —— `dashboard/` + `src/server/` 已删,CLI 内部面板适配代码清零,typecheck/build/lint 绿,运行时冒烟通过(reasonix code 模式 read_file 读到 package.json 0.55.0)。收敛基线:src/ 下 24 处 "dashboard" 字面量(合法 stats CLI 命名 + 锚点注释),作 Phase 4 drift 基线。下一步 Phase 2:机器人从桌面 sidecar 解耦到无头宿主。
- **当前进度(2026-07-04):** Phase 2(Bot Decoupling to Standalone CLI)完成 —— 传输协议无关的 HeadlessHost(`src/cli/headless/`)复用 CacheFirstLoop/PauseGate/完整 ToolRegistry(零重实现);`reasonix qq`/`telegram`/`weixin` 三命令挂载同一宿主,脱离 Tauri JSON-RPC;`desktop` sidecar 字节未动(D-09 共存)。UAT:QQ + WeChat + desktop live-verified,Telegram deferred(缺 token,acknowledged)。8/8 架构 truth VERIFIED,`threats_open: 0`(WR-05 medium deferred)。下一步 Phase 3:移除桌面 GUI。

## Constraints

- **Tech stack**: TypeScript + tsup 打包;Node ≥22;Ink(React)TUI;Commander CLI;Vitest / Biome / Stryker。
- **Compatibility**: 保留 CLI 二进制入口(`reasonix` / `dsnix` → `dist/cli/index.js`)与 npm 包发布能力。
- **不回归**: 核心 loop / 工具 / 记忆 / MCP / AcP 代码零回归;tree-sitter grammars 构建链保留。

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 放弃 Web 面板 + Tauri 桌面 GUI,走纯 CLI | 用户不再维护面板,聚焦 CLI 体验 | Web 面板已剥离(Phase 1,2026-07-03);桌面 GUI 待 Phase 3 |
| 保留 QQ/Telegram/微信机器人接入 | 远程/移动控制能力仍有价值 | ✓ Phase 2 — qq/telegram/weixin 经 HeadlessHost 独立 CLI(2026-07-04) |
| 机器人接入解耦为独立 CLI 命令(非删、非保留 GUI) | 当前寄生在桌面 sidecar,删 GUI 必须先解耦 | ✓ Phase 2 完成 — core reuse 零重实现,脱离 Tauri JSON-RPC(2026-07-04) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-04 after Phase 3 (Desktop GUI Removal) completion*
