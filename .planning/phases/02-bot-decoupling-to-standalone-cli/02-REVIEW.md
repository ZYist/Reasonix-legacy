---
phase: 02-bot-decoupling-to-standalone-cli
reviewed: 2026-07-03T00:00:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - src/cli/commands/qq.ts
  - src/cli/commands/telegram.ts
  - src/cli/commands/weixin.ts
  - src/cli/headless/gate-bridges.ts
  - src/cli/headless/host.ts
  - src/cli/headless/turn-driver.ts
  - src/cli/index.ts
  - src/cli/ui/App.tsx
  - src/i18n/EN.ts
  - src/i18n/JA.ts
  - src/i18n/de.ts
  - src/i18n/ru.ts
  - src/i18n/types.ts
  - src/i18n/zh-CN.ts
  - src/qq/use-qq-channel.ts
  - src/telegram/use-telegram-channel.ts
  - src/weixin/use-weixin-channel.ts
  - tests/headless-gate-bridges.test.ts
  - tests/headless-host.test.ts
  - tests/qq-channel-gate-callbacks.test.ts
  - tests/qq-command.test.ts
  - tests/qq-first-connect.test.tsx
  - tests/telegram-command.test.ts
  - tests/weixin-command.test.ts
findings:
  critical: 1
  warning: 6
  info: 6
  total: 13
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-07-03T00:00:00Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Phase 02 successfully mounts QQ / Telegram / Weixin onto a shared HeadlessHost with a unified GateCallbacks shape (D-08), preserves the channel public methods, wires SIGINT/SIGTERM cleanup before `channel.start()` in all three controllers, and ships the `commands.*` and `headless.*` i18n keys across all 5 locales. The refactor from `onXxxRef: {current: fn}` to plain `onXxx: fn` injection is consistent across the three adapters and App.tsx, and the internal refs (`pendingGateIdRef`, `interactionRef`, etc.) correctly stay refs.

However, the headless turn-driver/host error path is **mis-wired**: `HeadlessHost.runTurn` never passes `onError` to `runHeadlessTurn`, and `runHeadlessTurn` swallows every loop exception into an `onError` callback (which is therefore a no-op in production) and never rethrows. The result is that the carefully-written `errorMeta` classification block in `host.ts` is dead code, and every loop failure surfaces to the chat user as the generic `"(turn failed — see error above)"` string with zero diagnostic detail and nothing on stderr either. That is the lead BLOCKER.

Beyond that, the gate-reply parsers use overly-broad substring matching that can turn deny-intent replies ("don't run", "never always allow") into approvals — a safety concern for destructive commands, duplicated across four files. The single-slot `pending` interaction in the bridge is a latent hang hazard for parallel pausing tools, the Weixin QR-login window runs before the signal handlers are installed, and raw error messages flow unfiltered to stderr. Layered on top are extensive `//`-comment essays that exploit the comment-policy test's regex loopholes (only `/* */` blocks and literal "Phase N" are caught) to embed ephemeral task IDs and rotting cross-file line references.

## Critical Issues

### CR-01: HeadlessHost.runTurn discards all loop error detail — onError is never wired, errorMeta block is dead code

**File:** `src/cli/headless/host.ts:127-158` (cross-ref `src/cli/headless/turn-driver.ts:67-101`)
**Issue:**
`HeadlessHost.runTurn` calls `runHeadlessTurn` with only `onAssistantText`:

```ts
outcome = await runHeadlessTurn({
  loop: this.loop,
  ctx: this.ctx,
  eventizer: this.eventizer,
  signal: this.aborter.signal,
  text,
  sessionId: this.session,
  onAssistantText: (content) => { lastAssistantText = content; },
  // no onError, no onEvent
});
```

But `runHeadlessTurn` (turn-driver.ts:89-95) **catches every loop exception internally**, invokes `opts.onError?.(cause, meta)`, sets `outcome = "error"`, and returns — it never rethrows:

```ts
} catch (err) {
  const cause = err instanceof Error ? err : new Error(String(err));
  const meta = errorMeta(cause);
  opts.onError?.(cause, meta);   // undefined in host usage → no-op
  outcome = "error";
}
return outcome;
```

Because the turn-driver never rethrows, the `try/catch` in `host.ts:144-152` (which builds `errMessage` from `errorMeta` — the `${cause.message} [code=... phase=...]` classification) is **unreachable for any loop error**. `errMessage` stays `""`, so the host returns `errMessage || t("headless.host.errorFallback")` → the generic `"(turn failed — see error above)"` for *every* loop failure.

