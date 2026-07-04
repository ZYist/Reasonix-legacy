---
phase: 03-desktop-gui-removal
verified: 2026-07-04T16:20:00Z
status: passed
score: 26/27 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: N/A
  gaps_closed: []
  gaps_remaining: []
  regressions: []
behavior_unverified_items:

  - truth: "Three channel public methods (start/sendResponse/stop) still drive one full turn via HeadlessHost after sidecar removal"
    test: "With a configured QQ (or WeChat) account, run `reasonix qq` (or `weixin`), receive one inbound message, confirm the HeadlessHost runs a turn and the channel's sendResponse posts the reply. Repeat for Telegram if TELEGRAM_BOT_TOKEN is available."
    expected: "A full bot turn completes end-to-end (inbound -> HeadlessHost -> loop -> tool dispatch -> sendResponse outbound) with no `Cannot find module '../../desktop/...'` or sidecar-related ESM errors."
    why_human: "Signatures are unchanged and --help smoke passes, but a full turn is a runtime state transition (channel.start -> turn driver -> sendResponse) that no passing test in this phase exercises. tests/headless-host.test.ts and tests/headless-gate-bridges.test.ts exist but are in the documented pre-existing-red set (Phase 1/2 latent debt) and cannot serve as behavioral evidence. Phase 2 UAT historically covered this, but it is not re-run this phase. Preservation-by-construction (signatures unchanged + deletion of orphan sidecar only) makes regression low-risk, but presence checks cannot see a turn complete."
human_verification:

  - test: "Drive one full QQ turn via `reasonix qq` (and one WeChat turn via `reasonix weixin` if configured) to confirm send/recv survives the sidecar removal."
    expected: "Inbound message -> HeadlessHost runs a CacheFirstLoop turn -> channel.sendResponse posts the model reply. No ESM resolution errors referencing deleted src/desktop/* or commands/desktop.js."
    why_human: "Full-turn behavior is a state transition; the only named tests (headless-host, headless-gate-bridges) are pre-existing-red and excluded by scope. Signatures unchanged + Phase 2 UAT provide preservation-by-construction, not this-phase behavioral proof."

  - test: "With TELEGRAM_BOT_TOKEN set, run `reasonix telegram` and drive one full turn."
    expected: "Telegram bot starts, receives a message, completes a turn, and sendResponse posts the reply."
    why_human: "Acknowledged-deferred from Phase 2 (no token in env). Carried forward per 02-VERIFICATION.md Acknowledged Gaps; cannot run without a live Telegram token."
---

# Phase 03: Desktop GUI Removal — Verification Report

**Phase Goal:** As a CLI user, I want to run `reasonix qq`/`telegram`/`weixin` and the core CLI commands (`chat`/`code`/`run`/`acp`) in an environment with NO Tauri desktop app and NO sidecar shell code, so that bot integration and the CLI core no longer carry the retired desktop GUI build burden, and old `reasonix desktop` users get a clear migration message instead of a silent failure.

**Verified:** 2026-07-04T16:20:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

