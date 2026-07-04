# Phase 3: Desktop GUI Removal - Pattern Map

**Mapped:** 2026-07-04
**Files analyzed:** 11 deletion targets + 6 modify/create targets + 23 test deletions
**Analogs found:** 11 / 11 (all classified; 0 with no analog)

本 phase 是**删除 phase**,不是构建 phase。模式映射的形态与构建 phase 不同:大部分「analog」是 Phase 1 (01-01/01-02) 已验证的删除 recipe,以及现存代码里要**保留**的公共表面(anchor)。PATTERNS.md 分两类:
1. **删除目标的 recipe analog**(怎么删、删前 grep 什么)
2. **新增/修改目标的 pattern analog**(stub 怎么写、i18n key 怎么加、公共方法契约是什么)

---

## File Classification

### 删除目标(delete)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `desktop/` (整目录) | config / shell (Tauri Rust + Vite SPA) | file-I/O | Phase 1 `dashboard/` 目录删除 (01-01 Task 1) | exact |
| `src/cli/commands/desktop.ts` (3555 行 sidecar god module) | controller (sidecar entry) | event-driven (NDJSON-RPC-over-stdin) | Phase 1 `src/server/` 目录删除 (01-01 Task 1) + D-01 grep 预检 | role-match |
| `src/desktop/qq-ingress.ts` | middleware (sidecar QQ 路由分类) | event-driven | 无 (sidecar 专属,整组随删) | no-analog (delete-only) |
| `src/desktop/qq-remote-commands.ts` | controller (sidecar 远程命令派发) | event-driven | 无 (sidecar 专属) | no-analog (delete-only) |
| `src/desktop/qq-settings.ts` | config (sidecar QQ 设置) | request-response | 无 (sidecar 专属) | no-analog (delete-only) |
| `src/desktop/qq-turn-routing.ts` | controller (sidecar turn 路由) | event-driven | 无 (sidecar 专属) | no-analog (delete-only) |
| `src/desktop/login-shell-path.ts` | utility (PATH 增强) | file-I/O | D-02 grep 已确认**仅** `desktop.ts:78` 消费 → 随删 | exact (grep-confirmed) |
| `src/desktop/memory-browser.ts` | utility (记忆浏览) | file-I/O | D-02 grep 已确认**仅** `desktop.ts:84` 消费 → 随删 | exact (grep-confirmed) |
| `tests/desktop-*.test.ts(x)` (23 文件) | test | n/a | Phase 1 删 12 个面板专属测试 (01-01/01-02) | exact |
| i18n `app.sidecarHint` 死串 (5 locale + types.ts) | config (i18n 死串) | n/a | 01-02 Task 1 i18n 死串清理 recipe | exact |

### 修改/新增目标(modify/create)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/cli/index.ts` (注销 desktop 真命令、注册 D-04 stub) | route (Commander) | request-response | `src/cli/index.ts:373-393` (qq 子命令注册) + `:349-370` (现有 desktop 注册块,stub 替换目标) | exact |
| `src/i18n/types.ts` (新增 `commands.desktop` migration key + 删 `app.sidecarHint`) | config (i18n 契约) | n/a | `types.ts:1039-1061` `commands: { qq, telegram, weixin }` 现有形状 | exact |
| `src/i18n/{EN,JA,de,zh-CN,ru}.ts` (5 locale 同步) | config (i18n 实现) | n/a | `EN.ts:2125-2147` `commands: { qq, telegram, weixin }` 各 5 字段 | exact |

### 复用/不得触碰(reuse, do-NOT-break — 冒烟验证的契约)

| Anchor File | Role | Data Flow | Purpose in Phase 3 |
|-------------|------|-----------|---------------------|
| `src/cli/headless/{host,turn-driver,gate-bridges}.ts` | service (headless host) | request-response | Phase 2 提取的宿主,证明 sidecar 可删;不改动 |
| `src/qq/channel.ts` / `src/telegram/channel.ts` / `src/weixin/channel.ts` | service (channel 协议层) | event-driven | 三通道公共方法契约,冒烟验证 start/sendResponse/stop 仍工作 |
| `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` | utility (code-query) | file-I/O | 贯穿红线,任何删除清单不得包含 |

