---
quick: 260706-g0p
subsystem: headless-host
tags: [headless, turn-driver, surface-notifier, wr-01, error-recovery, i18n, qq, telegram, weixin, internal-feedback]

provides:
  - SurfaceNotifier — transport-agnostic MINIMAL notice engine (live immediate-emit / fold accumulate-and-summarize)
  - HeadlessHost.runTurn now forwards a kernel-event sink (hooks.onEvent) instead of dropping every event
  - WR-01 fix — recoverable mid-turn errors surface a scrubbed message instead of collapsing the turn into silence
  - headless.notice.{thinking,tool} i18n keys across all five locales
affects: [qq/telegram/weixin bot chats, headless host, future channel-streaming work]

tech-stack:
  added: []
  patterns:
    - "Recoverable-vs-terminal error discriminator: turn-driver flips outcome only on !recoverable; recoverable errors route to onRecoverableError and keep outcome end_turn"
    - "Per-channel notice mode by real send model: active-push channels (telegram/weixin) emit live; bounded-budget channels (qq C2C msgSeq) fold notices into the single reply so the answer always delivers"
    - "Surface-by-allowlist: notices carry ONLY a static thinking string + the tool NAME — never tool args, tool-result bodies, or reasoning text (no data/secret leak by construction)"

key-files:
  created:
    - src/cli/headless/surface-notifier.ts
    - tests/surface-notifier.test.ts
  modified:
    - src/cli/headless/turn-driver.ts
    - src/cli/headless/host.ts
    - src/i18n/types.ts
    - src/i18n/EN.ts
    - src/i18n/zh-CN.ts
    - src/i18n/JA.ts
    - src/i18n/de.ts
    - src/i18n/ru.ts
    - src/cli/commands/qq.ts
    - src/cli/commands/telegram.ts
    - src/cli/commands/weixin.ts
    - tests/headless-host.test.ts
    - tests/qq-command.test.ts
    - tests/telegram-command.test.ts
    - tests/weixin-command.test.ts

key-decisions:
  - "WR-01 naive `!recoverable` guard alone would regress the real force-summary path into silence (error(recoverable:true) + no assistant_final leaves outcome end_turn, lastAssistantText ''); threaded onRecoverableError so host.runTurn returns the scrubbed message instead of ''"
  - "Channel mode map LOCKED by the checker-passed plan: telegram=LIVE, weixin=LIVE, qq=FOLD — qq folds because its C2C reply is a bounded msgSeq budget that live notices would starve"
  - "No coalescing / no flush() — model.turn.started fires once per turn, so live notices emit the moment their event arrives; SurfaceNotifier.note() emits immediately per tool.intent"
  - "Command test assertions updated to the two-arg runTurn(text, {onEvent}) call — a Rule 1 deviation folded into Task 3 so each commit leaves the suite green"

requirements-completed: [ISSUE-2-surface-events, ISSUE-4-WR-01-error-outcome]

