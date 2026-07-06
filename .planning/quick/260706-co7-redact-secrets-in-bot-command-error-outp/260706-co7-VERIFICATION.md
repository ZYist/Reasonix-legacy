---
phase: 260706-co7-redact-secrets-in-bot-command-error-output
verified: 2026-07-06T11:13:53+08:00
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Quick Task 260706-co7: Redact Secrets in Bot Command Error Output — Verification Report

**Task Goal:** Redact plaintext secrets (DeepSeek API key, Telegram bot token, QQ appSecret, Weixin token) from bot command error output before it reaches stderr logs OR the chat channel. Closes GitHub issue #1 / deferred SEC-WR-05. Close BOTH leak surfaces: (A) qq/telegram/weixin controllers writing raw `error.message` to stderr; (B) `host.ts` mirroring `errMessage` to stderr AND returning it into the chat via `channel.sendResponse`.
**Verified:** 2026-07-06T11:13:53+08:00
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

This is a P0 information-disclosure fix. Verification was goal-backward and evidence-first: every claim was checked against the actual source and against exercised runtime behavior (tests run in-process, not trusted from SUMMARY.md).

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | A loop/turn error embedding the DeepSeek key is returned to the chat channel with the key `[redacted]` (host.runTurn return scrubbed) | ✓ VERIFIED | `host.ts:170` sets `errMessage = formatHeadlessError(...)`; `host.ts:178` returns that same scrubbed `errMessage`. End-to-end test `runHostRunTurnReturnScrubCase` calls a real `HeadlessHost.runTurn` with a throwing loop and asserts the return carries no plaintext token and contains `[redacted]` — passed (ok 6). Bare-key form covered at the shared seam (ok 5). |
| 2 | A channel-send failure embedding a Telegram bot token in `api.telegram.org/bot<token>` URL form is written to stderr with the token `[redacted]` | ✓ VERIFIED | Pattern `/bot\d{5,}:[A-Za-z0-9_-]{20,}/g` in `event-redaction.ts:5,21`. Controllers wrap every `.sendFailed` stderr write. Live test stdout showed `POST https://api.telegram.org/[redacted]/sendMessage`. |
| 3 | QQ appSecret and Weixin token embedded in any bot-command error string are scrubbed on both stderr and any chat-bound path | ✓ VERIFIED | `collectBotSecrets` sources `loadQQConfig().appSecret` + `loadWeixinConfig().token` (`config.ts:1826-1839`); literal `replaceAll` at all 4 `.error`/`.sendFailed` sites per controller + host seam. `collectBotSecrets` test asserts both values collected (ok, env-isolated). |
| 4 | Existing `redactEventValue` (event-kernel public path) is byte-for-byte unchanged | ✓ VERIFIED | `git diff 9080bdec~1 9080bdec` shows only ADDITIONS (constants + `redactSecretsInText`); `redactEventValue`/`redactUnknown` bodies untouched. Regression guard test passes. Module remains import-free. |
| 5 | A benign, secret-free error message passes through unchanged (targeted, no over-redaction) | ✓ VERIFIED | `MIN_SECRET_LEN=8` guard (`event-redaction.ts:19`); tests assert `["", "short"]` and `[]` leave benign text identical — passed. |

