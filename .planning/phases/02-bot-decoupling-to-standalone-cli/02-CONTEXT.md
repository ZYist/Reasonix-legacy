# Phase 2: Bot Decoupling to Standalone CLI - Context

**Gathered:** 2026-07-03
**Status:** Ready for planning
**Mode:** auto (`--auto` chain via `/gsd-progress --next --auto`; all gray areas auto-selected, recommended option chosen per option, single-pass)

<domain>
## Phase Boundary

提取一个**传输协议无关的无头对话宿主**(headless conversation host),让 QQ / Telegram / 微信 channel 经独立 CLI 命令运行,复用核心 `CacheFirstLoop` / `PauseGate` / 完整 `ToolRegistry`,不再依赖 Tauri JSON-RPC 协议。

**In scope:**
- 从 `src/cli/commands/desktop.ts` 的 `buildRuntimeFor` recipe 提取无头宿主(loop + toolset + system 构造 + 单轮 turn 驱动),与 `Tab` / NDJSON-RPC-over-stdin / Ink 解耦
- 新增顶层 CLI 子命令 `reasonix qq`(及等效 `telegram` / `weixin`),经无头宿主启动 channel
- 迁移三个 channel 的 `use-*-channel.ts` adapter,剥离对 TUI `*Ref` / Ink hook ref 的依赖,改为 gate-callback 闭包对象
- 复用现有 `QQBot` / `TelegramBot` / `WeixinBot` 协议层,不重写协议

**Out of scope:**
- 删除 `desktop/` Tauri 应用与 sidecar 外壳(Phase 3)
- 重写任何 channel 的底层协议(QQ WebSocket / Telegram long-polling / Weixin 扫码登录)
- 新增 CLI 功能(本里程碑只做精简,不加新能力)

**关键约束(贯穿):** `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` 不得删;Phase 3 必须在 Phase 2 之后(QQ 先有无头宿主,sidecar 才能删);每个 plan 保持纯 CLI 可用(MVP 垂直切片);核心 loop / 工具 / 记忆 / MCP / AcP 零回归。

</domain>

<decisions>
## Implementation Decisions

### Headless host extraction locus (D-01/D-02)
- **D-01:** 新建 `src/cli/headless/` 模块承载无头宿主,而非就地重构 `desktop.ts` 或塞进 `chat.tsx`。理由:`desktop.ts` 3555 行混合了 RPC dispatch / Tab 状态机 / TUI 适配,就地重构会触碰核心侧不可回归面;`chat.tsx`/`code.tsx` 是 Ink TUI 入口,与无头宿主职责正交。新模块可独立测试且不污染 TUI 表面,符合「一职责一文件、大文件拆同名目录子模块」约定。
- **D-02:** 无头宿主的核心构造 recipe **直接从 `desktop.ts` 的 `buildRuntimeFor`(line 1376-1400)复刻提取**,而非重新发明。recipe = `buildCodeToolset` → `applyPlanMode(toolset.tools, loadEditMode())` → `new DeepSeekClient({apiKey,baseUrl})` → `new ImmutablePrefix({system, toolSpecs: toolset.tools.specs()})` → `new CacheFirstLoop({client, prefix, tools, model, budgetUsd, session, reasoningEffort, maxIterPerTurn, hooks, hookCwd})` + `new Eventizer()`。这是已验证可用的构造路径(Phase 1 验证 4/4 通过时同一 recipe 在 desktop 上跑通),复刻它而非新建可最大限度满足 BOT-03(核心复用不重复实现)。

