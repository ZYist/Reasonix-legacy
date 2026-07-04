---
phase: 04-build-chain-cleanup-full-regression
plan: 02
subsystem: infra
tags: [full-regression, test-triage, cli-smoke, tree-sitter, code-query, safe-01, safe-02, safe-03]

# Dependency graph
requires:
  - phase: 04-build-chain-cleanup-full-regression
    provides: 04-01 (clean build chain — build/typecheck/pack already green; pure-CLI residue retired)
provides:
  - Milestone M1 regression closure — pure-CLI path proven regression-free: 7 orphan tests cleared, 4 milestone reds fixed green, 3 pre-existing reds evidence-deferred, every CLI command launches + offline commands functional, tree-sitter code-query proven alive end-to-end.
affects: [M1-milestone-close, fix-cycle-for-bucket-3-reds, downstream-UAT]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-01 triage-split (3 buckets) executed with fresh-baseline discipline: the model-recalled '22 red files' was wrong (actual 14) — fabricated-numeric-baselines rule proved its worth by forcing a fresh `npm test` count before classification."
    - "Bucket-2 vitest registration wrapper for dual-mode tests: when a test file uses a `run()` + `node:assert` pattern designed for `node --import tsx`, adding `import { describe, it, expect } from 'vitest'` + a single wrapping `describe/it` block registers it with vitest without forking the assertion logic. Caveat: the vitest import triggers Biome's noExportsInTest rule, so dead `export { run as ... }` lines (zero consumers) must be removed in the same edit."
    - "Fork-rename version drift fix: when a fork renames the npm package, the `readPackageVersion()` name guard must accept BOTH the upstream and fork publish names, else VERSION silently falls back to '0.0.0-dev'."

key-files:
  created: []
  modified:
    - src/version.ts
    - tests/cli-bundle-version-marker.test.ts
    - tests/headless-gate-bridges.test.ts
    - tests/headless-host.test.ts
  deleted:
    - tests/dashboard-composer-ime.test.tsx
    - tests/dashboard-css-vars.test.ts
    - tests/dashboard-server-bridge-refresh.test.ts
    - tests/dashboard-session-url.test.ts
    - tests/dashboard-settings-baidu.test.tsx
    - tests/dashboard-sidebar-new-chat-layout.test.ts
    - tests/dashboard-token-persistence.test.ts

key-decisions:
  - "D-01 fresh baseline = 14 red files (NOT the recalled 22). The 7 dashboard orphans + cli-bundle-version-marker (orphan of Phase-1-deleted copy-dashboard-vendor-css.mjs) + headless-* (2) + version + ssh-remote + ui-mcp-marketplace-snapshot + ui-slash-suggestions = 14."
  - "cli-bundle-version-marker.test.ts classified bucket-2 (not bucket-1 delete): although it tested a deleted script, its INTENT (verify the dist/cli ESM marker) maps to the 01-01 anti-regression red line and was otherwise untested. Rewrote to exercise the live scripts/write-cli-package-marker.mjs."
  - "version.test.ts root cause = fork rename (name 'reasonix' → 'reasonix-legacy'); fixed in src/version.ts by accepting both names. This is milestone-caused (the fork), not a pre-existing community bug."
  - "headless-gate-bridges/headless-host: Phase-2 code, vitest-incompatible (dual-mode run() pattern, 'No test suite found'). Fixed by adding a vitest registration wrapper + removing dead exports. Not deferred because Phase 2 is part of THIS milestone and the fix is cheap."
  - "Bucket-3 (ssh-remote, ui-mcp-marketplace-snapshot, ui-slash-suggestions) proven pre-existing via: (a) red in the pre-edit baseline run at commit 9d7b706c, (b) zero of my commits touch these files (git diff --name-only 9d7b706c HEAD), (c) identical failure output at HEAD after fixes. Acknowledged-deferred, not silent, not rabbit-holed."
  - "Self-caught regression: the bucket-2 src/version.ts edit initially used a 4-line block comment, tripping the comment-policy.test.ts (CLAUDE.md 'Block comments ≤ 3 lines'). Caught via the final `npm run verify` (the test was GREEN at baseline), condensed to a single-line comment, amended into the bucket-2 commit. Rule-1 self-fix."

