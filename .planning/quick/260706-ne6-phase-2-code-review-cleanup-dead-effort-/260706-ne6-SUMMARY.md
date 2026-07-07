---
quick: 260706-ne6
status: complete
branch: dev
commits:
  - 55dde7b7  # refactor(headless): IN-01..04
  - 382ddfd1  # refactor(headless): IN-05, IN-06
  - 679a3d6d  # fix(headless): WR-03, WR-04
---

# Quick Task 260706-ne6 — Phase-2 code-review cleanup (issue #4)

Deferred Phase-2 code-review follow-ups. WR-01 was already shipped with issue #2;
this task cleared the remaining IN-01..06 + WR-03 + WR-04. The command-controller
structural dedup is deliberately out of scope (issue #5).

## What shipped

**Task 1 — dead code + gate-bridge interface tidy (`55dde7b7`)**
- IN-01: dropped the doubly-dead `effort?` option from Qq/Telegram/Weixin `*CommandOptions`
  (never passed from cli/index.ts, never read in the bodies — effort is loaded inside
  HeadlessHost.create via loadReasoningEffort()).
- IN-02: the bridge now builds the prompt once and `sendPrompt(promptText)` receives it;
  removed the discarded second `defaultBuildPrompt` call from all 3 command closures.
- IN-03: `gateCallbacks` made optional (resolution is owned by dispatchReply via pauseGate);
  the all-no-op bags in the 3 commands are gone.
- IN-04: dropped the non-canonical `checkpoint` field from the plan_checkpoint revise verdict
  (CheckpointVerdict has no such field; consumers read only `.type`/`.feedback`).

**Task 2 — shared gate-parsers (`382ddfd1`)**
- IN-06: extracted `src/cli/headless/gate-parsers.ts` (React-free pure string→verdict fns) and
  routed gate-bridges.ts + the qq/telegram/weixin `use-*-channel.ts` hooks through it (4-way
  byte-identical dedup; headless graph stays React-free).
- IN-05: removed the unused `lowerText` binding from each hook's slash-reply callback.

**Task 3 — real bug fixes with red/green regression tests (`679a3d6d`)**
- WR-03: `pending` single slot → FIFO `pendingQueue` (push on request, shift on reply) so
  parallel pausing tools in one turn no longer orphan the first gate.
- WR-04: SIGINT/SIGTERM cleanup now installed BEFORE the multi-minute weixin QR-login window,
  with null-safe `bridge?`/`channel?` teardown — Ctrl-C during the scan exits cleanly.

## Verification

- `npm run verify` GREEN: 270 files / 3735 tests pass, 15 skipped, 0 failures (includes the
  two new WR-03/WR-04 regression tests).
- `tsc --noEmit` exit 0 (interface changes typecheck across all call sites).
- `npm run lint` clean.

## Self-check

- WR-03 queue drains FIFO (`pendingQueue.shift()`), verified by direct read.
- WR-04 handlers precede the QR window, verified by diff.
- gate-parsers.ts confirmed React-free.

## Note

The executor process was terminated by a 429 API error immediately after committing Task 3,
before it could write this SUMMARY. All three code commits landed cleanly on a clean working
tree; the orchestrator verified green independently and authored this summary.
