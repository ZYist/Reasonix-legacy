# Phase 3: Desktop GUI Removal - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning

<domain>
## Phase Boundary

移除 Tauri 桌面应用(`desktop/`)与 Node sidecar 外壳代码,从 Commander 注销 `reasonix desktop` 子命令,并验证 Phase 2 已解耦的机器人三通道(qq/telegram/weixin)与 CLI 核心命令(`chat`/`code`/`run`/`acp`)不受影响。

**In scope:**
- 删除 `desktop/` 目录(Tauri Rust shell `desktop/src-tauri/` + 前端 `desktop/src/`,含独立 `package.json`/`package-lock.json`/`tsconfig.json`/`vite.config.ts`)
- 删除 sidecar 外壳代码:`src/cli/commands/desktop.ts`(3555 行,`desktopCommand` 入口 + `qqRuntime` 状态机 + NDJSON-RPC-over-stdin 协议 + gate 桥接范式)
- 删除 `src/desktop/` 助手目录(`qq-{ingress,remote-commands,settings,turn-routing}.ts` + `login-shell-path.ts` + `memory-browser.ts`)
- 从 Commander 注销 `reasonix desktop`,替换为薄 stub + i18n 迁移提示
- 清理 desktop/sidecar 相关 i18n 死串 + 同步 5 locale(沿用 01-02 模式)
- 冒烟验证:机器人三通道命令可启动收发、CLI 核心命令不回归、`npm run build`/`typecheck`/`lint` 退出 0

**Out of scope(归 Phase 4 / PANEL-04):**
- 构建链全面简化:`files`/`postinstall`/`typecheck` trim、`build` 脚本去 dashboard/desktop 依赖、CLI 独立构建发布
- `release.yml` Tauri 打包工作流退役(`desktop-v*` tag 触发)、R2+GitHub updater endpoint 下线、Rust toolchain 平台依赖从 CI/文档移除
- 全量 `npm run verify` 回归(逐命令冒烟所有纯 CLI 命令 + tree-sitter/code-query 保留验证)
- 新增 CLI 功能(本里程碑只做精简,不加新能力)

**关键约束(贯穿):** `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` 不得删(服务 CLI 代码符号搜索);核心 loop/工具/记忆/MCP/AcP 零回归;本期保纯 CLI 可用(MVP 垂直切片)——build/typecheck/lint 必须退出 0;前置依赖 Phase 2 已满足(机器人迁至 `HeadlessHost`,sidecar 现为孤儿,可安全删除)。

</domain>

<decisions>
## Implementation Decisions

### desktop.ts 删除粒度 (D-01)
- **D-01:** `src/cli/commands/desktop.ts` **整文件 `git rm`**(而非逐片段 carve-out)。researcher 先 grep 确认 `src/` 内 `HeadlessHost` 之外无消费者(Phase 2 已把 `buildRuntimeFor` recipe @1376-1400、`RuntimeState`/`Tab` 形状、gate 桥接范式 `parseRunPermissionChoice` 等 @1866-1882 复刻进 `src/cli/headless/`);确认无消费者后整文件删除。理由:该文件 3555 行混合 RPC dispatch / Tab 状态机 / TUI 适配,唯一运行时职责是已退役的 sidecar,逐片段保留只会留下审查负担与潜在死码,且 Phase 2 D-09 已把删除明确推迟到本期。若 researcher 发现意外消费者,把所需片段迁入 `src/cli/headless/`(或对应子目录)再删整文件——不就地保留。

### src/desktop/ 助手删除策略 (D-02)
- **D-02:** `src/desktop/` **整目录删除**,但 researcher 必须先 grep `login-shell-path.ts` 与 `memory-browser.ts` 的消费者(二者名字听起来可能被 core/bot 复用,不像 `qq-*.ts` 四件明显是 sidecar 专属)。策略:有非 desktop 消费者 → 把模块迁到合适位置(`packages/core-utils/src/` 或对应的 `src/` 子目录)再从 `src/desktop/` 删;无消费者 → 同删。`qq-{ingress,remote-commands,settings,turn-routing}.ts` 四件无悬念随 sidecar 删除。目标:整目录清零,不留孤儿模块,也不误删被复用代码。

