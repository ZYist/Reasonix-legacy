---
quick_id: 260715-brj
slug: set-windows-terminal-tab-title-to-reason
title: Set Windows Terminal tab title to reasonix-legacy
status: complete
date: 2026-07-15
---

# Quick Task 260715-brj: Set Windows Terminal tab title to reasonix-legacy

## Goal

When reasonix runs in Windows Terminal, set the tab title to a fixed
`reasonix-legacy` so it no longer shows the cmd path.

## Root cause (found during execution)

OSC 0 does set the tab title and works. But Windows Terminal's ConPTY **syncs
child-process titles** (npx at startup, ollama, shell tools) onto the tab via
`SetConsoleTitle`. reasonix emitted OSC 0 once at startup; a child process
overwrote it within seconds, and the title never came back — confirmed by a
staged diagnostic: title flashed `reasonix-legacy` → `npx` → cmd path.

## Approach

Emit OSC 0 (`ESC ] 0 ; reasonix-legacy ST`) at the start of interactive
entrypoints AND re-emit on a 2s timer so child-process overwrites are recovered
within 2s. ST terminator (not BEL) stays valid alongside strip-bel. isTTY guard
skips pipes / acp. Fixed title (no project dir) — simpler, and avoids the
`reasonix-legacy` / `reasonix_legacy` visual duplication.

## Entrypoints

Covered: bare → code, `code`, `chat`, `run`.
Excluded: `acp` (stdout = JSON-RPC; also non-TTY), bot commands, data commands.

## Tasks

1. `src/cli/tab-title.ts` — `setTabTitle()` fixed title + 2s re-emit keeper.
2. `src/cli/index.ts` — call `setTabTitle()` in 4 interactive actions.
3. `tests/tab-title.test.ts` — fixed title, re-emit, no-stack, non-TTY no-op.

## Verification

- `biome check src tests`, `tsc --noEmit`, vitest tab-title + CLI routing regression.
