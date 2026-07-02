---
phase: 01-web-panel-removal
plan: 01
subsystem: cli
tags: [removal, decoupling, cli, build, refactor]

requires: []
provides:
  - "去除 Web 面板表面(dashboard/ + src/server/),CLI/TUI 不再背负面板耦合"
  - "切断所有硬引用(import type 与动态 import),npm run typecheck/build/lint 三件套通过"
  - "package.json 构建链与 files 字段去 dashboard 化,bin 入口保留"
  - "为 01-02 软清理(i18n 死串 + 运行时冒烟)建立事实基础"
affects: [01-02, 02-bot-decoupling, 03-desktop-gui-removal, 04-build-chain-regression]

tech-stack:
  added: []
  patterns:
    - "删除即清理:剥离 surface 时同步移除所有写而不读的死 ref-mirror 与死测试"
    - "ESM marker 脚本(write-cli-package-marker.mjs)替代既有脚本的副效用"

key-files:
  created:
    - "scripts/write-cli-package-marker.mjs"
  modified:
    - "package.json"
    - "tsup.config.ts"
    - "src/cli/ui/App.tsx"
    - "src/cli/ui/WelcomeBanner.tsx"
    - "src/cli/ui/hooks/handle-assistant-final.ts"
    - "src/cli/ui/CheckpointPicker.tsx"
    - "src/cli/ui/McpHub.tsx"
    - "src/cli/ui/McpMarketplace.tsx"
    - "src/cli/ui/SessionPicker.tsx"
    - "src/cli/ui/slash/commands.ts"
    - "src/cli/ui/slash/types.ts"
    - "src/cli/ui/slash/dispatch.ts"
    - "src/cli/ui/slash/handlers/observability.ts"
    - "src/cli/commands/chat.tsx"
    - "src/cli/commands/code.tsx"
    - "src/cli/index.ts"
    - "src/cli/ssh-remote.ts"
    - "src/config.ts"
    - "src/cli/ui/PlanPanel.tsx"

key-decisions:
  - "保留 dist/cli/package.json ESM marker 逻辑(从 copy-dashboard-vendor-css.mjs 拆出为 write-cli-package-marker.mjs),避免静默回归"
  - "i18n 死串(93 条)+ 叙事注释交由 01-02 清理,本计划只切除代码耦合"

patterns-established:
  - "删除 surface 时,grep 全树找齐所有 import 该 surface 的文件(含动态 import、测试),一次性清零"

requirements-completed: [PANEL-01, PANEL-03]

coverage:
  - id: D1
    description: "dashboard/ 与 src/server/ 目录物理删除,src/ 下无任何文件 import 已删除 server 模块"
    requirement: PANEL-01
    verification:
      - kind: other
        ref: "grep -rn 'from \"../../server/' src/ | wc -l == 0; test ! -d dashboard/ && test ! -d src/server/"
        status: pass
    human_judgment: false
  - id: D2
    description: "CLI 可独立构建:npm run typecheck && npm run build && npm run lint 全绿,dist/cli/index.js 存在"
    requirement: PANEL-01
    verification:
      - kind: other
        ref: "npm run typecheck (exit 0); npm run build (exit 0, dist/cli/index.js present); npm run lint (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "App.tsx、4 个 picker、slash 注册、CLI 命令链路、config 全部不再含面板耦合代码"
    requirement: PANEL-03
    verification:
      - kind: other
        ref: "grep -rn 'usePickerBroadcast|startDashboard|saveDashboardPort|--no-dashboard' src/ 中代码标识符为 0(i18n 死串除外)"
        status: pass
    human_judgment: false
  - id: D4
    description: "零回归红线:scripts/copy-tree-sitter-grammars.mjs 与 src/code-query/ 完整保留,CLI bin(reasonix/dsnix)不变"
    requirement: PANEL-01
    verification:
      - kind: other
        ref: "test -f scripts/copy-tree-sitter-grammars.mjs && test -d src/code-query && grep -c '\"reasonix\":' package.json ≥ 1"
        status: pass
    human_judgment: false

duration: 57min
completed: 2026-07-02
status: complete
---

# Phase 01 Plan 01: Web Panel Removal Summary

**整体切除 Web 面板表面(dashboard/ + src/server/ + 全部桥接适配),切断 18 个源文件的硬引用,删除 12 个面板专属测试,CLI 在无 node 依赖面板的前提下 typecheck/build/lint 三件套全绿。**

## Performance

- **Duration:** ~57 分钟
- **Started:** 2026-07-02T14:13:08Z
- **Completed:** 2026-07-02T15:10:43Z
- **Tasks:** 3/3 完成
- **Files modified:** 123(含 96 删除 + 27 编辑,不含 .planning/)

