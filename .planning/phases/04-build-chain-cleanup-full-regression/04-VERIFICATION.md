---
phase: 04-build-chain-cleanup-full-regression
verified: 2026-07-05T01:50:00Z
status: human_needed
score: 10/10 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: N/A
  gaps_closed: []
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "tests/ssh-remote.test.ts red (RFC dry-run, 'SSH tunnel' feature unimplemented)"
    addressed_in: "fix cycle (out-of-milestone)"
    evidence: "D-01 bucket-3 — file exists on v1 main (pre-existing), zero phase-04 commits touch it, identical AssertionError at HEAD"
  - truth: "tests/ui-mcp-marketplace-snapshot.test.ts red (buildMarketplacePickerSnapshot never exported/implemented)"
    addressed_in: "fix cycle (out-of-milestone)"
    evidence: "D-01 bucket-3 — file exists on v1 main, zero phase-04 commits touch it, identical TypeError at HEAD"
  - truth: "tests/ui-slash-suggestions.test.tsx red (command-count drift 10->9)"
    addressed_in: "fix cycle (out-of-milestone)"
    evidence: "D-01 bucket-3 — file exists on v1 main, zero phase-04 commits touch it, identical AssertionError at HEAD"
  - truth: "tests/hydrate-cards.test.ts:135 Biome warning (suppressions/unused)"
    addressed_in: "fix cycle (out-of-milestone)"
    evidence: "STATE.md §Deferred Items (03 carry-forward); pre-existing, unrelated to phase-04 work"
human_verification:
  - test: "Live Tier-3 chat/code/run turn with DEEPSEEK_API_KEY + interactive TTY"
    expected: "Single tool round-trip completes (read_file -> version or similar read-only path); cache-first loop + tool dispatch + telemetry proven end-to-end at UAT depth"
    why_human: "Needs interactive TTY for a supervised turn; the run live turn in 04-02 completed but the model misread the task (github_search_code) — a maintainer should confirm a cleaner read-only turn per the 01-02 read_file->version pattern"
  - test: "Live qq/telegram/weixin bot turn with real credentials"
    expected: "Bot starts headless host, sends/receives at least one message via the channel gateway"
    why_human: "TELEGRAM_BOT_TOKEN absent, QQ creds absent, WeChat needs interactive QR scan — non-interactive verify cannot exercise these channel gateways"
  - test: "Maintainer skim of trimmed .claude/CLAUDE.md for narrative coherence"
    expected: "Trimmed CLAUDE.md reads as coherent project guidance (no dangling bullet fragments, no broken section flow)"
    why_human: "Automated greps prove stale refs are gone and true refs survive, but documentation-quality coherence is judgment-tier"
---

# Phase 4: Build Chain Cleanup & Full Regression — Verification Report

