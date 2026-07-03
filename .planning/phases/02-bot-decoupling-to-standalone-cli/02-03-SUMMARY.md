---
phase: 02-bot-decoupling-to-standalone-cli
plan: 03
subsystem: cli
tags: [cli, telegram, weixin, bot-decoupling, pause-gate, headless, commander]

requires:
  - phase: 02-bot-decoupling-to-standalone-cli
    provides: 02-01 的 HeadlessHost + installHeadlessGateBridges + GateCallbacks,02-02 的 qq.ts 装配配方(本 plan 复刻到 telegram/weixin)
provides:
  - "src/cli/commands/telegram.ts — reasonix telegram 薄入口(装配 HeadlessHost + TelegramChannel + gate-bridges,SIGINT/SIGTERM 清理)"
  - "src/cli/commands/weixin.ts — reasonix weixin 薄入口 + PINNED QR-login-before-start 路径(runWeixinQrLogin 在 channel.start 前获取并持久化凭据)"
  - "UseTelegramChannelArgs / UseWeixinChannelArgs object-injection 形状(onXxx 纯回调替代 onXxxRef{TUI 调用方包 ref shim})"
  - "commands.telegram.* / commands.weixin.* i18n keys(5 locale + TranslationSchema)"
affects: [Phase 3 (删 sidecar 时三个 bot 均已有独立 CLI 入口), Phase 4 (三 controller 去重候选)]

tech-stack:
  added: []
  patterns:
    - "三 channel 统一装配配方(D-08):qq/telegram/weixin 经同一 HeadlessHost、同一 GateCallbacks 形状启动"
    - "Telegram 构造分歧(PATTERNS.md):TelegramChannel ctor 只收 {onSubmitMessage, onError} — 无 onInfo(无 QR 登录);qq/weixin 收全三 {onSubmitMessage, onError, onInfo}"
    - "Weixin QR-login-before-start(verified path):loadWeixinConfig → 若 token/accountId 缺失 → runWeixinQrLogin({onInfo}) → saveWeixinConfig 持久化 → channel.start(start 不内部驱动 QR)"
    - "object-injection 取代 TUI *Ref:三 channel adapter 一致(Ink 调用方包 ref shim,无头宿主直接闭包)"

key-files:
  created:
    - src/cli/commands/telegram.ts
    - src/cli/commands/weixin.ts
    - tests/telegram-command.test.ts
    - tests/weixin-command.test.ts
  modified:
    - src/telegram/use-telegram-channel.ts
    - src/weixin/use-weixin-channel.ts
    - src/cli/ui/App.tsx
    - src/cli/index.ts
    - src/i18n/EN.ts
    - src/i18n/zh-CN.ts
    - src/i18n/JA.ts
    - src/i18n/de.ts
    - src/i18n/ru.ts
    - src/i18n/types.ts

key-decisions:
  - "无 Rule 1-4 偏差:plan 按原样执行。02-02 建立的装配配方 + gate-callback 形状直接复刻到 telegram/weixin,无设计缺口(Rule 1 fix 已在 02-02 落到 gate-bridges,本 plan 继承)。"
  - "Telegram 构造分歧(load-bearing,TS2741 risk):TelegramChannel ctor 只收 {onSubmitMessage, onError} — 无 onInfo。telegram.ts 显式构造不传 onInfo;qq.ts/weixin.ts 传全三。tests/telegram-command.test.ts 用例 2 断言 ctor 只收到 ['onError', 'onSubmitMessage']。"
  - "Weixin QR-login-before-start(verified):读 src/weixin/channel.ts:305-352 确认 start() 不内部驱动 QR,只 acquireLock + loadWeixinConfig + 要求 token/accountId 已配置(throws missingToken/missingAccountId)。weixin.ts 在 start 前调 runWeixinQrLogin({onInfo}) 并 saveWeixinConfig 持久化(mirror completeConnect)。tests/weixin-command.test.ts 用例 3 断言 QR 在 start 前 resolve。"
  - "i18n 5-locale 契约:commands.telegram.* + commands.weixin.* 各 5 key(help/workspaceHint/sendFailed/error/busy)加到 5 locale + types.ts TranslationSchema(commands 块)。"

patterns-established:
  - "三 channel 薄入口去重候选:qq.ts/telegram.ts/weixin.ts ~150 行高度平行(同装配 recipe)。本 plan 按 CONTEXT Deferred Ideas + plan verification 注记 不抽取 BaseChannelAdapter — 留 Phase 4 构建清理。"

requirements-completed:
  - BOT-02

