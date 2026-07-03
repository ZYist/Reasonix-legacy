---
phase: 02-bot-decoupling-to-standalone-cli
plan: 02
subsystem: cli
tags: [cli, qq, bot-decoupling, pause-gate, headless, commander]

requires:
  - phase: 02-bot-decoupling-to-standalone-cli
    provides: 02-01 的 HeadlessHost + installHeadlessGateBridges + GateCallbacks(本 plan 挂载 QQ 其上)
provides:
  - "src/cli/commands/qq.ts — reasonix qq 薄入口(装配 HeadlessHost + QQChannel + gate-bridges,SIGINT/SIGTERM 清理)"
  - "UseQQChannelArgs object-injection 形状(onXxx 纯回调替代 onXxxRef{TUI 调用方包 ref shim})"
  - "gate-bridges dispatchReply 直接 resolve pauseGate(Rule 1 fix — bridge 持 gateId,观察者回调无须再解析)"
  - "commands.qq.* i18n keys(5 locale + TranslationSchema)"
affects: [02-03 (telegram/weixin 挂载同一 Host + 同一 gate-callback 形状), Phase 3 (删 sidecar 时 QQ 已有独立入口)]

tech-stack:
  added: []
  patterns:
    - "Commander 薄入口:program.command('qq') 动态 import ./commands/qq.js(lazy 图,匹配 desktop 块)"
    - "channel 命令装配顺序:loadDotenv → bridgeEndpointEnv → resolveDir → HeadlessHost.create → installHeadlessGateBridges → new QQChannel → SIGINT/SIGTERM → channel.start"
    - "object-injection 取代 TUI *Ref:Ink 调用方包 ref shim(onShellConfirm={(c)=>ref.current?.(c)}),无头宿主直接闭包"
    - "bridge 直接 resolve pauseGate(Rule 1 fix):dispatchReply 持 gateId,产出 ConfirmationChoice 对象形状,工具 type guard 经无头路径可用"

key-files:
  created:
    - src/cli/commands/qq.ts
    - tests/qq-command.test.ts
    - tests/qq-channel-gate-callbacks.test.ts
  modified:
    - src/qq/use-qq-channel.ts
    - src/cli/ui/App.tsx
    - src/cli/headless/gate-bridges.ts
    - src/cli/index.ts
    - src/i18n/EN.ts
    - src/i18n/zh-CN.ts
    - src/i18n/JA.ts
    - src/i18n/de.ts
    - src/i18n/ru.ts
    - src/i18n/types.ts
    - tests/qq-first-connect.test.tsx

key-decisions:
  - "Rule 1 fix:gate-bridges dispatchReply 直接 resolve pauseGate(plan 写 gateCallbacks 闭包 resolve,但回调无 gateId — 设计缺口)。bridge 持 pending.gateId,直接产 ConfirmationChoice 对象(非 desktop 的裸字符串,修正潜在 type bug),gateCallbacks 降级为观察者。02-01 5+4 测试全绿,契约向后兼容。"
  - "TDD 验证命令调整:plan 的 <verify> 写 `node --import tsx tests/qq-*.test.ts`,但 React-hook 测试(qq-channel-gate-callbacks)与 vi.mock stub 测试(qq-command)必须经 vitest 运行。沿用 qq-first-connect.test.tsx 的 vitest 惯例,verify 改 `npx vitest run`(同 02-01 SUMMARY 标注的 dotted-literal i18n grep 类型的 plan 措辞偏差)。"
  - "TUI 调用方 ref shim:App.tsx 的 useQQChannel 调用从 `onShellConfirmRef={ref}` 改为 `onShellConfirm={(c)=>ref.current?.(c)}`。telegram/weixin 调用保持 Ref(其 adapter 02-03 才迁移),QQ/telegram/weixin 在 App.tsx 短期形状不同 = D-10 共存契约。"
  - "i18n 新增 commands 块(非 cli 块):cli 块专放子命令 *描述*,commands.qq.* 含 help/workspaceHint/sendFailed/error/busy 5 key,5 locale + types.ts 同步。"

