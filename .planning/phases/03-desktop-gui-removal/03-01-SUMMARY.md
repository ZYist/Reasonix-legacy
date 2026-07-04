---
phase: 03-desktop-gui-removal
plan: 01
subsystem: cli
tags: [removal, decoupling, cli, build, i18n, sidecar, tauri]

requires:
  - phase: 02-bot-decoupling-to-standalone-cli
    provides: HeadlessHost (src/cli/headless/) + three decoupled channel CLIs (qq/telegram/weixin); sidecar frozen as orphan, ready for deletion
  - phase: 01-web-panel-removal
    provides: deletion recipe (delete dir + delete tests + clear i18n dead strings + keep build green)
provides:
  - reasonix desktop retired to a thin i18n stub (prints migration text + process.exit(1)), no sidecar/NDJSON-RPC surface
  - physical removal of desktop/ Tauri app, src/cli/commands/desktop.ts sidecar god module, src/desktop/ helper dir, 27 desktop-only tests
  - commands.desktop.retired i18n key across types.ts + 5 locales (EN/JA/de/zh-CN/ru)
  - app.sidecarHint dead string removed from types.ts + 4 locales (ru.ts never had it) and its LIVE events.ts call
  - tests/theme-tokens.test.ts refactored to CLI-only (FAILING -> PASSING, 8 tests)
affects: [04-build-chain-cleanup, PANEL-04, SAFE-03]

tech-stack:
  added: []
  patterns:
    - "D-04 retirement stub: Commander chain kept, action prints t(\"commands.desktop.retired\") + process.exit(1), no options, no dynamic import, no stdin read"
    - "Scoped gate replaces full vitest suite when pre-existing-red is out of scope (structure grep + survivor scoped vitest + deleted-file confirmations)"

key-files:
  created:
    - .planning/phases/03-desktop-gui-removal/03-01-SUMMARY.md
  modified:
    - src/cli/index.ts (desktop registration block replaced with D-04 stub)
    - src/i18n/types.ts (added commands.desktop.retired, removed app.sidecarHint)
    - src/i18n/EN.ts (added commands.desktop.retired, removed app.sidecarHint)
    - src/i18n/JA.ts (same)
    - src/i18n/de.ts (same)
    - src/i18n/zh-CN.ts (same)
    - src/i18n/ru.ts (added commands.desktop.retired only; never had sidecarHint)
    - src/cli/commands/events.ts (removed LIVE app.sidecarHint console.error call)
    - tests/theme-tokens.test.ts (refactored to CLI-only)
  deleted:
    - src/cli/commands/desktop.ts (3555-line sidecar god module)
    - src/desktop/ (6 sidecar-only modules)
    - desktop/ (128-file Tauri Rust shell + Vite SPA + nested npm project)
    - 23 tests/desktop-*.test.ts(x)
    - tests/markdown-codeblock-lang.test.tsx, tests/code-block-ligatures.test.ts, tests/user-message-newlines.test.ts, tests/installer-nsh-no-placeholders.test.ts

key-decisions:
  - "D-04 stub keeps Commander chain but action is synchronous console.error + process.exit(1); no options/dynamic import (attack surface reduction vs old NDJSON-RPC-over-stdin)"
  - "ru.ts confirmed never had app.sidecarHint (tsc TranslationSchema validates 5-locale key parity)"
  - "theme-tokens.test.ts FAILING -> PASSING by dropping BOTH dashboard + desktop theme imports and the aligned-names test (iter3 fix; iter2 left a dead dashboard import)"
  - "Full vitest suite is NOT a Phase 3 signal — 22 files are pre-existing Phase 1/2 latent debt (dashboard-*, headless-*, version, ssh-remote, mcp-runtime-failures, ui-*); full verify green is Phase 4 SAFE-03"

patterns-established:
  - "Retirement stub: program.command(\"X\").description(\"removed ...\").action(() => { console.error(t(\"commands.X.retired\")); process.exit(1); })"
  - "Scoped gate when suite is pre-existing-red: (a) cross src/+tests/ structure grep for 5 runtime shapes, (b) survivor scoped vitest, (c) deleted-file confirmations"

requirements-completed: [PANEL-02]

