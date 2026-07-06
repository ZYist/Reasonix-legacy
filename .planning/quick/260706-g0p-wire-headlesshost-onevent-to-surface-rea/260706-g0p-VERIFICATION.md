---
phase: 260706-g0p-wire-headlesshost-onevent-to-surface-rea
verified: 2026-07-06T15:45:00+08:00
status: passed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick Task 260706-g0p: Wire HeadlessHost onEvent + WR-01 No-Silence — Verification Report

**Task Goal:** (A) HeadlessHost forwards kernel onEvent so bot chats surface thinking/tool notices — telegram=LIVE, weixin=LIVE, qq=FOLD; (B) WR-01: a recoverable mid-turn error must never cause silence.
**Verified:** 2026-07-06T15:45:00+08:00
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A recoverable mid-turn error never yields silence (force-summary shape → non-empty scrubbed return, never "") | ✓ VERIFIED | `host.ts:187-191` returns `redactSecretsInText(recoverableErrMessage) \|\| errorFallback` when `!lastAssistantText && recoverableErrMessage`; `turn-driver.ts:90` routes recoverable → `onRecoverableError` and keeps outcome. Behavioral test case 10 `runHostSurfacesRecoverableErrorCase` replays REAL force-summary events through a **real `Eventizer`**, asserts `returned.trim() !== ""` and contains "context guard summary failed" — PASSES. |
| 2 | A terminal error still ends the turn (non-recoverable → outcome "error"; thrown-catch untouched) | ✓ VERIFIED | `turn-driver.ts:91` `else outcome = "error"`; catch block `99-104` unchanged (onError + "error"). Test case 8 (non-recoverable event → "error") + case 3 (thrown → onError + "error") PASS. |
| 3 | The `!recoverable` guard structurally preserves a later assistant_final (property of the guard, not a tested sequence — does not occur in today's kernel) | ✓ VERIFIED (structural) | Recoverable branch (`turn-driver.ts:90`) does NOT touch `outcome`; `host.ts:187` recoverable-return only fires when `!lastAssistantText`, so a later `assistant_final` sets `lastAssistantText` and is returned at `host.ts:192`. Plan explicitly states the sequence is unreachable (force-summary success/catch mutually exclusive); verified by code structure. |
| 4 | HeadlessHost.runTurn forwards a kernel-event sink (model.turn.started / tool.intent / model.final) | ✓ VERIFIED | `host.ts:149` signature `runTurn(text, hooks?)`; `:168` `onEvent: hooks?.onEvent`; `turn-driver.ts:86` `opts.onEvent?.(kev)` per consumed event. Test case 9 asserts onEvent receives all three types through a real `Eventizer` — PASSES. |
| 5 | telegram + weixin (LIVE): one thinking notice on first model event + one 🔧`<name>` per tool.intent, emitted IMMEDIATELY | ✓ VERIFIED | `surface-notifier.ts:27-43` emits synchronously in live mode (no batch/flush); `telegram.ts:116-129` + `weixin.ts:143-156` construct `mode:"live"` notifiers whose `emit` calls `channel.sendResponse`. surface-notifier test (b) asserts `["💭 thinking…","🔧 read_file","🔧 grep"]` in order (3 separate emits) — PASSES. |
| 6 | qq (FOLD): NO mid-turn push; summary() folds notices into the SINGLE final reply | ✓ VERIFIED | `qq.ts:115` `mode:"fold"` with no-op `emit`; `:121-123` composes `summary && answer ? summary\n\nanswer : answer` into one `sendResponse`. surface-notifier tests (c) fold-no-emit + (f) delivery guarantee PASS. |
| 7 | New notice strings resolve through t() and exist in all five locales | ✓ VERIFIED | `types.ts:1029-1031` contract; `notice.{thinking,tool}` present in EN/zh-CN/JA/de/ru. `tsc --noEmit` exit 0 enforces the contract; notifier tests resolve `t()` to concrete strings. |

**Score:** 7/7 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/cli/headless/surface-notifier.ts` | SurfaceNotifier class + NoticeMode; immediate-emit live / accumulate fold | ✓ VERIFIED | 50 lines; `note()`/`summary()`; no flush/coalescing. Imported+used by all 3 commands. |
| `tests/surface-notifier.test.ts` | dedupe, per-tool.intent immediacy, fold, ignore, delivery guarantee | ✓ VERIFIED | 6 tests, all PASS. |
| `src/cli/headless/turn-driver.ts` | onEvent typed `Event`; WR-01 `!recoverable` guard + onRecoverableError | ✓ VERIFIED | `:55` onEvent `(kev: Event)`; `:59` onRecoverableError; `:87-92` recoverable-vs-terminal branch. |
| `src/cli/headless/host.ts` | runTurn(text, hooks?) forwards onEvent + surfaces recoverable message | ✓ VERIFIED | `:149` signature; `:168` forward; `:172-174,187-191` no-silence return. |
| `src/i18n/{types,EN,zh-CN,JA,de,ru}.ts` | headless.notice.{thinking,tool} | ✓ VERIFIED | Present in contract + all 5 locales; tsc clean. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| turn-driver onEvent(Event) | host runTurn hooks.onEvent → command SurfaceNotifier.note | (live) sendResponse / (fold) summary() prepended | ✓ WIRED | End-to-end in code; command tests assert runTurn called with `{ onEvent }`. |
| Eventizer.consume error.recoverable | turn-driver outcome guard + onRecoverableError → host recoverable-empty return | eventize.ts:89 map → turn-driver:90 → host:187 | ✓ WIRED | Real Eventizer maps `errorDetail.recoverable ?? false`; verified live in cases 7 & 10. |
| Tool notice keys on tool.intent.name | SurfaceNotifier `t("headless.notice.tool",{tool:kev.name})` | events.ts:57-63 ToolIntentEvent.name | ✓ WIRED | Discriminated union narrows `kev.name`; test (b) confirms per-name lines. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 5 targeted test files | `npx vitest run tests/{headless-host,surface-notifier,qq-command,telegram-command,weixin-command}.test.ts` | 21 passed (incl. host cases 7/8/9/10) | ✓ PASS |
| Typecheck (Event typing + i18n contract) | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| Lint (comment policy, import type) | `npm run lint` | exit 0, only pre-existing hydrate-cards:135 warning | ✓ PASS |
| Full regression suite | `npx vitest run` | 3731 passed; 7 failed = 3 pre-existing unrelated files | ✓ PASS |
| Commits exist | `git cat-file -t ad98be8c c9a4eeda 8d831c7e` | all commit | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ISSUE-2-surface-events | 260706-g0p-PLAN | Surface thinking/tool feedback to bot chats | ✓ SATISFIED | onEvent threading + SurfaceNotifier + per-channel wiring + i18n; truths 4-7. |
| ISSUE-4-WR-01-error-outcome | 260706-g0p-PLAN | Recoverable mid-turn error must never cause silence | ✓ SATISFIED | Recoverable guard + onRecoverableError + host no-silence return; truths 1-3. |

### Anti-Patterns Found

None. No debt markers (TBD/FIXME/XXX/TODO/HACK) in modified `src/cli/headless/*`; no stub returns in `surface-notifier.ts`. Lint clean.

### Informational Notes (non-blocking)

1. **node-direct dual-mode gate fails pre-existingly.** `node --import tsx tests/headless-host.test.ts` throws "Vitest failed to access its internal state" at the top-level `import ... from "vitest"` (line 11). `git log -L 11,11` confirms that import was introduced by commit `559d7899 (fix(04-02))` — NOT by any of this task's 3 commits. The authoritative `npx vitest run tests/headless-host.test.ts` gate passes all 10 cases. Pre-existing harness limitation, not a regression; matches the SUMMARY's documented "Issues Encountered".
2. **Theoretical unreachable edge.** A recoverable error carrying an EMPTY message would return "" (vs pre-change `errorFallback`). This state is unreachable in today's kernel — the only recoverable emitter (force-summary.ts) always sets a message — so it is scoped out by the plan's verified facts. The real force-summary path is fully fixed and tested. Noted for future kernel changes only.
3. **Commit-message drift (cosmetic).** SUMMARY narrates Task 2's commit as "add SurfaceNotifier and thread onEvent through runTurn"; actual `c9a4eeda` message is "add SurfaceNotifier notice engine with i18n strings". Commit exists and code is correct; no impact.

### Human Verification Required

None. Every must-have is a code-level contract verified with a passing behavioral test that exercises the real invariant (real `Eventizer`, real force-summary event sequence, real single-turn multi-tool stream). All plan coverage entries are `human_judgment: false`. The end-to-end real-time delivery to live Telegram/WeChat/QQ gateways relies on pre-existing channel `sendResponse` infrastructure not modified by this task and is outside the task's must-have contract; an optional live-bot smoke test could confirm real-world appearance but is not required for goal achievement.

### Gaps Summary

No gaps. Both deliverables are achieved and independently verified against the codebase:

- **(A) onEvent threading:** `HeadlessHost.runTurn(text, hooks?)` forwards `hooks.onEvent` (typed as the real `Event` union) into `runHeadlessTurn`, which calls it for every consumed kernel event. SurfaceNotifier emits immediately in live mode (telegram/weixin) and folds into a single reply in fold mode (qq). i18n keys present in all 5 locales; tsc enforces the contract.
- **(B) WR-01 no-silence:** turn-driver flips outcome to "error" ONLY on `!recoverable`; recoverable errors route their message to `onRecoverableError` and keep outcome "end_turn". host.runTurn returns the scrubbed recoverable message (never "") when the turn ends end_turn with empty assistant text. The regression test replays the REAL force-summary sequence (status → error(recoverable:true) → done, no assistant_final) through a real Eventizer and asserts non-empty output; a non-recoverable error still terminates.

Full suite adds ZERO net-new failures — the only 3 red files (ssh-remote, ui-mcp-marketplace-snapshot, ui-slash-suggestions) are the documented pre-existing evidence-deferred baseline and are untouched by this task's commits.

---

_Verified: 2026-07-06T15:45:00+08:00_
_Verifier: Claude (gsd-verifier)_