## Accomplishments

- `dashboard/`(Vite SPA)与 `src/server/`(回环 HTTP server + 38 个 API 端点)整体物理删除
- `src/cli/ui/App.tsx` 从 ~4878 行精简至 ~4118 行:移除面板服务器生命周期、broadcastDashboardEvent 事件扇出(7 个 modal-up/down effect)、picker/viewer 广播接线、DashboardProps 字段,以及连带死亡的 ref-mirror(planModeRef/latestVersionRef/balanceRef/modelsRef/pendingPlanRef)
- 4 个 picker(CheckpointPicker/McpHub/McpMarketplace/SessionPicker)摘除 usePickerBroadcast 接线,保留本地列表渲染/键盘选择/回调提交
- slash 注册三件套(commands/types/dispatch)移除 /dashboard 命令与 SlashCtx 的三个生命周期字段;observability /status 移除面板 URL 行
- CLI 入口(cli/index.ts)移除 4 个 dashboard helper + chat/code 命令的 --no-dashboard 系列选项 + appProps 字段;ssh-remote.ts 移除 --no-dashboard 与隧道指引
- config.ts 移除 dashboard 配置块与 4 个 token/port 函数(loadDashboardEnabled/ensureDashboardToken/saveDashboardPort/clearDashboardToken)
- package.json build 链去 dashboard 化,files 数组移除 3 条 dashboard 条目,typecheck 移除 -p dashboard 分支,bin 入口(reasonix/dsnix)保持不变

## Task Commits

每个任务原子提交:

1. **Task 1: 删除面板目录与桥接适配文件 + 清理构建配置** - `438d355c` (chore)
2. **Task 2: 改造 App.tsx —— 移除面板服务器生命周期与全部 panel 类型依赖** - `b6fe919a` (refactor)
3. **Task 3: 改造依赖表面文件 + 验证 typecheck 与 build 全绿** - `baa4f52b` (refactor)

## Decisions Made

- **保留 dist/cli ESM marker**:被删的 copy-dashboard-vendor-css.mjs 有一项 CLI 相关副效用(写 dist/cli/package.json 让 Node 跳过 CJS-then-ESM 重解析警告)。拆出为独立脚本 write-cli-package-marker.mjs,避免静默回归。
- **i18n 死串推迟到 01-02**:本计划只切除代码耦合。93 条 i18n 面板死串(/dashboard 提示、--no-dashboard 描述等)与少量叙事注释按计划明文交由 01-02 清理。
- **删除 12 个面板专属测试**:这些测试仅覆盖已删的 server/bridge 表面(cockpit/dashboard/server/settings-api 端点 + picker-broadcast + loop-to-dashboard),无核心逻辑存活,删除而非重构。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Preserve Critical] 保留 dist/cli ESM marker 逻辑**
- **Found during:** Task 1
- **Issue:** copy-dashboard-vendor-css.mjs 除拷贝面板 CSS 外,还写 dist/cli/package.json ESM marker(抑制 Node 重解析警告)。计划只把它当面板脚本删除,会静默丢掉这项 CLI 构建副效用。
- **Fix:** 新建 scripts/write-cli-package-marker.mjs 仅保留 marker 逻辑,纳入 build 链。
- **Files modified:** scripts/write-cli-package-marker.mjs(新),package.json(build 脚本)
- **Verification:** npm run build 后 dist/cli/package.json 正确生成
- **Committed in:** 438d355c

**2. [Rule 3 - Blocking] handle-assistant-final.ts 仍 import 已删 server 类型(计划漏列)**
- **Found during:** Task 2(typecheck 暴露)
- **Issue:** 计划耦合分析只标了 App.tsx 5 处 server 引用,遗漏 src/cli/ui/hooks/handle-assistant-final.ts(import DashboardEvent + broadcastDashboardEvent ctx 字段)。该文件不在 Task 3 文件清单中。
- **Fix:** 移除 DashboardEvent import、AssistantFinalContext.broadcastDashboardEvent 字段、finalEvent 构造与广播调用。
- **Files modified:** src/cli/ui/hooks/handle-assistant-final.ts
- **Committed in:** baa4f52b

**3. [Rule 3 - Blocking] observability.ts /status 引用 ctx.getDashboardUrl(计划漏列)**
- **Found during:** Task 3(typecheck 暴露)
- **Issue:** SlashCtx 删掉 getDashboardUrl 后,observability slash handler 的 /status 仍读 ctx.getDashboardUrl 构造 dashLine。
- **Fix:** 删除 dashUrl/dashLine 声明与 lines.push(dashLine)。
- **Files modified:** src/cli/ui/slash/handlers/observability.ts
- **Committed in:** baa4f52b

