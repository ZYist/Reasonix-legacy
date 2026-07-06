---
quick: 260706-co7
subsystem: security
tags: [redaction, secrets, bot, telegram, qq, weixin, deepseek, information-disclosure]

provides:
  - Pure value-level secret scrubber redactSecretsInText (additive; redactEventValue untouched)
  - Config-side collectBotSecrets collector (DeepSeek key + Telegram/QQ/Weixin credentials)
  - Redaction wired at all five bot-command error leak sites (host return + stderr, three controllers)
affects: [bot channels, headless host, future channel-streaming work]

tech-stack:
  added: []
  patterns:
    - "Gather-then-scrub split: collectBotSecrets (config.ts) sources live values; redactSecretsInText (event-redaction.ts) stays import-free/pure"
    - "Required knownSecrets param forces every call site to supply secrets at compile time"

key-files:
  created:
    - tests/event-redaction.test.ts
  modified:
    - src/core/event-redaction.ts
    - src/config.ts
    - src/cli/headless/host.ts
    - src/cli/commands/qq.ts
    - src/cli/commands/telegram.ts
    - src/cli/commands/weixin.ts
    - tests/headless-host.test.ts

key-decisions:
  - "Weixin snapshots collectBotSecrets AFTER the mid-boot QR-login persist so a freshly scanned token is in the redaction set (Rule 2 deviation from the plan's after-bridgeEndpointEnv placement)"
  - "HeadlessHost hoists collectBotSecrets once at construction; runTurn reads the field (no per-turn config read)"
  - "Telegram bot-URL token caught by PATTERN (/bot\\d{5,}:.../) in addition to known-value replace, so grammy URL leaks are scrubbed even when the token is not in knownSecrets"

requirements-completed: [GH-1, SEC-WR-05]

coverage:
  - id: D1
    description: "Pure redactSecretsInText scrubs a Telegram bot-URL token, a known DeepSeek key, and Bearer credentials without over-redacting benign text"
    requirement: "SEC-WR-05"
    verification:
      - kind: unit
        ref: "tests/event-redaction.test.ts#redactSecretsInText"
        status: pass
    human_judgment: false
  - id: D2
    description: "collectBotSecrets sources the four channel secret values from config and drops sub-8-char values"
    requirement: "SEC-WR-05"
    verification:
      - kind: unit
        ref: "tests/event-redaction.test.ts#collectBotSecrets"
        status: pass
    human_judgment: false
  - id: D3
    description: "host.runTurn scrubs the single errMessage via formatHeadlessError before it reaches stderr AND before it is returned into the chat channel (leak site B)"
    requirement: "GH-1"
    verification:
      - kind: unit
        ref: "tests/headless-host.test.ts#formatHeadlessError scrubs the classified error string (both host sinks)"
        status: pass
      - kind: unit
        ref: "tests/headless-host.test.ts#HeadlessHost.runTurn scrubs the error it returns to the channel"
        status: pass
    human_judgment: false
  - id: D4
    description: "qq/telegram/weixin controllers wrap every .error/.sendFailed msg with redactSecretsInText against a per-run collectBotSecrets snapshot (leak site A)"
    requirement: "GH-1"
    verification:
      - kind: other
        ref: "grep redactSecretsInText src/cli/commands/{qq,telegram,weixin}.ts (5 each) + tsc required-param enforcement"
        status: pass
    human_judgment: false
  - id: D5
    description: "redactEventValue (event-kernel public path) and all five i18n locale files are byte-for-byte unchanged"
    verification:
      - kind: unit
        ref: "tests/event-redaction.test.ts#redactEventValue is unchanged (public event path regression guard)"
        status: pass
    human_judgment: false

duration: ~68min
completed: 2026-07-06
status: complete
---

# Quick Task 260706-co7: Redact Secrets in Bot Command Error Output Summary

**A DeepSeek key, Telegram bot token, QQ appSecret, or Weixin token embedded in a bot-command error is now stripped to `[redacted]` before it reaches stderr logs or a QQ/Telegram/WeChat chat, via a pure additive scrubber wired at all five leak sites — closing GitHub issue #1 / deferred SEC-WR-05.**

