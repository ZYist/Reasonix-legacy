---
status: testing
phase: 02-bot-decoupling-to-standalone-cli
source: [02-VERIFICATION.md]
started: 2026-07-03T22:35:00Z
updated: 2026-07-03T22:35:00Z
---

# Phase 02 UAT — Bot Decoupling to Standalone CLI

Architecturally complete (8/8 must-haves verified in-source, 0 gaps). These are the
live-exchange UAT items the automated suite cannot drive — every phase-02 command test
stubs the channel transport, and the success criteria explicitly require 收发消息
(send/receive messages) against real chat networks.

## Current Test

number: 1
name: reasonix qq live QQ message exchange
expected: |
  Inbound QQ message -> host.runTurn -> assistant reply delivered back to the QQ chat;
  gate prompts (run_command / plan) surface as QQ messages and numeric replies resolve
  the gate.
awaiting: user response

## Tests

### 1. reasonix qq live QQ message exchange

Run `reasonix qq --workspace <path>` with valid QQ credentials and exchange messages
with a live QQ account.

expected: Inbound QQ message -> host.runTurn -> assistant reply delivered back to the QQ chat; gate prompts surface as QQ messages and numeric replies resolve the gate.
result: [pending]

### 2. reasonix telegram live exchange

Run `reasonix telegram --workspace <path>` with a TELEGRAM_BOT_TOKEN and send/receive a message.

expected: Inbound Telegram text -> host.runTurn -> reply posted back to the Telegram chat.
result: [pending]

### 3. reasonix weixin cold-start QR scan + live exchange

Run `reasonix weixin --workspace <path>` cold (no saved token) and complete the QR scan,
then exchange a message.

expected: QR rendered to stderr -> operator scans with WeChat -> credentials persisted -> WeixinChannel.start connects -> inbound WeChat text drives a turn and reply is posted back.
result: [pending]

### 4. reasonix desktop sidecar still launches (SC4)

Confirm `reasonix desktop` still launches the sidecar.

expected: desktopCommand starts without error (qqRuntime + src/desktop/qq-*.ts untouched per D-09); QQ-over-sidecar path still functional as the coexistence fallback.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

None blocking. Deferred code-review follow-ups (WR-01/03/04/05/06 + 6 infos) are tracked
in 02-VERIFICATION.md `followups_deferred` for a separate fix cycle. One security item
deserves human/security attention: WR-05 — raw `(err as Error).message` flows unfiltered
to stderr in all 3 command controllers; route stderr-bound error text through redaction
before writing.
