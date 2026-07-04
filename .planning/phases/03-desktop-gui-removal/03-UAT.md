---
status: testing
phase: 03-desktop-gui-removal
source: [03-VERIFICATION.md]
started: 2026-07-04T08:17:56.000Z
updated: 2026-07-04T08:17:56.000Z
---

## Current Test

number: 1
name: Full QQ turn survives sidecar removal
expected: |
  With a configured QQ account, run `reasonix qq`, receive one inbound message, and confirm
  the HeadlessHost completes a turn — the model reply is dispatched via the channel's
  sendResponse. No `Cannot find module '../../desktop/...'` or sidecar ESM resolution errors.
  Repeat for WeChat (`reasonix weixin`) if a WeChat account is configured.
awaiting: user response

## Tests

### 1. Full QQ (and WeChat if configured) turn via HeadlessHost

expected: Inbound message -> HeadlessHost runs a CacheFirstLoop turn (stream → tool dispatch → fold) -> channel.sendResponse posts the model reply. No ESM resolution errors referencing deleted `src/desktop/*` or `commands/desktop.js`.
result: [pending]

### 2. Telegram full turn (acknowledged-deferred from Phase 2)

expected: With `TELEGRAM_BOT_TOKEN` set, `reasonix telegram` starts, receives a message, completes a turn, and sendResponse posts the reply. If no token is available, record as acknowledged-deferred (continues 02-VERIFICATION.md Acknowledged Gaps).
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