## Performance

- **Duration:** ~68 min (plan dispatch 09:39 → Task 2 commit 10:47, +08:00)
- **Tasks:** 2/2 complete
- **Files modified:** 8 (1 created, 7 modified)

## Accomplishments

- **`redactSecretsInText(text, knownSecrets)`** — a pure, import-free scrubber added to `src/core/event-redaction.ts`. Literal-replaces each known secret value (min length 8 guards against empty/short over-redaction), then strips Telegram bot-URL tokens (`/bot\d{5,}:[A-Za-z0-9_-]{20,}/g`) and `Bearer` credentials by pattern. `redactEventValue`/`redactUnknown` (the event-kernel path) left untouched.
- **`collectBotSecrets(path)`** — added to `src/config.ts`; gathers the live DeepSeek key + Telegram/QQ/Weixin credential values, de-duplicates, and drops sub-8-char values. Keeps the secret-gathering half in config so the pure redactor never imports config.
- **Leak site B (host):** `formatHeadlessError` added to `host.ts`; `runTurn` now scrubs the single `errMessage` before the stderr mirror AND the chat-bound return read it — one scrub point covers both sinks. `collectBotSecrets` hoisted once at construction.
- **Leak site A (controllers):** qq/telegram/weixin each hoist a `botSecrets` snapshot and wrap all four `.error`/`.sendFailed` `msg` values with `redactSecretsInText`. `onInfo` callbacks left untouched (out of scope).
- **Regression tests:** new `tests/event-redaction.test.ts` (7 cases) + two new `tests/headless-host.test.ts` cases (formatHeadlessError seam + end-to-end `runTurn` return scrub).

## Task Commits

1. **Task 1: Add redactSecretsInText scrubber + collectBotSecrets collector + regression test** — `9080bdec` (fix)
2. **Task 2: Wire redaction at all five leak sites + host-seam regression test** — `b36ba1ac` (fix)

_Docs/state commit handled by the orchestrator._

## Files Created/Modified

- `src/core/event-redaction.ts` (modified) — added `redactSecretsInText` + `MIN_SECRET_LEN`/pattern constants; `redactEventValue` unchanged.
- `src/config.ts` (modified) — added `collectBotSecrets` after `saveWeixinConfig`.
- `tests/event-redaction.test.ts` (created) — 7 cases covering scrubbing, collector, and the `redactEventValue` regression guard.
- `src/cli/headless/host.ts` (modified) — `formatHeadlessError` helper, `knownSecrets` field hoisted at construction, `runTurn` onError rewired.
- `src/cli/commands/qq.ts` / `telegram.ts` / `weixin.ts` (modified) — `botSecrets` snapshot + redaction at the four `.error`/`.sendFailed` sites each.
- `tests/headless-host.test.ts` (modified) — added the seam + end-to-end runTurn scrub cases (registered in the dual-mode `run()` array).

## Threat Mitigations (from plan STRIDE register)

| Threat | Disposition | How mitigated |
|--------|-------------|---------------|
| T-co7-01 (DeepSeek key → chat via host return) | mitigate | `formatHeadlessError`→`redactSecretsInText` scrubs `errMessage` before it is returned into the chat |
| T-co7-02 (grammy bot-token-in-URL → stderr) | mitigate | Telegram URL pattern + known-value replace on every `.sendFailed` stderr write |
| T-co7-03 (QQ appSecret / Weixin token in errors) | mitigate | `collectBotSecrets` sources live values; literal `replaceAll` scrubs at every site + host mirror; Weixin snapshots after QR login |
| T-co7-04 (over-redaction of benign diagnostics) | accept | Min-length guard + targeted value/pattern redaction; regression test asserts benign messages pass through unchanged |

## Decisions Made