**4. [Rule 1 - Bug] 删除 12 个面板专属测试(计划漏列)**
- **Found during:** Task 3
- **Issue:** 12 个测试文件仅覆盖已删 server/bridge 表面(cockpit-events/cockpit/dashboard-host-and-token/dashboard-port-pin/dashboard-sessions-ops/dashboard-smoke/server-dashboard/server-index-config/settings-api/ui-checkpoint-picker-broadcast/ui-session-picker-broadcast/loop-to-dashboard)。tsc 因 tests/ 被 tsconfig 排除而未报错,但 vitest 收集会崩。
- **Fix:** 全部 git rm。
- **Verification:** 删后剩余 tests/ 无任何文件 import 已删模块(grep 0)
- **Committed in:** baa4f52b

**5. [Rule 1 - Bug] 修复 biome lint:fix 误改 PlanPanel.tsx React import**
- **Found during:** Task 3(npm run lint:fix 后)
- **Issue:** biome --write 误把 PlanPanel.tsx 的 `import React, { useMemo, useState } from "react"` 拆成 `import type React`,导致 56 个 TS1361 错误(React 被当值用)。
- **Fix:** 恢复值 import 并加 biome-ignore 注释(项目既有约定)。
- **Files modified:** src/cli/ui/PlanPanel.tsx
- **Committed in:** baa4f52b

**6. [Rule 3 - Blocking] node_modules 缺失**
- **Found during:** Task 2(typecheck/build 无法运行)
- **Issue:** 仓库 node_modules 不存在,无法执行计划要求的 npm run typecheck/build/lint。
- **Fix:** 运行项目自身 `npm install`(无包名,仅按既有 lockfile 装已声明依赖,非新增可疑包)。
- **Verification:** typecheck/build/lint 均可执行且通过
- **Committed in:** 无(环境准备,不入库)

---

**Total deviations:** 6 auto-fixed(2× Rule 1 bug, 3× Rule 3 blocking/漏列, 1× Rule 2 preserve-critical)
**Impact on plan:** 全部为正确性/构建可用性所必需。计划耦合分析低估了表面文件数量(漏 handle-assistant-final.ts、observability.ts、12 个测试),偏离规则已自动补齐;无范围蔓延。核心 loop/工具/记忆/MCP/AcP 零触及。

## Issues Encountered

- `npx tsc` 触发了 npm 仓库里的 typosquat `tsc@2.0.4` 包(非 TypeScript)。改用项目本地 `npm run typecheck`(走 node_modules 的 typescript)规避——这也是为何 deviation #6 必须先装依赖。

## Known Stubs

无。本计划是纯删除/解耦,未引入任何 stub 或占位数据。面板 i18n 死串(93 条)是有意保留,由 01-02 清理,不属于阻断目标的 stub。

## Threat Flags

无新增威胁面。计划 `<threat_model>` 的 4 项(T-01-01 动态 import、T-01-02 /dashboard 非空断言、T-01-03 token 持久化、T-01-04 files/scripts)均已 mitigate:动态 import grep 校验为 0、/dashboard 命令三处同步删除、dashboard 配置块与 4 函数移除、files/scripts 去 dashboard 化。

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| i18n | 93 条面板死串(/dashboard、--no-dashboard、dashboardPortInvalid、dashboardAutoStartFailed 等) | 交由 01-02 | 01-01 |
| 叙事注释 | 23 处 src/ 内提及 "dashboard" 的描述性注释(非耦合代码) | 交由 01-02 | 01-01 |
| 运行时冒烟 | TUI 一轮对话冒烟(需交互式 TTY + DeepSeek key) | 交由 01-02 | 01-01 |

## Next Phase Readiness

- 01-02 可立即开始:代码耦合已清零,typecheck/build/lint 绿,提供干净的 i18n 死串基线(116 处 dashboard 提及:93 i18n + 23 注释/TUI-cost 函数名)。
- 本计划验证了核心对 server 仅弱引用的事实(剥离后核心零回归),为 Phase 2(机器人解耦)/Phase 3(桌面 GUI 删除)建立信心。

---
*Phase: 01-web-panel-removal*
*Completed: 2026-07-02*

## Self-Check: PASSED

- 创建文件:scripts/write-cli-package-marker.mjs、01-01-SUMMARY.md 均 FOUND
- 任务提交:438d355c / b6fe919a / baa4f52b 均 FOUND
- 关键产物:dashboard/ 与 src/server/ 已删;dist/cli/index.js 已生成;tree-sitter 脚本与 src/code-query/ 红线保留
