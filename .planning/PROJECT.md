# reasonix-legacy

## What This Is

DeepSeek 原生的命令行编程 agent。通过 CLI/TUI 暴露一个**缓存优先(cache-first)**的 agentic loop,自动修复模型输出的工具调用 JSON,并在 token 预算内折叠上下文。面向希望在终端内用 DeepSeek 完成编程任务、并严格控制 token 成本的开发者。

本仓库是上游的 fork,首个 fork release 为 v0.55.0。v1.0「Pure CLI」里程碑(2026-07-05)把项目从多前端(CLI/TUI + Web 面板 + Tauri 桌面)收敛为**纯 CLI**,同时保留 QQ/Telegram/微信聊天机器人接入能力。v1.3「Stable Release Hardening」里程碑(2026-07-18)进一步把当前维护表面收敛为单一 `reasonix-legacy` 发布身份,并为 Windows 基线下的本地稳定候选补齐了可审计的打包与发布证据。

## Core Value

在终端里跑一个**低成本、不中断**的 DeepSeek 编程 agent——缓存优先把 token 成本压到最低,工具调用 JSON 自修复保证 loop 不被坏输出打断。这是面板/UI 都可以失败、唯独不能失败的那一件事。

## Current Milestone: v1.3.1 LTS Release

**Goal:** 将已通过本地稳定版审计的 1.3 基线转化为用户可安装、可验证、具备明确支持期限与升级路径的 `reasonix-legacy@1.3.1` 正式 LTS 发布。

**Target features:**
- 把 package、lockfile、CLI 版本、文档和发布工作流统一提升到 `1.3.1`，并继续只暴露 `reasonix-legacy` 公共身份。
- 固化 LTS 支持合同：至少支持 6 个月或下一稳定版本发布后 90 天（取较晚者），明确 patch 范围、安全响应、EOL 通知和 1.4 后并行维护规则。
- 提供 1.2 → 1.3.1 的安装、命令迁移、升级验证和回滚说明。
- 在不可变候选上完成 Windows clean verify、production audit、真实 pack、外部隔离安装和 registry tarball smoke 证据。
- 对正式 tag、Windows CI、CodeQL、npm publish、GitHub Release、TTY 与 Telegram/Weixin UAT建立可审计的 operator gate，不伪造远端或凭据依赖步骤已完成。

**Locked direction:**
- 唯一 LTS 主线为 1.3.x；不把 1.2 重新包装为 LTS，也不维护常规 1.2 patch 分支。
- 保持 DeepSeek-first，不引入多模型/provider 抽象或与 LTS 发布无关的新产品功能。
- npm package 与 CLI 公共身份保持为 `reasonix-legacy`，不得恢复 `reasonix`/`dsnix` bin。
- 强制发布验证基线继续为 Windows + Node.js 24.15.0 + npm 11.16.0 + PowerShell。
- tag/push、npm publish、GitHub Release、branch protection 和真实凭据/TTY UAT 均属于需授权的 operator action；仓库自动化只能验证前置条件和记录结果。

## Requirements

### Validated

<!-- 既有代码已上线且被依赖,或本里程碑已交付 -->