### 构建链/CI 切分边界 (D-03)
- **D-03:** **本期只做「保 build 绿」的最小修复,完整构建链清理全留 Phase 4(PANEL-04)。** 具体划线:本期 `npm run build`(tsup)/`typecheck`/`lint` 必须退出 0——若删 `desktop/` 或 `desktop.ts` 导致根构建断裂(如根 `package.json` scripts、`tsup.config.ts` 入口图、`files` 字段引用了 desktop),本期修到绿;但 `files`/`postinstall`/`typecheck` 的 dashboard/desktop 配置 trim、`release.yml`(Tauri 打包,仅 `desktop-v*` tag 触发,不挡常规 CI)退役、R2+GitHub updater endpoint 下线、Rust toolchain 平台依赖从 `.github/workflows/ci.yml` 矩阵与 CLAUDE.md 移除,**统一归 Phase 4**。契合 ROADMAP 切分(PANEL-02 vs PANEL-04)与「每期保纯 CLI 可用」MVP 垂直切片。researcher 需核实 `desktop/` 是否为 root workspace 成员(maps 显示它是独立嵌套 npm 项目,非 root `workspaces: ["packages/*"]` 成员)以判断根构建是否真受影响。

### `reasonix desktop` 退役行为 (D-04)
- **D-04:** 退役后保留一个**薄 stub 子命令注册**(`src/cli/index.ts` Commander),执行 `reasonix desktop` 时打印 i18n 迁移文案(「desktop 已下线,请改用 `reasonix qq` / `telegram` / `weixin`」)+ 非零退出码。走 `t()` + 5 locale 同步(沿用 01-02 i18n 契约)。理由:对老用户最友好,明确指引迁移目标,契合 CLAUDE.md「log+crash > silent wrong output」原则。**不**完全注销走 Commander 默认 unknown-command 报错(未走 i18n、不指迁移目标),**不**静默退出 0(违反「不静默掩盖」)。

### i18n 死串清理时机 (D-05)
- **D-05:** desktop/sidecar 相关 i18n 死串**本期清理**(沿用 Phase 1 的 01-02 模式:删面板同期清 93 条死串、收敛 116→24)。本期删 desktop/sidecar 同步清理其专属 i18n key + 5 locale(EN/JA/de/zh-CN/ru)同步,保持 i18n 契约紧致、不留孤儿 key。合法引用(若清理过程中发现非死串的 desktop 字面量)作 drift 基线保留并在 CONTEXT/VERIFICATION 记录,留 Phase 4 统一审视。

### Claude's Discretion
- **测试删除范围**:删仅覆盖已移除 sidecar/desktop 表面的测试(镜像 Phase 1 删 12 个面板专属测试的约定);若某测试同时覆盖仍存活的核心逻辑,保留并剔除 desktop 专属断言。具体识别由 plan 阶段逐文件判断。
- **stub 文案与退出码**:迁移提示的具体措辞、退出码值(`1` 还是专用码)、是否建议 `--help` 列出,走 i18n key 命名规范与现有命令的退出码惯例。
- **i18n key 命名**:新增迁移提示 key 的命名遵循现有 `src/i18n/types.ts` 契约。
- **smoke 验证深度**:三通道冒烟到「命令启动无 sidecar 报错」还是「完整收发一轮」由 plan 阶段定;Telegram 在 Phase 2 UAT 因缺 `TELEGRAM_BOT_TOKEN` deferred(02-VERIFICATION.md Acknowledged Gaps),本期若仍无 token 则延续 acknowledged-deferred 策略,不阻塞本期完成。

### Folded Todos
无待办匹配本 phase(STATE.md Pending Todos = None;`cross_reference_todos` 返回 `todo_count: 0`)。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

无外部 SPEC/ADR 文档(本仓库为 fork,无 ADR 体系);关键约束散落在 `.planning/` 文档与 `.claude/CLAUDE.md`。canonical refs 以文档章节 + 代码锚点为主。

### Requirements & constraints
- `.planning/REQUIREMENTS.md` §PANEL-02 — 本期必须满足(desktop/ + sidecar 移除、`reasonix desktop` 下线)
- `.planning/REQUIREMENTS.md` §PANEL-04 / §SAFE-01 / §SAFE-02 / §SAFE-03 + Out of Scope — 本期**不得越界**的边界:构建链清理归 Phase 4;不得删 tree-sitter/code-query;不得重写 channel 协议
- `.planning/ROADMAP.md` §Phase 3 — Goal + 4 条 Success Criteria + 单 plan `03-01` 定义
- `.claude/CLAUDE.md` §Constraints / §Conventions / §Comments — tech stack、kebab-case 模块、CLI 二进制入口(`reasonix`/`dsnix` → `dist/cli/index.js`)、tree-sitter 构建链保留、i18n 5-locale 契约、注释禁叙事/禁 FIXME
- `.planning/PROJECT.md` Key Decisions — M1 三条(fork 剥 GUI 方向、机器人先解耦再删 GUI、phase 依赖序 1→2→3→4);Context 节「当前进度 2026-07-04」记录 Phase 2 完成、sidecar 字节未动待本期删