coverage:
  - id: D5
    description: "UseTelegramChannelArgs + UseWeixinChannelArgs 各 8 个 onXxxRef 字段翻转为 onXxx 纯回调;consumePauseReply 全 8 gate kind 调用点改写"
    requirement: BOT-02
    verification:
      - kind: static
        ref: "grep on(Shell|Path|PlanCancel|PlanFeedback|CheckpointConfirm|CheckpointRevise|PlanRevision|ChoiceResolve)Ref src/telegram/use-telegram-channel.ts src/weixin/use-weixin-channel.ts = 0 (excl //)"
        status: pass
      - kind: static
        ref: "内部 ref (pendingGateIdRef/interactionRef 等) 保留 — typecheck 通过"
        status: pass
    human_judgment: false
  - id: D8
    description: "telegram/weixin 经同一 HeadlessHost + 同一 GateCallbacks 形状启动,与 qq(02-02)统一"
    requirement: BOT-02
    verification:
      - kind: unit
        ref: "tests/telegram-command.test.ts + tests/weixin-command.test.ts 垂直切片(host.create → channel.start → inbound → runTurn → sendResponse)"
        status: pass
      - kind: build
        ref: "npm run build exit 0; node dist/cli/index.js --help advertises qq + telegram + weixin"
        status: pass
    human_judgment: false
  - id: D9
    description: "desktop.ts + src/desktop/ 字节级未动(git diff --stat 空),跨 02-01/02-02/02-03 三 plan 保持"
    requirement: BOT-02
    verification:
      - kind: static
        ref: "git diff --stat src/cli/commands/desktop.ts src/desktop/ = empty"
        status: pass
    human_judgment: false
  - id: T-02-14
    description: "SIGINT/SIGTERM 处理器在 channel.start 之前安装(telegram.ts:143 < :149; weixin.ts:172 < :179)"
    requirement: BOT-02
    verification:
      - kind: static
        ref: "grep -n SIGINT / channel.start 行号序"
        status: pass
    human_judgment: false
  - id: T-02-13
    description: "telegram.ts/weixin.ts 所有 process.stderr.write 走 t('commands.*', {msg}) 模板,插值 sanitized Error.message;无 token/apiKey/secret 符号插值进用户可见串"
    requirement: BOT-02
    verification:
      - kind: static
        ref: "grep 两 command 文件:无裸 token/apiKey/secret 字面插值"
        status: pass
    human_judgment: false

duration: ~16min
completed: 2026-07-03
status: complete
---

# Phase 2: Bot Decoupling — Plan 02-03 Summary

**Telegram + 微信 channel 挂载到 02-01 的 HeadlessHost,与 QQ(02-02)共用同一宿主入口、同一 GateCallbacks 形状;`reasonix telegram` / `reasonix weixin` 顶层子命令上线;两个 adapter 的 TUI *Ref 注入翻转成对象注入;desktop.ts/src/desktop 字节级未动(D-09 跨三 plan 保持)。**

## Performance

- **Tasks:** 2(Task 1 telegram adapter Ref→object + telegram.ts 薄入口 + 5-case 命令测试;Task 2 weixin adapter Ref→object + weixin.ts 薄入口含 PINNED QR-login-before-start + 5-case 命令测试)
- **Files:** 4 created(2 src + 2 test)+ 11 modified(2 adapter + App.tsx + index.ts + 5 i18n + types.ts)
- **Commits:** `4fb042f2`(Task 1 telegram)、`d29f8c34`(Task 2 weixin)

## Accomplishments

- `src/cli/commands/telegram.ts` 导出 `telegramCommand(opts: TelegramCommandOptions): Promise<void>` — 薄入口(D-04):loadDotenv → bridgeEndpointEnv → resolveDir → HeadlessHost.create → installHeadlessGateBridges → `new TelegramChannel({onSubmitMessage, onError})` → SIGINT/SIGTERM → channel.start。**构造分歧(load-bearing):**TelegramChannel ctor 只收 `{onSubmitMessage, onError}` — 无 onInfo(Telegram 用 botToken long-polling,无 QR 登录);startup info 文本直接 `process.stderr.write`,不走 channel callback。
- `src/cli/commands/weixin.ts` 导出 `weixinCommand(opts: WeixinCommandOptions): Promise<void>` — 薄入口 + **PINNED QR-login-before-start 路径(verified):**WeixinChannel.start() 不内部驱动 QR(channel.ts:305-352 只 acquireLock + loadWeixinConfig + 要求 token/accountId 已配置);weixin.ts 在 start 前调 `runWeixinQrLogin({onInfo})` 获取 {token, accountId, baseUrl, userId},经 `saveWeixinConfig` 持久化(mirror completeConnect),然后构造 `new WeixinChannel({onSubmitMessage, onError, onInfo})`(收全三,匹配 QQChannel)。
- `src/telegram/use-telegram-channel.ts` + `src/weixin/use-weixin-channel.ts`:各 8 个 `onXxxRef` 字段翻转成 `onXxx` 纯回调(D-05/D-06)。consumePauseReply 调用 `onShellConfirm(...)` 等而非 `onXxxRef.current(...)`。内部 ref(pendingGateIdRef/interactionRef/slashInteractionRef/planStepsRef/completedStepIdsRef)保留为 ref(PATTERNS rule 4)。
- `src/cli/ui/App.tsx`:telegram + weixin 调用方包 ref shim(`onShellConfirm={(c) => handleShellConfirmRef.current?.(c)}` 等 8 字段),镜像 QQ post-02-02。三 channel 现在形状一致(D-08 统一)。
- `src/cli/index.ts`:注册 `program.command("telegram")` + `program.command("weixin")` 块(镜像 qq 块形式):`-m/--model`、`--workspace`、`--effort`、`--budget`,动态 `import("./commands/{telegram,weixin}.js")`。
- `commands.telegram.*` + `commands.weixin.*` i18n keys(各 help/workspaceHint/sendFailed/error/busy)加到 5 locale + types.ts TranslationSchema。
- T-02-14:SIGINT/SIGTERM 处理器在 channel.start 之前安装(telegram.ts:143 < :149;weixin.ts:172 < :179)。
- T-02-13:两 command 文件所有 `process.stderr.write` 走 `t("commands.*", {msg})` 模板,无 token/apiKey/secret 字面插值。
- 三 bot 子命令(qq/telegram/weixin)现均在 `reasonix --help` 输出中。

