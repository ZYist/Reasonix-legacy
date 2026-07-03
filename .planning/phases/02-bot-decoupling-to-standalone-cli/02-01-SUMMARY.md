---
phase: 02-bot-decoupling-to-standalone-cli
plan: 01
subsystem: infra
tags: [cli, headless, agent-loop, pause-gate, bot-decoupling]

requires:
  - phase: 01-web-panel-removal
    provides: CLI 独立可用、面板代码切除后的干净核心 surface
provides:
  - "src/cli/headless/host.ts — HeadlessHost(transport-agnostic 对话宿主,复刻 buildRuntimeFor recipe)"
  - "src/cli/headless/turn-driver.ts — runHeadlessTurn(loop.step 迭代 + Eventizer.consume + AsyncLocalStorage 会话绑定)"
  - "src/cli/headless/gate-bridges.ts — installHeadlessGateBridges + GateCallbacks(pauseGate.on → 频道 prompt/回复 桥接)"
  - "headless.host.* + headless.gate.* i18n keys(5 locale + TranslationSchema)"
affects: [02-02 (reasonix qq 挂载 HeadlessHost), 02-03 (telegram/weixin 挂载同一 Host), Phase 3 (删 sidecar 时无头宿主已就位)]

tech-stack:
  added: []
  patterns:
    - "无头对话宿主:复刻 buildRuntimeFor recipe(deepseek client → ImmutablePrefix → CacheFirstLoop + Eventizer)而不搬动 desktop.ts"
    - "GateCallbacks 对象注入:取代 TUI *Ref 模式,让 channel adapter 脱离 React/Ink"
    - "AsyncLocalStorage 会话绑定:host.runTurn → headlessContext.run(sessionId) → gate-bridges 经 getActiveSessionId() 关联 pending 交互"
    - "autoResolveVerdict 短路 + 默认 deny/cancel(T-02-02 防篡改):未匹配回复永不自动放行"

key-files:
  created:
    - src/cli/headless/host.ts
    - src/cli/headless/turn-driver.ts
    - src/cli/headless/gate-bridges.ts
    - tests/headless-host.test.ts
    - tests/headless-gate-bridges.test.ts
  modified:
    - src/i18n/EN.ts
    - src/i18n/zh-CN.ts
    - src/i18n/JA.ts
    - src/i18n/de.ts
    - src/i18n/ru.ts
    - src/i18n/types.ts

key-decisions:
  - "新建 src/cli/headless/ 模块而非就地重构 desktop.ts(D-01)——desktop.ts 3555 行混合 RPC/Tab/TUI,就地重构触碰不可回归面"
  - "直接复刻 desktop.ts:1374-1397 buildRuntimeFor recipe(D-02)——Phase 1 验证 4/4 时同一 recipe 跑通,最大化满足 BOT-03 核心复用"
  - "parse*Choice 解析器内联到 gate-bridges(而非从 use-qq-channel.ts import)——后者顶部 import react,会把 React 拉进无头图,破坏 node --import tsx 测试;02-02 可提取共享 gate-parsers.ts"
  - "ReviseChoice/ChoiceResolution 内联定义而非从 pause-gate.ts import——pause-gate 仅 re-export ConfirmationChoice,另两个类型未导出;内联保持稳定 'accept'|'reject' union"
  - "headless.gate.* 默认 prompt 文案走 i18n t() + 5 locale;channel 可经 buildPrompt 覆盖(如 Telegram inline button 提示)"

patterns-established:
  - "HeadlessHost 静态工厂 create() + 实例 runTurn(text)/shutdown()——02-02/02-03 channel 命令统一装配入口"
  - "installHeadlessGateBridges 返回 { consumeReply, unsubscribe }——channel 命令持返回值,inbound 消息经 consumeReply 路由,channel.stop() 调 unsubscribe 防监听器堆积"

requirements-completed:
  - BOT-03

coverage:
  - id: D1
    description: "HeadlessHost 复刻 buildRuntimeFor recipe,transport-agnostic,可驱动一轮对话(host.test.ts:assistant_final 捕获 + abort sentinel + error sentinel + headlessContext 绑定)"
    requirement: BOT-03
    verification:
      - kind: unit
        ref: "tests/headless-host.test.ts#assistant_final captures text + eventizer consumes every event"
        status: pass
      - kind: unit
        ref: "tests/headless-host.test.ts#headlessContext AsyncLocalStorage is set for the duration of the turn"
        status: pass
    human_judgment: false
  - id: D2
    description: "gate-bridges 桥接 pauseGate.on:autoResolveVerdict 短路 + sendPrompt prompt + consumeReply 回复分发 + T-02-02 未匹配默认 deny/cancel"
    requirement: BOT-03
    verification:
      - kind: unit
        ref: "tests/headless-gate-bridges.test.ts#auto-resolve short-circuit: plan_checkpoint in auto mode never reaches sendPrompt"
        status: pass
      - kind: unit
        ref: "tests/headless-gate-bridges.test.ts#interactive reply: run_command surfaces prompt + consumeReply('1') → onShellConfirm('run_once')"
        status: pass
      - kind: unit
        ref: "tests/headless-gate-bridges.test.ts#T-02-02 tampering mitigation: unmatched reply defaults to deny, never auto-allow"
        status: pass
    human_judgment: false