---

## Pattern Assignments

### `desktop/` (整目录删除)

**Analog:** Phase 1 `dashboard/` 目录删除 —— 见 `.planning/phases/01-web-panel-removal/01-01-PLAN.md` Task 1 action 步骤 1 + acceptance `test ! -d dashboard/`。

**删除 recipe(analog 摘自 01-01-PLAN.md Task 1 `<action>` 与 `<verify>`):**
- 整目录 `git rm -rf desktop/`,删除后 `test ! -d desktop/` 通过。
- `desktop/` 是**独立嵌套 npm 项目**(CLAUDE.md §Runtime:「desktop/ and dashboard/ as nested npm projects, each with its own package-lock.json」),**不是**根 `package.json` 的 `workspaces: ["packages/*"]` 成员(已核实根 `package.json` `workspaces` 字段不含 desktop)。直接删除不破坏根构建。
- D-03 边界:本期只做「保 build 绿」;`release.yml`(仅 `desktop-v*` tag 触发)退役、Rust toolchain 从 CI 矩阵移除、R2+GitHub updater endpoint 下线全留 Phase 4(deferred)。

**删前 grep 预检(本期执行):**
```
# 确认 src/ 内无任何对 desktop/ 前端或 src-tauri 的 import
grep -rn "from \"\.\./\.\./desktop/\|from \"\.\./desktop/\|desktop/src-tauri" src/
```
预期:0 命中(`desktop/` 是 Tauri 应用,由 OS 进程启动,不被 `src/` import)。

---

### `src/cli/commands/desktop.ts` (整文件删除,D-01)

**Analog:** Phase 1 `src/server/` 目录删除 + D-01 grep 兜底。

**删除 recipe(摘自 03-CONTEXT.md D-01):**
- 3555 行混合 RPC dispatch / Tab 状态机 / TUI 适配,唯一运行时职责是已退役 sidecar,**整文件 `git rm`**(不逐片段 carve-out)。
- 删前 grep 兜底(D-01 强制):

```bash
# HeadlessHost 之外有无消费者
grep -rn "from \"[^\"]*commands/desktop\.js\?\|from \"\.\./\.\./desktop/" src/
```
预期:**仅** `src/cli/index.ts:364` `const { desktopCommand } = await import("./commands/desktop.js")` 一处运行时 import(本期 D-04 stub 替换它)+ `src/cli/commands/desktop.ts:78,84` 内部对 `src/desktop/*` 的 import(整文件删,不计数)。

**已确认的内部导出(删前确认无外部 import):**
- `desktopCommand(opts)` @ `src/cli/commands/desktop.ts:1499`(sidecar 入口)
- `buildRuntimeFor(tab)` @ 1376-1400 —— **Phase 2 已复刻进 `src/cli/headless/host.ts:84-121`(`HeadlessHost.create`)**,见 host.ts 头部模块注释明确引用此 recipe
- `RuntimeState`/`Tab` 类型 @ 1316-1415 —— Phase 2 已复刻
- gate 桥接 `parseRunPermissionChoice` 等 @ 1866-1882 —— Phase 2 已复刻进 `src/cli/headless/gate-bridges.ts:112-123`

**tsup 构建链红线(D-03):** `tsup.config.ts:14-30` CLI 入口 `src/cli/index.ts` 用 `noExternal: [/.*/]` 把整个动态 import 图打进 `dist/cli/index.js`。`desktop.ts` 删除后,**必须同步**把 `src/cli/index.ts:364-365` 的 `await import("./commands/desktop.js")` + `desktopCommand(...)` 调用替换为 D-04 stub,否则 esbuild bundle 会因 dangling import 失败。

