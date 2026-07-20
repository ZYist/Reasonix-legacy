---
phase: 12-windows-release-automation
plan: 01
subsystem: ci-codeql-branch-guidance
status: complete
completed: 2026-07-18
requirements_completed: [WIN-01, WIN-02, WIN-03]
commits: []
---

# Phase 12 Plan 01: Windows CI, CodeQL, and Branch Guidance Summary

Aligned the maintained CI, CodeQL, and branch-guidance surface to the real Windows-only `v1` / `dev` release contract.

## Delivered

- Rebuilt `.github/workflows/ci.yml` so pushes and pull requests target only `v1` and `dev`, run on `windows-latest`, use explicit PowerShell, pin Node.js `24.15.0` and npm `11.16.0`, and keep the release-hardening gates visible: `npm ci`, `node scripts/check-docs.mjs`, `npm run lint`, `npm run typecheck`, `npm run build`, the full Vitest suite via `node scripts/ci-test-with-retry.mjs`, the coverage summary, and the τ-bench dry-run.
- Rebuilt `.github/workflows/codeql.yml` around the same Windows baseline so CodeQL now covers `v1` and `dev`, pins Node.js `24.15.0` and npm `11.16.0`, uses PowerShell, and performs explicit install + build steps before analysis.
- Updated `docs/ci-branch-protection.md`, `docs/governance.md`, and `CONTRIBUTING.md` so the maintained branch model is consistently documented as `v1` default/release + `dev` development, with branch protection still called out as a manual GitHub operator setting rather than a fake in-repo guarantee.
- Extended `scripts/check-docs.mjs` and `tests/package-identity.test.ts` so workflow or maintained-doc drift back toward `main`, Ubuntu, unpinned Node/npm baselines, or missing PowerShell now fails automated verification.

## Verification

- `node scripts/check-docs.mjs` — passed.
- `npm test -- --run tests/package-identity.test.ts` — passed.
- `npm run lint` — passed.
- `npm run verify` — passed.

## Notes

- The Discord failure notification in CI was kept, but it now targets `v1` failures and uses PowerShell-native HTTP submission on the Windows runner.
- Final verification was green after formatting `tests/package-identity.test.ts` with Biome so the new workflow-contract assertions matched repository style requirements.