**Score:** 5/5 truths verified (0 present-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/core/event-redaction.ts` | Pure `redactSecretsInText`; `redactEventValue` unchanged | ✓ VERIFIED | Function at :15-24, import-free, min-len guard + Telegram + Bearer patterns. |
| `src/config.ts` | `collectBotSecrets` sourcing 4 channel secrets from real loaders | ✓ VERIFIED | `:1826-1839`; loaders `loadApiKey`/`loadTelegramConfig`/`loadQQConfig`/`loadWeixinConfig` all present, len≥8 filter, `new Set` dedupe. |
| `src/cli/headless/host.ts` | Single-point scrub feeding both stderr + return | ✓ VERIFIED | `formatHeadlessError` :68-78; `runTurn` scrubs once at :170; stderr :171 + return :178 read the same variable. No channel-transport import. |
| `src/cli/commands/qq.ts` | 4 `.error`/`.sendFailed` sites wrapped | ✓ VERIFIED | Redaction at :81,:119,:128,:137; `botSecrets` snapshot :46. |
| `src/cli/commands/telegram.ts` | 4 sites wrapped | ✓ VERIFIED | Redaction at :84,:120,:129,:139; snapshot :49. |
| `src/cli/commands/weixin.ts` | 4 sites wrapped | ✓ VERIFIED | Redaction at :111,:147,:156,:166; snapshot :94 (placed after QR-login persist so a fresh token is covered). |
| `tests/event-redaction.test.ts` | Scrubber + collector + regression coverage | ✓ VERIFIED | 7 cases, all passing. |
| `tests/headless-host.test.ts` | Seam + end-to-end runTurn-return scrub | ✓ VERIFIED | 2 new cases registered in dual-mode `run()`; passing. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `config.ts collectBotSecrets()` | `redactSecretsInText` | Live secret VALUES (DeepSeek/Telegram/QQ/Weixin) | ✓ WIRED | `host.ts:140` passes `collectBotSecrets()`; controllers hoist `collectBotSecrets()` snapshot then pass to every wrap. |
| `host.runTurn onError` | `channel.sendResponse` (return) + stderr | `formatHeadlessError` → `redactSecretsInText` | ✓ WIRED | Single `errMessage` (`:170`) feeds both stderr (`:171`) and the `outcome==="error"` return (`:178`) — leak site B closed at one point. |
| `{qq,telegram,weixin}.ts` | `t("commands.X.error"/"sendFailed")` | `redactSecretsInText(raw, botSecrets)` | ✓ WIRED | All 4 sites per file wrapped; only `onInfo` banners left raw (out of scope). |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Both regression suites green | `npx vitest run tests/event-redaction.test.ts tests/headless-host.test.ts` | 2 files, 8 tests passed | ✓ PASS |
| runTurn return scrub (live) | (test stdout) | `POST https://api.telegram.org/[redacted]/sendMessage` | ✓ PASS |
| Required-param type enforcement | `npx tsc --noEmit` | exit 0 | ✓ PASS |
| i18n locale files untouched | `git diff --name-only 9080bdec~1 b36ba1ac -- 'src/i18n/**'` | 0 files | ✓ PASS |

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
| ----------- | ------ | ----------- | ------ | -------- |
| GH-1 | PLAN | Redact secrets in bot command error output (issue #1) | ✓ SATISFIED | Both leak surfaces A + B closed and tested. |
| SEC-WR-05 | PLAN | Deferred 02-SECURITY.md AR-06 | ✓ SATISFIED | Value + pattern scrubber wired at all five sites. |

### Anti-Patterns Found

None. No `TODO`/`FIXME`/`XXX`/`HACK`/`PLACEHOLDER` markers in the six modified source files. No stub returns, no empty handlers, no orphaned artifacts.

### Human Verification Required

None. All must-haves are programmatically verifiable (pure transformation, static wiring, passing behavioral tests with live runtime evidence). No visual/UX/external-service dependency.

### Gaps Summary

No gaps. The security guarantee is delivered by construction and confirmed by exercised behavior:

- **Leak site B (the critical path the original issue MISSED)** is genuinely closed: `host.runTurn` routes the classified error through a single `formatHeadlessError` → `redactSecretsInText` call, and the identical scrubbed `errMessage` variable feeds both the stderr mirror and the chat-bound return. The end-to-end test drives a real `HeadlessHost.runTurn` with a throwing loop and asserts the returned string is scrubbed — this passes.
- **Leak site A** is closed at all four `.error`/`.sendFailed` sites in each of qq/telegram/weixin, against a per-run `collectBotSecrets` snapshot.
- **The event-kernel invariant holds**: `redactEventValue` is byte-for-byte unchanged (git-diff confirmed additions-only) and the redactor module stays import-free.

**Observations (informational, non-blocking):**
1. The tests do not literally capture `process.stderr`; the bare-key form is asserted on the shared `formatHeadlessError` seam (which is the single source for both the stderr write and the return) rather than a second time on the return path. This is architecturally sound — `host.ts:170-178` makes stderr and the return read one identical scrubbed variable, so the two sinks cannot diverge. No security hole; a stderr-capture assertion would test the same string.
2. `onInfo` stderr writes (`qq.ts:140`, `weixin.ts:80,170` — QR login text / online banners) remain un-redacted. These are non-error, pre-auth/operator-facing UX strings, explicitly scoped out by the plan. Not part of the error-output leak surface addressed by this task.

---

_Verified: 2026-07-06T11:13:53+08:00_
_Verifier: Claude (gsd-verifier)_