The phase goal IS achieved at the structural level: the desktop Tauri app and sidecar shell are physically gone, `reasonix desktop` is retired to a stub that emits the migration message and exits non-zero, the three bot channels and core CLI commands start cleanly with no ESM resolution failures, and typecheck/build/lint are green. The only behavior-dependent claim that automated checks cannot close — that a full bot turn still completes end-to-end via HeadlessHost — is routed to human verification (signatures unchanged + Phase 2 UAT provide preservation-by-construction; this phase did not re-run a live turn).

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `desktop/` Tauri app dir removed | ✓ VERIFIED | `test ! -d desktop` PASS |
| 2 | `src/cli/commands/desktop.ts` (3555-line sidecar god module) removed | ✓ VERIFIED | `test ! -f src/cli/commands/desktop.ts` PASS |
| 3 | `src/desktop/` helper dir (6 sidecar modules) removed | ✓ VERIFIED | `test ! -d src/desktop` PASS; `ls src/desktop/` returns none |
| 4 | 23 `tests/desktop-*.test.ts(x)` removed | ✓ VERIFIED | `ls tests/desktop-*.test.ts* \| wc -l` = 0 |
| 5 | `tests/theme-tokens.test.ts` refactored to CLI-only (FAILING→PASSING) | ✓ VERIFIED | 0 dashboard/desktop theme imports; `npx vitest run tests/theme-tokens.test.ts` → 8 tests pass, exit 0 |
| 6 | `tests/markdown-codeblock-lang.test.tsx` deleted | ✓ VERIFIED | `test ! -f` PASS |
| 7 | `tests/code-block-ligatures.test.ts` deleted | ✓ VERIFIED | `test ! -f` PASS |
| 8 | `tests/user-message-newlines.test.ts` deleted | ✓ VERIFIED | `test ! -f` PASS |
| 9 | `tests/installer-nsh-no-placeholders.test.ts` deleted | ✓ VERIFIED | `test ! -f` PASS |
| 10 | 5 surviving tests form the complete set (no 6th) | ✓ VERIFIED | exhaustive structural grep below returns 0 runtime refs |
| 11 | `reasonix desktop` retired: no sidecar/NDJSON-RPC flow; prints migration text + non-zero exit | ✓ VERIFIED (behavioral) | `node dist/cli/index.js desktop` → prints zh-CN migration text naming qq/telegram/weixin, exit 1; stub has no stdin read, no `.option()`, no dynamic import |
| 12 | `src/cli/index.ts` has no `await import("./commands/desktop.js")` | ✓ VERIFIED | grep count = 0 |
| 13 | `src/cli/index.ts` has no `desktopCommand` reference | ✓ VERIFIED | grep count = 0 |
| 14 | New i18n key `commands.desktop.retired` in types.ts + 5 locales | ✓ VERIFIED | `desktop: { retired: ... }` present in types.ts:1060 + EN:2145, JA:2206, de:2107, zh-CN:2027, ru:646; all text points to qq/telegram/weixin |
| 15 | `app.sidecarHint` purged from types.ts + locales; LIVE events.ts call removed | ✓ VERIFIED | `grep -c sidecarHint src/i18n/types.ts` = 0; `grep -c app.sidecarHint src/cli/commands/events.ts` = 0; events.ts empty-events branch still exits 1 with noEventsFor + lookedAtFile |
| 16 | `reasonix qq`/`telegram`/`weixin` startable, no sidecar ESM errors | ✓ VERIFIED (smoke) | all three `--help` exit 0, no `Cannot find module` errors |
| 17 | Three channels drive a full turn via HeadlessHost (start/sendResponse/stop) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | signatures unchanged (qq/channel.ts: refreshAccessConfig:176, describeAccess:180, start:192, sendResponse:248, stop:289; telegram/bot.ts: start:144, stop:162; weixin/bot.ts: start:356, stop:362) + Phase 2 UAT historical; no passing full-turn test this phase (headless-* tests are pre-existing-red). See Human Verification. |
| 18 | `src/cli/headless/` + three channel protocol layers signatures unchanged | ✓ VERIFIED | git diff across 2a2c1518..75fa1a5f shows NO modifications to src/qq/, src/telegram/, src/weixin/, src/cli/headless/ |
| 19 | `reasonix chat`/`code`/`run`/`acp` unaffected | ✓ VERIFIED (smoke) | all four `--help` exit 0 |
| 20 | `npm run typecheck` exit 0 | ✓ VERIFIED | exit 0 (TranslationSchema 5-locale key parity holds) |
| 21 | `npm run build` exit 0 + `dist/cli/index.js` exists | ✓ VERIFIED | exit 0; tsup noExternal bundle intact after dynamic-import removal; dist/cli/index.js present |
| 22 | `npm run lint` exit 0 | ✓ VERIFIED | exit 0 (1 pre-existing warning in tests/hydrate-cards.test.ts, documented, not caused by this phase) |
| 23 | SCOPED gate: structural grep (5 runtime shapes) = 0 hits | ✓ VERIFIED | import shapes: 0; readFileSync shapes: 0; login-shell-path/memory-browser consumers: 0 |
| 24 | SCOPED gate: theme-tokens scoped vitest exit 0 | ✓ VERIFIED | 8 tests pass |
| 25 | SCOPED gate: 4 deleted-file confirmations | ✓ VERIFIED | all 4 `test ! -f` PASS |
| 26 | Red lines intact: tree-sitter grammars script + src/code-query/ + src/cli/headless/ | ✓ VERIFIED | all three `test -f`/`test -d` PASS |
| 27 | D-03 boundary: no Phase 4 build-chain trim touched | ✓ VERIFIED | root package.json NOT modified (only nested desktop/package.json deleted with the dir); no release.yml/ci.yml/CLAUDE.md/tsup.config.ts changes in the code commits |

