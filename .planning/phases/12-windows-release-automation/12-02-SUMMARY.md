---
phase: 12-windows-release-automation
plan: 02
subsystem: publish-workflow-npm-only-release
status: complete
completed: 2026-07-18
requirements_completed: [PUB-01, PUB-02]
commits: []
---

# Phase 12 Plan 02: Publish Workflow and npm-Only Release Contract Summary

Hardened the maintained npm publication path so it matches the real `reasonix-legacy` stable-release contract: one root package, plain `vX.Y.Z` tags, Windows release gates before publish, and no desktop/Tauri mirror workflow.

## Delivered

- Rebuilt `.github/workflows/publish-npm.yml` on `windows-latest` with PowerShell, Node.js `24.15.0`, and npm `11.16.0`.
- Added an explicit tag/package guard so the workflow accepts only plain `vX.Y.Z` tags, documents the current stable example `v1.3.0`, verifies that the tag version matches `package.json`, and refuses to publish anything other than the root `reasonix-legacy` package.
- Reused the maintained release gates before `npm publish --access public`: `npm ci`, `node scripts/check-docs.mjs`, `npm run lint`, `npm run typecheck`, `npm run build`, and the full Vitest suite via `node scripts/ci-test-with-retry.mjs`.
- Deleted `.github/workflows/release-mirror.yml` to retire the leftover desktop/Tauri mirror path and updated `docs/governance.md`, `CONTRIBUTING.md`, and `docs/ci-branch-protection.md` so the maintained stable-release artifact is stated plainly as the npm package only.
- Extended `scripts/check-docs.mjs` and `tests/package-identity.test.ts` so drift in publish tags, package identity, Windows release gates, or the retired mirror workflow now fails automatically.

## Verification

- `node scripts/check-docs.mjs` — passed.
- `npm test -- --run tests/package-identity.test.ts` — passed.
- `npm run lint` — passed.
- `npm run verify` — passed.

## Notes

- No remote publication action was executed here: no tag push, no npm publish, no GitHub release creation, and no branch-protection change.
- Candidate tarball inspection, isolated install checks, and the final stable reassessment remain Phase 13 scope.