---

### `src/desktop/qq-{ingress,remote-commands,settings,turn-routing}.ts` (整组随删)

**Analog:** 无(sidecar 专属助手,无独立消费者)。CONTEXT D-02 明确「`qq-*.ts` 四件无悬念随 sidecar 删除」。

**删除 recipe:** 与 `desktop.ts` 同批 `git rm`,无预检需求(sidecar 专属,仅 `desktop.ts` 内部 import)。

**删前 grep(可选兜底):**
```bash
grep -rn "from \"[^\"]*desktop/qq-" src/
```
预期:仅 `src/cli/commands/desktop.ts` 内部 import。

---

### `src/desktop/login-shell-path.ts` + `src/desktop/memory-browser.ts` (D-02 grep-confirmed delete)

**Analog:** D-02 预设的 grep-or-migrate 流程;**本期已 grep 确认走「随删」路径**。

**D-02 grep 结果(已完成,planner 直接用):**
```
src/cli/commands/desktop.ts:78: import { augmentProcessPath } from "../../desktop/login-shell-path.js";
src/cli/commands/desktop.ts:84: } from "../../desktop/memory-browser.js";
```
**仅** `desktop.ts` 两处消费,**无** core/bot 复用 → 按 D-02「无消费者 → 同删」分支处理,不需要迁移。

---

### `tests/desktop-*.test.ts(x)` (23 文件删除)

**Analog:** Phase 1 删 12 个面板专属测试(01-01 PLAN `<files_modified>` 的 deleted 部分 + Phase 1 SUMMARY 的测试清理记录)。

