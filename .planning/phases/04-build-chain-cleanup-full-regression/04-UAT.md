---
status: testing
phase: 04-build-chain-cleanup-full-regression
source: [04-VERIFICATION.md]
started: 2026-07-05
updated: 2026-07-05
---

## Current Test

number: 1
name: Live Tier-3 chat/code/run turn with DEEPSEEK_API_KEY + interactive TTY
expected: |
  Single tool round-trip completes (read_file -> version or similar read-only path); cache-first loop + tool dispatch + telemetry proven end-to-end at UAT depth.
awaiting: user response

## Tests

### 1. Live Tier-3 chat/code/run turn with DEEPSEEK_API_KEY + interactive TTY
expected: Single tool round-trip completes (read_file -> version or similar read-only path); cache-first loop + tool dispatch + telemetry proven end-to-end. Needs interactive TTY for a supervised turn; the `run` live turn in 04-02 completed but the model misread the task (github_search_code) — a maintainer should confirm a cleaner read-only turn per the 01-02 read_file→version pattern.
result: [pending]

### 2. Live qq/telegram/weixin bot turn with real credentials
expected: Bot starts HeadlessHost, sends/receives at least one message via the channel gateway. TELEGRAM_BOT_TOKEN absent, QQ creds absent, WeChat needs interactive QR scan — non-interactive verify cannot exercise these channel gateways (Phase 2 acknowledged-deferred pattern, carried forward).
result: [pending]

### 3. Maintainer skim of trimmed .claude/CLAUDE.md for narrative coherence
expected: Trimmed CLAUDE.md reads as coherent project guidance (no dangling bullet fragments, no broken section flow). Automated greps prove stale refs are gone (Tauri/rusqlite/src/server/desktop/src-tauri/copy-dashboard-vendor-css/dashboard all = 0) and true refs survive (Node ≥22, copy-tree-sitter-grammars.mjs, CacheFirstLoop, simple-git-hooks, reasonix), but documentation-quality coherence is judgment-tier.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