patterns-established:
  - "D-01 baseline-comparison proof = (baseline red list captured BEFORE any edit) + (git diff --name-only <phase-start>..HEAD confirms suspect file untouched) + (rerun at HEAD shows identical failure). Three legs → rigorous pre-existing proof without a separate stash round-trip."
  - "Tier-2 functional smoke recipe for offline CLIs: drive each command against REAL data (real sessions, real MCP registry fetch, real git diff in a throwaway temp repo) rather than synthetic fixtures — surfaces real-path regressions that --help cannot."

requirements-completed: [SAFE-01, SAFE-02, SAFE-03]

# Coverage metadata (#1602)
coverage:
  - id: S3a
    description: "7 dashboard orphan test files deleted (each confirmed pre-deletion to cover only removed src/server/ + dashboard-UI surfaces — T-04-04 mitigation honored)"
    requirement: SAFE-03
    verification:
      - kind: other
        ref: "for f in tests/dashboard-{composer-ime.test.tsx,css-vars.test.ts,server-bridge-refresh.test.ts,session-url.test.ts,settings-baidu.test.tsx,sidebar-new-chat-layout.test.ts,token-persistence.test.ts}; do test ! -e $f; done"
        status: pass
    human_judgment: false
  - id: S3b
    description: "Bucket-2 milestone reds fixed green: version.test.ts, cli-bundle-version-marker.test.ts, headless-gate-bridges.test.ts, headless-host.test.ts (34 tests pass)"
    requirement: SAFE-03
    verification:
      - kind: unit
        ref: "npx vitest run tests/version.test.ts tests/cli-bundle-version-marker.test.ts tests/headless-host.test.ts tests/headless-gate-bridges.test.ts → 4 passed (34 tests)"
        status: pass
    human_judgment: false
  - id: S3c
    description: "Bucket-3 pre-existing reds evidence-deferred (ssh-remote, ui-mcp-marketplace-snapshot, ui-slash-suggestions) — each with baseline + git-diff + rerun proof"
    requirement: SAFE-03
    verification:
      - kind: other
        ref: "git diff --name-only 9d7b706c HEAD shows none of the 3 bucket-3 files touched; vitest-final.txt shows identical failures as vitest-baseline.txt for these 3"
        status: pass
    human_judgment: true
    rationale: "Maintainer should spot-check that no bucket-2 file was quietly deferred (plan <human-check> #1) and that the stash-equivalent evidence is credible."
  - id: S3d
    description: "Zero-regression bar: npm run build/lint/typecheck exit 0; npm test = 3 failed | 266 passed (down from 14 failed | 262 passed at baseline) — no NEW red from 04-01 build-chain cleanup"
    requirement: SAFE-03
    verification:
      - kind: other
        ref: "npm run build (exit 0) + npm run lint (1 pre-existing warning, exit 0) + npm run typecheck (exit 0) + npx vitest run (3 failed | 266 passed)"
        status: pass
    human_judgment: false
  - id: S1a
    description: "Tier-1: all 19 registered top-level commands incl. qq/telegram/weixin/index exit 0 on --help with zero import-graph breaks; retired desktop stub exits 1 with migration i18n + no removed-sidecar reference"
    requirement: SAFE-01
    verification:
      - kind: other
        ref: "node dist/cli/index.js <cmd> --help for chat code run acp commit sessions replay diff mcp doctor stats update version events index qq telegram weixin setup — all OK; desktop stub prints 'reasonix desktop 已下线' migration text"
        status: pass
    human_judgment: false
  - id: S1b
    description: "Tier-2: all 8 offline-capable commands (stats/doctor/commit/sessions/replay/diff/mcp/acp) complete a real functional happy-path on real data"
    requirement: SAFE-01
    verification:
      - kind: other
        ref: "stats rendered real usage table; doctor 10/10 diagnostics; sessions listed 226 real sessions; mcp list fetched 18-entry official registry; replay parsed real JSONL + rendered summary; diff compared 2 transcripts; acp returned valid JSON-RPC InitializeResult; commit generated 'Add file.txt' via real DeepSeek call + showed confirmation gate"
        status: pass
    human_judgment: false
  - id: S1c
    description: "Tier-3: key-gated commands — run live turn completed (MCP bridge + model + telemetry); chat/code TTY-gated share the same proven loop; qq/telegram lack bot creds; weixin needs QR scan — all acknowledged-deferred"
    requirement: SAFE-01
    verification:
      - kind: other
        ref: "node dist/cli/index.js run '...' → exit 0, MCP memory/github/puppeteer connected (9/26/7 tools), turns:2 cache:50% cost:$0.001407; TELEGRAM_BOT_TOKEN absent; QQ creds absent"
        status: pass
    human_judgment: true
    rationale: "Live run turn completed a tool round-trip but the model misread the task (tried github_search_code); a maintainer may confirm a cleaner read-only turn (e.g. code read_file → version) per the 01-02 pattern at UAT."
  - id: S2a
    description: "SAFE-02 red lines intact: scripts/copy-tree-sitter-grammars.mjs present, src/code-query/ non-empty (4 .ts files), package.json build script still chains grammar copy"
    requirement: SAFE-02
    verification:
      - kind: other
        ref: "test -f scripts/copy-tree-sitter-grammars.mjs && test -d src/code-query && grep -q copy-tree-sitter-grammars.mjs package.json"
        status: pass
    human_judgment: false
  - id: S2b
    description: "e2e-dist-grammars.mts passes — dist/grammars wasms load and parse (extracted 3 TS symbols: function:hello, class:Greeter, method:greet)"
    requirement: SAFE-02
    verification:
      - kind: other
        ref: "npx tsx scripts/e2e-dist-grammars.mts → exit 0, 'OK — dist/grammars wasms load and parse correctly'"
        status: pass
    human_judgment: false
  - id: S2c
    description: "e2e-code-query.mts passes — live parser extracts symbols across all 6 supported languages (TS/Python/Go/Rust/Java/JS) via get_symbols + find_in_code"
    requirement: SAFE-02
    verification:
      - kind: other
        ref: "npx tsx scripts/e2e-code-query.mts → exit 0, symbol tables rendered for src/tools.ts, src/code/setup.ts, src/code-query/parser.ts, sample.py, sample.go, sample.rs, Sample.java + find_in_code call/reference matches"
        status: pass
    human_judgment: false