Concrete impact for a chat bot:
- The chat user receives `"(turn failed — see error above)"`, which is meaningless (there is nothing "above" in a chat thread — stderr is invisible to the remote user). Real causes like "maximum context length exceeded", "401 Unauthorized", or "budget exhausted" are discarded.
- The terminal operator sees nothing on stderr either, because `runTurn` resolves (never rejects), so the command's `.catch` that writes to stderr never fires.
- The `errorMeta` import and the entire classification block in `host.ts` are dead code, which is why this slipped past the tests: `tests/headless-host.test.ts` exercises `runHeadlessTurn` directly (passing `onError`), and `tests/qq-command.test.ts` stubs `HeadlessHost.create` entirely. No test drives `HeadlessHost.runTurn`'s error path.

**Fix:** Wire `onError` so the cause/meta captured by the turn-driver reach the host's message builder, e.g.:

```ts
let errMessage = "";
outcome = await runHeadlessTurn({
  loop: this.loop,
  ctx: this.ctx,
  eventizer: this.eventizer,
  signal: this.aborter.signal,
  text,
  sessionId: this.session,
  onAssistantText: (content) => { lastAssistantText = content; },
  onError: (cause, meta) => {
    errMessage =
      meta.code || meta.phase
        ? `${cause.message} [code=${meta.code ?? "?"} phase=${meta.phase ?? "?"}]`
        : cause.message;
  },
});
```

(Then have the command controllers forward that message to both the channel reply and stderr, so operators can actually diagnose failures.)

## Warnings

### WR-01: turn-driver marks outcome "error" on any kernel "error" event and never recovers — assistant_final reply discarded on recoverable errors

**File:** `src/cli/headless/turn-driver.ts:80-83`
**Issue:**
Inside the event loop:

```ts
for (const kev of eventizer.consume(ev, ctx)) {
  opts.onEvent?.(kev);
  if ((kev as { type?: string }).type === "error") outcome = "error";
}
```

`outcome` is set to `"error"` the moment the eventizer projects any kernel `error` event (`src/core/eventize.ts:87-96`, emitted for `LoopEvent.role === "error"`, including ones flagged `recoverable: true`) and is **never reset** to `"end_turn"`. If the loop subsequently recovers, emits `assistant_final` (captured into `lastAssistantText`), and exhausts normally, the function still returns `"error"`. `HeadlessHost.runTurn` then returns `errMessage || errorFallback` and **discards the captured assistant reply**. A recoverable mid-turn error that the loop handled gracefully still produces a "(turn failed)" message instead of the model's actual answer.

**Fix:** Only treat a projected error as terminal when it is non-recoverable, or reset `outcome` back to `"end_turn"` when `assistant_final` arrives after the error; alternatively, drive the outcome solely from the catch path + a final `done`/terminal signal rather than mutating it from every projected event.

### WR-02: Gate-reply parsers use overly-broad substring matching — deny-intent replies silently approve destructive actions

**File:** `src/cli/headless/gate-bridges.ts:112-138`; duplicated verbatim in `src/qq/use-qq-channel.ts:129-155`, `src/telegram/use-telegram-channel.ts:129-155`, `src/weixin/use-weixin-channel.ts:130-156`
**Issue:**
```ts
function parseRunPermissionChoice(text: string): "run_once" | "always_allow" | "deny" {
  const lower = text.toLowerCase();
  if (lower.includes("1") || lower.includes("run")) return "run_once";
  if (lower.includes("2") || lower.includes("always")) return "always_allow";
  return "deny";
}
```
`includes("run")` matches "don't run it", "never run this", "running is dangerous" → all resolve to `run_once` (approve). `includes("always")` matches "do not always allow" → `always_allow`. `includes("1")` matches any reply containing the digit 1 (e.g. "13 reasons to deny"). The same looseness applies to `parsePlanChoice` ("2"/"refine"), `parseCheckpointChoice`, `parseRevisionChoice`. The T-02-02/T-02-06 mitigation comments claim "unmatched reply text defaults to deny, never auto-allow", but the substring rules mean benign English denials are matched as approvals. This is a real safety defect for the `run_command`/`path_access` gates on destructive commands, and it is copy-pasted across four modules (so a fix must land in four places — see IN-06).

**Fix:** Require the reply to *start with* the digit/keyword (anchor with `^`), or accept only the bare token (`text.trim() === "1"` / exact word), so multi-word deny-intent replies fall through to the denying default.

### WR-03: Single-slot `pending` interaction in the bridge — parallel pausing tools orphan the first gate and hang the turn