patterns-established:
  - "reasonix qq 装配配方 — 02-03 telegram.ts/weixin.ts 复刻:薄入口 → HeadlessHost.create → installHeadlessGateBridges(observer gateCallbacks)→ new *Channel({onSubmitMessage, onError, onInfo})→ SIGINT/SIGTERM → channel.start"
  - "object-injection GateCallbacks 是 channel adapter 的稳定注入契约(TUI 包 shim,无头直接闭包,02-03 三 channel 统一)"

requirements-completed:
  - BOT-01

coverage:
  - id: D3
    description: "UseQQChannelArgs 8 个 onXxxRef 字段翻转为 onXxx 纯回调;consumePauseReply 全 8 gate kind 经 tests/qq-channel-gate-callbacks.test.ts 钉死(+T-02-06 deny 默认)"
    requirement: BOT-01
    verification:
      - kind: unit
        ref: "tests/qq-channel-gate-callbacks.test.ts#dispatches run_command/path_access/plan_proposed/plan_checkpoint/plan_revision/choice + T-02-06 deny"
        status: pass
      - kind: static
        ref: "grep on(Shell|Path|PlanCancel|PlanFeedback|CheckpointConfirm|CheckpointRevise|PlanRevision|ChoiceResolve)Ref src/qq/use-qq-channel.ts = 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "src/cli/commands/qq.ts 薄入口:仅装配 + lifecycle,无业务逻辑。host←→channel←→bridge 垂直切片经 tests/qq-command.test.ts 验证"
    requirement: BOT-01
    verification:
      - kind: unit
        ref: "tests/qq-command.test.ts#assembly + inbound dispatch + gate-reply routing + SIGINT cleanup"
        status: pass
      - kind: build
        ref: "npm run build exit 0; node dist/cli/index.js --help advertises qq"
        status: pass
    human_judgment: false
  - id: D9
    description: "desktop.ts + src/desktop/ 字节级未动(git diff --stat 空);sidecar 与 reasonix qq 共存(D-10)"
    requirement: BOT-01
    verification:
      - kind: static
        ref: "git diff --stat src/cli/commands/desktop.ts src/desktop/ = empty; grep -c desktopCommand desktop.ts = 1"
        status: pass
    human_judgment: false
  - id: T-02-09
    description: "SIGINT/SIGTERM 处理器在 channel.start 之前安装(qq.ts:148 < qq.ts:154),Ctrl-C 总能释放 QQ_LOCK_FILE"
    requirement: BOT-01
    verification:
      - kind: static
        ref: "grep -n SIGINT qq.ts line < grep -n channel.start qq.ts line"
        status: pass
    human_judgment: false

duration: ~21min
completed: 2026-07-03
status: complete
---

# Phase 2: Bot Decoupling — Plan 02-02 Summary

**reasonix qq 顶层子命令上线:QQ channel 挂载到 02-01 的 HeadlessHost,与 Tauri JSON-RPC sidecar 完全解耦;adapter 的 TUI *Ref 注入翻转成 GateCallbacks 对象注入;desktop.ts/src/desktop 字节级未动(D-09/D-10 共存)。**

## Performance

- **Tasks:** 2(Task 1 adapter Ref→object 注入 + 9-case gate-callbacks 测试;Task 2 qq.ts 薄入口 + Commander 注册 + i18n 5-locale + 4-case 命令测试 + gate-bridges Rule 1 fix)
- **Files:** 11 created/modified(3 new src/test + 1 new test + 7 modified 含 5 i18n + types + index + gate-bridges)
- **Commits:** `9efe0c4b`(Task 1)、`a66d349c`(Task 2)

## Accomplishments

