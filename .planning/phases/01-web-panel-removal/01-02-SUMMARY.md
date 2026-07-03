---
phase: 01-web-panel-removal
plan: 02
subsystem: cli
tags: [removal, i18n, runtime-smoke, cli]

requires: [01-01]
provides:
  - "清理 01-01 之后剩余的面板 i18n 死串(types.ts 契约 + 5 个 locale 键集一致)"
  - "运行时冒烟证据:reasonix code TUI 完成一轮带原生 read_file 的对话,面板切除无运行时残留"
  - "收敛 grep 基线(src/ 下 dashboard 提及 116 → 24),作为 Phase 4 drift 检查基线"
affects: [04-build-chain-regression]

tech-stack:
  added: []
  patterns:
    - "i18n 契约同步:types.ts 删键 → EN.ts(事实来源)先行 → 其余 locale 对齐,tsc 兜底 missing/excess keys"

key-files:
  created: []
  modified:
    - "src/i18n/types.ts"
    - "src/i18n/EN.ts"
    - "src/i18n/zh-CN.ts"
    - "src/i18n/JA.ts"
    - "src/i18n/de.ts"
    - "src/i18n/ru.ts"
    - "src/cli/ui/markdown.tsx"
    - "src/cli/ui/App.tsx"
    - "src/code/plan-store.ts"

key-decisions:
  - "剩余 24 处 dashboard 字面量均为合法保留:stats CLI 用量统计命令(dashboard()/renderDashboard() 是终端用量面板,非已删 Web 面板)+ 带 issue 锚点的隐藏约束注释,记为 Phase 4 drift 基线"
  - "运行时冒烟以 reasonix code 模式为准(chat 模式按设计 filesystem-less,无原生 read_file)"

patterns-established:
  - "运行时冒烟区分 code(全原生工具)与 chat(filesystem-less)两种 CLI 模式,避免把模式设计误判为回归"

requirements-completed: [PANEL-03]

coverage:
  - id: D1
    description: "src/i18n/types.ts 与 5 个 locale 不再含面板专用键,键集一致(tsc 通过)"
    requirement: PANEL-03
    verification:
      - kind: other
        ref: "grep -c 'dashboardPortHint|dashboardPortInvalid|noDashboard|dashboardAutoStartFailed|handlers.dashboard|statusDash' src/i18n/types.ts == 0; 5 locale 同步为 0; npm run typecheck exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "reasonix code TUI 完成一轮对话:发消息 → 模型回复 → 原生 read_file 工具调用 → 结果回显,无面板相关报错"
    requirement: PANEL-03
    verification:
      - kind: other
        ref: "人交互确认:reasonix code 模式下模型调用 read_file package.json 返回 version 0.55.0;chat/code 双模式干净启动无 ESM 动态 import 失败"
        status: pass
    human_judgment: true
  - id: D3
    description: "reasonix code --help 不再列出 --no-dashboard/--dashboard-port/--dashboard-host"
    requirement: PANEL-03
    verification:
      - kind: other
        ref: "node dist/cli/index.js code --help 输出三选项命中数 0(执行者预检)"
        status: pass
    human_judgment: false
  - id: D4
    description: "typecheck/build/lint 在 01-01 绿的基础上继续绿"
    requirement: PANEL-03
    verification:
      - kind: other
        ref: "npm run typecheck && npm run build && npm run lint 均 exit 0; tests/comment-policy.test.ts 9/9 通过"
        status: pass
    human_judgment: false

duration: 24min
completed: 2026-07-03
status: complete
---

# Phase 01 Plan 02: i18n 清理 + 运行时 TUI 冒烟 Summary

**清理 01-01 之后剩余的面板 i18n 死串(types.ts 契约 + EN/zh-CN/JA/de/ru 五个 locale 键集对齐),并通过 reasonix code 模式运行时冒烟证明面板切除无运行时残留——模型在 TUI 内直接调用原生 read_file 读到 package.json 版本 0.55.0。**

## Performance

- **Duration:** ~24 分钟(含人交互冒烟)
- **Tasks:** 2/2 完成(Task 1 自动化 + Task 2 人交互冒烟)
- **Files modified:** 9(i18n 契约 1 + locale 5 + markdown 注释 1 + 顺手清理 2)

## Accomplishments

- `src/i18n/types.ts` 移除全部面板专用键声明:`ui.dashboardPortHint`、`ui.dashboardPortInvalid`、`ui.noDashboard`、`ui.dashboardAutoStartFailed`、整段 `handlers.dashboard.*`(notAvailable/stopNoCallback/notRunning/stopping/copied/tokenReset/tokenResetting/ready/readyHint/failed/alreadyRunning/alreadyRunningHint)、`statusDash`,及对应的文档注释
- 5 个 locale 文件(EN/zh-CN/JA/de/ru)同步删除对应值字符串,键集与 types.ts 完全一致(tsc 验证无 missing/excess keys)
- `src/cli/ui/markdown.tsx` 顶部「mirrors dashboard/app.css」叙事注释中性化
- 顺手清理 `src/cli/ui/App.tsx`、`src/code/plan-store.ts` 残留的面板叙事性引用(违反 CLAUDE.md「无版本/事故叙事」)
- 收敛 grep 基线:`grep -rn "dashboard" src/ | wc -l` 从 01-01 的 116 降至 **24**;剩余 24 处均为合法保留(stats CLI 用量统计命令 + 带锚点隐藏约束注释),作为 Phase 4 drift 检查基线

