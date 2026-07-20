---
phase: 12-windows-release-automation
verified: 2026-07-18T16:38:00+08:00
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 12: Windows Release Automation Verification Report

**Phase Goal:** 仓库内 CI、CodeQL、branch 指引和 npm publish contract 与真实 `v1`/`dev` 分支及 Windows Node 24.15.0 维护标准一致。
**Verified:** 2026-07-18T16:38:00+08:00
**Status:** passed
**Re-verification:** Yes — milestone closeout backfill on the current Phase 13 candidate tree.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The maintained CI workflow is Windows-only, PowerShell-based, and pinned to Node.js `24.15.0` / npm `11.16.0` on the real `v1` / `dev` branch model. | ✓ VERIFIED | `.github/workflows/ci.yml` now targets `v1` and `dev`, runs on `windows-latest`, uses PowerShell, and preserves the documented release-hardening gates; the current tree passed `npm run verify` and `node scripts/check-docs.mjs`. |
| 2 | CodeQL follows the same maintained Windows baseline and branch contract. | ✓ VERIFIED | `.github/workflows/codeql.yml` targets `v1` / `dev`, uses the same Windows/Node/npm baseline, and remains covered by the passing workflow/document drift checks. |
| 3 | The npm publication path is the only maintained stable-release artifact path, and it enforces plain `vX.Y.Z` tags plus root-package publication. | ✓ VERIFIED | `.github/workflows/publish-npm.yml` is present, `.github/workflows/release-mirror.yml` is removed, and the current documentation/workflow guard passed without detecting drift. |
| 4 | Maintained contributor and governance docs consistently describe `v1` as release/default and `dev` as development, while keeping branch protection explicitly manual. | ✓ VERIFIED | `CONTRIBUTING.md`, `docs/governance.md`, and `docs/ci-branch-protection.md` carry the same branch model and manual-operator language, and `node scripts/check-docs.mjs` passed. |
| 5 | The Phase 12 automation contract still holds on the current v1.3 candidate tree. | ✓ VERIFIED | The closeout re-run of `npm run verify` passed with `281` files and `3800` tests, preserving the package-identity and workflow-contract assertions added in Phase 12. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.github/workflows/ci.yml` | Windows-only CI on `v1` / `dev` with PowerShell + pinned Node/npm | ✓ VERIFIED | Current workflow reflects the maintained baseline and gates. |
| `.github/workflows/codeql.yml` | CodeQL aligned to the same maintained baseline | ✓ VERIFIED | Current workflow matches the Windows `v1` / `dev` contract. |
| `.github/workflows/publish-npm.yml` | npm-only publish path for `reasonix-legacy` with plain tag convention | ✓ VERIFIED | Current workflow remains the maintained publication path. |
| `.github/workflows/release-mirror.yml` | Removed / retired | ✓ VERIFIED | File is absent in the current tree. |
| `CONTRIBUTING.md`, `docs/governance.md`, `docs/ci-branch-protection.md` | Docs aligned to the maintained branch and release contract | ✓ VERIFIED | Current docs agree and the docs checker passed. |

### Command Timeline (all times Asia/Shanghai on 2026-07-18)

| Time | Command | Exit | Key Result |
|------|---------|------|------------|
| 16:36 | `npm run verify` | 0 | Full build/lint/typecheck/test suite passed: `281` files, `3800` tests passed, `15` skipped, `0` failed. |
| 16:37 | `node scripts/check-docs.mjs` | 0 | Workflow, version, package-identity, and maintained-doc drift checks passed. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| WIN-01 | 12-01 | Windows-only CI on Node `24.15.0` / npm `11.16.0` / PowerShell | ✓ SATISFIED | Current CI workflow matches the maintained baseline and the tree passes current verification. |
| WIN-02 | 12-01 | Branch model docs align to `v1` default + `dev` development | ✓ SATISFIED | Current contributor/governance/branch-protection docs agree and the docs checker passed. |
| WIN-03 | 12-01 | CodeQL covers the maintained branches without pretending remote protections exist | ✓ SATISFIED | Current CodeQL workflow targets `v1` / `dev`; docs continue to state branch protection as a manual operator action. |
| PUB-01 | 12-02 | Root publish workflow only publishes `reasonix-legacy` from plain `vX.Y.Z` tags after Windows release gates | ✓ SATISFIED | Current publish workflow remains npm-only and guarded by maintained release gates/document checks. |
| PUB-02 | 12-02 | Old `publish-dsnix` / release-mirror assumptions are gone | ✓ SATISFIED | `release-mirror.yml` is removed and package-identity/workflow checks continue to pass on the current tree. |

### Accepted Manual / External / Deferred Items

- This verification does not claim any remote GitHub branch-protection mutation, tag push, npm publish, or GitHub release action.
- Live release execution remains intentionally outside repository automation.

### Gaps Summary

No unresolved Phase 12 verification gap remains. The Windows release automation and npm-only publication contract established in Phase 12 is still satisfied by the current v1.3 candidate tree.

---

_Verified: 2026-07-18T16:38:00+08:00_
_Verifier: Codex (gsd-verifier inline fallback)_