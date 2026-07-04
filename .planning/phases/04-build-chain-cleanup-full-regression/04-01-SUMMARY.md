---
phase: 04-build-chain-cleanup-full-regression
plan: 01
subsystem: infra
tags: [build-chain, ci, npm-pack, docs-trim, panel-removal, tauri-retirement]

# Dependency graph
requires:
  - phase: 01-web-panel-removal
    provides: dashboard/ + src/server/ runtime code already deleted (only build-chain residue remained)
  - phase: 03-desktop-gui-removal
    provides: desktop/ + sidecar already deleted (D-03 deferred the build-chain cleanup to Phase 4 PANEL-04)
provides:
  - Pure-CLI build chain — npm pack ships zero desktop artifacts and registers no postinstall hook
  - CI workflow step name matching the actual build command (Build (tsup))
  - .claude/CLAUDE.md aligned to the pure-CLI reality (no Rust/Tauri/desktop/dashboard surfaces documented as live)
affects: [04-02-full-regression, downstream-agents-loading-CLAUDE.md, npm-publish-path]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build-chain residue retirement = (git rm dormant artifact) + (scoped package.json/ci.yml edit) + (CLAUDE.md trim); prepare (simple-git-hooks) is independent of postinstall and survives the removal"

key-files:
  created: []
  modified:
    - package.json
    - .github/workflows/ci.yml
    - .claude/CLAUDE.md
  deleted:
    - scripts/postinstall.mjs
    - scripts/sync-desktop-version.mjs
    - .github/workflows/release.yml

key-decisions:
  - "D-02 full-sweep applied: release.yml + postinstall.mjs + sync-desktop-version.mjs all retired in one task (not dormant-only)"
  - "release-mirror.yml RETAINED per planner discretion (D-02) — triggers on `release: [published]` for ALL releases (not desktop-only); its latest.json rewrite step is documented 'No-op when latest.json is absent (CLI-only releases)'"
  - "publish-npm.yml + publish-dsnix.yml RETAINED (red line — they publish the CLI binaries)"
  - "prepare (simple-git-hooks) left intact — it is independent of the postinstall key, so pre-commit/pre-push wiring survives"
  - "CLAUDE.md trim scoped to GSD-managed stack/conventions/architecture sections only; non-GSD sections (Project, Constraints, GSD Workflow Enforcement, Developer Profile) untouched; GSD regeneration markers preserved even where sections shrank"

patterns-established:
  - "Tarball cleanliness check: `npm pack --dry-run` + grep for the deleted artifact is the cheap proof that `files`/`scripts` alignment is real, not just config-cosmetic"
  - "Scoped Edit calls (not full-file Write) for CLAUDE.md trim — preserves GSD regeneration markers and non-target sections"

requirements-completed: [PANEL-04]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Three dormant desktop build-chain artifacts deleted (scripts/postinstall.mjs, scripts/sync-desktop-version.mjs, .github/workflows/release.yml)"
    requirement: PANEL-04
    verification:
      - kind: other
        ref: "test ! -e scripts/postinstall.mjs && test ! -e scripts/sync-desktop-version.mjs && test ! -e .github/workflows/release.yml"
        status: pass
    human_judgment: false
  - id: D2
    description: "package.json aligned to pure-CLI: scripts.postinstall key + files entry both removed; build + prepare wiring intact"
    requirement: PANEL-04
    verification:
      - kind: unit
        ref: "node assertion: 'postinstall' not in p.scripts AND p.files excludes scripts/postinstall.mjs"
        status: pass
      - kind: other
        ref: "grep 'tsup && node scripts/write-cli-package-marker.mjs && node scripts/copy-tree-sitter-grammars.mjs' package.json"
        status: pass
      - kind: other
        ref: "grep '\"prepare\": \"simple-git-hooks || true\"' package.json"
        status: pass
    human_judgment: false
  - id: D3
    description: "ci.yml build step renamed from 'Build (tsup + dashboard)' to 'Build (tsup)' (matches actual `npm run build`)"
    requirement: PANEL-04
    verification:
      - kind: other
        ref: "grep 'name: Build (tsup)$' .github/workflows/ci.yml AND ! grep 'Build (tsup + dashboard)'"
        status: pass
    human_judgment: false
  - id: D4
    description: "Published tarball carries no postinstall artifact (npm pack --dry-run)"
    requirement: PANEL-04
    verification:
      - kind: other
        ref: "npm pack --dry-run 2>&1 | grep -q scripts/postinstall.mjs → must be absent"
        status: pass
    human_judgment: false
  - id: D5
    description: "Pure-CLI build path stays usable: npm run build + npm run typecheck both exit 0 (MVP vertical slice)"
    requirement: PANEL-04
    verification:
      - kind: other
        ref: "npm run build (exit 0) + npm run typecheck (exit 0)"
        status: pass
    human_judgment: false
  - id: D6
    description: ".claude/CLAUDE.md carries zero Tauri/rusqlite/src/server/desktop/src-tauri/copy-dashboard-vendor-css references while preserving Node ≥22, CLI binary entry, tree-sitter, CacheFirstLoop, simple-git-hooks"
    requirement: PANEL-04
    verification:
      - kind: other
        ref: "negative greps (5 banned surface refs = 0) + positive greps (5 preserved refs present)"
        status: pass
    human_judgment: true
    rationale: "Automated greps prove the stale refs are gone and the true refs survive, but a maintainer should skim the trimmed CLAUDE.md to confirm it still reads as coherent project guidance (no dangling bullet fragments, no broken section flow). This is a documentation-quality review explicitly called out in the plan's <human-check> block."

