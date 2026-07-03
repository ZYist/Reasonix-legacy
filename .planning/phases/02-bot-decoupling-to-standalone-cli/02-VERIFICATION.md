---
phase: 02-bot-decoupling-to-standalone-cli
verified: 2026-07-03T22:35:00Z
status: human_needed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: none
  is_re_verification: false
human_verification:
  - test: "Run `reasonix qq --workspace <path>` with valid QQ credentials and exchange messages with a live QQ account"
    expected: "Inbound QQ message -> host.runTurn -> assistant reply delivered back to the QQ chat; gate prompts (run_command/plan) surface as QQ messages and numeric replies resolve the gate"
    why_human: "All 4 phase-02 command tests stub QQChannel.start/sendResponse; no automated test drives the real QQ WebSocket gateway. The success criteria explicitly require '收发 QQ 消息' (send/receive QQ messages), which needs live network + credentials."
  - test: "Run `reasonix telegram --workspace <path>` with a TELEGRAM_BOT_TOKEN and send/receive a message"
    expected: "Inbound Telegram text -> host.runTurn -> reply posted back to the Telegram chat"
    why_human: "tests/telegram-command.test.ts stubs TelegramChannel (botToken long-poll). The live Telegram long-poll exchange cannot be driven without a real bot token + network."
  - test: "Run `reasonix weixin --workspace <path>` cold (no saved token) and complete the QR scan, then exchange a message"
    expected: "QR rendered to stderr -> operator scans with WeChat -> credentials persisted -> WeixinChannel.start connects -> inbound WeChat text drives a turn and reply is posted back"
    why_human: "tests/weixin-command.test.ts stubs runWeixinQrLogin + WeixinChannel and only asserts ordering; the actual QR state-machine + WeChat HTTP exchange needs a human scanner + live WeChat endpoints."
  - test: "Confirm `reasonix desktop` still launches the sidecar (SC4: sidecar still runs)"
    expected: "desktopCommand starts without error (qqRuntime + src/desktop/qq-*.ts untouched per D-09); QQ-over-sidecar path still functional as the coexistence fallback"
    why_human: "D-09 zero-diff is statically proven, but 'sidecar still runs' (SC4) is a runtime assertion no phase-02 test exercises end-to-end."
security_review_items:
  - item: "WR-05 (deferred): raw (err as Error).message flows unfiltered to stderr via t('commands.{qq,telegram,weixin}.error', {msg}) in all 3 command controllers"
    risk: "If an upstream HTTP/auth failure embeds a bot token, appSecret, or DeepSeek key in the message, it is written verbatim to stderr. Threat-model T-02-08/T-02-13 mitigations claim no secret interpolation, but the code path does not redact."
    recommendation: "Route stderr-bound error text through src/core/event-redaction.ts redactEventValue before writing. Tracked as a separate fix-cycle follow-up (not a phase-02 goal blocker)."
followups_deferred:
  - "WR-01: turn-driver marks outcome='error' on any kernel 'error' event (incl. recoverable) and never resets — assistant_final discarded on recoverable mid-turn errors (turn-driver.ts:80-83). Quality issue in error-recovery path; no must-have asserts error-recovery semantics."
  - "WR-03: single-slot `pending` interaction in gate-bridges (gate-bridges.ts:344) — parallel pausing tools within one turn orphan the first gate. Latent concurrency edge case; no must-have asserts intra-turn gate concurrency."
  - "WR-04: Weixin QR-login (weixin.ts:77) runs before SIGINT handlers installed (weixin.ts:172) — Ctrl-C during the multi-minute QR window hits Node's default handler with no graceful teardown. T-02-14 (sigint-before-start) is satisfied; the QR window is the uncovered gap."
  - "WR-06: // -comment essays in phase-02 files (mitigated by fix(02) commit cf584737; comment-policy test passes 9/9). Spirit-of-rules concern, not a policy violation."
  - "IN-01..IN-06: dead `effort` option, double defaultBuildPrompt call, unused gateCallbacks bag, undocumented checkpoint field, unused lowerText binding, parse*Choice duplicated across 4 modules — all cleanup items, none goal-blocking."
---

# Phase 2: Bot Decoupling to Standalone CLI — Verification Report