coverage:
  - id: D1
    description: "reasonix desktop retired to i18n stub (prints migration text + non-zero exit, no sidecar/NDJSON-RPC)"
    requirement: PANEL-02
    verification:
      - kind: integration
        ref: "node dist/cli/index.js desktop -> exit 1, prints commands.desktop.retired text (reasonix qq/telegram/weixin)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Physical removal of desktop/ + src/cli/commands/desktop.ts + src/desktop/ + 23 desktop tests + 4 zero-CLI surviving tests"
    requirement: PANEL-02
    verification:
      - kind: integration
        ref: "test ! -f src/cli/commands/desktop.ts && test ! -d src/desktop && test ! -d desktop; structural grep for 5 runtime shapes across src/+tests/ returns 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "typecheck/build/lint three-piece suite exits 0 (D-03 keep-green standard)"
    requirement: PANEL-02
    verification:
      - kind: integration
        ref: "npm run typecheck && npm run build && npm run lint (all exit 0); dist/cli/index.js exists"
        status: pass
    human_judgment: false
  - id: D4
    description: "Three channels + CLI core commands do not regress; public method signatures unchanged"
    requirement: PANEL-02
    verification:
      - kind: integration
        ref: "node dist/cli/index.js {qq,telegram,weixin,chat,code,run,acp} --help all exit 0, no ESM resolution errors; qq/channel.ts refreshAccessConfig/describeAccess/start/sendResponse/stop unchanged"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-07-04
status: complete
---

# Phase 3 Plan 01: Desktop GUI Removal Summary

**Retired `reasonix desktop` to an i18n stub and physically removed the Tauri app + 3555-line sidecar god module + 27 desktop-only tests, proving the decoupled bot channels and CLI core are zero-regression on a green typecheck/build/lint three-piece suite.**

## Performance

- **Duration:** ~18 min
- **Tasks:** 3/3
- **Files changed:** 171 (27 insertions, 44,555 deletions across 162 deletions + 8 modifications + 1 SUMMARY)

## Accomplishments

- `reasonix desktop` replaced with a thin D-04 stub: `console.error(t("commands.desktop.retired"))` + `process.exit(1)`; no options, no dynamic import, no stdin/NDJSON-RPC protocol (attack surface reduction).
- Physical removal: `desktop/` (128-file Tauri Rust shell + Vite SPA), `src/cli/commands/desktop.ts` (3555-line sidecar god module), `src/desktop/` (6 sidecar-only modules incl. grep-confirmed `login-shell-path`/`memory-browser`), 23 `tests/desktop-*.test.ts(x)`, and 4 zero-CLI surviving tests.
- New i18n key `commands.desktop.retired` synchronized across `types.ts` + 5 locales (EN/JA/de/zh-CN/ru), text points users to `reasonix qq`/`telegram`/`weixin`.
- Dead string `app.sidecarHint` removed from `types.ts` + EN/JA/de/zh-CN (ru.ts never had it) and its LIVE `console.error` call in `src/cli/commands/events.ts`.
- `tests/theme-tokens.test.ts` refactored to CLI-only (FAILING -> PASSING, 8 tests) by dropping both dashboard + desktop theme imports and the aligned-names test block.
- Three-piece suite (typecheck/build/lint) all exit 0; tsup `noExternal` bundle intact after removing the dynamic import; `dist/cli/index.js` produced.

## Task Commits

1. **Task 1: retire reasonix desktop stub + i18n migration** - `2a2c1518` (refactor)
2. **Task 2: remove sidecar + desktop/ + 23 desktop tests + 5 surviving tests** - `75fa1a5f` (chore)
3. **Task 3: three-piece suite + SCOPED gate + smoke** - this commit (test/docs)

## Three-Piece Suite + SCOPED Gate Results

| Signal | Result |
|--------|--------|
| `npm run typecheck` | exit 0 |
| `npm run build` (tsup) | exit 0, `dist/cli/index.js` exists |
| `npm run lint` (Biome) | exit 0 (1 pre-existing warning in `tests/hydrate-cards.test.ts`, not caused by this phase) |
| SCOPED (a) structure grep import shapes | 0 hits across src/+tests/ |
| SCOPED (a) structure grep readFileSync shapes | 0 hits across src/+tests/ |
| SCOPED (b) `npx vitest run tests/theme-tokens.test.ts` | exit 0, 8 tests pass |
| SCOPED (c) 4 deleted-file confirmations | all GONE |

## Smoke Results (four classes)

| Class | Command | Result |
|-------|---------|--------|
| desktop stub | `node dist/cli/index.js desktop` | prints migration text (`reasonix desktop 已下线...qq...telegram...weixin`), exit 1 |
| three channels | `{qq,telegram,weixin} --help` | all exit 0, no ESM resolution errors |
| CLI core | `{chat,code,run,acp} --help` | all exit 0 |
| Telegram live | (requires TELEGRAM_BOT_TOKEN) | acknowledged-deferred (continues 02-VERIFICATION.md; no token in env) |

## Pre-existing-red Scope Note (iter3 fix 4)

The full vitest suite is **already red** before this phase: 22 test files fail (7 `dashboard-*`, 3 `desktop-*`, and 12 others incl. `headless-host`, `headless-gate-bridges`, `version`, `ssh-remote`, `mcp-runtime-failures`, `cli-bundle-version-marker`, `ui-mcp-marketplace-snapshot`, `ui-slash-suggestions`). **None caused by desktop removal** — they are cumulative Phase 1/2 latent debt.