- ✓ **cache-first agentic loop** — 缓存优先的对话循环,降低 token 成本 — existing
- ✓ **工具调用 JSON 自修复** — flatten/scavenge/storm/truncation,修复模型坏输出 — existing
- ✓ **上下文折叠与 token 预算防御** — ContextManager 分层阈值折叠 — existing
- ✓ **完整工具集** — 文件/shell/web/plan/todo/memory/subagent/skills/java-source/code-query + MCP 桥接 — existing
- ✓ **会话持久化与恢复** — append-only 日志、session resume/healing — existing
- ✓ **ACP JSON-RPC** — IDE/编辑器集成入口 — existing
- ✓ **tree-sitter 代码符号语义检索** — code-query 工具 — existing
- ✓ **Web 面板剥离** — `dashboard/` + `src/server/` + CLI 内部面板适配代码完全切除,CLI/TUI 无面板运行 — v1.0 (Phase 1, 2026-07-03)
- ✓ **机器人接入解耦为独立 CLI 命令** — QQ/Telegram/微信 channel 经传输协议无关的 HeadlessHost 作为独立 CLI 命令运行,复用核心 CacheFirstLoop/PauseGate/完整 ToolRegistry,脱离桌面 sidecar 与 Tauri JSON-RPC — v1.0 (Phase 2, 2026-07-04)
- ✓ **Tauri 桌面 GUI 剥离** — `desktop/` + 3555 行 sidecar god module + `src/desktop/` 移除,`reasonix desktop` 退役为 i18n 薄 stub(exit 1),机器人接入不受影响 — v1.0 (Phase 3, 2026-07-04)
- ✓ **构建链简化** — `postinstall.mjs`/`sync-desktop-version.mjs`/`release.yml` 退役,`package.json`/`ci.yml`/`.claude/CLAUDE.md` 对齐纯 CLI,`npm pack` 输出干净 CLI-only tarball(无 postinstall 钩子) — v1.0 (Phase 4, 2026-07-05)
- ✓ **纯 CLI 路径零回归** — 19 个命令 `--help` 全绿、8 个离线命令功能冒烟、tree-sitter `code-query` 跨 6 语言 e2e 存活;核心 loop/工具/记忆/MCP/AcP 零回归(14 baseline 红 → 3 evidence-deferred 预存红) — v1.0 (Phase 4, 2026-07-05)
- ✓ **治理决策与身份对齐** — 版本、fork、开发分支与风险 coverage policy 已形成权威文档 — v1.1
- ✓ **双语 i18n 边界** — 仅保留 `en`/`zh-CN`,支持 alias、migration、fallback 与 key parity — v1.1
- ✓ **关键路径离线保护** — TUI、关键 CLI command、Telegram/Weixin 生命周期具备确定性特征测试 — v1.1
- ✓ **CI 与 flaky 可见性** — 活跃路径具备完整门禁和首轮失败/诊断重试报告 — v1.1
- ✓ **统一发布身份** — root npm package、CLI bin、运行时帮助与维护文档统一为 `reasonix-legacy@1.3.0`,`reasonix`/`dsnix` 当前入口及 dsnix workspace/publish path 已删除 — v1.3 Phase 10
- ✓ **当前版本权威** — package、lockfile root、运行时版本、README、CHANGELOG、governance、SECURITY 与 milestone 对齐到 `1.3.0` / `v1.3`,并有自动漂移 guard — v1.3 Phase 10
- ✓ **稳定版安全整改** — 生产依赖 high/critical 风险已清零,`SECURITY.md` 与 install-script provenance 记录已对齐当前 CLI-only 表面,redaction regression 已重验 — v1.3 Phase 11
- ✓ **Windows 发布自动化与发布权威** — CI、CodeQL、branch 指引和 npm publish workflow 与 `v1`/`dev`、Windows 基线和 `v1.3.0` tag convention 一致,release contract 收敛为 npm-only — v1.3 Phase 12
- ✓ **Windows 候选包验证与本地稳定版复评** — clean install、全量 verify、tarball inventory、隔离安装和生产 audit 已在当前 Windows 基线下完成,最终 verdict 绑定候选 SHA `d595d30b7e56` — v1.3 Phase 13

### Active

- [ ] **1.3.1 release identity** — package、lockfile、CLI、维护文档与发布合同一致指向 `reasonix-legacy@1.3.1`，并以自动 guard 阻止身份漂移。
- [ ] **LTS support contract** — 发布前明确 1.3.x 支持期限、允许的 patch 类型、安全响应、EOL 通知和下一稳定版出现后的并行维护政策。
- [ ] **User migration and rollback** — 为 1.2 用户提供从 `reasonix`/`dsnix` 迁移到 `reasonix-legacy` 的安装、验证和回滚路径。
- [ ] **Reproducible release candidate** — 在不可变候选上完成 clean verify、生产审计、tarball 清单、隔离安装与校验和证据。
- [ ] **Auditable release operations** — 正式 tag、Windows CI/CodeQL、npm registry smoke、GitHub Release 与人工 UAT具备可执行 runbook、明确授权边界和结果记录。

