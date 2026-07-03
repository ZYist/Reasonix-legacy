---
phase: 01-web-panel-removal
verified: 2026-07-03T09:12:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 1: Web Panel Removal — 验证报告

**Phase Goal:** Web dashboard(`dashboard/` + `src/server/`)与 CLI 内部面板适配代码完全切除,CLI/TUI 在无任何面板代码的情况下正常运行。
**Mode:** mvp(User Story:「As a CLI 用户,I want to 在不依赖任何 Web 面板代码的前提下运行 `reasonix chat`/`code`/`run`,so that 终端里的 DeepSeek 编程 agent 不再背负面板的耦合与构建负担。」)
**Verified:** 2026-07-03T09:12:00Z
**Status:** passed
**Re-verification:** No — 初始验证

## Goal Achievement

### Observable Truths(对照 ROADMAP 成功标准)

| # | Truth(成功标准) | Status | Evidence(独立验证) |
|---|-------------------|--------|----------------------|
| 1 | `dashboard/` 与 `src/server/` 目录已移除;`src/` 下无任何文件 import `src/server` 或引用 `dashboard/` | ✓ VERIFIED | `test ! -d dashboard/`、`test ! -d src/server/`、`test ! -d src/cli/ui/dashboard/`、`loop-to-dashboard.ts`/`cards-to-messages.ts`/`slash/handlers/dashboard.ts`/`copy-dashboard-vendor-css.mjs` 均 ABSENT。`grep -rn 'from "../../server/' src/` = 0;动态 `await import.*server/` = 0;`from.*dashboard/` = 0。注:`src/acp/{dispatch,gates}.ts` 的 `from "./server.js"` 引用的是 **ACP 子系统**(`AcpServer`,IDE JSON-RPC),非已删 Web 面板 server,属误报。 |
| 2 | CLI 内部面板适配代码清除完毕——`App.tsx` 无 dashboard 钩子,无 `loop-to-dashboard`、`/dashboard` slash 命令、`cards-to-messages`、`picker-broadcast` 残留 | ✓ VERIFIED | 全 src/ 标识符 grep 计数均为 0:`usePickerBroadcast`=0、`startDashboard\|stopDashboard\|getDashboardUrl`=0、`broadcastDashboardEvent`=0、`loop-to-dashboard\|cards-to-messages\|use-picker-broadcast`=0、`persistentEventSubscribers\|persistentDashboardHandle`=0、`saveDashboardPort\|clearDashboardToken\|getOrCreateDashboardToken\|dashboardEnabled\|parseDashboardPortFlag\|resolveDashboardPort\|resolveDashboardHost\|resolveDashboardToken`=0、`--no-dashboard\|--dashboard-port\|--dashboard-host`=0。slash 三件套(commands.ts/types.ts/dispatch.ts)dashboard 注册全清。`App.tsx` 4136 行(substantive,非 stub),顶部 import 块无 server/dashboard。 |
| 3 | `reasonix chat` TUI 能正常发起并完成一轮对话(发消息 → 收模型回复 → 执行一次工具),无面板相关报错 | ✓ VERIFIED | 程序化前置证据(独立复跑):`npm run build` 退出 0(tsup 打包成功,入口图内无未解析动态 import);`node dist/cli/index.js --help` 与 `code --help` 干净渲染,`code --help` 三选项命中 0;面板代码路径已物理不存在(grep 全 0),故「无面板相关报错」由结构保证。完整 live TUI 回合(消息 → 模型回复 → 工具)经 01-02 Task 2 的 `checkpoint:human-verify` 门人确认通过(SUMMARY 记录:`reasonix code` 模式原生 `read_file` 读到 package.json version `0.55.0`,无 `Cannot find module '../../server/index.js'` 类 ESM 解析失败)。注:`reasonix chat` 按设计为 filesystem-less 模式(`src/cli/index.ts:104`),原生文件工具仅在 `code`/`run` 注册——冒烟以 `code` 模式为准,非回归。 |
| 4 | typecheck 与 build 通过(剥离 Web 面板后 CLI 可独立构建) | ✓ VERIFIED | 独立复跑:`npm run typecheck`(tsc --noEmit)退出 0;`npm run build`(tsup + write-cli-package-marker + copy-tree-sitter-grammars)退出 0;`dist/cli/index.js` 存在(135642 bytes),`dist/cli/package.json` ESM marker 正确生成,7 个 tree-sitter grammar wasm 拷贝成功。`tests/comment-policy.test.ts` 9/9 通过。`package.json` build 链 = `tsup && write-cli-package-marker && copy-tree-sitter-grammars`(无 build:dashboard/copy-dashboard-vendor-css);typecheck = 单条 `tsc --noEmit`(无 -p dashboard 分支);files 数组 dashboard 条目 = 0;bin(reasonix/dsnix → dist/cli/index.js)保留。 |