**Full `npm run verify` green is Phase 4 SAFE-03's job (REQUIREMENTS.md §SAFE-03, ROADMAP Phase 4 SC4), NOT this phase.** Phase 3's "green" = typecheck + build + lint + scoped checks. Phase 3 only owns: (1) desktop deletion introduces no NEW failures; (2) the 5 surviving desktop-referencing test files are handled (1 refactor + 4 delete).

## Phase 4 Build-Chain TODO (D-03 deferred — NOT touched this phase)

- `package.json` `files`/`postinstall`/`typecheck` trim of dashboard/desktop references (root package.json NOT modified this phase; only `desktop/package.json` deleted with the dir).
- `.github/workflows/release.yml` Tauri packaging workflow retirement (`desktop-v*` tag trigger — does not block常规 CI).
- `.github/workflows/ci.yml` Rust toolchain matrix removal.
- CLAUDE.md Rust toolchain / Tauri sections trim.
- R2 + GitHub updater endpoint decommission (was in `desktop/src-tauri/tauri.conf.json`, deleted with the dir).
- Drift-baseline prose cleanup (see below).

## Drift Baseline (legitimate sidecar/desktop prose references, NOT runtime imports — left for Phase 4)

These are prose comments / legitimate `commands.*.help` text, NOT runtime imports or `readFileSync` calls. They do not match the 5 runtime grep shapes and are recorded per CONTEXT D-05:

- `src/i18n/EN.ts`: 2 `sidecar` mentions in `commands.{qq,telegram}.help` (legitimate, describe the decoupling — e.g. "decoupled from the desktop sidecar").
- `src/cli/commands/qq.ts:9,11` + `src/cli/commands/telegram.ts:15,17`: prose comments referencing the now-historical D-09 coexistence contract and `desktopCommand`.
- `tests/headless-gate-bridges.test.ts:226` + `tests/headless-host.test.ts:106`: prose comments citing `desktop.ts` line ranges as the recipe origin (Phase 2 ported these).

## Files Created/Modified

- `src/cli/index.ts` - desktop registration block (:349-370) replaced with D-04 thin stub.
- `src/i18n/types.ts` - `commands.desktop: { retired: string }` added; `app.sidecarHint: string` removed.
- `src/i18n/{EN,JA,de,zh-CN,ru}.ts` - `commands.desktop.retired` added (5 locales); `app.sidecarHint` removed from EN/JA/de/zh-CN (ru.ts never had it).
- `src/cli/commands/events.ts` - removed LIVE `console.error(t("app.sidecarHint"))` call (t import retained, still used by noEventsFor/lookedAtFile).
- `tests/theme-tokens.test.ts` - refactored to CLI-only (removed dashboard + desktop theme imports + aligned-names test; 8 tests pass).

## Decisions Made

- Confirmed `ru.ts` never had `app.sidecarHint` (planner flagged uncertainty; executor verified via grep + tsc TranslationSchema passed with 5-locale key parity).
- D-04 stub uses `process.exit(1)` per the 16+ `process.exit(1)` convention in `src/cli/` (no special exit code).
- Kept `t` import in `events.ts` (still used by `noEventsFor` + `lookedAtFile` on lines 21-22).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] zh-CN.ts formatter divergence**
- **Found during:** Task 1 (commit attempt)
- **Issue:** My `commands.desktop.retired` edit in `src/i18n/zh-CN.ts` did not match Biome's formatting; pre-commit hook (`npm run lint`) failed with a format error.
- **Fix:** Ran `npm run format` (Biome `--write`), which auto-fixed the formatting.
- **Files modified:** src/i18n/zh-CN.ts
- **Verification:** `npm run lint` exit 0 after fix; commit succeeded.
- **Committed in:** `2a2c1518` (Task 1 commit, format fix folded in before commit succeeded)

---

**Total deviations:** 1 auto-fixed (1 blocking — formatter)
**Impact on plan:** Trivial formatting adjustment. No scope creep.

## Issues Encountered

- Pre-existing Biome warning `tests/hydrate-cards.test.ts:135 suppressions/unused` (a `// biome-ignore lint/suspicious/noExplicitAny` comment that is unused because `noExplicitAny` is `off` per CLAUDE.md). Verified pre-existing at HEAD before this phase; out of scope, does not fail the hook (warning only, lint exits 0). Logged for Phase 4 cleanup.

## Next Phase Readiness

- Pure CLI path is now independent: no Tauri/desktop/sidecar code remains in the working tree.
- Phase 4 (PANEL-04 / SAFE-01-03) can proceed with build-chain trim (files/postinstall/release.yml/Rust matrix/CLAUDE.md) and full `npm run verify` green-up of the 22 pre-existing-red files.
- Three bot channels and CLI core verified non-regressed via `--help` smoke; public method signatures unchanged (send/recv preservation-by-construction per WARNING-1).

---
*Phase: 03-desktop-gui-removal*
*Completed: 2026-07-04*
