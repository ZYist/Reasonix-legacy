# reasonix-legacy

## What This Is

DeepSeek 原生的命令行编程 agent。通过 CLI/TUI 暴露一个**缓存优先(cache-first)**的 agentic loop,自动修复模型输出的工具调用 JSON,并在 token 预算内折叠上下文。面向希望在终端内用 DeepSeek 完成编程任务、并严格控制 token 成本的开发者。

本仓库是上游的 fork,首个 fork release 为 v0.55.0。v1.0「Pure CLI」里程碑(2026-07-05)把项目从多前端(CLI/TUI + Web 面板 + Tauri 桌面)收敛为**纯 CLI**,同时保留 QQ/Telegram/微信聊天机器人接入能力。

## Core Value

在终端里跑一个**低成本、不中断**的 DeepSeek 编程 agent——缓存优先把 token 成本压到最低,工具调用 JSON 自修复保证 loop 不被坏输出打断。这是面板/UI 都可以失败、唯独不能失败的那一件事。

## Requirements

### Validated

<!-- 既有代码已上线且被依赖,或本里程碑已交付 -->

- ✓ **cache-first agentic loop** — 缓存优先的对话循环,降低 token 成本 — existing
- ✓ **工具调用 JSON 自修复** — flatten/scavenge/storm/truncation,修复模型坏输出 — existing
- ✓ **上下文折叠与 token 预算防御** — ContextManager 分层阈值折叠 — existing
- ✓ **完整工具集** — 文件/shell/web/plan/todo/memory/subagent/skills/java-source/code-query + MCP 桥接 — existing
- ✓ **会话持久化与恢复** — append-only 日志、session resume/healing — existing
- ✓ **ACP JSON-RPC** — IDE/编辑器集成入口 — existing
- ✓ **多语言 i18n** — zh/EN/ja/de/ru — existing
- ✓ **tree-sitter 代码符号语义检索** — code-query 工具 — existing
- ✓ **Web 面板剥离** — `dashboard/` + `src/server/` + CLI 内部面板适配代码完全切除,CLI/TUI 无面板运行 — v1.0 (Phase 1, 2026-07-03)
- ✓ **机器人接入解耦为独立 CLI 命令** — QQ/Telegram/微信 channel 经传输协议无关的 HeadlessHost 作为独立 CLI 命令运行,复用核心 CacheFirstLoop/PauseGate/完整 ToolRegistry,脱离桌面 sidecar 与 Tauri JSON-RPC — v1.0 (Phase 2, 2026-07-04)
- ✓ **Tauri 桌面 GUI 剥离** — `desktop/` + 3555 行 sidecar god module + `src/desktop/` 移除,`reasonix desktop` 退役为 i18n 薄 stub(exit 1),机器人接入不受影响 — v1.0 (Phase 3, 2026-07-04)
- ✓ **构建链简化** — `postinstall.mjs`/`sync-desktop-version.mjs`/`release.yml` 退役,`package.json`/`ci.yml`/`.claude/CLAUDE.md` 对齐纯 CLI,`npm pack` 输出干净 CLI-only tarball(无 postinstall 钩子) — v1.0 (Phase 4, 2026-07-05)
- ✓ **纯 CLI 路径零回归** — 19 个命令 `--help` 全绿、8 个离线命令功能冒烟、tree-sitter `code-query` 跨 6 语言 e2e 存活;核心 loop/工具/记忆/MCP/AcP 零回归(14 baseline 红 → 3 evidence-deferred 预存红) — v1.0 (Phase 4, 2026-07-05)

### Active

<!-- 下一个里程碑(v1.1)尚未定义。运行 /gsd-new-milestone 启动 questioning → research → requirements → roadmap。 -->

(待 v1.1 里程碑定义)

### Out of Scope

- Web 面板(`dashboard/`) — 用户不再维护,聚焦 CLI;v1.0 已物理移除
- Tauri 桌面 GUI(`desktop/`) — 用户不再维护,聚焦 CLI;v1.0 已物理移除
- 重写聊天机器人 channel 协议 — `src/qq|telegram|weixin` 已是独立模块,只换宿主不改协议
- 新增 CLI 功能 — 精简优先于新增

## Context