### Out of Scope

- Web 面板(`dashboard/`) 与 Tauri desktop GUI — v1.0 已物理移除,不重新引入。
- 多模型/provider 适配 — 默认仍保持 DeepSeek-first,避免稀释针对 DeepSeek 的缓存与工具调用优化。
- 保留 `dsnix` 兼容入口或双命令迁移期 — 用户已决定直接统一为 `reasonix-legacy`。
- 重写聊天机器人 channel 协议 — 除非新里程碑显式立项,否则只在现有入口上做受保护的增量改动。
- 自动修改 GitHub branch protection、自动 push tag/release 或执行未经授权的远程变更 — 属于外部 operator action。
- 把真实 bot/model/TTY 流量包装成自动测试 — live UAT 仍与仓库内自动化分层处理。

## Context

- 架构是 **multi-surface single-core**:核心 `CacheFirstLoop`(`src/loop.ts`)与所有 surface 单向依赖,核心不反向 import 任何 surface。详细地图见 `.planning/codebase/`(ARCHITECTURE / STACK / STRUCTURE / CONVENTIONS / INTEGRATIONS / TESTING / CONCERNS)。
- **当前状态(2026-07-22,v1.3.1 LTS Release planning):** 项目维持纯 CLI 产品形态,当前公开 package 与唯一 bin 均为 `reasonix-legacy`。Windows 维护基线下的 clean `npm ci`、`npm run verify`、`node scripts/check-docs.mjs`、`npm pack --dry-run`、真实 `npm pack`、隔离 tarball 安装和 `npm audit --omit=dev` 已全部通过;当前候选 SHA 为 `d595d30b7e56`。
- **关键红线(持续生效):** `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` 服务 CLI 代码符号搜索,任何后续里程碑都必须保留。v1.3 打包验证已再次确认八个 grammar/runtime WASM 均进入 tarball。
- **已知技术债 / 后续候选:**
  - **HeadlessHost 渲染缺口(accepted-and-deferred):** `runTurn` 未订阅 `turn-driver` 的 `onEvent` 回调 → 全部 channel 都丢弃 reasoning/tool 事件。它是共享宿主层的既存缺口,不是 v1.3 回归,适合在独立 channel-streaming 里程碑内处理。
  - **REF-01..04 protected refactor:** `App.tsx`、`config.ts`、`loop.ts` 和大型 tools 的结构拆分仍待后续里程碑在 characterization tests 保护下推进。
  - **Live UAT / external release actions:** Telegram/Weixin/交互式 TTY 的真实凭据验证、GitHub branch protection、tag/push、npm publish 与 GitHub release 仍是显式人工步骤。

## Constraints

