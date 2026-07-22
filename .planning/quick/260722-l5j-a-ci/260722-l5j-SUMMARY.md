---
phase: quick-260722-l5j
plan: 01
subsystem: ci
tags: [ci, github-actions, docs-gate, release-gates]
status: complete
requires:
  - "dist/cli/index.js produced by Build (tsup) step"
provides:
  - "CI Docs gate step that passes once Build has run"
affects:
  - ".github/workflows/ci.yml"
  - ".github/workflows/publish-npm.yml"
tech-stack:
  added: []
  patterns:
    - "step-order dependency: consumers of built dist must run after Build (tsup)"
key-files:
  modified:
    - .github/workflows/ci.yml
    - .github/workflows/publish-npm.yml
decisions:
  - "Move Docs gate after Build (tsup) rather than regenerating dist inside check-docs.mjs — zero logic change, fixes the root ordering bug from cc8bbad1."
metrics:
  duration: "~6 min"
  completed: "2026-07-22"
  tasks: 2
  files: 2
---

# quick-260722-l5j Plan 01: CI Docs Gate Ordering Fix Summary

Moved the "Docs gate" step to after "Build (tsup)" in both CI workflows so `scripts/check-docs.mjs` finds `dist/cli/index.js` (which it executes via `execFileSync`); `dist/` is gitignored and only exists after Build.

## What Changed

Both `.github/workflows/ci.yml` and `.github/workflows/publish-npm.yml` had the Docs gate placed between "Install dependencies" and "Lint (biome)" — before Build, so `dist/` did not yet exist and `check-docs.mjs` failed every CI run since cc8bbad1 (2026-07-19). The step block was relocated to immediately after "Build (tsup)" and before "Test (vitest + coverage)". The step content (name + run command) is byte-identical; only position changed.

### Final step order — ci.yml

0. Setup Node 24.15.0
1. Pin npm 11.16.0
2. Show runtime versions
3. Install dependencies
4. Lint (biome)
5. Typecheck
6. Build (tsup)
7. **Docs gate** (moved here from position 4)
8. Test (vitest + coverage)
9. Coverage job summary
10. τ-bench harness dry-run
11. Notify Discord on v1 failure

### Final step order — publish-npm.yml

0. Setup Node 24.15.0
1. Pin npm 11.16.0
2. Show runtime versions
3. Verify tag matches package.json version
4. Install dependencies
5. Lint (biome)
6. Typecheck
7. Build (tsup)
8. **Docs gate** (moved here from position 5)
9. Test (vitest + coverage)
10. τ-bench harness dry-run
11. Publish to npm

## Verification

- **ci.yml order assertion:** `Build(6) < Docs gate(7)` — PASS.
- **publish-npm.yml order assertion:** `Build(7) < Docs gate(8)` — PASS.
- **Local CI-order simulation:** `npm run build` → exit 0, `dist/cli/index.js` produced; `node scripts/check-docs.mjs` → exit 0, last line `documentation check passed`.
- **check-docs.mjs untouched:** `git diff HEAD~2 HEAD -- scripts/check-docs.mjs` is empty (zero lines changed).
- Release-gate presence checks in check-docs.mjs (lines 242-253 / 294-307) use `includes()` and are order-independent, so the reorder violates no gate assertion — confirmed by the passing check-docs run.

## Commits

- `8d02079d` fix(ci): run docs gate after build so dist exists
- `80e2c9d1` fix(publish): run docs gate after build so dist exists

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. No new trust boundary, secret, network, or code-execution surface introduced; the change is step-position only (T-quick-01/02 accept, T-quick-03 mitigated by this very fix).

## Self-Check: PASSED

- FOUND: .github/workflows/ci.yml (Docs gate after Build)
- FOUND: .github/workflows/publish-npm.yml (Docs gate after Build)
- FOUND: 8d02079d (ci.yml commit)
- FOUND: 80e2c9d1 (publish-npm.yml commit)
- check-docs.mjs diff empty (untouched)