**File:** `src/cli/headless/gate-bridges.ts:338, 359-372, 374-379`
**Issue:**
The bridge keeps a single `let pending: PendingInteraction | null`. When `pauseGate.on` fires, it overwrites `pending` and pushes the prompt. If two pausing tools are dispatched concurrently (parallelSafe tools whose `gate.ask` fires before the user replies to the first — e.g. two `run_command` calls in one assistant turn), the second request overwrites the first `pending`, so:
1. The first `gateId` is no longer reachable by `consumeReply` (its pending slot was clobbered).
2. The user's reply to the first prompt is parsed as the verdict for the *second* kind, or — once `pending` is null — falls through to `host.runTurn` as a fresh turn.
3. The first `pauseGate.ask` promise never resolves and the tool hangs until SIGINT.

The command-layer `turnInFlight` guard only prevents *turn*-level concurrency, not *gate*-level concurrency within one turn.

**Fix:** Track pending interactions in a `Map<gateId, PendingInteraction>` (or a FIFO queue keyed by kind), and have `consumeReply` dispatch to the oldest/matching entry; mirror whatever queueing the desktop modal stack does.

### WR-04: Weixin QR login runs before SIGINT/SIGTERM handlers are installed

**File:** `src/cli/commands/weixin.ts:75-88` vs `172-173`
**Issue:**
The Weixin QR-login flow (which blocks waiting for a manual mobile scan and can take minutes) executes at lines 75-88, but the signal handlers are only registered at lines 172-173, *after* `HeadlessHost.create`, the QR login, the gate bridge, and channel construction. A Ctrl-C during the QR window hits Node's default SIGINT handler (exit 130) with no graceful teardown — `bridge.unsubscribe` is never called and `host.shutdown()` is never invoked (so an in-flight aborter, if any, leaks). The phase invariant "SIGINT/SIGTERM cleanup installed BEFORE channel.start()" is technically satisfied, but the QR window — the longest-blocking step — is uncovered.

**Fix:** Either install the signal handlers before the QR-login block, or factor the cleanup closure so a minimal handler is registered right after `HeadlessHost.create` returns.

### WR-05: Raw error messages flow unfiltered to stderr — token/secret leak risk

**File:** `src/cli/commands/qq.ts:74,108,113,120-121`; `src/cli/commands/telegram.ts:77,109,115-116,122-123`; `src/cli/commands/weixin.ts:103,135,142-143,148-149`
**Issue:**
Every error path writes `t("commands.{qq,telegram,weixin}.error", { msg: (err as Error).message })` (or `.sendFailed`) straight to `process.stderr.write`. `(err as Error).message` is unfiltered — if an upstream HTTP/auth failure embeds the bot token, appSecret, or DeepSeek key in the message (e.g. a URL or header echo from the channel transport or DeepSeekClient), it is written verbatim to stderr. The phase brief explicitly calls out "token/secret leakage into stderr strings" as a thing to flag. (Note: under CR-01 the `runTurn` error path currently returns the generic sentinel so its stderr write is benign, but the `sendResponse` failure paths still emit raw messages today, and any future fix to CR-01 would route classified — but still potentially secret-laden — messages through stderr too.)

**Fix:** Route stderr-bound error text through a redactor (the codebase already has `src/core/event-redaction.ts` `redactEventValue`) before writing, or at minimum strip anything matching a token/key pattern.

### WR-06: `//`-comment essays exploit comment-policy loopholes — module headers run 7-20 lines of ephemeral task-ID narrative

**File:** `src/cli/commands/qq.ts:1-13`, `src/cli/commands/telegram.ts:1-17`, `src/cli/commands/weixin.ts:1-20`, `src/cli/headless/gate-bridges.ts:1-16`, `src/cli/headless/host.ts:1-11`, `src/cli/headless/turn-driver.ts:1-7` (and inline essays at e.g. `gate-bridges.ts:203-238, 326-372`, `qq.ts:58-94, 127-142`)
**Issue:**
The comment-policy test (`tests/comment-policy.test.ts`) only enforces the header-length and block-length rules on `/* */` blocks and only flags the literal regex `\bPhase\s+\d+\b`. The recent `fix(02)` commit exploited those loopholes by converting essays to `//` line comments and dropping the literal "Phase N" wording — but the new files still violate the documented CLAUDE.md rules ("Module header ≤ 2 lines", "Block comments ≤ 3 lines / prefer one-line", "No Phase N narrative") in spirit: headers are 7-20 `//` lines each, and the body is saturated with ephemeral planning IDs (`BOT-01`, `02-01`, `02-02`, `T-02-09`, `T-02-14`, `D-08`, `D-09`) and rotting cross-file line references (`desktop.ts:1872-1933`, `code.tsx:48-87`, `use-qq-channel.ts:81-112`) that lose meaning the moment those files shift. These comments are noise that will mislead future maintainers.

**Fix:** Collapse each module header to ≤2 lines of `//` describing what the module is, drop the task IDs and foreign-file line ranges, and reduce the inline essays to one-line "why" notes (the CLAUDE.md comment table already permits a hidden-constraint/workaround note).