coverage:
  - id: G1
    description: "REAL force-summary shape (status → error(recoverable:true, msg set) → done, no assistant_final) through a real Eventizer resolves outcome end_turn, no assistant text captured, onRecoverableError receives the message"
    requirement: "ISSUE-4-WR-01-error-outcome"
    verification:
      - kind: unit
        ref: "tests/headless-host.test.ts#recoverable error keeps end_turn and routes its message to onRecoverableError"
        status: pass
    human_judgment: false
  - id: G2
    description: "host.runTurn returns a NON-EMPTY scrubbed message (never '') for the recoverable force-summary failure — the regression guard against silence"
    requirement: "ISSUE-4-WR-01-error-outcome"
    verification:
      - kind: unit
        ref: "tests/headless-host.test.ts#host.runTurn surfaces a recoverable error message instead of the empty string"
        status: pass
    human_judgment: false
  - id: G3
    description: "A non-recoverable (terminal) error still flips outcome to error"
    requirement: "ISSUE-4-WR-01-error-outcome"
    verification:
      - kind: unit
        ref: "tests/headless-host.test.ts#non-recoverable error terminates the turn"
        status: pass
    human_judgment: false
  - id: G4
    description: "HeadlessHost.runTurn(text, {onEvent}) forwards kernel events (model.turn.started / tool.intent / model.final) that runTurn previously dropped"
    requirement: "ISSUE-2-surface-events"
    verification:
      - kind: unit
        ref: "tests/headless-host.test.ts#host.runTurn forwards onEvent kernel events (turn.started/tool.intent/final)"
        status: pass
    human_judgment: false
  - id: G5
    description: "SurfaceNotifier live: thinking emitted once across model events; one IMMEDIATE notice per tool.intent on a real single-turn multi-tool stream, in order, three separate emit calls"
    requirement: "ISSUE-2-surface-events"
    verification:
      - kind: unit
        ref: "tests/surface-notifier.test.ts#live: emits the thinking notice exactly once + live: emits one immediate notice per tool.intent, in order"
        status: pass
    human_judgment: false
  - id: G6
    description: "SurfaceNotifier fold: accumulates without emitting, summary thinking-first; empty summary with no events; ignores tool.result/model.final/error/status"
    requirement: "ISSUE-2-surface-events"
    verification:
      - kind: unit
        ref: "tests/surface-notifier.test.ts#fold: accumulates... + fold: summary is empty... + ignores non-model/non-tool.intent events"
        status: pass
    human_judgment: false
  - id: G7
    description: "Fold reply-composition delivery guarantee: (summary && answer ? summary\\n\\nanswer : answer) always contains the answer and equals the answer exactly when summary is empty (no stray separator)"
    requirement: "ISSUE-2-surface-events"
    verification:
      - kind: unit
        ref: "tests/surface-notifier.test.ts#fold reply-composition: answer always present; no stray separator when summary empty"
        status: pass
    human_judgment: false
  - id: G8
    description: "headless.notice.{thinking,tool} resolve through t() and exist in all five locales (EN, zh-CN, JA, de, ru)"
    requirement: "ISSUE-2-surface-events"
    verification:
      - kind: other
        ref: "tsc --noEmit enforces the headless.notice contract; each locale declares its own headless literal so a missing key fails typecheck"
        status: pass
    human_judgment: false
  - id: G9
    description: "telegram/weixin construct a LIVE notifier + thread onEvent; qq constructs a FOLD notifier and composes summary + answer into the single sendResponse; runTurn is called with the onEvent hook"
    requirement: "ISSUE-2-surface-events"
    verification:
      - kind: unit
        ref: "tests/{qq,telegram,weixin}-command.test.ts#routes inbound onSubmitMessage to host.runTurn and channel.sendResponse"
        status: pass
    human_judgment: false

duration: ~85min
completed: 2026-07-06
status: complete
---

# Quick Task 260706-g0p: Wire HeadlessHost onEvent to Surface Reasoning/Tool Feedback + WR-01 Summary