## Task Commits

1. **Task 1: 清理 i18n 面板专用死串 + 收敛基线快照** - `cff185e7` (refactor)
2. **Task 2: 运行时冒烟(人交互验证)** - 无代码提交(纯运行时人确认,结果记录于本 SUMMARY 与 STATE.md);checkpoint 文档提交 `e876dc6e`

## Runtime Smoke Findings(关键)

**冒烟结论:面板切除无运行时回归。** 双重证据:

1. **静态 + 程序化**:`node dist/cli/index.js code --help` 三选项命中 0;`tests/comment-policy.test.ts` 9/9;编排器程序化验证 `import { registerFilesystemTools } from "./dist/index.js"` 后 dispatch `read_file({path:"package.json"})` 成功返回 version `0.55.0`。
2. **人交互 live 回合(reasonix code 模式)**:用户在 TUI 输入「读一下 package.json 的 version 字段」,模型调用**原生 `read_file`**(`✓ read_file package.json · 0.89秒`,非 puppeteer/github MCP),正确读取「head 10 of 150 lines」并返回 `0.55.0`。整回合:消息 → 推理 → read_file 工具调用 → 结果回显 → 模型回复,无 `Cannot find module '../../server/index.js'` 类 ESM 动态 import 失败,无面板相关报错。

**模式区分澄清(重要事实)**:`reasonix chat` 按设计是 **filesystem-less** 模式(`src/cli/index.ts:104` 注释明文),不注册原生文件工具;原生 `read_file`/`edit_file`/`shell` 只在 `reasonix code`(默认子命令,经 `buildCodeToolset` → `seedTools` 注册)与 `reasonix run`(headless)中可用。初轮冒烟用 chat 模式测文件读取会得到「无 read_file 工具」的假阴性——这是模式设计,非面板回归。

## Decisions Made

- **剩余 24 处 dashboard 字面量保留**:经逐条核对均为合法——`reasonix stats` CLI 用量统计命令(其内部 `dashboard()`/`renderDashboard()` 渲染终端用量面板,与已删 Web 面板无关)+ 带 `(#nnn)` 锚点的隐藏约束注释。记为 Phase 4 drift 基线,不强求为 0。
- **冒烟以 code 模式为准**:chat 模式 filesystem-less,文件读取冒烟必须用 code/run 模式。

## Deviations from Plan

无代码层偏离。计划列出的 i18n 键清单为示例,执行时以 `grep -n "dashboard" src/i18n/types.ts` 的实际完整清单为准同步 5 个 locale(计划 context 已预见此点)。顺手清理 `App.tsx`、`plan-store.ts` 的面板叙事注释属计划 action 步骤 5 明文授权。

## Issues Encountered

- **初轮冒烟假阴性**:用户首测用 `reasonix chat`(filesystem-less)读取本地文件,模型仅有 MCP 工具(puppeteer/github)+ skill,无原生 `read_file`,且 `everything` MCP 启不起来(initialize 超时 60s)。诊断为模式设计 + 环境 MCP 故障,**非 Phase 1 回归**(git diff 证 src/tools/、src/loop*、src/mcp/ 零触及)。改用 `reasonix code` 复测,原生 read_file 正常工作。
- **本机全局 reasonix 占位**:用户本机装有原版 reasonix,`reasonix` 命令被占位。绕开方式:`node D:\workspace\reasonix_legacy\dist\cli\index.js <cmd>`。属用户环境,不影响本计划。

## Known Stubs

无。本计划是纯 i18n 清理 + 人交互冒烟,未引入任何 stub 或占位数据。

## Threat Flags

计划 `<threat_model>` 4 项均已 mitigate:
- **T-02-01**(App.tsx 残留动态 import 运行时解析,high):code/chat 双模式干净启动,无 ESM 解析失败——运行时证据已获。
- **T-02-02**(/dashboard 命令残留崩溃,high):01-01 已从 commands.ts/dispatch.ts/types.ts 三处删除且 handler 文件已删;输入未知命令安全提示,不触发非空断言。
- **T-02-03**(i18n 键集不一致运行时 undefined,medium):types.ts 与 5 locale 键集一致,tsc 通过;TUI 启动无 undefined 文案。
- **T-02-SC**(npm 包安装):本计划无新依赖。

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(无)* | | | |

本计划清除了 01-01 deferred 的全部 i18n 死串与叙事注释;用户环境项(全局 reasonix 占位、everything MCP 故障)不属本里程碑范畴。

## Next Phase Readiness

- Phase 1(Web Panel Removal)四条 ROADMAP 成功标准全部满足,可进入 goal 验证。
- 收敛基线 24 处合法 dashboard 字面量已记录,供 Phase 4 构建/回归 drift 检查参考。
- 核心 loop/工具/记忆/MCP/AcP 零回归红线得到静态 + 运行时双重证据。

---
*Phase: 01-web-panel-removal*
*Completed: 2026-07-03*

## Self-Check: PASSED

- i18n 契约:types.ts 与 5 locale 面板键均为 0,tsc 通过
- 任务提交:cff185e7 FOUND;checkpoint 文档 e876dc6e FOUND
- 关键产物:read_file 运行时读到 0.55.0(code 模式人确认 + 程序化验证双重);typecheck/build/lint/comment-policy 四件套绿
- 收敛基线:116 → 24(合法保留)已记录
