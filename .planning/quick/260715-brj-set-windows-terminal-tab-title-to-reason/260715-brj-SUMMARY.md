---
quick_id: 260715-brj
status: complete
date: 2026-07-15
---

# Quick Task 260715-brj — Summary

## Outcome

Interactive reasonix entrypoints set the Windows Terminal tab title to a fixed
`reasonix-legacy` via OSC 0, re-emitted every 2s so child-process title
overwrites (ConPTY) are recovered automatically.

## Root cause

OSC 0 works, but Windows Terminal's ConPTY syncs child-process titles (npx at
startup, ollama, shell tools) onto the tab via `SetConsoleTitle`. A single
startup emit got overwritten within seconds (`reasonix-legacy` → `npx` → cmd
path, observed live). Fix: re-emit on a 2s unref'd singleton timer.

## Changes

- `src/cli/tab-title.ts` (new) — `setTabTitle()` emits OSC 0 with an ST
  terminator + starts a 2s re-emit singleton (unref'd, non-stacking);
  `stopTabTitleKeeper()` for test teardown.
- `src/cli/index.ts` — call `setTabTitle()` in the bare / code / chat / run actions.
- `tests/tab-title.test.ts` (new) — fixed title, re-emit interval, no-stack,
  non-TTY and undefined-isTTY no-op.

## Decisions

- Fixed title `reasonix-legacy` (no project dir) — simpler; avoids the
  `reasonix-legacy` / `reasonix_legacy` duplication.
- Excluded `acp` (stdout is the JSON-RPC channel) and bot / data commands.
- 2s re-emit — recovers the startup overwrite quickly at negligible cost;
  unref'd so it never blocks exit.

## Verification

- `biome check src tests` — pass.
- `tsc --noEmit` — pass.
- vitest: tab-title (5) + strip-bel (5) + clipboard (5) + CLI routing (24) = 39 passed.

## Commit

Squashed into a single `feat(cli)` commit on `dev`.