- **Tech stack**: TypeScript + tsup；Ink/React TUI；Commander CLI；Vitest / Biome / Stryker。
- **Maintained runtime/test baseline (until explicitly changed)**: Windows + Node.js 24.15.0 + npm 11.16.0 + PowerShell；其他 OS/Node 组合不作为当前阻塞标准。
- **Product identity**: npm package 与 CLI bin 统一为 `reasonix-legacy`；不得恢复 `dsnix` 映射；保持 DeepSeek-first。
- **不回归**: 核心 loop / 工具 / 记忆 / MCP / ACP / chat channels；保留 tree-sitter grammars 构建链。

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 放弃 Web 面板 + Tauri 桌面 GUI,走纯 CLI | 用户不再维护面板,聚焦 CLI 体验 | ✓ v1.0 — Web 面板剥离(Phase 1,2026-07-03)+ 桌面 GUI 移除(Phase 3,2026-07-04) |
| 保留 QQ/Telegram/微信机器人接入 | 远程/移动控制能力仍有价值 | ✓ v1.0 — qq/telegram/weixin 经 HeadlessHost 独立 CLI(Phase 2,2026-07-04) |
| 机器人接入解耦为独立 CLI 命令(非删、非保留 GUI) | 删 GUI 前必须先把 QQ 从桌面 sidecar 解耦 | ✓ v1.0 — core reuse 零重实现,脱离 Tauri JSON-RPC(Phase 2) |
| phase 依赖序 1→2→3→4 | 先剥耦合最低的面板,再解耦机器人(难点),删 GUI 前宿主就位,最后清构建+回归 | ✓ v1.0 — 4 phase 全绿,每个 phase 交付"系统仍可用"垂直切片 |
| HeadlessHost 新建模块而非就地重构 desktop.ts | desktop.ts 3555 行混合 RPC/Tab/TUI,就地重构触碰不可回归面 | ✓ v1.0 — 复刻 buildRuntimeFor recipe,sidecar 字节级未动直到 Phase 3 才删 |
| 三 channel 薄入口不抽 BaseChannelAdapter | qq/telegram/weixin ~150 行平行,但分歧(Telegram 无 onInfo、Weixin QR-login-before-start)是协议层差异 | ⚠️ Revisit — 当前仍维持薄适配器策略;若后续做 channel-streaming,再评估抽象收益 |
| HG-01：package semver 与 GSD milestone 对齐 | 避免 fork 的公开版本与规划版本再次漂移 | ✓ v1.1 — `package.json` 为对外权威；当前里程碑与维护版本事实已通过文档/测试/workflow guard 共同约束 |
| HG-02：当前维护身份属于 ZYist fork | 当前操作入口必须与历史来源清楚分离 | ✓ v1.1 — 当前链接与写操作仅指向 `ZYist/reasonix-legacy`;upstream 只读 attribution,禁止 push/tag/release |
| HG-03：`dev` push 运行完整 CI | 活跃开发路径需要直接反馈,同时不虚构 GitHub 外部保护设置 | ✓ v1.1 / v1.3 — `dev` push 跑 CI；branch protection 始终作为经验证的 operator action 单独披露 |
| HG-04：采用风险导向 coverage policy | 单一全局百分比无法代表 TUI、command 与 channel 生命周期风险 | ✓ v1.1 — characterization + risk-based 验收已成为后续里程碑默认方法 |
| v1.3：package 与 CLI 统一为 `reasonix-legacy` | 单一公开身份消除 package/bin/docs/release 漂移 | ✓ Phase 10 — 当前 package、唯一 bin、docs 与 guards 已统一到 `reasonix-legacy@1.3.0` |
| v1.3：删除全部 `dsnix` 遗留,不设兼容期 | 老旧映射已经损坏发布链,继续维护只增加歧义 | ✓ Phase 10 — workspace、shim/bin、lock records 与专用 publish workflow 已删除 |
| v1.3：保持 DeepSeek-first,不做多模型适配 | 保护针对 DeepSeek 的 cache-first 与工具调用修复差异化 | ✓ v1.3 — hardening 全程维持单模型定位,没有引入 provider abstraction |
| v1.3：仅 Windows / Node 24.15.0 为强制测试标准 | 与当前真实维护环境一致,避免为未支持矩阵阻塞稳定版 | ✓ Phases 12-13 — CI/docs/candidate verification 已统一到 Windows + Node.js 24.15.0 + npm 11.16.0 + PowerShell |
| v1.3：稳定候选必须从 packed tarball 与隔离安装证明 | warm dev checkout 会掩盖真正的发布缺陷 | ✓ Phase 13 — isolated install 暴露并修复了 production `workspace:*` 依赖泄漏,最终候选已重验 |
| v1.3：远程发布与 live UAT 不伪装为仓库自动化 | 本地 PASS 不等于 tag/publish/凭据驱动 UAT 已完成 | ✓ v1.3 — audit/verification 始终把 branch protection、tag/publish、GitHub release 与 live UAT 保留为 manual/external |

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
*Last updated: 2026-07-22 after starting v1.3.1 LTS Release milestone*