- **Weixin snapshot placement (Rule 2 deviation):** the plan said hoist `collectBotSecrets` right after `bridgeEndpointEnv`. In `weixin.ts` the QR-login step obtains and persists a NEW token mid-boot; snapshotting before it would leave the freshly scanned Weixin token out of the redaction set for that run (exactly T-co7-03). Placed the snapshot AFTER the QR-login-and-persist block so the fresh token is covered. qq/telegram keep the after-`bridgeEndpointEnv` placement (no mid-boot credential mutation there).
- **Host snapshot at construction (hardening note #2):** `HeadlessHost` computes `collectBotSecrets()` once in `create()` and stores it; `runTurn` reads the field instead of re-reading config every turn.
- **Pattern + value redaction (hardening note #1):** the Telegram bot-URL token is caught by the regex pattern (not just known-value replace), and a direct end-to-end `HeadlessHost.runTurn` test asserts the RETURN value is scrubbed — guarding against a future refactor bypassing the `formatHeadlessError` seam.

## Deviations from Plan

### Auto-fixed / hardening

**1. [Rule 2 - Missing critical functionality] Weixin fresh-QR token not in redaction snapshot**
- **Found during:** Task 2 (wiring weixin.ts)
- **Issue:** Plan's "snapshot after `bridgeEndpointEnv`" placement runs BEFORE weixin's mid-boot QR login persists a new token, so a freshly scanned token would not be redacted for that run.
- **Fix:** Hoisted `const botSecrets = collectBotSecrets();` AFTER the QR-login/`saveWeixinConfig` block in `weixin.ts` only.
- **Verification:** tsc clean; audit confirms `redactSecretsInText` wraps all four sites.
- **Committed in:** `b36ba1ac`

**2. [Hardening notes #1 + #2] Folded in as instructed** — direct end-to-end `runTurn` return-scrub assertion added; `collectBotSecrets` hoisted to host construction. Hardening note #3 (channel-internal raw logging) left out of scope as instructed.

**Total deviations:** 1 Rule-2 auto-fix + 2 hardening notes folded in. **Impact:** all necessary for the security goal; no scope creep.

## Issues Encountered

- **Pre-existing (out of scope): `node --import tsx tests/headless-host.test.ts` dual-mode self-exec fails.** The file header claims dual-mode support, but a minimal 2-line probe (`import { expect } from "vitest"`) run under `node --import tsx` fails identically at vitest's `createExpect` module init. Root cause is the top-level `import ... from "vitest"` (present at HEAD, unchanged by this task); modern vitest throws when its runtime module is imported outside the vitest runner. The 3-leg proof: (1) minimal probe reproduces the exact stack, (2) the vitest import predates my changes, (3) my additions only touch case functions + a host.js import. The real gate — `npx vitest run tests/headless-host.test.ts` — passes all 6 cases (including the 2 new ones). Not fixed here (unrelated to the security fix; would risk the test registration stabilized in prior milestone work).

## Verification

- `npx vitest run tests/event-redaction.test.ts tests/headless-host.test.ts` — 8 tests green (7 + 1 dual-mode aggregate; 6 headless cases incl. the 2 new scrub cases).
- `npx tsc --noEmit` — exit 0 (required `knownSecrets` param compiled at every call site).
- `npm run lint` (biome check src tests) — exit 0; only the ONE pre-existing acceptable warning at `tests/hydrate-cards.test.ts:135` (issue #3), no new lint issues.
- Manual audit: `redactSecretsInText` present in host.ts (2) + qq/telegram/weixin.ts (5 each); no `src/i18n/` file touched; `redactEventValue` unchanged.

## Next Readiness

- P0 information-disclosure fix complete on `dev`; `v1` untouched. Both leak surfaces (host return→chat, controller stderr) closed with regression coverage.
- Adjacent gap unchanged: weixin "no internal feedback" (shared HeadlessHost does not stream reasoning/tool events to chat) remains a separate acknowledged-deferred feature gap, not touched here.

---
*Quick task: 260706-co7*
*Completed: 2026-07-06*

## Self-Check: PASSED

- All 8 source/test files present on disk; SUMMARY.md written.
- Both task commits verified in git history: `9080bdec` (Task 1), `b36ba1ac` (Task 2).
