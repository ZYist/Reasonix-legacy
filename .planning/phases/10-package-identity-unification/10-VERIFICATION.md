---
phase: 10-package-identity-unification
verified: 2026-07-17T15:43:11+08:00
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 10: Package Identity Unification Verification Report

**Phase Goal:** 用户和维护者只面对 `reasonix-legacy` package/CLI，所有 `dsnix`/旧 bin 与 1.2/1.1/0.55 当前版本漂移从发布路径中消失。
**Verified:** 2026-07-17T15:43:11+08:00
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The published root package is `reasonix-legacy@1.3.0` and exposes exactly one `reasonix-legacy` executable. | ✓ VERIFIED | Direct JSON inspection shows `package.json` name/version `reasonix-legacy`/`1.3.0` and exact bin `{ "reasonix-legacy": "dist/cli/index.js" }`; the passing package-identity test asserts the same contract. |
| 2 | The dsnix workspace, shim, package graph, lock records, and dedicated publish workflow no longer exist. | ✓ VERIFIED | `packages/dsnix` and `.github/workflows/publish-dsnix.yml` are absent; lockfile inspection found no dsnix records; the guard scans every current workflow path and body for `dsnix`. |
| 3 | Runtime version output is exactly `reasonix-legacy 1.3.0` and derives its numeric version from root package metadata. | ✓ VERIFIED | `src/version.ts` accepts only package name `reasonix-legacy`, reads its version, and builds `DISPLAY_VERSION`; both `node dist/cli/index.js --version` and `node dist/cli/index.js version` returned `reasonix-legacy 1.3.0`; version and bundle-marker tests passed. |
| 4 | Maintained installation, invocation, help, contribution, and governance surfaces use `reasonix-legacy` as the executable name. | ✓ VERIFIED | `node scripts/check-docs.mjs` passed its maintained-surface scan; built help starts `Usage: reasonix-legacy [options] [command]`; the package-identity test scans maintained docs plus current source/examples/benchmark surfaces for old executable forms. |
| 5 | Current version authority agrees on package `1.3.0` and milestone `v1.3` without rewriting archived or historical records. | ✓ VERIFIED | Package and lock root metadata agree; README, top CHANGELOG entry, governance, SECURITY, and `.planning/STATE.md` satisfy the current-version checks; Phase 10 diff contains no `docs/archive/**` or `.planning/milestones/**` changes. |
| 6 | Automated verification rejects old public bins, dsnix publication paths, or current-surface identity/version drift. | ✓ VERIFIED | `tests/package-identity.test.ts` and `scripts/check-docs.mjs` assert exact package/lock/bin/version facts, absence of dsnix path/workflow records and content, maintained-surface command identity, built help identity, both version entrypoints, and current milestone/document facts; `npm run verify` and the documentation check both passed. |