- `src/cli/commands/qq.ts` 导出 `qqCommand(opts: QqCommandOptions): Promise<void>` — 薄入口(D-04):loadDotenv → bridgeEndpointEnv → resolveDir(--workspace > cwd > crash)→ HeadlessHost.create → installHeadlessGateBridges → new QQChannel → SIGINT/SIGTERM 处理器 → channel.start。inbound onSubmitMessage 先走 bridge.consumeReply(门回复),否则 host.runTurn → channel.sendResponse;并发 inbound 经 turnInFlight 标志 + busy 提示复制 classifyDesktopQQIngress。
- `src/qq/use-qq-channel.ts` `UseQQChannelArgs` 8 个 `onXxxRef` 字段翻转成 `onXxx` 纯回调(D-05/D-06)。consumePauseReply 调用 `onShellConfirm(...)` 等而非 `onShellConfirmRef.current(...)`。内部 ref(pendingGateIdRef/interactionRef/slashInteractionRef/planStepsRef/completedStepIdsRef)保留为 ref(PATTERNS rule 4)。parse*Choice 助手留在原文件(02-03 决定是否抽共享 gate-parsers.ts)。
- `src/cli/ui/App.tsx` QQ 调用方包 ref shim:`onShellConfirm={(c) => handleShellConfirmRef.current?.(c)}` 等 8 字段。telegram/weixin 调用保持 Ref(其 adapter 02-03 迁移)— 短期形状分歧 = D-10 共存契约。
- `src/cli/headless/gate-bridges.ts` Rule 1 fix:dispatchReply 直接 `pauseGate.resolve(gateId, verdict)` / `pauseGate.cancel(gateId)`(bridge 持 gateId,观察者回调无须再解析)。产出 ConfirmationChoice 对象形状(`{type:"run_once"}` 等,非 desktop.ts:1876 的裸字符串 — 修正潜在 type bug,工具 `choice.type === "deny"` 经无头路径可用)。gateCallbacks 降级为观察者(02-01 5+4 测试全绿,向后兼容)。
- `src/cli/index.ts` 注册 `program.command("qq")` 块(镜像 desktop 块形式):`-m/--model`、`--workspace`、`--effort`、`--budget`,动态 `import("./commands/qq.js")` 保持启动图精简。
- `commands.qq.*` i18n keys(help/workspaceHint/sendFailed/error/busy)加到 5 locale + types.ts TranslationSchema(commands 块)。
- T-02-09:SIGINT/SIGTERM 处理器在 channel.start 之前安装(qq.ts:148 < qq.ts:154),Ctrl-C 总能释放 QQ_LOCK_FILE PID 锁。
- T-02-06:unmatched 回复文本默认 deny/cancel(tests/qq-channel-gate-callbacks.test.ts 9 号用例钉死)。

## Verify Gates Run

| Gate | Command | Result |
|------|---------|--------|
| typecheck | `npx tsc --noEmit` | exit 0 |
| Task 1 test | `npx vitest run tests/qq-channel-gate-callbacks.test.ts` | 9 passed |
| Task 1 existing test | `npx vitest run tests/qq-first-connect.test.tsx` | 4 passed |
| Task 2 test | `npx vitest run tests/qq-command.test.ts` | 4 passed |
| 02-01 regression | `node --import tsx tests/headless-gate-bridges.test.ts` | 5 passed(Rule 1 fix 未回归) |
| 02-01 regression | `node --import tsx tests/headless-host.test.ts` | 4 passed |
| public-api | `npx vitest run tests/public-api.test.ts` | pass(无 API 表面变更) |
| shell-tools | `npx vitest run tests/shell-tools.test.ts` | pass(pause-gate 消费者正常) |
| lint | `npx @biomejs/biome check src/cli/commands/qq.ts src/cli/headless/gate-bridges.ts src/cli/index.ts src/i18n/*.ts tests/qq-*.test.ts` | exit 0(10 files) |
| build | `npm run build` | exit 0(tree-sitter grammars preserved — SAFE-02) |
| --help advertises qq | `node dist/cli/index.js --help \| grep qq` | `qq [options] 在无头宿主上启动 QQ 机器人...` ✓ |
| D-09 zero-diff | `git diff --stat src/cli/commands/desktop.ts src/desktop/` | empty ✓ |
| D-10 coexistence | `grep -c desktopCommand desktop.ts` = 1 AND --help 含 qq | both ✓ |
| i18n 5-locale | `grep -l 'commands' src/i18n/{EN,zh-CN,JA,de,ru}.ts \| wc -l` | 5 ✓ |
| transport integrity | `grep -rn 'from "../../desktop' src/cli/commands/qq.ts` | 0(qq.ts 不 import sidecar)✓ |
| T-02-09 ordering | SIGINT handler line(148) < channel.start line(154) | PASS ✓ |