### Prior phase context(继承,不重问)
- `.planning/phases/02-bot-decoupling-to-standalone-cli/02-CONTEXT.md` — **D-09 共存契约**(sidecar 在 Phase 2 全程冻结、本期删)+ **deferred**(删除 `desktop.ts`/sidecar/`src/desktop/qq-*.ts`/`src/desktop/{login-shell-path,memory-browser}.ts` 明确推到 Phase 3);D-01/D-02 HeadlessHost 复刻 recipe 的细节
- `.planning/phases/02-bot-decoupling-to-standalone-cli/02-VERIFICATION.md` — Telegram UAT deferred(缺 token)、WR-05 medium deferred;本期冒烟深度的前置上下文
- `.planning/phases/01-web-panel-removal/` — Phase 1 删 `dashboard/`+`src/server/` 的既有模式(同期清 i18n 死串、删专属测试、保 build 绿),本期镜像沿用

### Code anchors — 删除目标(researcher 先 grep 消费者)
- `src/cli/commands/desktop.ts` — 3555 行 sidecar god module;`desktopCommand(opts)` @1499(sidecar 入口,本期删)、`buildRuntimeFor(tab)` @1376-1400(recipe,Phase 2 已复刻)、`qqRuntime` 状态机、gate 桥接 @1866-1882(Phase 2 已复刻)
- `src/desktop/qq-{ingress,remote-commands,settings,turn-routing}.ts` — sidecar 专属助手,随删
- `src/desktop/login-shell-path.ts` / `src/desktop/memory-browser.ts` — **D-02 researcher 必验消费者**,有则迁、无则删
- `desktop/`(整目录)— Tauri 应用:`desktop/src-tauri/src/{main,rpc,cc_switch}.ts`(rusqlite SQLite,desktop-only,承载 CC switch/MCP state,随 desktop 删除一并消失——预期内,无对应 CLI 需求)、`desktop/src/` 前端、`desktop/src-tauri/tauri.conf.json`(R2+GitHub updater pubkey/endpoint)
- `src/cli/index.ts` Commander — `reasonix desktop` 注册点(D-04 替换为薄 stub)

### Code anchors — 复用/不得触碰(reuse, do NOT break)
- `src/cli/headless/` — Phase 2 提取的无头对话宿主(复用 `CacheFirstLoop`/`PauseGate`/完整 `ToolRegistry`);本期证明 sidecar 可删的事实依据,**不得改动**
- `src/qq/` / `src/telegram/` / `src/weixin/` — 三 channel 协议层(公共方法 `start`/`sendResponse`/`stop`/`refreshAccessConfig`/`describeAccess`),本期**保留**,冒烟验证其经 `HeadlessHost` 仍可启动
- `src/i18n/{EN,JA,de,zh-CN,ru}.ts` + `src/i18n/types.ts` — i18n 契约(D-04 新增迁移提示 key、D-05 清 desktop 死串,均需 5 locale 同步)
- `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` — **贯穿红线,任何删除清单不得包含**
- `tsup.config.ts` + 根 `package.json`(`scripts`/`files`/`workspaces`)— 本期保 build 绿的检查面(D-03);完整 trim 留 Phase 4

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`src/cli/headless/` HeadlessHost(Phase 2)** — 已接管 sidecar 的全部核心职责(loop 构造 + gate 桥接 + turn 驱动);它的存在是本期可整删 `desktop.ts` 与 `src/desktop/qq-*.ts` 的前提证据。本期不改动它,只验证它仍驱动三通道。
- **Commander 子命令注册模式** — `src/cli/index.ts` 既有的 `program.command("...")...action(...)` 模式;D-04 stub 沿用同一注册点,action 改为打印迁移提示 + `process.exit(非零)`。
- **i18n runtime + 5-locale 契约** — `t("key", {vars})` + `src/i18n/types.ts` 类型签名 + 5 locale 文件;D-04 迁移提示与 D-05 死串清理均走此通道(01-02 既定契约)。
- **Phase 1 删除 recipe** — 删目录 + 同期清 i18n 死串 + 删专属测试 + 保 build 绿的完整流程已在 Phase 1(01-01/01-02)验证可用,本期镜像。

