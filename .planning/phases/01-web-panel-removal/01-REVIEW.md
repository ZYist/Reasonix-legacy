---
phase: 01-web-panel-removal
reviewed: 2026-07-03T09:05:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - package.json
  - tsup.config.ts
  - scripts/write-cli-package-marker.mjs
  - src/cli/index.ts
  - src/cli/ssh-remote.ts
  - src/cli/commands/chat.tsx
  - src/cli/commands/code.tsx
  - src/cli/ui/App.tsx
  - src/cli/ui/WelcomeBanner.tsx
  - src/cli/ui/PlanPanel.tsx
  - src/cli/ui/CheckpointPicker.tsx
  - src/cli/ui/McpHub.tsx
  - src/cli/ui/McpMarketplace.tsx
  - src/cli/ui/SessionPicker.tsx
  - src/cli/ui/markdown.tsx
  - src/cli/ui/hooks/handle-assistant-final.ts
  - src/cli/ui/slash/commands.ts
  - src/cli/ui/slash/dispatch.ts
  - src/cli/ui/slash/types.ts
  - src/cli/ui/slash/handlers/observability.ts
  - src/code/plan-store.ts
  - src/config.ts
  - src/i18n/types.ts
  - src/i18n/EN.ts
  - src/i18n/zh-CN.ts
  - src/i18n/JA.ts
  - src/i18n/de.ts
  - src/i18n/ru.ts
findings:
  critical: 1
  warning: 3
  info: 0
  total: 4
status: resolved
resolved: 2026-07-03
---

# Phase 01: Code Review Report

**Reviewed:** 2026-07-03T09:05:00Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Phase 01 是一次以删除为主的重构,移除了 `dashboard/` + `src/server/` + 桥接适配器,并清理了 CLI/TUI 中的面板耦合。28 个存活文件经过逐文件审查 + 跨文件追踪。

整体清理质量较高:
- 删除一致性良好——`src/` 中没有任何残留 import 指向被删模块(`server/context`、`server/index`、`dashboard/use-picker-broadcast`、`effects/loop-to-dashboard`、`state/cards-to-messages`、`slash/handlers/dashboard` 全部无引用)。
- i18n key 集合在 types.ts 与 5 个 locale 文件之间保持一致(tsc + grep 双重验证);移除的 key 在所有 locale 中对齐,ru.ts 因原本就靠 `...EN.x` spread 继承而只需删少量显式 key,无遗漏。
- `ChatOptions` / `AppProps` / `CodeOptions` / `SlashContext` / `ReasonixConfig` 上的 dashboard 字段在类型层和所有调用点同步移除,prop 传递链(chat.tsx → Root → App)无断裂。
- `write-cli-package-marker.mjs` 正确保留了被删 `copy-dashboard-vendor-css.mjs` 的 `dist/cli/package.json` ESM marker 副效用,实测写出 `{name, version, type:"module"}` 正确。
- 构建链 `tsup && write-cli-package-marker && copy-tree-sitter-grammars` 顺序正确,`typecheck` 去掉 `-p dashboard` 分支正确。

但审查发现 1 个 Critical(由本次删除引发的存活文件控制流断裂)和 3 个 Warning(被编辑文件中对已删模块的悬置注释引用)。

## Critical Issues

### CR-01: 删除 dashboard/ 导致 postinstall 守卫提前退出,desktop 依赖安装被静默跳过