**镜像 01-01 的判断规则(03-CONTEXT.md Claude's Discretion):**
- 删**仅**覆盖已移除 sidecar/desktop 表面的测试
- 若某测试同时覆盖仍存活的核心逻辑,**保留**并剔除 desktop 专属断言

**完整删除清单(23 文件,均以 `desktop-` 前缀,sidecar 专属):**
```
tests/desktop-abort-draft.test.ts          tests/desktop-memory-browser.test.ts
tests/desktop-abort-policy.test.ts         tests/desktop-mcp-servers.test.ts
tests/desktop-btw-status.test.ts           tests/desktop-mcp-settings-layout.test.ts
tests/desktop-composer-autosize.test.ts    tests/desktop-qq-config.test.ts
tests/desktop-crash-guards.test.ts         tests/desktop-qq-ingress.test.ts
tests/desktop-csp.test.ts                  tests/desktop-qq-remote-commands.test.ts
tests/desktop-edge.test.ts                 tests/desktop-qq-settings-ui.test.ts
tests/desktop-login-shell-path.test.ts     tests/desktop-qq-turn-routing.test.ts
tests/desktop-session-load.test.ts         tests/desktop-session-rename.test.ts
tests/desktop-sidebar-new-chat-layout.test.ts  tests/desktop-slash-settings.test.ts
tests/desktop-startup-failure.test.tsx     tests/desktop-stdout-write.test.ts
tests/desktop-user-message.test.ts
```

**必须保留**的对侧测试(覆盖存活 surface,冒烟证据):
```
tests/headless-host.test.ts                tests/headless-gate-bridges.test.ts
tests/qq-command.test.ts                   tests/qq-channel.test.ts         tests/qq-channel-gate-callbacks.test.ts
tests/telegram-command.test.ts             tests/telegram-channel.test.ts
tests/weixin-command.test.ts               tests/weixin-bot.test.ts
```

---

### i18n 死串清理 (D-05) —— 沿用 01-02 recipe

**Analog:** `.planning/phases/01-web-panel-removal/01-02-PLAN.md` Task 1 完整 recipe(types.ts + 5 locale 同步,EN 先行)。

**本期 i18n 死串清单(小,仅 1 条真死串):**
- `app.sidecarHint` (`types.ts:257` + `EN.ts:705-706` + `zh-CN.ts:676` + `JA.ts:796` + `de.ts:693-694` + `ru.ts` 对应行)
  - 文案「sessions auto-create the sidecar on first turn」引用 sidecar 的自动创建行为,sidecar 删后此键成死串,5 locale 同步删除。

**作 drift 基线保留(非死串,NOT 删除):**
- `commands.{qq,telegram,weixin}.help` 各含「decoupled from the desktop sidecar / vom Desktop-Sidecar entkoppelt / 桌面 sidecar 解耦」—— 这些是**活引用**(描述新命令的存在价值),按 03-CONTEXT D-05「合法引用作 drift 基线保留并在 CONTEXT/VERIFICATION 记录」处理,planner 在 PLAN 的 acceptance 记录剩余计数即可。

**01-02 recipe 核心(摘自 01-02-PLAN.md Task 1 `<action>`):**
1. `grep -n "sidecar\|desktop" src/i18n/types.ts` 取本机完整清单
2. types.ts 删 `sidecarHint` 声明 + 上方注释
3. EN.ts 先改(契约事实来源),其余 4 locale 对齐;tsc 捕获 missing/excess keys
4. `npm run lint:fix` 整理 + `npm run typecheck && npm run build && npm run lint` 三件套验证

---

### `src/cli/index.ts` (D-04 stub 注册)

**Analog:** `src/cli/index.ts:349-370`(现有 desktop 注册块,stub 替换目标)+ `:373-393`(qq 子命令注册,同款 Commander 链式形状)。

**现有 desktop 注册块(待替换,`src/cli/index.ts:349-370`):**
```typescript
program
  .command("desktop")
  .description("headless JSON-RPC chat for the desktop client (internal)")
  .option("-m, --model <id>", t("ui.modelIdHint"))
  .option("--dir <path>", "root directory for filesystem tools (default: cwd)")
  .option("--effort <level>", t("ui.effortHintShort"))
  .option("--budget <usd>", t("ui.budgetHintShort"), (v) => Number.parseFloat(v))
  .action(async (opts) => {
    persistEffortFlag(opts.effort);
    const defaults = resolveDefaults({
      model: opts.model,
      mcp: [],
      effort: opts.effort,
      noConfig: false,
    });
    const { desktopCommand } = await import("./commands/desktop.js");
    await desktopCommand({
      model: defaults.model,
      budgetUsd: parseBudgetFlag(opts.budget),
      dir: opts.dir,
    });
  });
```

**qq 子命令同款形状(`src/cli/index.ts:372-393`,stub 可对齐其极简度):**
```typescript
program
  .command("qq")
  .description(t("commands.qq.help"))
  .option("-m, --model <id>", t("ui.modelIdHint"))
  .option("--workspace <path>", t("commands.qq.workspaceHint"))
  // ...
  .action(async (opts) => {
    // ...
    const { qqCommand } = await import("./commands/qq.js");
    await qqCommand({ /* ... */ });
  });
```

**D-04 stub 模式(替换 :349-370 整块):**
- Commander 链保留(`.command("desktop").description(...).action(...)`)
- `.action(...)` 改为**同步打印 i18n 迁移文案 + `process.exit(1)`**
- **不需要** `await import("./commands/desktop.js")`(该文件已删)
- 迁移文案走 `t("commands.desktop.retired", ...)`(新 key,见下条)
- 指向 `reasonix qq` / `telegram` / `weixin` 三命令(03-CONTEXT specifics 明确要求)

**非零退出码惯例(摘自 `src/cli/`):** `process.exit(1)` 是既定标准(`src/cli/commands/{commit,doctor,events,import-sessions,mcp,prune-sessions,sessions,run,stats}.ts` 共 16+ 处使用;`src/cli/index.ts` 自身 :163/:173/:578/:601/:620/:633/:649/:693 共 8 处使用)。**不要**用 `process.exit(2)` 或其他专用码——不符合惯例(Claude's Discretion 已确认走现有惯例)。

**stub 不带 `.option()` 注册**:迁移提示命令不需要 model/workspace/effort/budget 选项(用户跑 `reasonix desktop` 即可看到迁移文案,不应暗示命令仍可用)。

---

### i18n 新增 `commands.desktop.retired` key (D-04)

**Analog:** `src/i18n/types.ts:1039-1061` `commands: { qq, telegram, weixin }` 现有契约 + `src/i18n/EN.ts:2125-2147` 同结构。

**现有 commands 契约形状(`types.ts:1039-1061`):**
```typescript
commands: {
  qq: {
    help: string;
    workspaceHint: string;
    sendFailed: string;
    error: string;
    busy: string;
  };
  telegram: { /* 同形 */ };
  weixin:  { /* 同形 */ };
};
```

**EN.ts 实现(`EN.ts:2125-2147`,契约事实来源):**
```typescript
commands: {
  qq: {
    help: "Start the QQ bot on a headless host (decoupled from the desktop sidecar).",
    workspaceHint: "workspace root directory (default: cwd)",
    // ...
  },
  // telegram / weixin 同形
}
```

**D-04 新增 key 形状(建议,planner 可按 i18n 命名规范微调):**
```typescript
// types.ts commands 段新增:
commands: {
  // ... qq/telegram/weixin 不动
  desktop: {
    retired: string;   // 迁移提示正文
  };
};
```
5 locale 同步新增 `desktop.retired` 值,文案指向 `reasonix qq` / `telegram` / `weixin`。EN 先行,4 locale 对齐,tsc 校验键集一致(01-02 recipe)。

**变量插值惯例:** `t("commands.desktop.retired", { /* vars */ })` —— 现有 i18n runtime 支持变量插值(见 `src/cli/headless/gate-bridges.ts:163,168,176` 等大量 `t("...", { var: value })` 调用)。若文案不含动态变量,可不传第二参。

---

## Shared Patterns

### 删除 recipe(贯穿所有 delete 目标)
**Source:** `.planning/phases/01-web-panel-removal/01-01-PLAN.md` Task 1 + 01-02 Task 1
**Apply to:** 所有删除目标
1. 删前 grep 确认无活消费者(D-01/D-02)
2. `git rm` 整文件/整目录(不留 carve-out)
3. 同步删依赖测试(镜像 Phase 1 删面板测试的判断规则)
4. 同步清 i18n 死串(01-02 recipe:types.ts + 5 locale,tsc 校验)
5. **保 build 绿**:`npm run typecheck && npm run build && npm run lint` 三件套退出 0(D-03)

### Commander 子命令注册(贯穿 `src/cli/index.ts` 修改)
**Source:** `src/cli/index.ts:123-671`(20+ 个子命令注册块,统一链式形态)
**Apply to:** D-04 stub 注册
形态:`program.command("X").description(t("cli.X")).option(...).action(async (opts) => { ... })`。stub 沿用 `.command("desktop").description(...).action(...)` 链,action 内改为同步打印 + `process.exit(1)`。

### 非零退出码惯例
**Source:** `src/cli/` 全域(16+ 处 `process.exit(1)`)
**Apply to:** D-04 stub action
一律 `process.exit(1)`,不用专用码。

### i18n 5-locale 同步契约
**Source:** `src/i18n/types.ts` + `{EN,JA,de,zh-CN,ru}.ts`(01-02 已验证)
**Apply to:** D-04 新增 migration key + D-05 删 sidecarHint
EN.ts 是契约事实来源,先改 EN 再对齐 4 locale;tsc `TranslationSchema` 类型保证 missing/excess keys 编译失败。`handlers` 段是 `[group: string]: { [key: string]: string }` 索引签名(types.ts:326-330),其余段为精确键。

### 「log + crash > silent wrong output」原则
**Source:** `.claude/CLAUDE.md` §Error Handling
**Apply to:** D-04 stub 行为
CONTEXT D-04 明确:不走 Commander 默认 unknown-command 报错(未走 i18n、不指迁移目标),不静默 exit 0。stub 必须 (a) 走 `t()` 出 i18n 文案、(b) 明确指向三迁移命令、(c) `process.exit(1)`。

---

## Reuse / Do-NOT-Break Anchors(冒烟验证契约)

冒烟验证(Success Criteria 3 + 4)依赖以下公共表面**完全不动**。PATTERNS.md 把它们的签名固定下来,planner 在 PLAN 的 `<verify>` 引用:

### HeadlessHost(Phase 2 提取,本期不改动)
**Source:** `src/cli/headless/host.ts`
```typescript
export class HeadlessHost {
  static async create(opts: HeadlessHostOptions): Promise<HeadlessHost>;
  async runTurn(text: string): Promise<string>;   // 返回 assistant 文本 / aborted sentinel / error 文本
  shutdown(): void;                                // 释放 in-flight aborter
}
export function resolveDir(raw: string | undefined, fallback: string): string;  // crash on missing
```
存在性是 sidecar 可整删的事实依据(host.ts:1-6 模块头注释明确引用 `desktop.ts:1374-1397` recipe)。

### HeadlessGateBridge
**Source:** `src/cli/headless/gate-bridges.ts`
```typescript
export function installHeadlessGateBridges(opts: HeadlessGateBridgeOptions): InstalledHeadlessGateBridge;
export function defaultBuildPrompt(kind: string, payload: Record<string, unknown>): string;
export type { ConfirmationChoice } from "../../core/pause-gate.js";
```

### 三 channel 公共方法契约
**Source:** `src/qq/channel.ts:64` QQChannel + 平行 `src/telegram/channel.ts` / `src/weixin/channel.ts`
```typescript
// src/qq/channel.ts 公共方法(行号见 Grep 结果)
refreshAccessConfig(): void;          // :176
describeAccess(): string;             // :180
async start(): Promise<void>;         // :192 — 获取 PID 锁、连 WS、bot 上线
async sendResponse(text: string): Promise<void>;  // :248
async stop(): Promise<void>;          // :289 — 释放 QQ_LOCK_FILE
```
telegram/weixin channel 平行实现同名公共方法(02-CONTEXT D-08 已确认三 channel 签名一致)。冒烟链路:`reasonix {qq,telegram,weixin}` → 装配 `HeadlessHost` → 挂载 channel → `channel.start()` → turn → `channel.sendResponse()` → `channel.stop()`。

### tree-sitter / code-query 红线
**Source:** `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/`
**Apply to:** 任何删除清单的 negative acceptance
绝对不得出现在任何 `<files_modified>` delete 清单。01-01 PLAN 已为此设 negative grep `test -f scripts/copy-tree-sitter-grammars.mjs && test -d src/code-query`,本期 PLAN 必须复用同款 acceptance。

### CLI 二进制入口保留(01-01 防回归契约)
**Source:** `package.json` `bin` + `scripts/write-cli-package-marker.mjs`
**Apply to:** D-03 build 绿的标准
`package.json` `bin`(`reasonix`/`dsnix` → `dist/cli/index.js`)+ `build` 脚本的 `write-cli-package-marker.mjs` 调用**不变**(已核实根 `package.json` 已无 dashboard/desktop 引用,Phase 1 清理过)。

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/desktop/qq-{ingress,remote-commands,settings,turn-routing}.ts` (4 文件) | middleware / controller / config | event-driven | sidecar 专属助手,无独立 analog;随 sidecar 整组删除,不需要找 analog |

无 analog 的 4 文件均为 **delete-only**(无新增/修改需求),不需要 recipe 映射,直接 `git rm`。

---

## Metadata

**Analog search scope:**
- `.planning/phases/01-web-panel-removal/{01-01,01-02}-PLAN.md`(删除 recipe + i18n 清理 recipe)
- `.planning/phases/02-bot-decoupling-to-standalone-cli/02-CONTEXT.md`(D-09 共存契约 + HeadlessHost 提取锚点)
- `src/cli/index.ts`(Commander 注册模式 + 非 0 退出惯例)
- `src/cli/headless/{host,gate-bridges}.ts`(保留的公共表面)
- `src/cli/commands/{desktop,qq,telegram,weixin}.ts`(sidecar 入口 + 三迁移命令的薄入口形状)
- `src/i18n/{types,EN,zh-CN,JA,de,ru}.ts`(i18n 契约 + sidecar 死串定位)
- `src/qq/channel.ts`(channel 公共方法行号)
- `tsup.config.ts` + 根 `package.json`(D-03 build 绿检查面)
- `tests/desktop-*.test.ts(x)` 与 `tests/{headless,qq,telegram,weixin}-*.test.ts(x)` 文件清单

**Files scanned:** 11 删除/修改目标 + 23 测试删除 + 10 保留测试 + 7 i18n 文件 + 6 cli 源文件 = ~57 项

**Pattern extraction date:** 2026-07-04

---

## PATTERN MAPPING COMPLETE

**Phase:** 03 - Desktop GUI Removal
**Files classified:** 17(11 delete + 6 modify/create)+ 23 test deletions
**Analogs found:** 11 / 11(4 个 delete-only sidecar 助手标为 no-analog,符合预期,直接删)

### Coverage
- Files with exact analog: 7(`desktop/` 目录、`desktop.ts`、`login-shell-path.ts`、`memory-browser.ts`、desktop 测试集、`src/cli/index.ts` stub、i18n types/locales)
- Files with role-match analog: 0
- Files with no analog (delete-only): 4(`src/desktop/qq-{ingress,remote-commands,settings,turn-routing}.ts`)

### Key Patterns Identified
- **Phase 1 删除 recipe 复用** —— 删目录 + 同步删测试 + 同步清 i18n 死串 + 保 build 绿的完整流程在 01-01/01-02 已验证,本期镜像(D-01/D-05)。
- **D-02 grep 已完成** —— `login-shell-path.ts` + `memory-browser.ts` 仅被 `desktop.ts:78,84` 消费,走「无消费者 → 同删」分支,不需要迁移到 `packages/core-utils/`。
- **Commander 子命令 stub 模式** —— D-04 替换 `src/cli/index.ts:349-370` 整块,action 改为 `t("commands.desktop.retired") + process.exit(1)`,沿用 src/cli 16+ 处 `process.exit(1)` 惯例。
- **i18n 5-locale 同步契约(01-02)** —— EN 先行,tsc `TranslationSchema` 兜底;本期新增 `commands.desktop.retired` + 删 `app.sidecarHint` 5-locale 同步。
- **HeadlessHost + 三 channel 公共方法** —— 冒烟验证契约固定(`start/sendResponse/stop/refreshAccessConfig/describeAccess`),本期不动只验证。
- **tsup 动态 import 红线** —— `noExternal: [/.*/]` 意味着 `desktop.ts` 删除必须**同步**替换 `src/cli/index.ts:364` 的 `await import`,否则 bundle 断裂。

### File Created
`D:\workspace\reasonix_legacy\.planning\phases\03-desktop-gui-removal\03-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference:
- 01-01/01-02 删除 recipe 作为所有 delete 目标的 action 模板
- `src/cli/index.ts:349-370` + `:373-393` 作为 D-04 stub 的具体替换锚点
- `src/i18n/types.ts:1039-1061` + `EN.ts:2125-2147` 作为 i18n 新增/删除 key 的契约形状
- `src/cli/headless/{host,gate-bridges}.ts` + `src/qq/channel.ts:176-289` 作为冒烟验证的公共表面锚点
- `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` 作为 negative-acceptance 红线