**Phase Goal:** QQ/Telegram/微信 channel 经一个传输协议无关的"无头对话宿主"作为独立 CLI 命令运行,复用核心 `CacheFirstLoop`/PauseGate/完整 ToolRegistry,不再依赖桌面 sidecar 或 Tauri JSON-RPC。
**Verified:** 2026-07-03T22:35:00Z
**Status:** human_needed
**Re-verification:** No — initial verification
**Mode note:** ROADMAP declares `mode: mvp`, but the phase goal is a system-capability statement, not a "As a… I want to… so that…" user story. The 4 Success Criteria are concrete and observable, so goal-backward verification proceeded against them (the SCs + BOT-01/02/03). Flagging the MVP user-story format deviation as informational — does not block verification since the SCs are testable.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Transport-agnostic headless host exists under `src/cli/headless/`, reusing CacheFirstLoop + ImmutablePrefix + DeepSeekClient + ToolRegistry + Eventizer via the buildRuntimeFor recipe (BOT-03 / SC1) | VERIFIED | `src/cli/headless/host.ts:87-121` `HeadlessHost.create` calls buildCodeToolset → applyPlanMode → codeSystemPrompt → loadEndpoint → `new DeepSeekClient` → `new ImmutablePrefix` → `new CacheFirstLoop` + `new Eventizer`. Imports canonical modules (`../../index.js`, `../../core/eventize.js`, `../../code/setup.js`). NO reimplementation — `grep "class (CacheFirstLoop\|ToolRegistry\|ImmutablePrefix\|Eventizer)" src/cli/headless/` = 0. Transport-agnostic — `grep "from \"../../qq/\|telegram/\|weixin/" src/cli/headless/` = 0. |
| 2 | The host drives one turn end-to-end (inbound text → loop.step → assistant text out) without React/Ink/TUI/NDJSON-RPC | VERIFIED | Behavioral: `tests/headless-host.test.ts` test 1 (assistant_final captures text + eventizer consumes every event), test 2 (abort sentinel), test 3 (loop error → onError → error sentinel), test 4 (headlessContext AsyncLocalStorage bound). All 4 pass. `runHeadlessTurn` (turn-driver.ts:67-101) iterates `loop.step(text)`, captures `assistant_final`, threads `eventizer.consume`. CR-01 fix (commit fa9cfa69) confirmed: host.ts:148-154 wires `onError` so errorMeta classification reaches the channel+stderr. |
| 3 | `reasonix qq` is a registered Commander subcommand that starts QQ via HeadlessHost, detached from Tauri/JSON-RPC (BOT-01 / SC2) | VERIFIED | `src/cli/index.ts:373` `program.command("qq")` + `:387` lazy `import("./commands/qq.js")`. `src/cli/commands/qq.ts` exports `qqCommand` (thin entry, D-04): loadDotenv → bridgeEndpointEnv → resolveDir → `HeadlessHost.create` → `installHeadlessGateBridges` → `new QQChannel({onSubmitMessage: host.runTurn})` → SIGINT/SIGTERM → `channel.start`. Behavioral: `tests/qq-command.test.ts` 4/4 pass (assembly + inbound dispatch + gate-reply routing + SIGINT cleanup). `node dist/cli/index.js --help` advertises `qq`. qq.ts imports NO sidecar (`grep "from \"../../desktop" src/cli/commands/qq.ts` = 0). |
| 4 | `reasonix telegram` + `reasonix weixin` registered, start their bots on the SAME HeadlessHost with the same GateCallbacks shape (BOT-02 / SC3) | VERIFIED | `src/cli/index.ts:396` telegram, `:419` weixin (lazy imports :410, :433). `telegram.ts`/`weixin.ts` mirror qq.ts assembly recipe (D-08). Telegram ctor divergence honored (only `{onSubmitMessage, onError}` — no onInfo). Weixin PINNED QR-login-before-start path (weixin.ts:75-88) + ctor `{onSubmitMessage, onError, onInfo}`. Behavioral: `tests/telegram-command.test.ts` 5/5, `tests/weixin-command.test.ts` 5/5 (incl QR-before-start ordering). `--help` advertises all three. |
| 5 | desktop.ts sidecar + src/desktop/ byte-for-byte unchanged this phase (D-09 / SC4) | VERIFIED | `git diff --stat v1..HEAD -- src/cli/commands/desktop.ts src/desktop/` = **empty** (hard gate holds). `grep -c desktopCommand src/cli/commands/desktop.ts` = 1 (sidecar entry intact). Coexistence (D-10): both `desktop` and `qq/telegram/weixin` registered in same `src/cli/index.ts`. |
| 6 | BOT-03 depth: the host genuinely REUSES CacheFirstLoop + PauseGate + full ToolRegistry rather than reimplementing them | VERIFIED | host.ts imports `CacheFirstLoop, DeepSeekClient, ImmutablePrefix` from `../../index.js` (canonical re-exports), `Eventizer` from `../../core/eventize.js`, `buildCodeToolset/applyPlanMode` from `../../code/setup.js` (the FULL code toolset — filesystem/shell/web/etc, not chat's filesystem-less subset). gate-bridges.ts imports the `pauseGate` singleton from `../../core/pause-gate.js` and `autoResolveVerdict` from `../../core/pause-policy.js` (bridged, not reimplemented). Zero `class` redefinitions in `src/cli/headless/`. `tests/public-api.test.ts` 2/2 pass (pauseGate/autoResolveVerdict signatures unchanged). |
| 7 | Three channel adapters use GateCallbacks object injection (Ref → object), unified (D-05/D-06/D-08) | VERIFIED | `grep -nE 'on(Shell\|Path\|PlanCancel\|PlanFeedback\|CheckpointConfirm\|CheckpointRevise\|PlanRevision\|ChoiceResolve)Ref' src/{qq,telegram,weixin}/use-*-channel.ts` (excl `//`) = **0 in all 3**. Internal refs preserved (PATTERNS rule 4): pendingGateIdRef/interactionRef/slashInteractionRef/planStepsRef/completedStepIdsRef present in all 3 adapters. Behavioral: `tests/qq-channel-gate-callbacks.test.ts` 9/9 pass (all 8 gate kinds + T-02-06 deny default). |
| 8 | pauseGate bridging works via GateCallbacks closures; pauseGate/autoResolveVerdict public API untouched | VERIFIED | `installHeadlessGateBridges` (gate-bridges.ts:337) subscribes `pauseGate.on` once, routes via autoResolveVerdict short-circuit → sendPrompt → consumeReply dispatch (Rule 1 fix: bridge owns gateId, resolves pauseGate directly). Behavioral: `tests/headless-gate-bridges.test.ts` 6/6 pass (auto-resolve short-circuit, interactive reply→resolve, T-02-02 deny-default, WR-02 fail-closed, i18n prompt rendering). `git diff --stat v1..HEAD -- src/core/pause-gate.ts src/core/pause-policy.ts` empty (public-API anchor preserved); public-api test 2/2 pass. |

**Score:** 8/8 truths verified (0 present-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/cli/headless/host.ts` | `class HeadlessHost` static `create` + instance `runTurn`/`shutdown` | VERIFIED | 169 lines; exports HeadlessHost, HeadlessHostOptions, resolveDir; re-exports getActiveSessionId/headlessContext. buildRuntimeFor recipe at lines 87-121. onError wired (CR-01 fix). |
| `src/cli/headless/turn-driver.ts` | `runHeadlessTurn` async turn-runner | VERIFIED | 101 lines; exports runHeadlessTurn, TurnOutcome, HeadlessHostContext, headlessContext, getActiveSessionId. Iterates loop.step, captures assistant_final, AsyncLocalStorage session binding. |
| `src/cli/headless/gate-bridges.ts` | `GateCallbacks` interface + `installHeadlessGateBridges` | VERIFIED | 388 lines; exports GateCallbacks, HeadlessGateBridgeOptions, InstalledHeadlessGateBridge, installHeadlessGateBridges, defaultBuildPrompt, parseRunPermissionChoice, ConfirmationChoice re-export. WR-02 fail-closed parser at line 112-123. |
| `src/cli/commands/qq.ts` | `qqCommand(opts)` thin entry | VERIFIED | 150 lines; exports qqCommand + QqCommandOptions. Thin assembly + lifecycle only (D-04). |
| `src/cli/commands/telegram.ts` | `telegramCommand(opts)` thin entry | VERIFIED | 150 lines; exports telegramCommand + TelegramCommandOptions. Telegram ctor divergence `{onSubmitMessage, onError}` honored. |
| `src/cli/commands/weixin.ts` | `weixinCommand(opts)` thin entry + QR-login-before-start | VERIFIED | 180 lines; exports weixinCommand + WeixinCommandOptions. PINNED QR path at lines 75-88. |
| `src/cli/index.ts` | 3 `program.command(...)` registrations | VERIFIED | qq:373, telegram:396, weixin:419 (lazy imports 387/410/433). Desktop block (350) preserved. |
| `tests/headless-host.test.ts`, `tests/headless-gate-bridges.test.ts` | TAP unit tests | VERIFIED | 4/4 + 6/6 pass. |
| `tests/{qq,telegram,weixin}-command.test.ts`, `tests/qq-channel-gate-callbacks.test.ts` | vitest vertical-slice tests | VERIFIED | 4/4 + 5/5 + 5/5 + 9/9 = 23 pass. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| qq.ts | HeadlessHost.create | `HeadlessHost.create({rootDir, model, budgetUsd})` (qq.ts:52) | WIRED | host constructed; runTurn called on inbound (qq.ts:104); shutdown in cleanup (qq.ts:139). qq-command test 1 asserts. |
| qq.ts | installHeadlessGateBridges | `installHeadlessGateBridges({sendPrompt, gateCallbacks})` (qq.ts:69) | WIRED | sendPrompt → channel.sendResponse; consumeReply guards inbound (qq.ts:97). |
| qq.ts | QQChannel | `new QQChannel({onSubmitMessage, onError, onInfo})` (qq.ts:95) | WIRED | onSubmitMessage → bridge.consumeReply OR host.runTurn → sendResponse. |
| telegram.ts / weixin.ts | HeadlessHost + channels | same recipe (telegram.ts:55/72/96; weixin.ts:63/98/122) | WIRED | telegram + weixin command tests assert full slice. |
| weixin.ts | runWeixinQrLogin BEFORE channel.start | `await runWeixinQrLogin({onInfo})` then `saveWeixinConfig` then `channel.start` (weixin.ts:77-88, 179) | WIRED | weixin-command test 3 asserts QR resolves before start; saveWeixinConfig called. |
| host.ts runTurn | runHeadlessTurn onError | `onError: (cause, meta) => { errMessage = ...; stderr.write }` (host.ts:148-154) | WIRED | CR-01 fix confirmed; headless-host test 3 exercises it. |
| gate-bridges dispatchReply | pauseGate.resolve/cancel | `pauseGate.resolve(gateId, verdict)` per kind (gate-bridges.ts:243,249,261,273,283,296,308,315,323) | WIRED | headless-gate-bridges test 3 + qq-channel-gate-callbacks 9 tests assert. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|----|
| host.ts `runTurn` | `lastAssistantText` | `loop.step(text)` generator → `assistant_final` event (turn-driver.ts:77) | Yes — driven by real DeepSeekClient in production; stubbed loop in unit test returns "hi" | FLOWING |
| host.ts `runTurn` error path | `errMessage` | `runHeadlessTurn` onError ← `errorMeta(cause)` (turn-driver.ts:91-92) | Yes — errorMeta classifies real loop exceptions (code/phase) | FLOWING |
| gate-bridges dispatchReply | verdict | `parse*Choice(text)` ← inbound channel reply | Yes — reply text → typed ConfirmationChoice; default-else deny/cancel | FLOWING |
| qq/telegram/weixin.ts outbound | assistantText | `host.runTurn(text).then(...)` → `channel.sendResponse` | Yes — real loop output; stubbed host returns "echo: hi" in tests | FLOWING |

No HOLLOW / STATIC / DISCONNECTED / HOLLOW_PROP artifacts found.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| HeadlessHost drives a turn (assistant_final capture + abort + error + context) | `node --import tsx tests/headless-host.test.ts` | 4 passed | PASS |
| Headless gate-bridge dispatch (auto-resolve, interactive reply, deny-default, WR-02 fail-closed, i18n prompt) | `node --import tsx tests/headless-gate-bridges.test.ts` | 6 passed | PASS |
| QQ command vertical slice (assembly + inbound + gate-reply + SIGINT) | `npx vitest run tests/qq-command.test.ts` | 4 passed | PASS |
| Telegram command vertical slice (incl ctor divergence assertion) | `npx vitest run tests/telegram-command.test.ts` | 5 passed | PASS |
| Weixin command vertical slice (incl QR-before-start ordering) | `npx vitest run tests/weixin-command.test.ts` | 5 passed | PASS |
| QQ adapter 8-gate dispatch + T-02-06 deny | `npx vitest run tests/qq-channel-gate-callbacks.test.ts` | 9 passed | PASS |
| pauseGate/autoResolveVerdict public API unchanged | `npx vitest run tests/public-api.test.ts` | 2 passed | PASS |
| CLAUDE.md comment rules (no Phase-N narrative, no bare TODO/FIXME) | `npx vitest run tests/comment-policy.test.ts` | 9 passed | PASS |
| typecheck (tsc --noEmit across new + touched files) | `npx tsc --noEmit` | EXIT 0 | PASS |
| `--help` advertises qq + telegram + weixin | `node dist/cli/index.js --help \| grep` | 3 bot lines present (localized) | PASS |
| T-02-09/T-02-14 sigint-before-start ordering (all 3 commands) | grep line numbers | qq 143<149, telegram 143<149, weixin 172<179 | PASS |
| WR-02 fail-closed parser in all 4 copies | `grep "don't\|do not\|no\|nope" {4 files}` | all 4 FIXED (denial-first) | PASS |

### Probe Execution

Step 7c: SKIPPED — this phase declares no `scripts/*/tests/probe-*.sh` probes and is not a migration/tooling phase. The `<verify>` blocks use TAP/vitest test invocations (covered under Behavioral Spot-Checks) plus git-diff/grep static gates (all executed inline above).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BOT-01 | 02-02 | QQ 接入从桌面 sidecar 解耦为独立 CLI 命令,不依赖 Tauri JSON-RPC | SATISFIED | `reasonix qq` registered (index.ts:373), qq.ts mounts QQChannel on HeadlessHost, zero sidecar import, sidecar byte-identical (D-09). Live exchange pending human UAT. REQUIREMENTS.md already marks Complete. |
| BOT-02 | 02-03 | Telegram/微信 channel 经独立 CLI 宿主启动,迁移现有接入不重写协议 | SATISFIED | `reasonix telegram` + `reasonix weixin` registered, both mount on same HeadlessHost + same GateCallbacks shape (D-08); channel public method signatures unchanged; protocols migrated not rewritten. Live exchange pending human UAT. REQUIREMENTS.md already marks Complete. |
| BOT-03 | 02-01 | 机器人复用核心对话循环 / 暂停门 / 工具集,不重复实现 | SATISFIED (recommend Pending→Complete) | host.ts imports canonical CacheFirstLoop/DeepSeekClient/ImmutablePrefix/Eventizer + buildCodeToolset (full ToolRegistry) + bridges pauseGate singleton — ZERO reimplementation. **REQUIREMENTS.md currently marks BOT-03 "Pending" — the orchestrator should update traceability to Complete.** |

No orphaned requirements: REQUIREMENTS.md maps only BOT-01/02/03 to Phase 2; all three are claimed by plans (02-01→BOT-03, 02-02→BOT-01, 02-03→BOT-02).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | No TBD/FIXME/XXX debt markers | — | — |
| (none) | — | No stub/empty-impl (`return null`, `=> {}`, "not implemented", "placeholder") | — | — |

Debt-marker gate: clean. Comment-policy test 9/9 pass (no Phase-N narrative, no bare TODO/HACK, no FIXME). The 11 deferred REVIEW findings (WR-01/03/04/05/06 + IN-01..06) are tracked quality/security follow-ups — none independently violates a BOT must-have (see `followups_deferred` in frontmatter).

### Human Verification Required

The phase is architecturally complete and all 8 architectural must-have truths are VERIFIED with behavioral evidence (44 automated tests pass: 4+6+4+5+5+9+2+9, plus typecheck + --help + grep gates). However, the success criteria explicitly require **live message exchange** ("收发 QQ 消息" / "收发消息"), and every phase-02 command test stubs the channel transport. The live chat-network round-trip is inherent UAT territory (real credentials, QR scan, external services). Four human-verification items are listed in the frontmatter `human_verification` block:

1. **`reasonix qq` live QQ exchange** — real QQ account + WebSocket gateway
2. **`reasonix telegram` live Telegram exchange** — real botToken + long-poll
3. **`reasonix weixin` cold-start QR scan + live WeChat exchange** — human scanner + WeChat endpoints
4. **`reasonix desktop` sidecar still launches (SC4 runtime assertion)** — D-09 statically proven, runtime unverified

Plus one security review item (WR-05 raw error→stderr redaction) flagged for human/security attention in `security_review_items`.

### Gaps Summary

No must-have gaps. All 8 truths VERIFIED, all artifacts substantive + wired + data-flowing, all key links wired, D-09 hard gate intact, BOT-01/02/03 satisfied at the architecture level, zero debt markers, zero stubs, comment-policy + public-api + typecheck green.

The phase routes to `human_needed` (not `passed`) strictly because the success criteria's "收发消息" clause requires live chat-network exchange that no automated test can exercise — this is the single human/UAT dependency, not a code defect. The two pre-verification code-review fixes (CR-01 onError wiring, WR-02 fail-closed parser) are both confirmed in-source and test-pinned.

**BOT-03 traceability action for the orchestrator:** REQUIREMENTS.md line 46 (`BOT-03 | Phase 2 | Pending`) should be updated to `Complete` — core reuse is verified (canonical imports, zero reimplementation, full ToolRegistry via buildCodeToolset, pauseGate singleton bridged).

**On status `human_needed`:** proceed to the end-of-phase human checkpoint. Once the 4 live-exchange UAT items confirm (or are explicitly accepted as deferred UAT by the developer), the phase advances. None of the deferred code-review follow-ups (WR-01/03/04/05/06 + infos) block this — they are scheduled for a separate fix cycle per user decision.

---

_Verified: 2026-07-03T22:35:00Z_
_Verifier: Claude (gsd-verifier)_