**File:** `scripts/postinstall.mjs:7-10`(本文件未在本阶段的 28 个修改文件列表内,但其控制流被本阶段删除 `dashboard/` 直接打断——这正是 phase_context 审查重点 #2「删除引发的逻辑断裂」所要找的问题)

**Issue:** `scripts/postinstall.mjs` 的控制流以 `existsSync("dashboard/package.json")` 作为是否执行 workspace 依赖安装的闸门:

```js
if (!existsSync("dashboard/package.json")) process.exit(0);   // 第 7 行
execSync("npm --prefix dashboard ci --ignore-scripts", { stdio: "inherit" }); // 第 9 行
execSync("npm --prefix desktop ci --ignore-scripts", { stdio: "inherit" });   // 第 10 行
```

本阶段删除了 `dashboard/` 目录(已确认 `dashboard: ABSENT`),因此第 7 行的守卫条件 `!existsSync(...)` 恒为 `true`,`process.exit(0)` 立即触发。后果:第 10 行 `npm --prefix desktop ci` **永远不会执行**——而 `desktop/` 目录仍然存在(已确认 `desktop/package.json` 存在,name=`reasonix-desktop`)。

也就是说:开发者 clone 仓库后跑 `npm install`,postinstall 会静默(exit 0,无报错)跳过 desktop workspace 的依赖安装。注释原意是「发布 tarball 里没 dashboard,所以 no-op;git checkout 里有 dashboard 才装 workspace 依赖」——删除 dashboard 后,git checkout 也被当成 tarball 处理了。失败是静默的(exit 0),最难排查。

**Fix:** 守卫不能再以 `dashboard/package.json` 作为唯一闸门。把 desktop 的安装从 dashboard 的存在性里解耦:

```js
#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

// Tarball 里不 ship dashboard/desktop 的 package.json,checkout 才装 workspace 依赖。
if (existsSync("desktop/package.json")) {
  execSync("npm --prefix desktop ci --ignore-scripts", { stdio: "inherit" });
}
```

(或保留 dashboard 行但用各自的 `existsSync` 守卫;关键是 desktop 的安装不能依赖 dashboard 的存在性。)

## Warnings

### WR-01: cli/index.ts 注释把已删的 dashboard 列为 fetch 闭包的持有者

**File:** `src/cli/index.ts:42-46`

**Issue:** 该注释块(本阶段未编辑,但因 dashboard 被删而变成悬置引用)写道:

```js
// HTTPS_PROXY / HTTP_PROXY only reach Node's fetch via undici's global
// dispatcher; install before any client (DeepSeek, web tools, dashboard)
// constructs a fetch closure (#646). ...
```

`dashboard` 作为 client 已不存在,读者会去搜索一个不存在的持有者。本阶段 import 行紧邻其下被编辑,属于编辑文件的悬置引用。

**Fix:** 删掉括号里的 `dashboard`:

```js
// HTTPS_PROXY / HTTP_PROXY only reach Node's fetch via undici's global
// dispatcher; install before any client (DeepSeek, web tools) constructs
// a fetch closure (#646). Argv is peeked manually here — commander hasn't
// run yet — so position of `--no-proxy` doesn't matter and we can honor
// it before any fetch closure captures the dispatcher.
```

(顺带压到 ≤3 行以满足 comment-policy,但行数违规是既存的,不在本阶段编辑范围——只要求修掉 dashboard 引用。)

### WR-02: handle-assistant-final.ts 注释引用已删的 web dashboard 作为数据消费方

**File:** `src/cli/ui/hooks/handle-assistant-final.ts:68-70`

**Issue:** 本阶段从该文件移除了 `broadcastDashboardEvent` 及 `DashboardEvent` 构造逻辑,但同函数内这条注释仍声称「web dashboard 读取 `loop.stats.summary()`」:

```js
    // Pass the session-aggregate cache-hit so the persistent status bar
    // mirrors what the web dashboard reads from `loop.stats.summary()`
    // (issue #1028) instead of showing this single turn's ratio.
```

web dashboard 已删,「mirrors what the web dashboard reads」是失效断言。

**Fix:** 改为只说持久状态栏自身:

```js
    // Pass the session-aggregate cache-hit so the persistent status bar
    // mirrors `loop.stats.summary()` (issue #1028) instead of showing
    // this single turn's ratio.
```

### WR-03: observability.ts 注释引用已删的 web dashboard (#1479)

**File:** `src/cli/ui/slash/handlers/observability.ts:192-195`

**Issue:** 本阶段从该 handler 移除了 `getDashboardUrl` / `dashLine` 逻辑,但紧邻其下的注释仍把 web dashboard 当作一致性对齐目标:

```js
    // Session-aggregate cache hit so this card matches the bottom status bar
    // and the web dashboard (#1479). The bar already shows the rolling total
    // (state/events.ts comment) — displaying a per-turn number here just for
    // the slash card produced two different "cache hit %" values on screen.
```

`#1479` 关联的是已删面板的一致性问题,继续留着会误导。

**Fix:**

```js
    // Session-aggregate cache hit so this card matches the bottom status bar's
    // rolling total — displaying a per-turn number here just for the slash card
    // produced two different "cache hit %" values on screen.
```

---

_Reviewed: 2026-07-03T09:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

## Resolution(编排器内联修复,2026-07-03)

全部 4 项 finding 已在编排器内联修复,提交于 `922b3398`:

- **CR-01(Critical)**:`scripts/postinstall.mjs` 守卫从 `dashboard/package.json` 改为 `desktop/package.json`,删除已无意义的 `npm --prefix dashboard ci` 行——恢复 git checkout 的 desktop 依赖安装,tarball 仍正确 no-op。不再静默 exit 0 跳过。
- **WR-01**:`src/cli/index.ts` fetch-闭包持有者注释移除 "dashboard"。
- **WR-02**:`handle-assistant-final.ts` 注释改写为描述持久状态栏自身,不再引用 web dashboard。
- **WR-03**:`observability.ts` 注释改写为描述 slash card 与状态栏对齐,不再引用 web dashboard,保留 (#1479) 锚点。

复验:`npm run lint:fix`(无新问题)、`npm run typecheck`(exit 0)、`tests/comment-policy.test.ts`(9/9 通过)。无新增 finding。