# Metrics
duration: 7min
completed: 2026-07-04
status: complete
---

# Phase 4 Plan 01: Build Chain Cleanup Summary

**Three dormant desktop build-chain artifacts deleted, package.json/ci.yml aligned to pure-CLI, and CLAUDE.md trimmed of every Rust/Tauri/dashboard reference — `npm pack` now ships a clean CLI-only tarball and `npm run build` stays green.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-07-04T16:24:42Z
- **Completed:** 2026-07-04T16:31:34Z
- **Tasks:** 2
- **Files modified:** 5 (2 config edits + 1 doc trim + 3 deletions, counting only paths touched)

## Accomplishments

- Deleted `scripts/postinstall.mjs` (no-op desktop workspace installer that nonetheless shipped in the tarball via `files`), `scripts/sync-desktop-version.mjs` (orphan; sole consumer was `release.yml`), and `.github/workflows/release.yml` (dormant Tauri desktop bundler that fired only on `desktop-v*` tags). Removing `release.yml` also removes the Apple/Windows code-signing + R2/GitHub-updater secret-handling workflow from the repo — a net security surface reduction (T-04-02).
- Aligned `package.json` to the pure-CLI release: dropped the `scripts.postinstall` key and removed `scripts/postinstall.mjs` from the `files` array. The `build` script (`tsup && node scripts/write-cli-package-marker.mjs && node scripts/copy-tree-sitter-grammars.mjs`) and `prepare` (`simple-git-hooks || true`) are byte-identical to their pre-task state — the tree-sitter / CLI-marker / git-hook wiring survives.
- Renamed the stale CI step `Build (tsup + dashboard)` → `Build (tsup)` in `.github/workflows/ci.yml` (the step was already running plain `npm run build`, only the label was wrong).
- Trimmed `.claude/CLAUDE.md` of every stale Rust/Tauri/dashboard reference in the GSD-managed stack, conventions, and architecture sections. Verified zero occurrences of `Tauri`, `rusqlite`, `src/server`, `desktop/src-tauri`, and `copy-dashboard-vendor-css`, while preserving `Node ≥22`, `copy-tree-sitter-grammars.mjs`, `CacheFirstLoop`, `reasonix`, and `simple-git-hooks` documentation. Downstream agents loading this project instruction are no longer misled into searching for removed directories.
- Verified the pure-CLI MVP slice: `npm run build` exits 0 (tsup success + grammar copy), `npm run typecheck` exits 0, and `npm pack --dry-run` lists no `scripts/postinstall.mjs` (tarball size 9.2 MB, 168 files, all CLI / grammar / data / patch entries).

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete dormant build artifacts and sync package.json + ci.yml (per D-02)** — `53a64966` (chore)
2. **Task 2: Trim stale desktop/Rust/Tauri sections from .claude/CLAUDE.md (per D-02)** — `bc4995cd` (docs)

**Plan metadata:** pending final commit (docs: complete plan) after SUMMARY + STATE + ROADMAP.

## Files Created/Modified

- `package.json` — removed `scripts.postinstall` key + `scripts/postinstall.mjs` from `files` array; `build`/`prepare`/`workspaces`/`bin` untouched.
- `.github/workflows/ci.yml` — renamed `Build (tsup + dashboard)` → `Build (tsup)`; matrix/lint/typecheck/test/tau-bench/Discord steps unchanged.
- `.claude/CLAUDE.md` — Languages (dropped Rust + dashboard CSS + HTML bullets), Runtime (dropped Tauri 2 + browser + workspaces clause), Frameworks (dropped React+Vite dashboard, Tauri 2 shell, Vite 5 dashboard), Key Deps (dropped `@tauri-apps/api` + react-markdown/dashboard-rendering bullets; trimmed React bullet), Configuration (dropped dashboard/desktop tsconfig + vite.config + codemirror + postinstall refs), Platform Requirements (dropped Rust toolchain + Desktop Tauri + Dashboard bullets), Conventions (deleted empty `## Special: Desktop (Tauri) Subdir` heading), Architecture (deleted Dashboard server row; trimmed Multi-surface + Layers; deleted `src/server/index.ts` Entry Points block).
- `scripts/postinstall.mjs` — **deleted**.
- `scripts/sync-desktop-version.mjs` — **deleted**.
- `.github/workflows/release.yml` — **deleted**.