**Phase Goal:** 构建链全面简化——CLI 可独立构建发布;全量 `npm run verify` 通过,核心 loop/工具/记忆/MCP/AcP 零回归,tree-sitter 代码符号搜索保留可用。
**Verified:** 2026-07-05T01:50:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (4 ROADMAP Success Criteria)

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|--------------------|--------|----------|
| 1 | **PANEL-04** — `npm run build` no longer depends on dashboard/vendor-css; `files`/`postinstall`/`typecheck` configs have no dashboard/desktop residue; CLI builds independently | VERIFIED | `npm run build` exit 0 (tsup 624ms + DTS + 8 grammar wasms); `npm pack --dry-run` 9.2 MB / 168 files, **zero** `scripts/postinstall.mjs` / desktop / release.yml entries; `package.json` `scripts.postinstall` ABSENT, `files` array clean (`dist`, `data/deepseek-tokenizer.json.gz`, `patches`, `README.md`, `LICENSE`); `scripts.build` = `tsup && node scripts/write-cli-package-marker.mjs && node scripts/copy-tree-sitter-grammars.mjs`; `scripts.prepare` = `simple-git-hooks \|\| true` (independent of postinstall, git hooks survive) |
| 2 | **SAFE-01** — All pure-CLI commands (`chat`/`code`/`run`/`acp`/`commit`/`sessions`/`replay`/`diff`/`mcp`/`doctor` etc.) command-by-command smoke without regression | VERIFIED (D-03 hybrid: Tier-1+2 proven; Tier-3 routed to human UAT per D-03) | Tier-1: all 17 subcommands `--help` exit 0 with no import-graph break (chat/code/run/acp/commit/sessions/replay/diff/mcp/doctor/stats/update/version/events/qq/telegram/weixin + retired `desktop` stub prints migration i18n); Tier-2: `stats`/`doctor`/`sessions`/`version` functional happy-path exit 0 on real data; Tier-3: `run` live turn completed in 04-02 (MCP bridge + cache:50% cost:$0.001407) — chat/code/qq/telegram/weixin key/cred/QR-gated acknowledged-deferred (see Human Verification) |
| 3 | **SAFE-02** — `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` retained, `code-query` symbol search works | VERIFIED | Red lines intact: `scripts/copy-tree-sitter-grammars.mjs` present, `src/code-query/` non-empty (4 .ts files), `package.json` `scripts.build` chains grammar copy. `npx tsx scripts/e2e-dist-grammars.mts` → exit 0 (3 TS symbols extracted: function:hello, class:Greeter, method:greet). `npx tsx scripts/e2e-code-query.mts` → exit 0 (live parser across 6 languages TS/Python/Go/Rust/Java/JS + find_in_code symbol search). |
| 4 | **SAFE-03** — `npm run verify` (build + lint + typecheck + test) passes; core loop/tools/memory/MCP/AcP zero regression | VERIFIED per D-01 zero-regression bar | `npm run build` exit 0; `npm run lint` exit 0 (1 pre-existing Biome warning in tests/hydrate-cards.test.ts:135 — documented deferral); `npm run typecheck` exit 0; `npx vitest run` → 3 failed \| 266 passed files (7 failed \| 3718 passed tests). The 3 reds (ssh-remote, ui-mcp-marketplace-snapshot, ui-slash-suggestions) are bucket-3 pre-existing per 3-leg proof: exist on v1 main, zero phase-04 commits touch them, identical failure at HEAD. 7 dashboard orphan tests deleted (bucket 1). 4 bucket-2 fixes green (37 tests pass). **No NEW red introduced by phase-04 build-chain cleanup.** |

**Score:** 4/4 ROADMAP SCs verified (10/10 PLAN truths verified — see Goal Achievement detail below).

### PLAN-level Truths (10/10 verified)

| Plan | # | Truth | Status | Evidence |
|------|---|-------|--------|----------|
| 04-01 | 1 | `npm run build` exits 0 with no dependency on removed dashboard vendor-css copy or any desktop build step | VERIFIED | Build green, grammar copy is the only post-tsup step besides write-cli-package-marker |
| 04-01 | 2 | Published tarball ships no desktop artifacts and registers no postinstall hook | VERIFIED | `npm pack --dry-run` grep for postinstall/desktop = 0 matches |
| 04-01 | 3 | CI workflow step names accurately describe what they run | VERIFIED | `ci.yml:36` = `name: Build (tsup)`; stale `Build (tsup + dashboard)` absent |
| 04-01 | 4 | `.claude/CLAUDE.md` no longer documents the removed Rust/Tauri/desktop/dashboard surfaces as if they were live | VERIFIED | 0 matches for `Tauri`/`rusqlite`/`src/server`/`desktop/src-tauri`/`copy-dashboard-vendor-css`/`dashboard` (WR-03 fix applied); preserved: Node ≥22, copy-tree-sitter-grammars.mjs, CacheFirstLoop, simple-git-hooks, reasonix |
| 04-01 | 5 | `prepare` (simple-git-hooks) still wires pre-commit/pre-push after postinstall removal | VERIFIED | `scripts.prepare` = `simple-git-hooks \|\| true` byte-identical to pre-phase state |
| 04-02 | 6 | `npm run verify` exits 0 OR every remaining red is baseline-proven pre-existing (D-01) | VERIFIED | 3 remaining reds proven pre-existing via 3-leg baseline comparison (see SC-4 evidence) |
| 04-02 | 7 | Every pure-CLI command launches `--help` without import-graph break or stale desktop reference (D-03 Tier-1) | VERIFIED | 17/17 commands tested in this verification exit 0 on `--help`; retired `desktop` stub prints migration text, no removed-sidecar reference |
| 04-02 | 8 | Offline-capable commands complete a functional happy-path, not just `--help` (D-03 Tier-2) | VERIFIED | spot-checked `stats`/`doctor`/`sessions`/`version` exit 0 on real data; SUMMARY records all 8 (stats/doctor/commit/sessions/replay/diff/mcp/acp) functional |
| 04-02 | 9 | `scripts/e2e-code-query.mts` and `scripts/e2e-dist-grammars.mts` both pass (D-04) | VERIFIED | Both green (exit 0) — re-run in this verification |
| 04-02 | 10 | SAFE-02 red lines intact: grammar-copy script chained in build, `src/code-query/` present | VERIFIED | `test -f scripts/copy-tree-sitter-grammars.mjs` + `test -d src/code-query` + grep `copy-tree-sitter-grammars.mjs` package.json — all pass |