# Metrics
duration: 16min
completed: 2026-07-05
status: complete
---

# Phase 4 Plan 02: Full Regression (SAFE-01/02/03) Summary

**M1 regression closure — 14 baseline red files converged to 3 evidence-deferred pre-existing reds; every pure-CLI command launches + offline commands functional; tree-sitter code-query proven alive end-to-end across 6 languages. The zero-regression bar (D-01) is met with no NEW red from 04-01's build-chain cleanup.**

## Performance

- **Duration:** ~16 min (PLAN_START 2026-07-04T16:38:19Z → COMPLETE 2026-07-04T16:54:51Z)
- **Tasks:** 3
- **Files modified:** 4 source/test files edited, 7 orphan test files deleted

## Task 1 — SAFE-03 Test Triage (D-01 three-bucket)

### Baseline (fresh `npm test` at commit 9d7b706c, BEFORE any 04-02 edit)

**14 red test files / 28 failed tests** (the model-recalled "22" was wrong — fabricated-numeric-baselines rule forced a fresh count):

| # | Red file | Failure summary | Bucket |
|---|----------|-----------------|--------|
| 1 | tests/dashboard-composer-ime.test.tsx | imports removed `../dashboard/src/ui/composer` | 1 (DELETE) |
| 2 | tests/dashboard-css-vars.test.ts | reads removed `../dashboard/app.css` | 1 (DELETE) |
| 3 | tests/dashboard-server-bridge-refresh.test.ts | imports removed `../dashboard/src/lib/tauri-bridge` | 1 (DELETE) |
| 4 | tests/dashboard-session-url.test.ts | imports removed `../dashboard/src/lib/session-url` | 1 (DELETE) |
| 5 | tests/dashboard-settings-baidu.test.tsx | imports removed `../dashboard/src/{App,protocol,ui/settings}` | 1 (DELETE) |
| 6 | tests/dashboard-sidebar-new-chat-layout.test.ts | reads removed `dashboard/src/styles.css` | 1 (DELETE) |
| 7 | tests/dashboard-token-persistence.test.ts | imports removed `ensureDashboardToken` etc. from `src/config.js` (functions deleted) | 1 (DELETE) |
| 8 | tests/cli-bundle-version-marker.test.ts | exercises Phase-1-deleted `scripts/copy-dashboard-vendor-css.mjs` (exit 1) | 2 (FIX) |
| 9 | tests/headless-gate-bridges.test.ts | "No test suite found" (dual-mode run(), no vitest registration) | 2 (FIX) |
| 10 | tests/headless-host.test.ts | "No test suite found" (dual-mode run(), no vitest registration) | 2 (FIX) |
| 11 | tests/version.test.ts | `VERSION === "0.0.0-dev"` vs `"0.55.0"` (fork-rename name guard miss) | 2 (FIX) |
| 12 | tests/ssh-remote.test.ts | expects "SSH tunnel" / "127.0.0.1:8420" in report (RFC dry-run, feature unimplemented) | 3 (DEFER) |
| 13 | tests/ui-mcp-marketplace-snapshot.test.ts | `buildMarketplacePickerSnapshot is not a function` (function never exported) | 3 (DEFER) |
| 14 | tests/ui-slash-suggestions.test.tsx | expected 10 advanced commands, got 9 (command-count drift) | 3 (DEFER) |