**Score:** 6/6 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Root package `reasonix-legacy@1.3.0` with one bin | ✓ VERIFIED | Exact name, version, and single bin map inspected directly. |
| `package-lock.json` | Root identity synchronized; no dsnix graph records | ✓ VERIFIED | Root name/version/bin match package metadata; no dsnix record found. |
| `src/version.ts` | Single package authority and explicit display identity | ✓ VERIFIED | Reads only `reasonix-legacy` package metadata and formats `reasonix-legacy ${semver}`. |
| `src/cli/index.ts` | Built Commander program named `reasonix-legacy` | ✓ VERIFIED | `.name("reasonix-legacy")` is wired to the real CLI; built help confirms it. |
| `tests/version.test.ts` | Numeric/display version regression coverage | ✓ VERIFIED | Included in the passing 280-file suite; checks `VERSION` against package metadata and display formatting. |
| `tests/package-identity.test.ts` | Package, lock, workflow, maintained-surface drift guard | ✓ VERIFIED | Three substantive tests cover exact identity, dsnix removal, current docs/source identity, and milestone authority. |
| `scripts/check-docs.mjs` | Built help/version and maintained-document identity gate | ✓ VERIFIED | Executed successfully after a fresh build; reports `documentation check passed`. |
| `README.md`, `CHANGELOG.md`, `docs/governance.md`, `SECURITY.md` | Current `1.3.0`/`v1.3` authority with current executable examples | ✓ VERIFIED | Required current facts are asserted by the automated guards and passed. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `package.json` | `src/version.ts` | Runtime searches ancestor package metadata and accepts only `reasonix-legacy` | ✓ WIRED | `VERSION === package.json.version` is covered by `tests/version.test.ts`. |
| `package.json` | `dist/cli/package.json` | `scripts/write-cli-package-marker.mjs` during `npm run build` | ✓ WIRED | Bundle-marker tests passed; rebuilt CLI reports the root version. |
| `src/version.ts` | CLI `--version` and `version` command | `DISPLAY_VERSION` | ✓ WIRED | Both built entrypoints returned the same exact identity. |
| `package.json` | `package-lock.json` | npm root record and exact bin map | ✓ WIRED | Direct inspection and package-identity test agree. |
| `src/cli/index.ts` | Built help | Commander `.name("reasonix-legacy")` | ✓ WIRED | Built help usage line verified at runtime and by `check-docs.mjs`. |
| Current docs/source/workflows | `npm run verify` and docs gate | `tests/package-identity.test.ts` plus `scripts/check-docs.mjs` | ✓ WIRED | Both gates execute and fail on the specified drift categories; both passed in the current tree. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `src/version.ts` | `VERSION` | Root/bundle package `version` field | `1.3.0` | ✓ VERIFIED |
| `src/version.ts` | `DISPLAY_VERSION` | `toDisplayVersion(VERSION)` | `reasonix-legacy 1.3.0` | ✓ VERIFIED |
| `src/cli/index.ts` | Commander program name | Literal singular public identity | `Usage: reasonix-legacy ...` | ✓ VERIFIED |
| `scripts/check-docs.mjs` | Built command/version output | `dist/cli/index.js` | Validates real built help and both version paths | ✓ VERIFIED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full release verification | `npm run verify` | Build, lint, typecheck, and all tests passed; 280 files, 3,794 passed, 15 skipped | ✓ PASS |
| Maintained documentation and built CLI identity | `node scripts/check-docs.mjs` | `documentation check passed` | ✓ PASS |
| Version flag | `node dist/cli/index.js --version` | `reasonix-legacy 1.3.0` | ✓ PASS |
| Version command | `node dist/cli/index.js version` | `reasonix-legacy 1.3.0` | ✓ PASS |
| Help program name | `node dist/cli/index.js --help` | First line `Usage: reasonix-legacy [options] [command]` | ✓ PASS |
| Required Windows baseline | `node --version`; `npm --version` | Node `v24.15.0`; npm `11.16.0` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ID-01 | 10-01 | Install exposes only `reasonix-legacy` CLI bin | ✓ SATISFIED | Exact root bin map and matching lock root record; no `reasonix`/`dsnix` bin. |
| ID-02 | 10-01 | Remove dsnix workspace/shim/package graph records | ✓ SATISFIED | Workspace and publish workflow absent; lock and workflows contain no dsnix records or logic. |
| ID-03 | 10-02 | Maintained command surfaces use only `reasonix-legacy`, preserving history | ✓ SATISFIED | Built help and maintained-surface scans pass; archive and milestone files unchanged by Phase 10. |
| ID-04 | 10-01 | Runtime outputs explicit `reasonix-legacy 1.3.0` from one authority | ✓ SATISFIED | Both version entrypoints match; source and tests tie numeric version to package metadata. |
| VER-01 | 10-02 | Package, lock, runtime, docs, governance, SECURITY, milestone agree | ✓ SATISFIED | Automated current-fact assertions and direct runtime checks all pass. |
| VER-02 | 10-02 | Automated checks fail on identity/version/docs/workflow drift | ✓ SATISFIED | Package identity test is included in `npm run verify`; docs checker independently validates built help/version and maintained docs. |

### Anti-Patterns Found

None. No stubs or disconnected identity constants were found in the required artifacts. The old-name allowlist is intentionally semantic rather than global: historical archives, historical CHANGELOG content, `~/.reasonix`, `@reasonix/*`, transcript metadata, and internal product prose remain valid while public command/package forms are rejected.

### Human Verification Required

None. The phase goal is a deterministic package/CLI/documentation contract and every observable behavior is exercised by local automated checks on the mandated Windows/Node/npm baseline. Package tarball installation and publication behavior are explicitly Phase 13 scope, not a Phase 10 verification gap.

### Gaps Summary

No gaps. All six phase requirements and all six plan-level observable truths are verified against the actual codebase. The Phase 10 goal is achieved and the phase can advance.

---

_Verified: 2026-07-17T15:43:11+08:00_
_Verifier: Codex (gsd-verifier inline fallback)_