### Established Patterns
- **一职责一文件、大文件拆同名子目录** — 删除反向操作同样遵循:整文件/整目录清零优于留 carve-out(D-01/D-02)。
- **log+crash > silent wrong output** — D-04 stub 非零退出 + 明确迁移提示,不静默退出 0。
- **injectable boundaries** — `CacheFirstLoopOptions` 注入边界保证删 sidecar 不伤核心 loop;本期验证此解耦的稳健性。
- **named exports only,无 default export;kebab-case.ts 模块** — 新增 stub(若独立文件)遵守;迁移提示 i18n key 命名遵守现有契约。
- **git rm 干净删除** — `desktop/`、`desktop.ts`、`src/desktop/` 均在 git 历史中可追溯,直接 `git rm`,不归档到分支。

### Integration Points
- **CLI 入口**:`src/cli/index.ts` Commander——注销 `desktop` 真命令、注册 D-04 薄 stub;`bin`(`reasonix`/`dsnix` → `dist/cli/index.js`)+ `write-cli-package-marker.mjs` 保留 ESM marker(01-01 防回归契约)。
- **tsup 构建链**:`tsup.config.ts` CLI 入口图须不因删 `desktop.ts` 而断裂(动态 import 清理);`npm run build` 退出 0(D-03 保绿标准)。
- **机器人 lifecycle(冒烟验证点)**:`reasonix qq`/`telegram`/`weixin` → 装配 `HeadlessHost` → 挂载 channel → `channel.start()` → turn → `channel.sendResponse()`;本期验证删 sidecar 后此链路无 `src/desktop/*` 缺失引用。
- **i18n 同步**:任何新增/删除 key 须 5 locale 同步(D-04/D-05)。

</code_context>

<specifics>
## Specific Ideas

- 「整文件删除 + researcher 预检 grep」是 D-01 的执行形态:不逐片段审查,但删前用 grep 兜底,避免误删被 HeadlessHost 之外复用的导出。
- `src/desktop/login-shell-path.ts` 与 `memory-browser.ts` 是 D-02 唯一需要 researcher 判断去留的模块;`qq-*.ts` 四件无悬念。
- 构建链划线(D-03)的核心判据:「本期 build/typecheck/lint 是否退出 0」——退出 0 即本期达标,其余 trim 留 Phase 4;`release.yml` 仅 `desktop-v*` tag 触发,不挡常规 push/PR,可安全留到 Phase 4。
- D-04 stub 的迁移提示**必须**指向 `reasonix qq`/`telegram`/`weixin` 三命令(老 desktop 用户的使用场景就是远程控制机器人)。
- 冒烟验证至少覆盖 Success Criteria 3(qq/telegram/weixin 可启动)与 4(chat/code/run/acp 不回归);Telegram 若仍缺 token 延续 Phase 2 的 acknowledged-deferred。

</specifics>

<deferred>
## Deferred Ideas

- 构建链全面简化(`files`/`postinstall`/`typecheck` trim、`build` 去 dashboard/desktop 依赖、CLI 独立构建发布)→ **Phase 4**(PANEL-04)。
- `release.yml` Tauri 打包工作流退役、R2+GitHub updater endpoint 下线、Rust toolchain 从 CI 矩阵与 CLAUDE.md 移除 → **Phase 4**(PANEL-04,属构建链/CI 清理)。
- 全量 `npm run verify` 回归 + 逐命令冒烟所有纯 CLI 命令 + tree-sitter/code-query 保留验证 → **Phase 4**(SAFE-01/02/03)。
- sidecar 内 QQ 宿主代码与 `reasonix qq` 的去重(Phase 2 双入口并存遗留)→ 本期删 sidecar 时随 D-01/D-02 一并清理(已纳入 in scope,非再 deferred)。
- CC switch / MCP state(`desktop/src-tauri/src/cc_switch.rs`,desktop-only SQLite)随 `desktop/` 删除一并消失——预期内,无对应 CLI 需求;若后续有 CLI 侧 CC switch 需求,属新能力,另开 phase。

</deferred>

---

*Phase: 3-Desktop GUI Removal*
*Context gathered: 2026-07-04*