### QQ command surface (D-03/D-04)
- **D-03:** 顶层子命令形态:`reasonix qq`(及后续 `reasonix telegram` / `reasonix weixin`),在 `src/cli/index.ts` Commander 注册。复用 `code` 模式的完整 toolset(`buildCodeToolset` 走 filesystem/shell/web 等工具),而非 `chat` 的 filesystem-less 子集 —— 机器人要能编程,必须带文件/执行能力。`reasonix chat` 的 filesystem-less 设计按 01-VERIFICATION 备注 仅属 TUI 模式,不适用于无头机器人宿主。
- **D-04:** 每个机器人命令是一个薄入口:`reasonix qq` → 装配 `HeadlessHost`(workspace 来自 cwd 或 `--workspace` flag) → 挂载 `QQChannel` → `channel.start()` → 转发 inbound 消息到 host 跑一轮 turn → `channel.sendResponse()` 回写。命令层只做装配与 lifecycle,不持业务逻辑。

### Channel→loop gate reversal (D-05)
- **D-06/D-05:** channel adapter(`use-*-channel.ts`)的 gate 交互从「**TUI `*Ref` 回调注入**」改为「**gate-callback 闭包对象**」。当前 `UseQQChannelArgs` 依赖 ~15 个 `onXxxConfirmRef`(shell/path/plan/checkpoint/revision/choice)经 Ink ref 注入,这些 ref 是 TUI 专属。无头宿主改为:adapter 接收一个 `GateCallbacks` 对象(纯函数闭包,不依赖 React/Ink),宿主把 `pauseGate.resolve/cancel` 的桥接实现在闭包里提供;plan/checkpoint/choice 的「向 channel 发确认问题文本 + 解析回复索引」已有实现(`use-qq-channel.ts:parseRunPermissionChoice` 等),原样搬过来,只把 ref 注入点换成对象注入点。
- **D-07:** adapter 的消息分片/Markdown 规整/访问描述逻辑(`splitQQMessage` / `normalizeQQMarkdownReply` / `describeQQAccess` 等)是 channel 专属、与 UI 无关,留在 `src/qq/` 不动,无头宿主只复用 `QQChannel.start()/sendResponse()/stop()/refreshAccessConfig()` 公共方法。

### Telegram/Weixin migration order (D-08)
- **D-08:** Telegram / 微信在 **02-03 内统一迁移**到同一 `HeadlessHost`,三 channel 经同一宿主入口、同一 gate-callback 形状启动。三者的 `channel.ts` 公共方法签名已一致(`start/sendResponse/stop/refreshAccessConfig/describeAccess`),adapter 也高度平行(~900-988 行),统一迁移而非逐个独立适配可避免三份 gate 桥接分叉。QQ 优先(02-02)因它是当前 sidecar 唯一深度耦合者(印证 ROADMAP 02-02→02-03 wave)。

### Sidecar coexistence contract (D-09/D-10)
- **D-09:** 本 phase `desktop.ts` / sidecar **不删、不可回归**。`desktopCommand`(line 1499)及其 NDJSON-RPC-over-stdin 协议、`qqRuntime` 状态机、`src/desktop/qq-{ingress,remote-commands,settings,turn-routing}.ts` 助手全部保留运行。契合 BOT 成功标准 4(sidecar 仍在,QQ 已迁出但 sidecar 未删)。
- **D-10:** 共存的代价是本 phase **短期存在 QQ 双入口**(sidecar 内一套 + 新 `reasonix qq` 一套)。这是可接受的过渡态——两个入口对各自 channel 实例独立,无共享可变状态(`QQ_LOCK_FILE` PID 锁会阻止同一账号双开,见 `src/qq/channel.ts`)。迁移期间 sidecar 仍引用 `src/qq/*` 模块;新命令也引用同一模块,**协议层共享、宿主层分离**。Phase 3 删 sidecar 时再移除 desktop 内 QQ 宿主代码与 `src/desktop/qq-*.ts`。

### Claude's Discretion
- adapter 内部消息文本格式(分片大小、Markdown 规整)沿用现有 channel 模块默认值,不另行调参——属 channel 协议层细节,无 UI 设计契约。
- `reasonix qq` 的启动日志/i18n 文案复用现有 `src/qq/strings.ts` + i18n runtime,新增 key 走 `t("...")` 且同步 5 locale(沿用 01-02 的 i18n 契约)。
- 无头宿主的 workspace 解析优先级:CLI flag `--workspace` > cwd > 报错(不静默回退,遵循「log+crash > silent wrong output」)。

