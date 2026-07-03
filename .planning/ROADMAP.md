# Roadmap: reasonix-legacy

## Overview

Milestone M1「精简为纯 CLI」把项目从多前端(CLI/TUI + Web 面板 + Tauri 桌面)收敛为纯 CLI,同时保留 QQ/Telegram/微信聊天机器人接入能力。四个 phase 沿依赖链推进:先剥耦合最低的 Web 面板,再把机器人从桌面 sidecar 解耦到独立无头宿主(本里程碑难点),随后安全移除桌面 GUI,最后清理构建链并跑全量回归。每个 phase 交付一个"系统仍可工作"的垂直切片——纯 CLI 路径始终可用,核心 loop/工具/记忆/MCP/AcP 零回归。

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Web Panel Removal** - 切除 dashboard/ + src/server/ 及 CLI 内部面板适配代码,CLI/TUI 无面板运行 (completed 2026-07-03)
- [ ] **Phase 2: Bot Decoupling to Standalone CLI** - 提取无头对话宿主,QQ/TG/微信经独立 CLI 命令运行,复用核心循环
- [ ] **Phase 3: Desktop GUI Removal** - 移除 Tauri 桌面应用与 sidecar 外壳,desktop 命令下线,机器人不受影响
- [ ] **Phase 4: Build Chain Cleanup & Full Regression** - 构建链简化,CLI 独立构建发布,全量 verify 通过零回归

## Phase Details

### Phase 1: Web Panel Removal

**Goal:** Web dashboard(`dashboard/` + `src/server/`)与 CLI 内部面板适配代码完全切除,CLI/TUI 在无任何面板代码的情况下正常运行。
**Mode:** mvp
**Depends on**: Nothing (first phase, lowest coupling — 核心对 `src/server/` 仅 5 处弱引用)
**Requirements**: PANEL-01, PANEL-03
**Success Criteria** (what must be TRUE):

  1. `dashboard/` 与 `src/server/` 目录已移除;`src/` 下无任何文件 import `src/server` 或引用 `dashboard/`
  2. CLI 内部面板适配代码清除完毕——`App.tsx` 无 dashboard 钩子,无 `loop-to-dashboard`、`/dashboard` slash 命令、`cards-to-messages`、`picker-broadcast` 残留
  3. `reasonix chat` TUI 能正常发起并完成一轮对话(发消息 → 收模型回复 → 执行一次工具),无面板相关报错
  4. typecheck 与 build 通过(剥离 Web 面板后 CLI 可独立构建)

**Plans**: 2/2 plans executed

Plans:

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md

**Wave 1**

- [x] 01-01: 移除 `dashboard/` + `src/server/` 目录,清理 `src/` 对 server 的全部引用(import type 与动态 import)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02: 清理 i18n 面板死串 + 运行时 TUI 冒烟 — **完成**(panel i18n 死串移除,types.ts+5 locale 同步,收敛 116→24,commit cff185e7,typecheck/build/lint 绿);运行时冒烟通过(reasonix code 模式 read_file 读到 package.json 0.55.0,chat/code 双模式干净启动无面板报错)

**UI hint**: yes

### Phase 2: Bot Decoupling to Standalone CLI

**Goal:** QQ/Telegram/微信 channel 经一个传输协议无关的"无头对话宿主"作为独立 CLI 命令运行,复用核心 `CacheFirstLoop`/PauseGate/完整 ToolRegistry,不再依赖桌面 sidecar 或 Tauri JSON-RPC。
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: BOT-01, BOT-02, BOT-03
**Success Criteria** (what must be TRUE):

  1. 存在一个从 `src/cli/commands/desktop.ts` 提取的"无头对话宿主",复用核心 `CacheFirstLoop`、PauseGate、完整 ToolRegistry,与传输协议解耦(BOT-03)
  2. `reasonix qq`(或等效新 CLI 命令)可独立启动、收发 QQ 消息并驱动对话循环,运行时不依赖 Tauri JSON-RPC 协议(BOT-01)
  3. Telegram/微信 channel 可经同一无头宿主启动并收发消息——迁移现有 `src/telegram`/`src/weixin` 模块,未重写协议(BOT-02)
  4. 此阶段 `desktop.ts` sidecar 仍可运行(QQ 已迁出但 sidecar 未删,保证系统持续可用)