**Score:** 26/27 truths verified (1 present, behavior-unverified)

Note on SC2 wording: ROADMAP SC2 literally reads "Commander 不再注册该命令" (no longer registers the command), but the LOCKED CONTEXT decision D-04 explicitly overrides this with a thin retirement stub (keep Commander registration, action prints migration text + `process.exit(1)`, no options, no stdin, no NDJSON-RPC). The user's verification directive and PLAN re-interpret SC2 as "retired to stub". The stub satisfies the spirit of SC2: the desktop flow is gone, the user gets a clear migration message, and the process exits non-zero. Truth #11 reflects the D-04 interpretation and is VERIFIED.

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `desktop/` dir | deleted | ✓ VERIFIED | `test ! -d desktop` PASS |
| `src/cli/commands/desktop.ts` | deleted | ✓ VERIFIED | `test ! -f` PASS |
| `src/desktop/` dir (6 files) | deleted | ✓ VERIFIED | `test ! -d` PASS |
| 23 `tests/desktop-*.test.ts(x)` | deleted | ✓ VERIFIED | 0 remain |
| 4 surviving tests (markdown/code-block/user-message/installer-nsh) | deleted | ✓ VERIFIED | all `test ! -f` PASS |
| `tests/theme-tokens.test.ts` | refactored CLI-only | ✓ VERIFIED | 0 dashboard/desktop theme imports; 8 tests pass |
| `src/cli/index.ts` desktop block | replaced with D-04 stub | ✓ VERIFIED | lines 349-356: `.command("desktop").description(...).action(() => { console.error(t("commands.desktop.retired")); process.exit(1); })` |
| `src/i18n/types.ts` | +desktop.retired, -sidecarHint | ✓ VERIFIED | desktop: { retired } at :1060; sidecarHint purged |
| 5 locale files | +desktop.retired, -sidecarHint (where present) | ✓ VERIFIED | all 5 locales have desktop.retired; EN/JA/de/zh-CN purged sidecarHint (ru never had it) |
| `src/cli/commands/events.ts` | LIVE app.sidecarHint call removed | ✓ VERIFIED | grep = 0; empty-events branch still exits 1 |
| `dist/cli/index.js` | build product exists | ✓ VERIFIED | produced by `npm run build` |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/cli/index.ts` desktop stub | i18n types.ts → 5 locales | `t("commands.desktop.retired")` | ✓ WIRED | call site at cli/index.ts:353; key present in types.ts + all 5 locales; no dangling i18n refs |
| tsup CLI bundle | (post-deletion) | `noExternal: [/.*/]` esbuild graph | ✓ WIRED | `npm run build` exit 0; dynamic import removed; no dangling-import failure |
| `reasonix qq`/`telegram`/`weixin` | HeadlessHost → channel protocol | module assembly path | ✓ WIRED | all three `--help` exit 0, no `Cannot find module '../../desktop/...'` |
| Negative link: tree-sitter + code-query | (must NOT be in deletion list) | not in git rm set | ✓ WIRED | both present post-phase |
| Structural grep link (5 runtime shapes) | src/ + tests/ | import + readFileSync patterns | ✓ WIRED | 0 hits across all 5 shapes |

### Data-Flow Trace (Level 4)

Not applicable. This phase is a pure removal + retirement-stub phase; no artifact renders dynamic data from a data source. The retirement stub emits a static i18n string (data source = locale file, produces real text — verified by smoke output).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| desktop stub prints migration text + non-zero exit | `node dist/cli/index.js desktop` | prints "`reasonix desktop` 已下线...qq...telegram...weixin", exit 1 | ✓ PASS |
| qq --help, no ESM error | `node dist/cli/index.js qq --help` | exit 0, prints usage | ✓ PASS |
| telegram --help, no ESM error | `node dist/cli/index.js telegram --help` | exit 0, prints usage | ✓ PASS |
| weixin --help, no ESM error | `node dist/cli/index.js weixin --help` | exit 0, prints usage | ✓ PASS |
| chat --help | `node dist/cli/index.js chat --help` | exit 0 | ✓ PASS |
| code --help | `node dist/cli/index.js code --help` | exit 0 | ✓ PASS |
| run --help | `node dist/cli/index.js run --help` | exit 0 | ✓ PASS |
| acp --help | `node dist/cli/index.js acp --help` | exit 0 | ✓ PASS |
| typecheck green | `npm run typecheck` | exit 0 | ✓ PASS |
| build green | `npm run build` | exit 0, dist/cli/index.js produced | ✓ PASS |
| lint green | `npm run lint` | exit 0 (1 pre-existing warning) | ✓ PASS |
| scoped vitest | `npx vitest run tests/theme-tokens.test.ts` | 8 tests pass, exit 0 | ✓ PASS |
| Full bot turn via HeadlessHost | (requires live channel config / token) | not run this phase | ? SKIP → Human Verification |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes declared in the PLAN for this phase; the SCOPED gate (structural grep + scoped vitest + deleted-file confirmations) serves the equivalent role and was executed above. Step 7c: SKIPPED (no probe scripts declared).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| PANEL-02 | 03-01-PLAN.md | `desktop/` (Tauri app) and desktop sidecar shell removed; `reasonix desktop` subcommand decommissioned | ✓ SATISFIED | desktop/ + src/desktop/ + desktop.ts physically removed (Truths 1-3); reasonix desktop retired to migration stub + non-zero exit (Truth 11, behavioral); bots + CLI core verified non-regressed at smoke level (Truths 16, 19); three-piece suite green (Truths 20-22). PANEL-02 marked Complete in REQUIREMENTS.md. |

REQUIREMENTS.md traceability table shows `PANEL-02 | Phase 3 | Complete`. No orphaned requirements for Phase 3.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| src/cli/headless/host.ts | 3, 65, 85 | stale prose citations to deleted `src/cli/commands/desktop.ts:1374-1397` (and `:1315`) | ℹ️ Info (drift baseline) | CLAUDE.md bans stale/misleading comments. Collateral from this phase's deletion. Documented in SUMMARY drift baseline + REVIEW IN-01. Not a runtime issue; Phase 4 cleanup. |
| tests/headless-gate-bridges.test.ts | 226 | stale prose citation to `desktop.ts:1939-1985` | ℹ️ Info (drift baseline) | same as above |
| tests/mention-parent-entry.test.ts | 5 | stale prose citation to `desktop/src/ui/composer.tsx` | ℹ️ Info (drift baseline) | same as above |
| src/cli/index.ts | 351 | `.description("removed — use ...")` is hardcoded English, not `t()`-localized (WR-01) | ⚠️ Warning | CLAUDE.md mandates user-visible strings go through `t()`. The retired *action* message IS localized; only the `.description()` shown in `--help` is raw English. Minor localization regression for zh-CN/JA/de/ru users. Does not block goal. Documented in REVIEW WR-01. |
| src/cli/index.ts | 349-355 | no regression test for the retirement stub (IN-02) | ℹ️ Info | Stub is 3 lines; manual spot-check in this verification covers behavior (exit 1 + migration text). No automated guard against future regression. Optional one-liner smoke test suggested in REVIEW. |

No unreferenced TBD/FIXME/XXX debt markers in any modified source file (grep scan clean). The pre-existing Biome warning in `tests/hydrate-cards.test.ts` is out of scope (documented, not caused by this phase).

### Human Verification Required

1. **Full QQ turn after sidecar removal** — With a configured QQ account, run `reasonix qq`, receive one inbound message, and confirm the HeadlessHost completes a turn (model reply dispatched via channel.sendResponse). Repeat for WeChat (`reasonix weixin`) if configured.
   - **Expected:** Inbound → HeadlessHost → CacheFirstLoop turn → sendResponse posts the reply. No `Cannot find module '../../desktop/...'` or sidecar ESM errors.
   - **Why human:** Full-turn behavior is a runtime state transition; the only named tests (headless-host, headless-gate-bridges) are in the pre-existing-red set and excluded by documented scope. Signatures unchanged + Phase 2 UAT provide preservation-by-construction; this phase did not re-run a live turn.

2. **Telegram full turn (acknowledged-deferred)** — With `TELEGRAM_BOT_TOKEN` set, run `reasonix telegram` and drive one full turn.
   - **Expected:** Telegram bot starts, receives a message, completes a turn, sendResponse posts the reply.
   - **Why human:** Acknowledged-deferred from Phase 2 (no token in env). Cannot run without a live Telegram token.

### Gaps Summary

No gaps block the phase goal. All structural deletions, the retirement stub, i18n synchronization, red-line preservation, D-03 boundary, three-piece suite, and scoped gate are verified. PANEL-02 is satisfied and marked Complete in REQUIREMENTS.md.

The single behavior-unverified truth (full bot turn via HeadlessHost) is routed to human verification rather than marked FAILED because: (a) the sidecar was an orphan with no HeadlessHost之外的消费者 (Phase 2 D-09 共存契约 confirmed); (b) all public method signatures are byte-for-byte unchanged (git diff confirms src/qq/, src/telegram/, src/weixin/, src/cli/headless/ untouched); (c) Phase 2 UAT historically exercised the full turn. The phase correctly narrowed its automated scope to typecheck/build/lint + structural grep + the one survivor scoped vitest, leaving full-suite green-up to Phase 4 SAFE-03 (pre-existing-red is explicitly out of scope per the PLAN scope_note).

Two lower-severity notes from the code review (WR-01 hardcoded English description; IN-01 stale comment citations) are documented for Phase 4 cleanup and do not affect goal achievement.

## Acknowledged Gaps

Deferred UAT accepted by the developer on 2026-07-04 (explicit authorization during `/gsd-verify-work 03` completion gate — same item, same disposition as Phase 2):

- **Test 2 — `reasonix telegram` full turn [DEFERRED]:** Not exercised against a live Telegram long-poll endpoint this cycle (no `TELEGRAM_BOT_TOKEN` / live bot configured at verification time; carried forward verbatim from `02-VERIFICATION.md` Acknowledged Gaps). The architectural claim this test guards — "three channel public methods (start/sendResponse/stop) still drive one full turn via HeadlessHost after sidecar removal" — IS behaviorally verified this phase via QQ (Test 1: inbound → HeadlessHost → CacheFirstLoop turn → sendResponse posts the model reply, no ESM errors). The Telegram-specific path differs only in transport (botToken long-poll vs QQ WebSocket / WeChat HTTP), owned by `src/telegram/bot.ts`, which VERIFICATION Truth #18 confirms is byte-unchanged this phase (git diff 2a2c1518..75fa1a5f shows NO modifications to src/telegram/, src/qq/, src/weixin/, src/cli/headless/). The live Telegram round-trip remains a deferred UAT item to confirm before the next milestone boundary; it is not a code defect and not a Phase 3 regression.

This deferred item is the sole reason `phase uat-passed --require-verification` reports `passed: false` (blocker: `03-UAT.md: test 2 (skipped)`). UAT (1 pass / 0 issues), verification (26/27 truths + canonicalized `status: passed`), and security (`threats_open: 0`, 03-SECURITY.md verified) gates are otherwise fully satisfied, and the developer authorized advancing the phase with this single UAT item deferred — consistent with the Phase 2 precedent for the identical item.

---

_Verified: 2026-07-04T16:20:00Z_
_Verifier: Claude (gsd-verifier)_