**Bot chats now see live internal feedback — a `💭 thinking…` notice on the first model event and a `🔧 <tool>` line per tool dispatch (LIVE for telegram/weixin, FOLDED into the single reply for qq's bounded msgSeq budget) — and a recoverable mid-turn error (force-summary blip) surfaces its scrubbed message instead of collapsing the turn into silence, closing the shared-HeadlessHost internal-feedback gap (ISSUE #2) and the WR-01 error-outcome bug (ISSUE #4).**

## Performance

- **Duration:** ~85 min (plan dispatch 13:38 → final regression sweep 15:20, +08:00)
- **Tasks:** 3/3 complete
- **Files:** 15 (2 created, 13 modified)

## Accomplishments

- **WR-01 (Task 1):** `turn-driver.ts` now branches the kernel `error` event on `recoverable` — a recoverable error calls `onRecoverableError(message)` and KEEPS outcome `end_turn`; only a non-recoverable error flips outcome to `error`. `host.runTurn` threads that message and, when the turn ends `end_turn` with empty assistant text, returns `redactSecretsInText(message, knownSecrets)` (never `""`), preserving the pre-change `errorFallback` contract. The thrown-error catch path is untouched.
- **onEvent threading (Task 1):** `HeadlessHost.runTurn(text, hooks?)` forwards `hooks.onEvent` into `runHeadlessTurn`, so channels receive `model.turn.started` / `tool.intent` / `model.final` kernel events the host previously consumed-and-discarded. `onEvent` is now typed `(kev: Event) => void` (the loose `{ type: string }` cast is gone).
- **SurfaceNotifier (Task 2):** new `src/cli/headless/surface-notifier.ts` — a transport-agnostic MINIMAL notice engine. Live mode emits a thinking notice once + one line per `tool.intent` the moment each event fires (no batching, no `flush()`); fold mode buffers them into a newline-joined `summary()` (thinking first). Surfaces ONLY the static thinking string and the tool NAME — never args, result bodies, or reasoning text.
- **i18n (Task 2):** `headless.notice.{thinking,tool}` added to the `types.ts` contract and all five locale literals (EN/zh-CN/JA/de/ru); `tsc` enforces the contract across every locale.
- **Per-channel wiring (Task 3):** telegram + weixin build a `mode: "live"` notifier whose `emit` calls `channel.sendResponse(...).catch(...)` (weixin live is the direct fix for the "no internal feedback" chat gap); qq builds a `mode: "fold"` notifier and composes `summary && answer ? summary\n\nanswer : answer` into its single `sendResponse`, so the bounded C2C msgSeq budget is spent on the answer and the answer always delivers.

## Task Commits

1. **Task 1: WR-01 recoverable-error fix + thread onEvent through HeadlessHost.runTurn** — `ad98be8c` (`fix(headless)`)
2. **Task 2: SurfaceNotifier (immediate live / accumulate fold) + i18n notice strings in 5 locales** — `c9a4eeda` (`feat(headless)`)
3. **Task 3: Wire SurfaceNotifier into telegram/weixin (live) + qq (fold) + command-test updates** — `8d831c7e` (`feat(headless)`)

_Docs/state commit handled by the orchestrator._

## Security / Non-Regression

- **No data/secret leak by construction:** notices carry only a static localized thinking string and `tool.intent.name` (an identifier like `read_file`). Tool args, tool-result bodies, and reasoning text are never surfaced, so the new chat-bound path carries no user data or secrets.
- **WR-01 message is scrubbed:** the recoverable error message is returned through `redactSecretsInText(message, knownSecrets)` (host.ts), reusing the prior 260706-co7 scrubber — no plaintext secret can ride the recovered message into a chat.
- **Abort + terminal-error paths untouched:** the `(aborted)` sentinel, the thrown-error `onError`/stderr-mirror path, and the `outcome === "error"` return are unchanged. `host.runTurn(text)` (no hooks) call sites keep working via the optional second parameter.
- **qq answer-delivery guarantee:** notices are folded into the one reply; with the WR-01 fix making `assistantText` non-empty on a recoverable force-summary failure, `if (reply)` passes and the answer is the only thing consuming qq's reply budget.

## Deviations from Plan

### Auto-fixed

**1. [Rule 1 - Bug] Command tests asserted the old single-arg runTurn signature**
- **Found during:** Task 3 full-suite verification.
- **Issue:** `tests/{qq,telegram,weixin}-command.test.ts` each asserted `expect(fakeHost?.runTurn).toHaveBeenCalledWith("hi")`. Task 3's plan-mandated change to `host.runTurn(text, { onEvent })` legitimately broke that assertion (3 new red tests). These three files were not in the plan's `files_modified`, but the signature change directly requires them.
- **Fix:** updated each to `toHaveBeenCalledWith("hi", expect.objectContaining({ onEvent: expect.any(Function) }))` — a stronger assertion that validates the onEvent hook is threaded through. The `sendResponse("echo: hi")` assertions still pass (the stub host does not invoke onEvent, so no notices emit and the qq fold summary is empty).
- **Verification:** all 3 command test files green (14 tests); full suite back to exactly the 3 pre-existing reds.
- **Committed in:** `8d831c7e` (amended into Task 3 so each commit leaves the suite green).

**Total deviations:** 1 Rule-1 auto-fix (test-fixture update). No architectural changes, no scope creep.

## Issues Encountered

- **Pre-existing (out of scope): `node --import tsx tests/headless-host.test.ts` fails at the top-level vitest import.** The file's `import { describe, expect, it } from "vitest"` (line 11, unchanged by this task) throws `Vitest failed to access its internal state` at vitest's `createExpect` when run outside the vitest runner. Confirmed pre-existing by running the pristine `git show HEAD:tests/headless-host.test.ts` directly — it fails identically. This is the same condition the prior 260706-co7 task documented. The real gate `npx vitest run tests/headless-host.test.ts` passes all 10 cases (6 prior + 4 new). Not fixed here (unrelated to these files' behavior; would risk the dual-mode registration and is out of the task's scope boundary).
- **Pre-existing evidence-deferred reds unchanged:** the full suite ends at 3 failed files / 7 failed tests — `ssh-remote`, `ui-mcp-marketplace-snapshot`, `ui-slash-suggestions` — exactly the 04-02 evidence-deferred baseline (STATE.md). My changes introduced zero net-new failures (6 → 3 failed files after the Rule-1 command-test fix).
- **Checker non-blocking note (accepted):** in the pathological case where a qq answer already sits exactly at the C2C msgSeq passive-reply limit, prepending the fold summary could push one tail chunk past the budget. Minimized by the thinking + tool-name-only minimal summary; the answer being present in the reply is the guarantee that matters. Not over-engineered per the plan.

## Verification

- `npm run typecheck` (tsc --noEmit) — exit 0. Enforces the `onEvent: Event` typing AND the `headless.notice` contract across all five locales.
- `npx vitest run tests/headless-host.test.ts tests/surface-notifier.test.ts` — 7 tests green (headless-host dual-mode aggregate covering 10 cases + 6 surface-notifier cases).
- `npx vitest run tests/{qq,telegram,weixin}-command.test.ts` — 14 tests green.
- `npm run lint` (biome check src tests) — exit 0; only the ONE pre-existing acceptable warning at `tests/hydrate-cards.test.ts:135` (issue #3), no new lint issues.
- `tests/comment-policy.test.ts` (9) + `tests/public-api.test.ts` (2) — green (new files comply with the comment policy; public API surface unchanged).
- Full `npx vitest run` — 268 files / 3731 tests passed; 3 files / 7 tests failed = exactly the pre-existing evidence-deferred reds.

## Next Readiness

- ISSUE #2 (internal feedback) + ISSUE #4 (WR-01) both closed on `dev`; `v1` untouched. The weixin "no internal feedback" UAT gap is now fixed — weixin pushes live notices; the gap was a shared-HeadlessHost rendering gap that also affected telegram/qq, now resolved for all three by their real send model.
- The `onEvent` sink is generic (`(kev: Event) => void`), so a future channel-streaming phase can layer richer surfacing (reasoning text, tool results) without re-plumbing the host boundary.

---
*Quick task: 260706-g0p*
*Completed: 2026-07-06*

## Self-Check: PASSED

- All 15 source/test files present on disk; SUMMARY.md written.
- Both created files verified: `src/cli/headless/surface-notifier.ts`, `tests/surface-notifier.test.ts`.
- All three task commits verified in git history: `ad98be8c` (Task 1), `c9a4eeda` (Task 2), `8d831c7e` (Task 3).