**Score:** 4/4 truths verified

### Required Artifacts(关键产物)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `dashboard/` 目录 | 已删除 | ✓ VERIFIED | `test ! -d dashboard/` 通过 |
| `src/server/` 目录 | 已删除(含 api/、index.ts、router.ts、context.ts、assets.ts) | ✓ VERIFIED | `test ! -d src/server/` 通过 |
| `src/cli/ui/dashboard/`、`effects/loop-to-dashboard.ts`、`state/cards-to-messages.ts`、`slash/handlers/dashboard.ts` | 已删除 | ✓ VERIFIED | 均 ABSENT;`src/cli/ui/effects/` 空目录已整体移除 |
| `scripts/copy-dashboard-vendor-css.mjs` | 已删除 | ✓ VERIFIED | ABSENT;其 ESM marker 副效用已拆出为 `scripts/write-cli-package-marker.mjs`(实测 build 时正确写出 dist/cli/package.json) |
| `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/`(零回归红线) | 完整保留 | ✓ VERIFIED | 两者均存在;build 日志显示 7 个 grammar wasm 正常拷贝 |
| `package.json` bin(reasonix/dsnix) | 未变 | ✓ VERIFIED | `"reasonix": "dist/cli/index.js"`、`"dsnix": "dist/cli/index.js"` |
| `src/i18n/types.ts` + 5 locale 面板键 | 全部移除,键集一致 | ✓ VERIFIED | types.ts 面板键 grep = 0;EN/zh-CN/JA/de/ru 各 locale 面板键 grep = 0;tsc 通过(无 missing/excess keys) |