## Verify Gates Run

| Gate | Command | Result |
|------|---------|--------|
| typecheck | `npx tsc --noEmit` | exit 0 |
| Task 1 test | `npx vitest run tests/telegram-command.test.ts` | 5 passed |
| Task 2 test | `npx vitest run tests/weixin-command.test.ts` | 5 passed(incl QR-login-before-start ordering) |
| qq-command regression | `npx vitest run tests/qq-command.test.ts` | 4 passed |
| 02-01 regression | `node --import tsx tests/headless-gate-bridges.test.ts` | 5 passed(TAP runner) |
| 02-01 regression | `node --import tsx tests/headless-host.test.ts` | 4 passed |
| 02-02 regression | `npx vitest run tests/qq-channel-gate-callbacks.test.ts` | 9 passed |
| public-api | `npx vitest run tests/public-api.test.ts` | 2 passed(无 API 表面变更) |
| comment-policy | `npx vitest run tests/comment-policy.test.ts` | 9 passed(无 Phase-N/version 叙事,bare TODO 等) |
| lint | `npx @biomejs/biome check` (11 files) | exit 0 |
| build | `npm run build` | exit 0(tree-sitter grammars preserved — SAFE-02) |
| --help 三 bot | `node dist/cli/index.js --help \| grep -E 'qq\|telegram\|weixin '` | 三行均出现 ✓ |
| D-09 zero-diff | `git diff --stat src/cli/commands/desktop.ts src/desktop/` | empty ✓ |
| adapter Ref→object | `grep on(Shell\|Path\|...)Ref src/{telegram,weixin}/use-*-channel.ts` (excl //) | 0 ✓ |
| i18n 5-locale | `grep -l 'commands' src/i18n/{EN,zh-CN,JA,de,ru}.ts \| wc -l` | 5 ✓ |
| transport integrity | `grep -rn 'from "../../desktop' src/cli/commands/{telegram,weixin}.ts` | 0(不 import sidecar)✓ |
| T-02-14 ordering | SIGINT line < channel.start line(两文件) | PASS ✓ |
| Telegram ctor 分歧 | tests/telegram-command.test.ts 用例 2:ctor keys = ['onError','onSubmitMessage'] | PASS ✓ |
| Weixin QR-before-start | tests/weixin-command.test.ts 用例 3:runWeixinQrLogin 在 start 前 resolve + saveWeixinConfig 被调 | PASS ✓ |

## Deviations from Plan

None — plan executed exactly as written. 02-02 建立的装配配方 + gate-callback 形状直接复刻,无 Rule 1-4 偏差(gate-bridges Rule 1 fix 已在 02-02 落地,本 plan 继承)。

## Deferred Observations

**三 channel 薄入口去重候选(per plan verification 注记):**qq.ts / telegram.ts / weixin.ts 各 ~150 行高度平行(同 loadDotenv → bridgeEndpointEnv → resolveDir → HeadlessHost.create → installHeadlessGateBridges → new *Channel → SIGINT/SIGTERM → channel.start 配方)。本 plan 按 CONTEXT Deferred Ideas + plan verification 显式指示**不抽取 `BaseChannelAdapter`** — 留 Phase 4 构建清理。分歧点(Telegram 无 onInfo、Weixin 有 QR-login-before-start)是 channel 协议层差异,非共享代码可消除。

## Next

Phase 2 完成(qq/telegram/weixin 三 bot 均有独立 CLI 入口,共用同一 HeadlessHost + GateCallbacks 形状,desktop sidecar 字节级未动)。Phase 3 可安全删除 desktop sidecar(desktopCommand + qqRuntime + src/desktop/*),三 bot 已有独立无头宿主。

## Self-Check: PASSED

- Created files: src/cli/commands/telegram.ts, src/cli/commands/weixin.ts, tests/telegram-command.test.ts, tests/weixin-command.test.ts — all FOUND
- Commits: 4fb042f2 (Task 1), d29f8c34 (Task 2) — both FOUND
- SUMMARY: .planning/phases/02-bot-decoupling-to-standalone-cli/02-03-SUMMARY.md — FOUND