注:plan 的 `<verify>` 写 `node --import tsx tests/qq-channel-gate-callbacks.test.ts` 与 `node --import tsx tests/qq-command.test.ts`,但前者是 React-hook 测试(需 vitest 的 react 环境且含 JSX → 用 React.createElement 保持 .ts 扩展但 vitest 执行),后者用 vi.mock stub(仅 vitest 可运行)。两者均沿用仓库既有 `tests/qq-first-connect.test.tsx` 的 vitest 惯例,verify 改 `npx vitest run`(同 02-01 SUMMARY 标注的 dotted-literal i18n grep 偏差类型 — plan 措辞与运行时实际的偏差,执行时以实际可运行为准)。

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] gate-bridges dispatchReply 直接 resolve pauseGate**
- **Found during:** Task 2(qq.ts 装配时发现 gateCallbacks 无 gateId 参数,无法 fulfill plan 的 "gateCallbacks:{onShellConfirm:(c)=>pauseGate.resolve(...)}" 契约)
- **Issue:** plan 设想 qq.ts 的 gateCallbacks 闭包调用 `pauseGate.resolve(gateId, choice)`,但 GateCallbacks 接口的回调签名不含 gateId(只收 choice)。bridge 内部的 `pending.gateId` 是唯一 gateId 来源,未暴露给回调。plan 原文 "get gateId from the active pending interaction (installHeadlessGateBridges stores it on the headlessContext via getActiveSessionId)" 有事实错误 — getActiveSessionId 返回 sessionId(string),非 gateId(number)。
- **Fix:** dispatchReply 直接调 `pauseGate.resolve(gateId, verdict)` / `pauseGate.cancel(gateId)`(bridge 持 gateId)。gateCallbacks 降级为观察者(仍被调用,02-01 测试不变)。同时产 ConfirmationChoice 对象形状(`{type:"run_once"}` 等)而非 desktop.ts:1876 的裸字符串,修正潜在 type bug 让工具的 `choice.type === "deny"` 经无头路径可用。新增 `confirmationVerdict` helper 避免内联 `as const` 在三元中触发 TS1005。
- **Files modified:** src/cli/headless/gate-bridges.ts
- **Commit:** a66d349c

**2. [Rule 3 - Blocking] tests/qq-command.test.ts 需 mock process.exit**
- **Found during:** Task 2 测试编写(qqCommand 清理调 `process.exit(0)`,vitest worker 被杀)
- **Issue:** cleanup 的 `process.exit(0)` 在测试中终止 vitest worker,后续测试无法运行。
- **Fix:** `vi.spyOn(process, "exit").mockImplementation((() => {}) as () => never)` 拦截 exit,worker 存活。test 4 显式断言 `exitSpy.toHaveBeenCalledWith(0)`。
- **Files modified:** tests/qq-command.test.ts
- **Commit:** a66d349c

### Plan Verify-Gate Wording Adjustments (non-bug)

- `<verify>` `node --import tsx tests/qq-channel-gate-callbacks.test.ts` → 实际 `npx vitest run`(React-hook 测试,vitest-only,详见 Verify Gates 注)
- `<verify>` `node --import tsx tests/qq-command.test.ts` → 实际 `npx vitest run`(vi.mock stub,vitest-only)
- `<verify>` i18n `grep 'commands\.qq'` dotted-literal → 实际 `grep 'commands'`(reasonix 用 nested-object i18n 语法,同 02-01 标注的 false-negative)

## Recovery Notes

无中断。两 task 原子提交,TDD RED→GREEN 流程完整(Task 1:9-case 测试先 RED → adapter 翻转 GREEN;Task 2:4-case 测试先 RED → qq.ts 创建 GREEN)。gate-bridges Rule 1 fix 中途遇 TS1005(三元内联 `as const`)→ 抽 `confirmationVerdict` helper 解决;TS2345(choice resolution 字面量推断)→ 显式 `ChoiceResolution` 类型注解解决。

## Next

02-03:把 Telegram + 微信 channel 挂到同一 HeadlessHost,新增 `reasonix telegram` / `reasonix weixin` 子命令,迁移 `use-telegram-channel.ts` / `use-weixin-channel.ts` 的 *Ref → 对象注入(D-08 统一迁移)。本 plan 建立的装配配方 + gate-callback 形状直接复刻。Phase 3 删 sidecar 时 QQ/telegram/weixin 均已有独立 CLI 入口。