## Info

### IN-01: `effort` option declared but never read in all three command controllers

**File:** `src/cli/commands/qq.ts:27`, `src/cli/commands/telegram.ts:31`, `src/cli/commands/weixin.ts:42`
**Issue:**
Each `*CommandOptions` interface declares `effort?: string`, but the function bodies never reference `opts.effort`, and `src/cli/index.ts` (qq/telegram/weixin `.action`) never passes `effort` into the command (it only forwards `model`, `workspace`, `budgetUsd`). Effort is persisted upstream via `persistEffortFlag` and later read back by `loadReasoningEffort()` inside `HeadlessHost.create`, so the field is doubly dead.
**Fix:** Remove `effort` from the three `*CommandOptions` interfaces (it is not part of the contract).

### IN-02: `defaultBuildPrompt` invoked twice per gate prompt; result discarded in the bridge

**File:** `src/cli/headless/gate-bridges.ts:359-372`
**Issue:**
The bridge computes `const prompt = (opts.buildPrompt ?? defaultBuildPrompt)(...)` then immediately `void prompt;` (kept "alive for tests that want to inspect it" — but no test inspects the bridge's local; `tests/headless-gate-bridges.test.ts` calls `defaultBuildPrompt` directly). The channel command's `sendPrompt` callback (`qq.ts:71`, `telegram.ts:74`, `weixin.ts:100`) then calls `defaultBuildPrompt` a second time to get the actual text. The first call is wasted work and the `void prompt` is confusing dead code.
**Fix:** Drop the `const prompt = …; void prompt;` lines in the bridge; let `sendPrompt` own prompt construction.

### IN-03: Required `GateCallbacks` object is eight no-op closures in every command

**File:** `src/cli/commands/qq.ts:78-87`, `src/cli/commands/telegram.ts:81-90`, `src/cli/commands/weixin.ts:107-116`
**Issue:**
Per the comments ("observer callbacks here are no-ops because the resolution path is fully owned by dispatchReply"), the bridge resolves `pauseGate` directly inside `dispatchReply`, so the eight `gateCallbacks` fields are never load-bearing in the headless command path — all three commands dutifully pass `() => undefined` for every field. The `GateCallbacks` bag is over-specified for the headless surface: it is a required interface whose entire contract is unused.
**Fix:** Either make `gateCallbacks` optional in `HeadlessGateBridgeOptions` (default to no-op internally), or document explicitly that the headless path ignores it and accept a partial/empty object.

### IN-04: `dispatchReply` plan_checkpoint resolve carries an undocumented `checkpoint` field

**File:** `src/cli/headless/gate-bridges.ts:266-275`
**Issue:**
```ts
pauseGate.resolve(gateId, {
  type: "revise",
  feedback: followup,
  checkpoint: { stepId: payload.stepId ?? "", title: payload.title },  // not in CheckpointVerdict
});
```
The canonical `CheckpointVerdict = { type: "continue" } | { type: "revise"; feedback?: string } | { type: "stop" }` has no `checkpoint` field. Because `pauseGate.resolve` is typed `unknown`, this slips past the compiler. The consuming tool reads only `.type`/`.feedback` so it is harmless today, but it is a type-contract drift that will confuse anyone auditing the verdict shapes.
**Fix:** Drop the `checkpoint` field (it is not consumed), or, if it must mirror desktop, extend `CheckpointVerdict` and document it.

### IN-05: `lowerText` declared and unused in `consumeSlashReply` across all three adapters

**File:** `src/qq/use-qq-channel.ts:510`, `src/telegram/use-telegram-channel.ts:499`, `src/weixin/use-weixin-channel.ts:528`
**Issue:**
Each `consumeSlashReply` opens with `const lowerText = text.toLowerCase();` that is never referenced in the function body (callers use `isCancelText(text)` / inline `.toLowerCase()`). Dead binding.
**Fix:** Delete the unused declaration in all three files.

### IN-06: `parse*Choice` / `stripFollowupPrefix` duplicated across four modules

**File:** `src/cli/headless/gate-bridges.ts:107-147`, `src/qq/use-qq-channel.ts:114-164`, `src/telegram/use-telegram-channel.ts:114-164`, `src/weixin/use-weixin-channel.ts:115-165`
**Issue:**
The gate-bridge module admits in comments it copied these helpers verbatim ("02-02 will extract a shared `gate-parsers.ts`"). They now exist in four places. Any behavioral fix — in particular the WR-02 safety fix to the substring parsers — must be applied four times, or the headless and TUI paths will drift in how they interpret the same reply text.
**Fix:** Extract `parse*Choice` / `stripFollowupPrefix` into a shared React-free module and import from all four sites.

---

_Reviewed: 2026-07-03T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