## Decisions Made

- **D-02 full-sweep applied.** `release.yml`, `postinstall.mjs`, `sync-desktop-version.mjs` were all retired in one task rather than leaving the no-op/orphan cases dormant. Rationale (per 04-CONTEXT.md): the published tarball carrying a no-op postinstall + the orphan `sync-desktop-version.mjs` lingering without a consumer both contradict PANEL-04's "CLI 独立构建发布" intent.
- **`release-mirror.yml` RETAINED.** Planner determination (D-02 discretion, recorded in 04-01-PLAN.md `<read_first>`): `release-mirror.yml` triggers on `release: [published]` for ALL releases (not desktop-only), and its `latest.json` rewrite step is explicitly documented `"No-op when latest.json is absent (CLI-only releases)"`. It mirrors CLI releases too, so it stays. Only the desktop-only `release.yml` (`desktop-v*` tag trigger) is deleted.
- **`publish-npm.yml` + `publish-dsnix.yml` RETAINED.** Red line — they publish the `reasonix-legacy` / `@reasonix/dsnix` CLI binaries. Untouched.
- **CLAUDE.md trim was scoped, not blanket.** Only the GSD-managed stack/conventions/architecture sections were edited; the non-GSD Project, Constraints, GSD Workflow Enforcement, and Developer Profile sections were left alone (already accurate or managed by other tooling). GSD regeneration markers (`<!-- GSD:stack-start -->` etc.) were preserved even where a section shrank, per plan instructions.
- **Pre-existing Biome warning tolerated.** `tests/hydrate-cards.test.ts:135` emits a `suppressions/unused` warning during the pre-commit `npm run lint` hook. This is the documented pre-existing warning (STATE.md §Deferred Items, deferred to fix cycle) — Biome treats warnings as non-blocking, the hook exits 0, and the warning is unrelated to this plan's deletions. No new warnings introduced.

## Deviations from Plan

None — plan executed exactly as written. Both tasks, their `<read_first>`, `<action>`, `<verify>`, and `<acceptance_criteria>` blocks were followed precisely. The `<human-check>` block in `<verification>` is honored by the `D6` coverage entry (human judgment required for the CLAUDE.md coherence skim).

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. This plan only deleted dormant artifacts and edited build config + project docs.

## Next Phase Readiness

- **Ready for 04-02 (full regression).** The build chain is now pure-CLI: `npm run build` is green, the tarball is clean, and CI step names match reality. 04-02 can run `npm run verify` against this clean baseline and triage the 22 pre-existing-red test files (D-01 three-bucket strategy) without any desktop/build-chain noise.
- **No blockers.** Red lines honored: `scripts/copy-tree-sitter-grammars.mjs` and `src/code-query/` untouched; `publish-npm.yml`/`publish-dsnix.yml`/`release-mirror.yml` retained; no runtime source code changed; `prepare` (simple-git-hooks) wiring intact.
- **Carry-forward note for 04-02:** the pre-existing Biome warning at `tests/hydrate-cards.test.ts:135` and the 22 pre-existing-red test files (per STATE.md §Deferred Items) are scoped to SAFE-03's triage (D-01 bucket 2 vs bucket 3), not introduced by this plan.

## Tarball Before/After

- **Before (recorded by planner):** `files` array shipped `scripts/postinstall.mjs` (a 9-line no-op desktop workspace installer).
- **After:** `npm pack --dry-run` produces a 9.2 MB / 168-file tarball (`reasonix-legacy-0.55.0.tgz`) containing only `dist/` (CLI bundle + grammars + CLI ESM marker at `dist/cli/package.json`), `data/deepseek-tokenizer.json.gz`, `patches/`, `package.json`, `README.md`, `LICENSE`. No `scripts/postinstall.mjs`, no desktop artifacts, no postinstall hook registration.

## Build / Typecheck Exit Codes

- `npm run build` → **exit 0** (tsup build success in 767 ms, DTS success in 2420 ms, CLI marker written, 8 grammar wasms copied to `dist/grammars/`).
- `npm run typecheck` (`tsc --noEmit`) → **exit 0**.
- `npm pack --dry-run` → **exit 0**, tarball integrity `sha512-JW+yTyFdB5MfL...`.

---
*Phase: 04-build-chain-cleanup-full-regression*
*Completed: 2026-07-04*

## Self-Check: PASSED

- `04-01-SUMMARY.md` exists on disk.
- Three deleted paths absent from working tree: `scripts/postinstall.mjs`, `scripts/sync-desktop-version.mjs`, `.github/workflows/release.yml`.
- Task 1 commit `53a64966` present in `git log`.
- Task 2 commit `bc4995cd` present in `git log`.