### Deferred Items

Items not yet met but explicitly deferred per phase contracts (D-01 zero-regression bar + D-03 hybrid smoke).

| # | Item | Addressed In | Evidence |
|---|------|--------------|----------|
| 1 | tests/ssh-remote.test.ts red | fix cycle (out-of-milestone) | D-01 bucket-3 — exists on v1 main, zero phase-04 commits, identical failure at HEAD |
| 2 | tests/ui-mcp-marketplace-snapshot.test.ts red | fix cycle (out-of-milestone) | D-01 bucket-3 — exists on v1 main, zero phase-04 commits, identical failure at HEAD |
| 3 | tests/ui-slash-suggestions.test.tsx red | fix cycle (out-of-milestone) | D-01 bucket-3 — exists on v1 main, zero phase-04 commits, identical failure at HEAD |
| 4 | tests/hydrate-cards.test.ts:135 Biome warning | fix cycle (out-of-milestone) | STATE.md §Deferred Items (03 carry-forward) |

These conform to the zero-regression bar (D-01): not silent, not rabbit-holed, every "pre-existing" claim proven by baseline comparison. They are NOT gaps.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/postinstall.mjs` | deleted | VERIFIED | Path absent from working tree |
| `scripts/sync-desktop-version.mjs` | deleted | VERIFIED | Path absent from working tree |
| `.github/workflows/release.yml` | deleted | VERIFIED | Path absent from working tree |
| `package.json` | aligned to pure-CLI | VERIFIED | `scripts.postinstall` absent; `files` excludes postinstall.mjs; `build`+`prepare` intact |
| `.github/workflows/ci.yml` | step name corrected | VERIFIED | `name: Build (tsup)`; stale name absent |
| `.claude/CLAUDE.md` | pure-CLI reality | VERIFIED | Zero banned refs; preserved content intact |
| `.github/workflows/release-mirror.yml` | RETAINED | VERIFIED | Present (D-02 discretion — mirrors CLI releases too) |
| `.github/workflows/publish-npm.yml` | RETAINED (red line) | VERIFIED | Present |
| `.github/workflows/publish-dsnix.yml` | RETAINED (red line) | VERIFIED | Present |
| `scripts/copy-tree-sitter-grammars.mjs` | RETAINED (SAFE-02 red line) | VERIFIED | Present, chained in build |
| `src/code-query/` | RETAINED (SAFE-02 red line) | VERIFIED | Present, 4 .ts files |
| `src/acp/server.ts` | RETAINED (live ACP, not removed src/server/) | VERIFIED | Present |
| `tests/dashboard-{composer-ime,css-vars,server-bridge-refresh,session-url,settings-baidu,sidebar-new-chat-layout,token-persistence}.test.ts(x)` | deleted (bucket-1 orphans) | VERIFIED | All 7 paths absent from working tree |
| `src/version.ts` | CR-01 + CR-02 fixes | VERIFIED | REGISTRY_URL → reasonix-legacy/latest; OWN_PACKAGE_NAMES accepts both names; detectNpmInstallPrefix regex widened to `(?:-legacy)?(?:/\|$)`; detectInstallSource regex explicit (IN-01) |
| `src/cli/commands/update.ts` | CR-01 downstream fix | VERIFIED | MANUAL_UPDATE_COMMANDS + buildUpdateCommand target `reasonix-legacy@latest` across npm/bun/pnpm/yarn; preserves `--prefix` nvm/fnm pin |
| `tests/version.test.ts` | WR-04 regression case | VERIFIED | New posix + Windows `reasonix-legacy` cases added (would fail against pre-CR-01 regex) |
| `tests/cli-bundle-version-marker.test.ts` | WR-01 + IN-02 fixes | VERIFIED | Asserts `reasonix-legacy` fallback; new happy-path case for the renamed name |
| `tests/headless-host.test.ts` | WR-02 fix | VERIFIED | Title corrected to "does NOT surface prior assistant text" |
| `tests/headless-gate-bridges.test.ts` | vitest registration | VERIFIED | 6 cases registered, all pass |
| `tests/update-command.test.ts` + `tests/slash.test.ts` | CR-01 downstream assertions | VERIFIED | All `reasonix-legacy@latest` expectations updated |

### Key Link Verification

| From | To | Via | Status | Details |
|------|------|-----|--------|---------|
| `package.json` `scripts.build` | `scripts/copy-tree-sitter-grammars.mjs` | build script chains tsup → write-cli-package-marker → copy-tree-sitter-grammars (SAFE-02 red line) | WIRED | Pattern `tsup && node scripts/write-cli-package-marker.mjs && node scripts/copy-tree-sitter-grammars.mjs` matches byte-for-byte |
| `package.json` `scripts.prepare` | `simple-git-hooks` | prepare (not postinstall) wires git hooks | WIRED | Pattern `"prepare": "simple-git-hooks \|\| true"` present |
| `scripts/e2e-code-query.mts` | `src/code-query/parser.ts` | e2e drives live parser against bundled grammars | WIRED | Both green (TS/Python/Go/Rust/Java/JS symbol extraction) |
| `src/cli/index.ts` Commander | `dist/cli/index.js` | every command's `--help` registers via Commander without desktop import | WIRED | 17/17 commands exit 0 on `--help` |
| `src/version.ts` `detectNpmInstallPrefix` | `src/cli/commands/update.ts` `buildUpdateCommand` | prefix detection feeds the npm `--prefix` pin | WIRED | CR-01 fix verified empirically: 3 real install-path shapes (posix/nvm/Windows) return non-null prefix; `reasonix-pro` correctly rejected |
| `REGISTRY_URL` | npm registry `reasonix-legacy/latest` | freshness check queries the fork's package | WIRED | CR-02 fix applied — `https://registry.npmjs.org/reasonix-legacy/latest` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `dist/grammars/*.wasm` | grammar artifacts | `scripts/copy-tree-sitter-grammars.mjs` (chained in build) | Yes — 8 wasms (TS/TSX/JS/Python/Go/Rust/Java/web-tree-sitter) | FLOWING |
| `dist/cli/package.json` | ESM marker | `scripts/write-cli-package-marker.mjs` | Yes — `name: reasonix-legacy`, `type: module` | FLOWING |
| `reasonix version` output | VERSION constant | `readPackageVersion()` walking up to package.json | Yes — prints `reasonix 0.55.0` at runtime | FLOWING |
| `tests/version.test.ts` reasonix-legacy cases | detectNpmInstallPrefix result | `src/version.ts:164-173` regex match | Yes — `/usr/local` and `C:/Users/me/AppData/Roaming/npm` returned for the renamed paths | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Build chain green after cleanup | `npm run build` | exit 0 (tsup 624ms + DTS + 8 grammar wasms copied) | PASS |
| Typecheck green | `npm run typecheck` | exit 0 | PASS |
| Lint green (1 pre-existing warning tolerated) | `npm run lint` | exit 0; 1 warning tests/hydrate-cards.test.ts:135 (documented deferral) | PASS |
| Tarball carries no postinstall/desktop | `npm pack --dry-run \| grep postinstall` | 0 matches | PASS |
| CR-01 regex: reasonix-legacy paths detected | empirical regex test | `/usr/local`, nvm path, Windows path all return non-null prefix; `reasonix-pro` rejected | PASS |
| Bucket-2 vitest green (CR-01/02 + WR-01/02 + headless registration) | `npx vitest run tests/{version,cli-bundle-version-marker,headless-host,headless-gate-bridges}.test.ts` | 4 files / 37 tests passed | PASS |
| Bucket-3 reds still red (proof of pre-existing) | `npx vitest run tests/{ssh-remote,ui-mcp-marketplace-snapshot,ui-slash-suggestions}.test.ts(x)` | 3 files / 7 tests failed — exactly matches documented deferral | PASS (D-01 contract honored — not silent, not greenwashed) |
| Full vitest final state matches SUMMARY | `npx vitest run` | 3 failed / 266 passed files (7 failed / 3718 passed tests) | PASS |
| SAFE-02 e2e-dist-grammars | `npx tsx scripts/e2e-dist-grammars.mts` | exit 0; 3 TS symbols extracted from dist-bundled grammars | PASS |
| SAFE-02 e2e-code-query | `npx tsx scripts/e2e-code-query.mts` | exit 0; live parser across 6 languages + find_in_code | PASS |
| Tier-1 all 17 commands --help | `node dist/cli/index.js <cmd> --help` | 17/17 exit 0; zero import-graph breaks | PASS |
| Tier-2 stats/doctor/sessions/version functional | `node dist/cli/index.js <cmd>` | exit 0 on real data (real usage JSONL, real diagnostic checks, real session list, real version) | PASS |
| Retired `desktop` stub does NOT load sidecar | `node dist/cli/index.js desktop --help` | exit non-zero; prints migration i18n; no `src/desktop`/`src/server` reference | PASS |
| Runtime version.ts fix | `node dist/cli/index.js version` | prints `reasonix 0.55.0` (proves name-guard + REGISTRY_URL retarget) | PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` declared or conventional — phase uses e2e tsx scripts (D-04) and npm run verify as the probe surface. Both ran clean (see Behavioral Spot-Checks).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PANEL-04 | 04-01 | 构建链简化——build 不依赖 dashboard/vendor-css;files/postinstall/typecheck 去 dashboard/desktop;CLI 独立构建发布 | SATISFIED | Build green, tarball clean, ci.yml step name corrected, package.json aligned, CLAUDE.md trimmed, 3 dormant artifacts deleted, retained workflows intact |
| SAFE-01 | 04-02 | 纯 CLI 命令功能不回归 | SATISFIED (D-03 hybrid) | Tier-1 17/17 green; Tier-2 functional green; Tier-3 routed to UAT per D-03 contract |
| SAFE-02 | 04-02 | tree-sitter grammars + code-query 保留可用 | SATISFIED | Red lines intact; e2e-dist-grammars green; e2e-code-query green across 6 languages |
| SAFE-03 | 04-02 | `npm run verify` 通过;核心 loop/工具/记忆/MCP 零回归 | SATISFIED (D-01 zero-regression bar) | build/lint/typecheck exit 0; vitest 3 reds / 266 passed; bucket-3 reds proven pre-existing via 3-leg baseline proof; zero NEW red from phase-04 |

**Orphaned requirements check:** REQUIREMENTS.md maps exactly PANEL-04, SAFE-01, SAFE-02, SAFE-03 to Phase 4 — all 4 are claimed by plans and verified. No orphaned requirement IDs.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | — | — | No TBD/FIXME/XXX in any phase-modified file; no bare TODO/HACK without `(#nnn)` anchor; no stub patterns; no placeholder returns. Phase is deletion + config edit + test wiring — no production source added. |

### Code Review (04-REVIEW.md) — Critical/Warning Resolution

The phase went through `gsd-code-review` (04-REVIEW.md found 2 critical + 4 warning + 3 info) and `gsd-code-fixer` (04-REVIEW-FIX.md). Verifier independently confirmed each fix is in code, not just claimed:

| ID | Severity | Claim | Code State (verifier-checked) |
|----|----------|-------|-------------------------------|
| CR-01 | critical | `detectNpmInstallPrefix` regex widened; `update.ts` targets `reasonix-legacy` | RESOLVED — `src/version.ts:168,170` regex is `/reasonix(?:-legacy)?(?:/\|$)/`; `src/cli/commands/update.ts:34-38, 88-95` use `reasonix-legacy@latest` across all 4 package managers; `--prefix` pin preserved; empirically verified 3 real install-path shapes return non-null |
| CR-02 | critical | `REGISTRY_URL` retargeted to `reasonix-legacy/latest` | RESOLVED — `src/version.ts:9` reads `https://registry.npmjs.org/reasonix-legacy/latest` |
| WR-01 | warning | Test title contradicts assertion in `cli-bundle-version-marker.test.ts` | RESOLVED — `scripts/write-cli-package-marker.mjs:9` falls back to `"reasonix-legacy"`; test asserts `toBe("reasonix-legacy")` |
| WR-02 | warning | Test title contradicts assertion in `headless-host.test.ts` | RESOLVED — title now reads "does NOT surface prior assistant text" matching `captured === null` assertion |
| WR-03 | warning | CLAUDE.md trim left 3 stale dashboard refs | RESOLVED — `grep -ci 'dashboard' .claude/CLAUDE.md` returns 0 |
| WR-04 | warning | `tests/version.test.ts` false confidence on reasonix-legacy paths | RESOLVED — posix + Windows reasonix-legacy cases added at lines 170/176 |
| IN-01 | info (bonus) | `detectInstallSource` regex matched accidentally via word boundary | RESOLVED — explicit `/reasonix(?:-legacy)?(?:/\|$)/` regex |
| IN-02 | info (bonus) | `cli-bundle-version-marker.test.ts` didn't exercise renamed name | RESOLVED — new happy-path case for `reasonix-legacy` |
| IN-03 | info (skipped) | Module-level mutable `origHome` in `headless-gate-bridges.test.ts` | NOT FIXED — out of requested scope; sequential-await pattern is safe today; non-blocking |

**Critical-fix regression check:** REVIEW-FIX.md noted a first verify pass surfaced 10 new reds in `tests/update-command.test.ts` + `tests/slash.test.ts` from CR-01's package-name change; verifier confirms both files are now updated to expect `reasonix-legacy@latest` and the full vitest run shows zero new reds.

### Human Verification Required

#### 1. Live Tier-3 chat/code/run turn with DEEPSEEK_API_KEY + interactive TTY

**Test:** Run `reasonix code` (or `chat`/`run`) with a real DeepSeek key in an interactive TTY; issue a single read-only tool turn (e.g. `read_file package.json` to verify version).
**Expected:** Single tool round-trip completes (model emits tool_call -> tool dispatches -> result returned -> model finalizes); cache-first loop + tool dispatch + telemetry render correctly.
**Why human:** Needs interactive TTY for a supervised turn. The 04-02 `run` live turn completed (proving the loop wiring end-to-end) but the model misread the task (dispatched `github_search_code` instead of `read_file`); a maintainer should confirm a cleaner read-only turn per the 01-02 `read_file -> 0.55.0` pattern.

#### 2. Live qq/telegram/weixin bot turn with real credentials

**Test:** Start `reasonix qq` / `reasonix telegram` / `reasonix weixin` with real bot credentials; send a test message through the channel.
**Expected:** Headless host boots, channel gateway connects, at least one inbound message triggers a `CacheFirstLoop` turn and the model replies through the channel.
**Why human:** `TELEGRAM_BOT_TOKEN` absent; QQ bot gateway credentials absent; WeChat uses interactive QR-code login (`qrcode` lib) that cannot be scanned non-interactively. Mirrors Phase 2 Telegram UAT acknowledged-deferred precedent.

#### 3. Maintainer skim of trimmed `.claude/CLAUDE.md` for narrative coherence

**Test:** Read the trimmed `.claude/CLAUDE.md` end-to-end.
**Expected:** Documentation reads as coherent project guidance — no dangling bullet fragments, no broken section flow, no internal contradictions.
**Why human:** Automated greps prove the 5 banned refs (`Tauri`/`rusqlite`/`src/server`/`desktop/src-tauri`/`copy-dashboard-vendor-css`) are gone and the 5 preserved refs survive, but documentation-quality coherence is judgment-tier (the plan's `<human-check>` block explicitly calls this out).

### Gaps Summary

**No gaps.** All 4 ROADMAP Success Criteria are verified at the contract level the phase decisions (D-01/D-02/D-03/D-04) define:

- PANEL-04 (SC1): fully verified by static + build + pack — clean CLI-only tarball, no desktop residue.
- SAFE-01 (SC2): hybrid smoke (D-03) — Tier-1 fully green, Tier-2 functional green, Tier-3 routed to UAT per contract.
- SAFE-02 (SC3): red lines intact + both e2e scripts green across 6 languages.
- SAFE-03 (SC4): zero-regression bar (D-01) met — no NEW red, 7 orphans cleared, 4 bucket-2 fixes green, 3 bucket-3 reds evidence-deferred.

The 3 acknowledged-deferred bucket-3 reds (ssh-remote, ui-mcp-marketplace-snapshot, ui-slash-suggestions) and the hydrate-cards Biome warning conform to the D-01 evidence-defer contract — they are NOT gaps. The Tier-3 cred/QR-gated bot commands conform to the D-03 acknowledged-deferred contract — they route to UAT (human_needed), not gaps.

**Critical fixes (CR-01, CR-02) verified in code** — not just claimed. The fork-protection Core Value (`reasonix update` will not silently replace the fork with upstream) is now actually enforced by the widened regex + retargeted REGISTRY_URL + aligned update commands.

**Milestone M1 is closeable** upon completion of the 3 human verification items above. The pure-CLI release is shippable: build green, commands runnable, symbol search alive, zero NEW regressions, fork identity protected.

---

_Verified: 2026-07-05T01:50:00Z_
_Verifier: Claude (gsd-verifier)_