Note: `tests/mcp-server-list.test.ts` (listed in plan `files_modified`) was already GREEN at baseline — no action needed.

### Bucket 1 — DELETE 7 orphans (commit aa3d9f9b)

`git rm` of all 7 `tests/dashboard-*.test.ts(x)`. Each confirmed (pre-deletion via import/read scan) to cover ONLY removed surfaces — mirrors Phase 1's 01-01 orphan convention. T-04-04 mitigation honored (none covers live core logic). SAFE-02 red lines verified intact post-deletion.

### Bucket 2 — FIX 4 milestone reds (commit 559d7899)

- **`src/version.ts`** — `readPackageVersion()` name guard now accepts both `"reasonix"` and `"reasonix-legacy"` (the fork's npm publish name) via `OWN_PACKAGE_NAMES` set. `VERSION` now correctly resolves to `0.55.0` (verified at runtime: `reasonix version` prints "reasonix 0.55.0"). Fixes `tests/version.test.ts`.
- **`tests/cli-bundle-version-marker.test.ts`** — rewritten to exercise the live `scripts/write-cli-package-marker.mjs` (the 01-01 ESM-marker red line, previously untested) instead of the Phase-1-deleted `scripts/copy-dashboard-vendor-css.mjs`. 3 cases: marker write, dir-create, name/version fallback.
- **`tests/headless-gate-bridges.test.ts`** + **`tests/headless-host.test.ts`** — added a vitest registration wrapper (`import { describe, it, expect } from "vitest"` + single wrapping `describe/it`) around the existing dual-mode `run()` so vitest recognizes the suite (was "No test suite found"). Removed the dead `export { run as ... }` lines (grep-confirmed zero consumers) to satisfy Biome's `noExportsInTest` rule once the vitest import landed. The `node --import tsx` direct-run tail still drives the plan gate exit code. Phase-2 code, cheap fix.

### Bucket 3 — EVIDENCE-DEFER 3 pre-existing reds (acknowledged-deferred)

Each proven pre-existing via the D-01 three-leg baseline comparison:

| File | Failure | Proof of pre-existing |
|------|---------|----------------------|
| tests/ssh-remote.test.ts | report missing "SSH tunnel" / "127.0.0.1:8420" (RFC dry-run feature unimplemented) | (a) red in baseline at 9d7b706c; (b) `git diff --name-only 9d7b706c HEAD` does NOT list this file; (c) identical AssertionError at HEAD after fixes. Leave for fix cycle. |
| tests/ui-mcp-marketplace-snapshot.test.ts | `buildMarketplacePickerSnapshot is not a function` (function never exported/implemented) | (a) red in baseline; (b) untouched by 04-02 commits; (c) identical TypeError at HEAD. The marketplace picker snapshot module was never wired. Leave for fix cycle. |
| tests/ui-slash-suggestions.test.tsx | expected 10 advanced commands, got 9 (command-count drift) | (a) red in baseline; (b) untouched by 04-02 commits; (c) identical AssertionError (`expected 9 to be 10`) at HEAD. A slash command was removed/renamed upstream of this milestone. Leave for fix cycle. |

These are **acknowledged-deferred**, not silent, not rabbit-holed (T-04-05 mitigation honored: every "pre-existing" claim is proven by the three-leg comparison above).

### Self-caught regression (Rule 1)

The initial `src/version.ts` edit used a 4-line block comment, which tripped `tests/comment-policy.test.ts` (CLAUDE.md "Block comments ≤ 3 lines"). The test was GREEN at baseline (✓ 9 tests). Caught via the post-fix `npm run verify`, condensed the comment to a single line (`/** Name guard accepts reasonix + reasonix-legacy so VERSION tracks the real package.json. */`), and amended into commit 559d7899. No regression shipped.

### Final `npm run verify` (zero-regression bar)

```
npm run build       → exit 0  (tsup + CLI marker + 8 grammar wasms)
npm run lint        → exit 0  (1 pre-existing warning: hydrate-cards.test.ts:135 suppressions/unused — documented in STATE.md §Deferred Items)
npm run typecheck   → exit 0
npx vitest run      → 3 failed | 266 passed (269) | 7 failed tests | 3714 passed (3737 incl. skipped)
```

**Reduction: 14 red files → 3 red files (all bucket-3 deferred). 28 failed tests → 7 failed tests.** No NEW red introduced by 04-01's build-chain cleanup. D-01 zero-regression bar met.

## Task 2 — SAFE-01 Pure-CLI Command Smoke (D-03 hybrid)

### Tier 1 — ALL commands `--help` (import-graph + Commander regression net)

All 19 registered top-level commands **PASS** (exit 0, Commander help dump, zero import-graph exceptions, zero deleted-module references):

`chat` `code` `run` `acp` `commit` `sessions` `replay` `diff` `mcp` `doctor` `stats` `update` `version` `events` `index` `qq` `telegram` `weixin` `setup`

Checker Advisory honored: the plan's CMD_LIST example omitted 5 registered subcommands — `qq`, `telegram`, `weixin`, `index`, and `events` were all included here and all pass. These bot commands are the milestone's core deliverable — their clean `--help` proves no import-graph break in the Phase-2 channel code.

**Retired `desktop` stub** — exit 1 (expected), prints the migration i18n message "`reasonix desktop` 已下线。若要在终端驱动机器人,请改用 `reasonix qq`、`reasonix telegram` 或 `reasonix weixin`。" References NO removed sidecar / `src/desktop` / `src/server` code (only mentions the live bot commands). The `[proxy]` lines in its output are the normal early CLI proxy-install step, not a desktop reference.

### Tier 2 — Offline-capable commands, functional happy-path (Checker Advisory 2: all 8)

| Command | Functional evidence | Result |
|---------|---------------------|--------|
| `stats` | Rendered real usage table (today/week/month/all-time, cache hit %, cost, saved-vs-claude) from `~/.reasonix/usage.jsonl` | exit 0 ✓ |
| `doctor` | 10 diagnostic checks all green (api key, config, proxy, reach, tokenizer, sessions, hooks, project) | exit 0 ✓ |
| `sessions` | Listed 226 real saved sessions with msg count / size / modified | exit 0 ✓ |
| `version` | Printed "reasonix 0.55.0" (VERSION resolves correctly post-fix) | exit 0 ✓ |
| `mcp list` | Fetched official registry, rendered 18 entries with source badges | exit 0 ✓ |
| `replay <transcript>` | Parsed real JSONL session, rendered summary (model calls, turns, cache, cost) | exit 0 ✓ |
| `diff <a> <b>` | Compared two real transcripts, rendered comparison table (A/B/Δ columns) | exit 0 ✓ |
| `acp` | Returned valid JSON-RPC `InitializeResult` (protocolVersion, agentInfo reasonix/0.55.0, capabilities) to a piped `initialize` handshake | exit 0 ✓ |
| `commit` | Generated "Add file.txt" via real DeepSeek call in a throwaway temp git repo + surfaced accept/regenerate/edit/cancel gate (no uncontrolled commit) | exit 0 ✓ |

### Tier 3 — Key-gated / TTY / external-service commands

| Command | Status | Evidence |
|---------|--------|----------|
| `run` | **LIVE TURN COMPLETED** ✓ | DeepSeek key read from `~/.reasonix/config.json` (doctor confirmed). `reasonix run "Read pkg.json..."` → MCP bridge connected (memory:9 / github:26 / puppeteer:7 tools), model dispatched `github_search_code` (auth failed — no github token, expected), telemetry rendered (turns:2, cache:50.0%, cost:$0.001407, save-vs-claude:97.7%). The cache-first loop + MCP bridge are proven alive end-to-end. |
| `chat` / `code` | Acknowledged-deferred (TTY) | Share the same `CacheFirstLoop` proven via `run`; need interactive TTY for a supervised turn. Loop machinery already proven. |
| `qq` | Acknowledged-deferred (creds) | QQ bot gateway credentials absent. |
| `telegram` | Acknowledged-deferred (creds) | `TELEGRAM_BOT_TOKEN` absent — mirrors Phase 2 Telegram UAT precedent. |
| `weixin` | Acknowledged-deferred (QR) | WeChat uses interactive QR-code login (`qrcode` lib); cannot scan non-interactively. |

The `run` live turn satisfies the plan's "single tool round-trip proves the loop" contract for the key-gated tier. The remaining commands are acknowledged-deferred (non-blocking) per D-03.

## Task 3 — SAFE-02 Tree-sitter / Code-query Preservation (D-04)

### Red-line presence check — all intact

- `scripts/copy-tree-sitter-grammars.mjs` — present (untouched by 04-01/04-02)
- `src/code-query/` — present, non-empty (4 .ts files: parser.ts, symbols.ts, + 2 others)
- `package.json` `scripts.build` — still chains `copy-tree-sitter-grammars.mjs` (`tsup && node scripts/write-cli-package-marker.mjs && node scripts/copy-tree-sitter-grammars.mjs`)
- `dist/grammars/` — 8 wasm files (typescript, tsx, javascript, python, go, rust, java, web-tree-sitter) copied by the fresh build

### e2e-dist-grammars.mts — PASS (exit 0)

Loaded the dist-bundled grammars, parsed a TypeScript sample, extracted exactly 3 symbols: `function:hello`, `class:Greeter`, `method:greet`. Proves the dist bundle carries working grammar artifacts.

### e2e-code-query.mts — PASS (exit 0)

Drove the live `src/code-query/parser.ts` + `symbols.ts` against bundled grammars across all 6 supported languages:

- **TypeScript** — `src/tools.ts` (10 interfaces/classes/types incl. ToolRegistry), `src/code/setup.ts` (interfaces + functions), `src/code-query/parser.ts` (interfaces + functions incl. setGrammarDir, getParser, parseSource)
- **Python** — `sample.py` (function, class, methods with `parent` tracking)
- **Go** — `sample.go` (types, interfaces, functions, methods)
- **Rust** — `sample.rs` (classes, interfaces, functions, methods)
- **Java** — `Sample.java` (class, properties, methods with parent)
- **Unsupported** — `package.json` correctly returned `language not supported` error (graceful)
- **`find_in_code`** — grep-style symbol search returned call/reference matches with line/column/snippet across TS/Python/Go/Rust/Java

No escalation needed — both e2e scripts green on the first run. The code-symbol-search capability (a CLI feature that must survive M1) is proven alive after the build-chain cleanup.

## Task Commits

Each task's code work committed atomically:

1. **Task 1 Bucket 1** — `aa3d9f9b` (chore): delete 7 dashboard orphan tests
2. **Task 1 Bucket 2** — `559d7899` (fix): repair 4 milestone-related test failures + comment-policy self-fix (amended)

Tasks 2 and 3 produced no code changes (verification-only: smoke + e2e). Their evidence is recorded in this SUMMARY.

**Plan metadata:** pending final commit (docs: complete plan) after SUMMARY + STATE + ROADMAP.

## Deviations from Plan

- **CHECKER ADVISORY (close in-flight) 1 — Tier-1 CMD_LIST expansion:** the plan's Tier-1 `CMD_LIST` example listed 16 commands and omitted `qq`, `telegram`, `weixin`, `index`, `events`. Per the advisory, all registered top-level commands (19) were included in the Tier-1 smoke. All pass. The acceptance criterion "every registered subcommand --help exits without an import-graph exception" was the binding contract; the CMD_LIST was illustrative and incomplete.
- **CHECKER ADVISORY (close in-flight) 2 — Tier-2 all 8 offline commands:** the plan's verify block spot-checked only `stats` + `doctor`. Per the advisory, all 8 offline-capable commands (stats/doctor/commit/sessions/replay/diff/mcp/acp) were driven through real functional paths. All pass.
- **`cli-bundle-version-marker.test.ts` reclassification:** the plan listed it only in `files_modified` (not bucketed). It tested a Phase-1-deleted script but its INTENT maps to the 01-01 ESM-marker red line. Classified as bucket-2 (rewrite to live script) rather than bucket-1 (delete) to preserve the otherwise-untested marker coverage. Rule-2 auto-add (critical functionality: the ESM marker anti-regression contract).
- **Comment-policy self-fix (Rule 1):** the bucket-2 `src/version.ts` edit initially violated the CLAUDE.md block-comment-length rule; caught by `npm run verify`, condensed to a single-line comment, amended into the bucket-2 commit.
- **`tests/mcp-server-list.test.ts`:** plan listed it as a bucket-2 candidate but it was already GREEN at baseline — no action taken (documented, not a deviation).

No Rule-4 architectural changes. No blockers.

## Issues Encountered

- **Fabricated numeric baseline.** The STATE.md / model-recall said "22 pre-existing-red files"; the actual fresh count was 14. The fabricated-numeric-baselines rule (run the count fresh) prevented trusting a wrong number. Recorded here so the next planner/executor does not re-cite "22".
- **Biome `noExportsInTest` cascade.** Adding `import { describe, it } from "vitest"` to the dual-mode headless tests caused Biome to now treat them as test files and flag the pre-existing `export { run as ... }` lines as errors. Resolved by removing the dead exports (zero consumers). Documented in patterns-established so future dual-mode conversions anticipate this.

## Known Stubs

None. This plan deleted tests and fixed test wiring; it introduced no production stubs, no placeholder data, no unwired components. The `buildMarketplacePickerSnapshot` function referenced by the deferred `ui-mcp-marketplace-snapshot.test.ts` was never implemented (pre-existing gap, bucket-3 deferred) — but that is a pre-existing missing feature, not a stub introduced by this plan.

## Acknowledged-Deferred Items (carry to fix cycle)

| Item | Category | Evidence |
|------|----------|----------|
| tests/ssh-remote.test.ts | pre-existing red (RFC dry-run, "SSH tunnel" feature unimplemented) | bucket-3 three-leg proof above |
| tests/ui-mcp-marketplace-snapshot.test.ts | pre-existing red (`buildMarketplacePickerSnapshot` never exported) | bucket-3 three-leg proof above |
| tests/ui-slash-suggestions.test.tsx | pre-existing red (command-count drift 10→9) | bucket-3 three-leg proof above |
| tests/hydrate-cards.test.ts:135 Biome warning | pre-existing (suppressions/unused) | STATE.md §Deferred Items (03 carry-forward) |
| chat/code interactive TTY turn | Tier-3 TTY-gated (loop proven via `run`) | not a regression |
| qq/telegram/weixin live bot turn | Tier-3 cred/QR-gated | Phase 2 Telegram UAT precedent |

## Next Phase Readiness

- **M1 milestone is closeable.** The pure-CLI release is shippable: build green (clean CLI-only tarball per 04-01), every command launches, offline commands functional, tree-sitter code-query alive across 6 languages, no NEW test regressions. The 3 remaining reds are proven pre-existing and acknowledged-deferred (fix cycle).
- **No blockers.** Red lines honored: `scripts/copy-tree-sitter-grammars.mjs`, `src/code-query/`, `src/acp/server.ts` all untouched. No runtime source changes except the one-line `src/version.ts` name-guard broadening.
- **Carry-forward for fix cycle:** the 3 bucket-3 reds (ssh-remote, ui-mcp-marketplace-snapshot, ui-slash-suggestions) + the hydrate-cards Biome warning + WR-05/IN-* items from earlier phases.

---
*Phase: 04-build-chain-cleanup-full-regression*
*Completed: 2026-07-05*