### Folded Todos
无待办匹配本 phase(STATE.md Pending Todos = None;`cross_reference_todos` 无 ≥0.4 匹配)。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

无外部 SPEC/ADR 文档(本仓库为 fork,无 ADR 体系);关键约束散落在 CLAUDE.md 与 REQUIREMENTS.md。canonical refs 以代码锚点为主:

### Requirements & constraints
- `.planning/REQUIREMENTS.md` §BOT-01/02/03 + §SAFE-01/02/03 + Out of Scope — 本 phase 必须满足 BOT 三项、不得触碰 SAFE 回归红线、不得重写 channel 协议
- `.claude/CLAUDE.md` §Constraints / §Conventions — tech stack、kebab-case 模块、E2SM CLI 二进制入口、tree-sitter 构建链保留、i18n 5-locale 契约
- `.planning/PROJECT.md` Key Decisions — M1 三条(fork 剥 GUI 方向、机器人先解耦再删 GUI、phase 依赖序 1→2→3→4)

### Code anchors (reuse, do NOT break)
- `src/cli/commands/desktop.ts:1376-1400` `buildRuntimeFor(tab)` — 无头宿主复刻的 loop 构造 recipe(BOT-03 复用基准)
- `src/cli/commands/desktop.ts:1499` `desktopCommand(opts)` — 本期保留不可回归的 sidecar 入口(D-09 共存契约)
- `src/cli/commands/desktop.ts:1316-1415` `RuntimeState`/`Tab` 类型 — 提取宿主时参照的最小化状态形状
- `src/qq/{channel.ts:64 QQChannel, use-qq-channel.ts:65 UseQQChannelArgs, bot.ts:25 QQBot}` — QQ channel 公共方法签名 + adapter 当前 TUI-ref 耦合面(D-05/D-07)
- `src/telegram/{channel.ts:237 TelegramChannel, use-telegram-channel.ts, bot.ts:91 TelegramBot}` — 平行结构,D-08 统一迁移靶
- `src/weixin/{channel.ts:123 WeixinChannel, use-weixin-channel.ts, bot.ts:239 WeixinBot}` — 平行结构,含扫码登录 `runWeixinQrLogin`(bot.ts:130)
- `src/cli/commands/{chat.tsx, code.tsx}` — TUI 入口的 loop 装配参照(`ToolRegistry`/`rebuildSystem`),无头宿主与它们职责正交,不耦合
- `src/core/pause-gate.ts` `pauseGate.resolve/cancel/ask` + `src/core/pause-policy.ts` `autoResolveVerdict` — gate 桥接实现源
- `src/cli/commands/desktop.ts:1866-1882` — gate 文本→解析→resolve 的现成桥接范式(`parseRunPermissionChoice` 等),适配器原样复刻

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildCodeToolset` / `applyPlanMode`(`src/code/setup.ts`)— code 模式完整工具集 + plan-mode 门控,无头宿主直接复用,满足 BOT-03
- `CacheFirstLoop` + `ImmutablePrefix` + `DeepSeekClient` + `Eventizer`(`src/loop.ts` / `src/memory/runtime.ts` / `src/client.ts` / `src/core/eventize.ts`)— 核心 loop 四件套,recipe 见 `desktop.ts:1382-1400`
- `pauseGate` 单例 + `autoResolveVerdict`(`src/core/pause-gate.ts` / `pause-policy.ts`)— 暂停门,channel adapter 经它桥接 plan/confirm/choice
- 三 channel 的 `class *Channel { start/sendResponse/stop/refreshAccessConfig/describeAccess }` — 公共签名一致,宿主经统一接口挂载
- `parseRunPermissionChoice / parsePlanChoice / parseCheckpointChoice / parseRevisionChoice`(`use-*-channel.ts`)— channel 文本回复→gate 决策解析,adapter 内已有,移到 gate-callback 闭包即可
- `loadQQConfig` / `QQConfig` / `decideQQAccess`(`src/qq/access.ts`)+ `tg`/`weixin` 对应物 — 访问控制已是 channel 内独立逻辑,不动

### Established Patterns
- **一职责一文件、大文件拆同名子目录**(`src/loop/`、`src/tools/shell/`)— 无头宿主新模块遵循,预计拆 `src/cli/headless/{host,gate-bridges,turn-driver}.ts`
- **injectable boundaries**(`CacheFirstLoopOptions` 接受 client/prefix/tools/hooks/`confirmationGate`)— 宿主与 loop 之间经 `CacheFirstLoopOptions` 注入,无头宿主不 new 任何隐藏全局
- **kebab-case.ts 模块 + Option bag ≤5 flag** — `HeadlessHostOptions` 若超 5 flag 即拆分(沿用 CLAUDE.md Function Design 规则)
- **i18n 经 `t()` + 5 locale 同步**(01-02 契约)— 任何新用户可见串走 i18n,无裸 console.log
- **named exports only,无 default export**(`src/` 全域)— 新模块遵守

### Integration Points
- **CLI 入口**:`src/cli/index.ts` Commander 注册 `qq`(及后续 `telegram`/`weixin`)子命令,且经 `bin`(`reasonix`/`dsnix` → `dist/cli/index.js`)+ `write-cli-package-marker.mjs` 保留 ESM marker(01-01 防回归契约)
- **tsup 构建链**:`tsup.config.ts` CLI 入口图须仍能解析新动态 import;`npm run build` 须退出 0(01-VERIFICATION 标准 4)
- **channel lifecycle**:`channel.start()` → inbound `EventEmitter` → host turn → `channel.sendResponse(text)` → `channel.stop()`;PID 锁(`QQ_LOCK_FILE`)防同账号双开
- **gate 桥接**:adapter 收到 inbound → 若需 plan/confirm/choice 临门 → 经 `GateCallbacks` 把问题文本发回 channel → 解析回复 → `pauseGate.resolve/cancel`(范式见 `desktop.ts:1866-1882`)

</code_context>

<specifics>
## Specific Ideas

- 无头宿主 workspace 解析:`--workspace` flag > cwd > 直接 throw(不静默回退)。
- 「短期 QQ 双入口」是可接受过渡态;`QQ_LOCK_FILE` PID 锁天然防同账号双开,无需额外协调。
- adapter 三件套不重写,只把 `*Ref` 注入点替换为对象注入点(`GateCallbacks`),其余(分片/Markdown/访问描述/access 决策)原样迁。
- `reasonix qq`/`telegram`/`weixin` 命令是薄入口,只装配 + lifecycle,业务逻辑留在 adapter 与 host。

</specifics>

<deferred>
## Deferred Ideas

- 删除 `desktop.ts` / sidecar / `src/desktop/qq-*.ts` / `src/desktop/{login-shell-path,memory-browser}.ts` → **Phase 3**(删桌面 GUI)。本期严格不动 desktop sidecar 任何代码(D-09)。
- sidecar 内 QQ 宿主代码与 `reasonix qq` 的去重(本 phase 双入口并存)→ Phase 3 删 sidecar 时一并清理。
- `reasonix qq` 子命令的细粒度 flag(`--model`/`--session`/`--workspace` 覆盖)→ 计划阶段(02-02 PLAN)按需落,不在 context 层决策。
- 三 channel adapter 的进一步抽取(如统一 `BaseChannelAdapter` 基类去重 ~900 行平行代码)→ 若 02-03 迁移时发现显著重复可顺手提议,但属 plan 层判断,不预设;若改动面过大则延后到 Phase 4(构建清理 + 回归)。

### Reviewed Todos (not folded)
无(本 phase 无 todo 匹配)。

</deferred>

---

*Phase: 2-Bot Decoupling to Standalone CLI*
*Context gathered: 2026-07-03*
*Mode: --auto (auto-selected all gray areas, recommended-option per question, single-pass)*
