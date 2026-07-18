---
phase: 11-supply-chain-and-security-contract
plan: 01
subsystem: dependency-audit-install-scripts
status: complete
completed: 2026-07-18
requirements_completed: [SEC-01, SEC-02, SEC-04]
commits: []
---

# Phase 11 Plan 01: Dependency Remediation and Install-Script Provenance Summary

Remediated the remaining production dependency audit findings and turned npm install-script review into a maintained, test-backed contract.

## Delivered

- Updated the production dependency ranges for `undici` and `ws`, then regenerated `package-lock.json` so the reviewed secure resolutions are recorded in the lockfile.
- Added `docs/install-script-provenance.md` with the root `prepare` script, the complete reviewed `hasInstallScript` set from `package-lock.json`, and an explicit statement that production install scripts are not allowed.
- Linked the new provenance document from `docs/README.md` so the install-script review is discoverable from maintained documentation.
- Extended `scripts/check-docs.mjs` to require the provenance document, parse its `install-script-review` block, verify the reviewed install-script set against `package-lock.json`, enforce the root `prepare` script contract, and fail if any non-dev install script appears.
- Added `tests/install-script-provenance.test.ts` and expanded `tests/package-identity.test.ts` so the reviewed install-script facts stay aligned with the repository state.

## Verification

- `node scripts/check-docs.mjs` — passed.
- `npm test -- --run tests/install-script-provenance.test.ts tests/package-identity.test.ts` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed.
- `npm audit --omit=dev --json` — production vulnerabilities reported as `high: 0`, `critical: 0`, `total: 0`.

## Notes

- The reviewed `hasInstallScript` set remains limited to the root `prepare` hook plus dev and optional tooling packages recorded in `package-lock.json`; no current production dependency requires an install script.
- Full-suite verification initially surfaced a repository comment-policy failure because the new test title used a `Phase 11` label; the description was renamed to repository-neutral wording before final verification.