**Plans**: 3/3 plans executed

Plans:

- [x] 02-01-PLAN.md
- [x] 02-02-PLAN.md
- [x] 02-03-PLAN.md

- [x] 02-01: 从 `src/cli/commands/desktop.ts` 提取传输协议无关的"无头对话宿主"(对话循环 / 暂停门 / 工具集),核心复用不重复实现
- [x] 02-02: 将 QQ channel 挂载到无头宿主,提供独立 `reasonix qq` CLI 命令,脱离 Tauri JSON-RPC
- [x] 02-03: 把 Telegram/微信 channel 迁移到同一无头宿主,经独立 CLI 命令可启动收发消息

### Phase 3: Desktop GUI Removal

**Goal:** Tauri 桌面应用(`desktop/`)与 sidecar 外壳移除,`reasonix desktop` 子命令下线,已解耦的机器人接入不受影响。
**Mode:** mvp
**Depends on**: Phase 2(机器人已解耦到无头宿主,删 sidecar 前必须完成,否则 QQ 无宿主)
**Requirements**: PANEL-02
**Success Criteria** (what must be TRUE):

  1. `desktop/`(Tauri 应用)目录与 sidecar 外壳代码已移除
  2. `reasonix desktop` 子命令下线——Commander 不再注册该命令,执行时不再进入桌面流程
  3. `reasonix qq` / Telegram / 微信 命令仍能正常启动并收发消息(验证删 sidecar 未伤机器人宿主)
  4. CLI 核心命令(`chat`/`code`/`run`/`acp`)正常工作,系统保持可用

**Plans**: 1 plan

Plans:

- [ ] 03-01: 移除 `desktop/` 与 sidecar 外壳代码,从 Commander 注销 `reasonix desktop`,冒烟验证机器人三通道与 CLI 核心命令

### Phase 4: Build Chain Cleanup & Full Regression

**Goal:** 构建链全面简化——CLI 可独立构建发布;全量 `npm run verify` 通过,核心 loop/工具/记忆/MCP/AcP 零回归,tree-sitter 代码符号搜索保留可用。
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: PANEL-04, SAFE-01, SAFE-02, SAFE-03
**Success Criteria** (what must be TRUE):

  1. `npm run build` 不再依赖 `build:dashboard`/`copy-dashboard-vendor-css`;`files`/`postinstall`/`typecheck` 配置中无 dashboard/desktop 残留;CLI 可独立构建发布(PANEL-04)
  2. 所有纯 CLI 命令(`chat`/`code`/`run`/`acp`/`commit`/`sessions`/`replay`/`diff`/`mcp`/`doctor` 等)逐命令冒烟不回归(SAFE-01)
  3. `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` 保留可用,`code-query` 代码符号搜索正常工作——本 phase 删除清单不含它们(SAFE-02)
  4. `npm run verify`(build + lint + typecheck + test)全量通过,核心 loop/工具/记忆/MCP/AcP 零回归(SAFE-03)

**Plans**: 2 plans

Plans:

- [ ] 04-01: 简化构建链(移除 build:dashboard/copy-dashboard-vendor-css 依赖,清理 files/postinstall/typecheck 中 dashboard/desktop 配置),验证 CLI 独立构建发布
- [ ] 04-02: 全量回归——逐命令冒烟所有纯 CLI 命令,确认 tree-sitter grammars + code-query 保留可用,`npm run verify` 全绿

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Web Panel Removal | 2/2 | Complete    | 2026-07-03 |
| 2. Bot Decoupling to Standalone CLI | 3/3 | Complete (pending verification) | 2026-07-03 |
| 3. Desktop GUI Removal | 0/1 | Not started | - |
| 4. Build Chain Cleanup & Full Regression | 0/2 | Not started | - |

---
*Roadmap created: 2026-07-02 (Milestone M1: 精简为纯 CLI)*