- 架构是 **multi-surface single-core**:核心 `CacheFirstLoop`(`src/loop.ts`)与所有 surface 单向依赖,核心不反向 import 任何 surface。详细地图见 `.planning/codebase/`(ARCHITECTURE / STACK / STRUCTURE / CONVENTIONS / INTEGRATIONS / TESTING / CONCERNS)。
- **当前状态(2026-07-05,v1.0 Pure CLI shipped):** 项目已是纯 CLI——Web 面板与 Tauri 桌面 GUI 均已物理移除,QQ/Telegram/微信经独立 CLI 命令(`reasonix qq`/`telegram`/`weixin`)挂载同一 `HeadlessHost`(`src/cli/headless/`),脱离已删的桌面 sidecar。构建链干净:`npm run build` 绿,`npm pack` 输出 9.2 MB / 168 文件的 CLI-only tarball。`npm run verify`:build/lint/typecheck exit 0,test = 3 failed | 266 passed(3 个预存红 evidence-deferred 到 fix cycle)。
- **关键红线(贯穿 v1.0,仍生效):** `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` 服务 CLI 代码符号搜索,任何阶段必须保留。v1.0 全程未触及。
- **已知技术债(留 fix cycle):**
  - 3 个预存红测试:`tests/ssh-remote.test.ts`(RFC dry-run,SSH tunnel feature 未实现)、`tests/ui-mcp-marketplace-snapshot.test.ts`(`buildMarketplacePickerSnapshot` 从未导出)、`tests/ui-slash-suggestions.test.tsx`(命令数 10→9 drift)。
  - `tests/hydrate-cards.test.ts:135` Biome suppressions/unused 预存警告。
  - WR-05(3 个 command controller 的 raw `Error.message` 未脱敏直写 stderr,medium)+ IN-01..06(turn-driver error 恢复、gate 并发、weixin QR 窗口 SIGINT 等,02-VERIFICATION.md followups_deferred)。
  - **HeadlessHost 渲染缺口(accepted-and-deferred):** `runTurn` 未订阅 `turn-driver` 的 `onEvent` 回调 → 全部 channel 都丢弃 reasoning/tool 事件(weixin UAT #2 暴露)。非回归,是 Phase-2 既存架构;stream-to-chat 是适用于全部 3 channel 的新功能,路由到未来 channel-streaming phase。

## Constraints

- **Tech stack**: TypeScript + tsup 打包;Node ≥22;Ink(React)TUI;Commander CLI;Vitest / Biome / Stryker。
- **Compatibility**: 保留 CLI 二进制入口(`reasonix` / `dsnix` → `dist/cli/index.js`)与 npm 包发布能力。
- **不回归**: 核心 loop / 工具 / 记忆 / MCP / AcP 代码零回归;tree-sitter grammars 构建链保留。

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 放弃 Web 面板 + Tauri 桌面 GUI,走纯 CLI | 用户不再维护面板,聚焦 CLI 体验 | ✓ v1.0 — Web 面板剥离(Phase 1,2026-07-03)+ 桌面 GUI 移除(Phase 3,2026-07-04) |
| 保留 QQ/Telegram/微信机器人接入 | 远程/移动控制能力仍有价值 | ✓ v1.0 — qq/telegram/weixin 经 HeadlessHost 独立 CLI(Phase 2,2026-07-04) |
| 机器人接入解耦为独立 CLI 命令(非删、非保留 GUI) | 删 GUI 前必须先把 QQ 从桌面 sidecar 解耦 | ✓ v1.0 — core reuse 零重实现,脱离 Tauri JSON-RPC(Phase 2) |
| phase 依赖序 1→2→3→4 | 先剥耦合最低的面板,再解耦机器人(难点),删 GUI 前宿主就位,最后清构建+回归 | ✓ v1.0 — 4 phase 全绿,每个 phase 交付"系统仍可用"垂直切片 |
| HeadlessHost 新建模块而非就地重构 desktop.ts | desktop.ts 3555 行混合 RPC/Tab/TUI,就地重构触碰不可回归面 | ✓ v1.0 — 复刻 buildRuntimeFor recipe,sidecar 字节级未动直到 Phase 3 才删 |
| 三 channel 薄入口不抽 BaseChannelAdapter | qq/telegram/weixin ~150 行平行,但分歧(Telegram 无 onInfo、Weixin QR-login-before-start)是协议层差异 | ⚠️ Revisit — Phase 4 构建清理未抽,future fix cycle 可评估去重 |

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
*Last updated: 2026-07-05 after v1.0 Pure CLI milestone*
