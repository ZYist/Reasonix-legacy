---
phase: 08-critical-path-characterization
plan: 03
status: complete
completed: 2026-07-13
requirements: [TEST-04, TEST-05]
commits: [fa6aad07]
---
# Plan 08-03 Summary

Added deterministic offline characterization for Telegram and Weixin channel lifecycles without changing production code.

## Delivered

- Added fake-transport adapter tests for configured startup, Telegram command registration, authorized inbound forwarding with `[TG]` / `[WX]` markers, recoverable `bot_error` forwarding, fatal startup rejection, PID-lock release, transport stop, and explicit shutdown.
- Strengthened both standalone channel command suites to prove `SIGINT` / `SIGTERM` cleanup is idempotent and best-effort: gate bridges unsubscribe once, transport stop is attempted once, the headless host shuts down, and process exit remains single-shot even when stop rejects.
- Added `docs/channel-lifecycle-testing.md` as the offline/live verification contract, including isolation rules, sanitized evidence requirements, and separate Telegram and Weixin live-UAT checklists.
- Kept every automated boundary deterministic and offline: bot transports, credentials/config, PID/state files, headless host/model turns, process signals, and `process.exit` are fake or in-memory.

## Verification

- Focused Telegram/Weixin regression with retry disabled: 10 files, 47 tests passed.
- `npm run typecheck`: passed.
- Scoped Biome check for the four changed test files: passed.
- Commit hook `npm run lint`: passed (680 files checked).
- No real Telegram/Weixin request, model request, QR scan, credential, filesystem lock, or interactive TTY was used.

## Live UAT boundary

Live UAT was **not run**. Real BotFather/iLink credentials, Telegram polling and callbacks, Weixin QR scanning and session persistence, remote delivery, real network interruption/recovery, and operating-system signal behavior remain manual checks. The repository contract records those checks explicitly and does not infer a live pass from fake-transport tests.

No remote, push, upstream, tag, or release operation occurred.