duration: ~95min
completed: 2026-07-03
status: complete
---

# Phase 2: Bot Decoupling — Plan 02-01 Summary

**提取传输协议无关的无头对话宿主(HeadlessHost + turn-driver + gate-bridges),复刻 desktop buildRuntimeFor recipe,为 02-02/02-03 的 reasonix qq/telegram/weixin 命令提供统一挂载点;desktop.ts sidecar 零改动(D-09)。**

## Performance

- **Tasks:** 2(Task 1 host+turn-driver+host test+i18n;Task 2 gate-bridges+gate-bridges test)
- **Files:** 11 created/modified(5 new src/test + 6 i18n)
- **Commits:** `edb548bb`(Task 1)、`c8c11c81`(Task 2)、SUMMARY + STATE + ROADMAP 见下

## Accomplishments

- `HeadlessHost.create({rootDir,model,budgetUsd?,session?,systemAppend?})` 复刻 buildRuntimeFor:buildCodeToolset → applyPlanMode(loadEditMode()) → DeepSeekClient(loadEndpoint) → ImmutablePrefix → CacheFirstLoop + Eventizer。`runTurn(text)` 驱动一轮,`shutdown()` 释放 aborter。
- `runHeadlessTurn` 迭代 `loop.step(text)`,捕获 `assistant_final` 文本(经 onAssistantText),`eventizer.consume(ev,ctx)` 投影 kernel 事件(telemetry/cache 诊断保持流动),`headlessContext.run(sessionId,...)` 绑定会话供 gate-bridges 读取。
- `installHeadlessGateBridges` 订阅 `pauseGate.on` 一次/进程:① `autoResolveVerdict(req,loadEditMode())` 短路 → `pauseGate.resolve`;② 无活跃 session → `pauseGate.cancel`(不挂起);③ 否则 `defaultBuildPrompt`(i18n)经 `sendPrompt` 推到 channel,stash pending。返回 `consumeReply(text)` 按 kind 分发到 GateCallbacks 字段(复刻 desktop.ts:1872-1933 dispatch 顺序)。
- T-02-02 篡改缓解:所有 parse*Choice 默认 else 返回 deny/cancel/stop,绝不自动放行(test 4 钉死)。
- D-09:`git diff --stat src/cli/commands/desktop.ts src/desktop/ src/core/pause-gate.ts src/core/pause-policy.ts` = 空(sidecar 字节级未动)。
- Transport-agnostic:`src/cli/headless/` 不 import 任何 `/channel` 传输模块(grep 0 命中)。

## Verify Gates Run

| Gate | Command | Result |
|------|---------|--------|
| typecheck | `npx tsc --noEmit` | exit 0 |
| test host | `node --import tsx tests/headless-host.test.ts` | 4 passed |
| test gate-bridges | `node --import tsx tests/headless-gate-bridges.test.ts` | 5 passed |
| lint | `npx @biomejs/biome check src/cli/headless/ tests/headless-*.test.ts` | exit 0 (5 files) |
| build | `npm run build` | exit 0 (tree-sitter grammars preserved — SAFE-02) |
| D-09 zero-diff | `git diff --stat desktop.ts src/desktop/ pause-gate.ts pause-policy.ts` | empty ✓ |
| transport-agnostic | `grep -rn 'from "../../qq/channel\|telegram/channel\|weixin/channel' src/cli/headless/` | 0 ✓ |
| i18n 5-locale | `grep -l 'runCommandPrompt:' src/i18n/{EN,zh-CN,JA,de,ru}.ts \| wc -l` | 5 ✓ |

注:plan 的 `<verify>` 写的是 `grep 'headless.gate' ...`(dotted literal),但 reasonix i18n 用 nested object 语法(`headless:{gate:{runCommandPrompt}}`),故 dotted grep 为 false-negative。改用实际 key 名 `runCommandPrompt:` 验证 = 5;且 test 5(`defaultBuildPrompt renders the i18n-localized gate prompt strings`)运行时 `t("headless.gate.runCommandPrompt")` 解析成功,双证契约成立。02-02/02-03 的 verify 文案沿用同一 dotted-literal 措辞,需在执行时同样以 key 名而非 dotted literal 校验。

## Recovery Notes

执行 agent 两次中断(stream watchdog 600s 卡死 + 429 限流),工作全部未提交。orchestrator 内联恢复:修复 gate-bridges.ts line 34 注释块格式错误(`//` 单行后误接 JSDoc ` *` 续行 → 改为 2 行 `//`),跑全量 gate,原子提交 Task 1 + Task 2。host.ts/turn-driver.ts/i18n/test 在中断前已完成且 typecheck 绿,未重做。

## Next

02-02:把 QQ channel 挂到 HeadlessHost,新增 `reasonix qq` 顶层子命令,`use-qq-channel.ts` 的 `*Ref` 注入改 `GateCallbacks` 对象注入(BOT-01)。