### Key Link Verification(关键链路)

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/cli/ui/App.tsx` | 已删 server 模块 | 类型 import / 动态 import | ✓ NOT_WIRED(已切断) | App.tsx 顶部 import 块无任何 server/dashboard 引用;动态 `await import` = 0;运行时无 dangling ESM 解析 |
| slash 派发 | `/dashboard` handler | commands.ts 注册 / dispatch.ts import / types.ts SlashCtx | ✓ NOT_WIRED(已切断) | 三文件同步删除:commands.ts 无 dashboard cmd、dispatch.ts 无 handler import、types.ts SlashCtx 无生命周期字段;用户输入该命令走未知命令安全提示 |
| CLI 命令链路 | `<App>` | dashboardPort/Host/Token props | ✓ NOT_WIRED(已切断) | chat.tsx/code.tsx 的 AppProps 与 `<App>` 透传均无 dashboard 字段;cli/index.ts 不再注册 --no-dashboard 系列选项 |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `code --help` 无面板选项 | `node dist/cli/index.js code --help 2>&1 \| grep -c -- '--no-dashboard\|--dashboard-port\|--dashboard-host'` | 0(无匹配) | ✓ PASS |
| 顶层 CLI 加载无 ESM 解析失败 | `node dist/cli/index.js --help` | 正常渲染 Usage + 命令列表 | ✓ PASS |
| typecheck 通过 | `npm run typecheck` | exit 0 | ✓ PASS |
| build 产物生成 | `npm run build` | exit 0;dist/cli/index.js(135642 bytes)+ dist/cli/package.json + 7 个 grammar wasm | ✓ PASS |
| 注释策略回归 | `npx vitest run tests/comment-policy.test.ts` | 9/9 通过 | ✓ PASS |
| live TUI 回合(消息→模型→工具) | `reasonix code` 交互(SUMMARY 记录的人确认) | 原生 read_file 读到 package.json 0.55.0,无面板报错 | ✓ PASS(执行期内人确认) |

### Probe Execution

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| (无 conventional probe 脚本) | — | — | SKIP(本 phase 为删除/解耦,未声明 probe 脚本;验证以 grep + build + 人交互冒烟为准) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PANEL-01 | 01-01 | `dashboard/` 与 `src/server/` 整体移除——`src/` 核心无残留引用,构建无残留依赖 | ✓ SATISFIED | 目录删除 + import grep 0 + 独立构建通过(build 不依赖 build:dashboard/copy-dashboard-vendor-css) |
| PANEL-03 | 01-01 + 01-02 | CLI 内部面板适配代码清理(`App.tsx` dashboard 钩子、loop-to-dashboard、/dashboard slash、cards-to-messages、picker-broadcast) | ✓ SATISFIED | 所有面板适配标识符在 src/ 下 grep 全 0;App.tsx/slash 三件套/picker 4 件/CLI 入口/config 全部去耦合;i18n 死串(types.ts + 5 locale)清零 |

**Orphaned requirements:** 无。REQUIREMENTS.md 把 PANEL-01、PANEL-03 都映射到 Phase 1,两个 plan 都已声明并覆盖。

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| 多处(约 8 条) | — | 过时注释仍引用已删 Web 面板 server(如 `heap-limit-launch.ts:1` "dashboard server load"、`useWorkspaceRoot.ts:14` "dashboard server"、`net/proxy.ts:20` "protects the dashboard"、`index/config.ts:1,14` "dashboard read/endpoint"、`ollama-launcher.ts:22` "dashboard process"、`state/events.ts:103`/`primitives.tsx:21` "web dashboard") | ℹ️ INFO | 注释级残留,非代码耦合——不影响构建/运行;01-REVIEW 已内联修 3 条(922b3398),余下约 8 条属清理债,自然落入 Phase 4「Build Chain Cleanup & Full Regression」范畴。`stats.ts` 的 `dashboard()`/`renderDashboard()` 是终端用量面板函数名(合法保留),`doctor.ts`/`run.ts` 指 DeepSeek 账户外层面板(外部服务),均非已删 Web 面板。 |

无 TBD/FIXME/XXX 债务标记(phase 修改文件内 grep 全空)。无 stub/占位实现。

### Deferred Items(后续 phase 覆盖,非阻断 gap)

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | 约 8 条过时注释仍提「dashboard server/web dashboard」(注释级,非代码) | Phase 4 | Phase 4 goal:「构建链全面简化……全量 verify 通过」+ success criteria 含 drift 检查;01-02 SUMMARY 已把剩余 dashboard 字面量(现 21,原记 24)记为「Phase 4 drift 检查基线」 |

### Gaps Summary

无阻断性 gap。四条 ROADMAP 成功标准全部 VERIFIED:

- **SC1(目录移除 + 无引用):** 目录与桥接文件全部 ABSENT;src/ 下对已删 server/dashboard 的 import 与动态 import 均为 0。(src/acp 的 `./server.js` 是 ACP 子系统,误报。)
- **SC2(CLI 适配代码清除):** 全部面板适配标识符在 src/ 下 grep 为 0;slash 三件套、picker 4 件、CLI 入口、config、i18n 契约全部去耦合。
- **SC3(TUI 完成一轮对话无面板报错):** 程序化前置证据独立复跑通过(build 打包成功、CLI 加载干净、面板代码路径已不存在);完整 live 回合经 01-02 Task 2 的 `checkpoint:human-verify` 门人确认(read_file → 0.55.0,无 ESM 解析失败)。
- **SC4(typecheck + build):** 独立复跑 `npm run typecheck` 与 `npm run build` 均退出 0,dist/cli/index.js 存在,tree-sitter 红线保留。

唯一发现是约 8 条过时注释(非代码耦合)仍提及已删面板 server——属清理债,自然由 Phase 4 处理,不影响本 phase 目标达成。核心 loop/工具/记忆/MCP/AcP 零触及,零回归红线(tree-sitter + code-query + bin 入口)完整保留。

---

_Verified: 2026-07-03T09:12:00Z_
_Verifier: Claude (gsd-verifier)_
