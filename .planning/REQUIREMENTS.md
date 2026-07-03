# Requirements: reasonix-legacy

**Defined:** 2026-07-02
**Core Value:** 在终端里跑一个低成本、不中断的 DeepSeek 编程 agent——缓存优先压低成本,工具调用 JSON 自修复保证 loop 不被打断。

本里程碑(M1:精简为纯 CLI)的目标是把项目从多前端收敛为纯 CLI,同时保留聊天机器人接入能力。

## v1 Requirements

### Panel Removal(面板剥离)

- [x] **PANEL-01**: `dashboard/` 与 `src/server/` 整体移除——`src/` 核心无残留引用,构建无残留依赖
- [ ] **PANEL-02**: `desktop/`(Tauri 应用)与桌面 sidecar 外壳移除,`reasonix desktop` 子命令下线
- [x] **PANEL-03**: CLI 内部面板适配代码清理(`App.tsx` 的 dashboard 钩子、`loop-to-dashboard`、`/dashboard` slash、`cards-to-messages`、`picker-broadcast`)
- [ ] **PANEL-04**: 构建链简化——`build` 不再依赖 `build:dashboard`/`copy-dashboard-vendor-css`,`files`/`postinstall`/`typecheck` 去掉 dashboard/desktop,CLI 可独立构建发布

### Bot Decoupling(聊天机器人解耦)

- [x] **BOT-01**: QQ 接入从桌面 sidecar 解耦为独立 CLI 命令,不依赖 Tauri JSON-RPC 协议即可运行
- [x] **BOT-02**: Telegram/微信 channel 保留可用,可经独立 CLI 宿主启动(迁移现有接入,不重写协议)
- [x] **BOT-03**: 机器人复用核心对话循环 / 暂停门 / 工具集,不重复实现

### Regression Safety(不回归)

- [ ] **SAFE-01**: 纯 CLI 命令(`chat`/`code`/`run`/`acp`/`commit`/`sessions`/`replay`/`diff`/`mcp`/`doctor` 等)功能不回归
- [ ] **SAFE-02**: tree-sitter grammars 构建与 `code-query` 代码符号搜索保留可用
- [ ] **SAFE-03**: `npm run verify`(build + lint + typecheck + test)通过;核心 loop/工具/记忆/MCP 零回归

## Out of Scope

| Feature | Reason |
|---------|--------|
| Web 面板(`dashboard/`) | 用户不再维护,聚焦 CLI |
| Tauri 桌面 GUI(`desktop/`) | 用户不再维护,聚焦 CLI |
| 重写 QQ/Telegram/微信 channel 协议 | 已是独立模块,只换宿主,不改协议 |
| 新增 CLI 功能 | 本里程碑只做精简,不加新能力 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PANEL-01 | Phase 1 | Complete |
| PANEL-03 | Phase 1 | Complete |
| BOT-01 | Phase 2 | Complete |
| BOT-02 | Phase 2 | Complete |
| BOT-03 | Phase 2 | Complete |
| PANEL-02 | Phase 3 | Pending |
| PANEL-04 | Phase 4 | Pending |
| SAFE-01 | Phase 4 | Pending |
| SAFE-02 | Phase 4 | Pending |
| SAFE-03 | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 10 total
- Mapped to phases: 10 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-02*
*Last updated: 2026-07-02 — traceability populated by roadmapper (M1: 精简为纯 CLI)*
