---
phase: 10-package-identity-unification
plan: 01
subsystem: package-runtime-identity
status: complete
completed: 2026-07-17
requirements_completed: [ID-01, ID-02, ID-04]
commits: [d54ccc6b, ee795559]
---

# Phase 10 Plan 01: Package Graph and Runtime Identity Summary

Established a single current release identity: npm package `reasonix-legacy` version `1.3.0` with one `reasonix-legacy` CLI bin.

## Delivered

- Root `package.json` and lockfile root metadata now agree on `reasonix-legacy@1.3.0`.
- Root bin map contains only `reasonix-legacy -> dist/cli/index.js`.
- Deleted `packages/dsnix` and `.github/workflows/publish-dsnix.yml`.
- Regenerated `package-lock.json` with Windows Node `v24.15.0` / npm `11.16.0`; no dsnix workspace or node_modules record remains.
- Runtime display now renders `reasonix-legacy X.Y.Z`; the built v1.3 CLI prints `reasonix-legacy 1.3.0`.
- Install-source and prefix detection recognize only the current `reasonix-legacy` package path while preserving the `~/.reasonix` cache directory.

## Verification

- `npm run build` — passed.
- `npm test -- --run tests/version.test.ts tests/cli-bundle-version-marker.test.ts` — 2 files, 40 tests passed.
- `npm run lint` — passed, 682 files checked.
- `node dist/cli/index.js --version` — `reasonix-legacy 1.3.0`.
- Package/lock assertion — correct name/version/bin; no `packages/dsnix` or `node_modules/dsnix` record.

## Notes

- `npm install --package-lock-only --ignore-scripts` reported existing dependency audit findings; remediation remains Phase 11 scope.
- No push, tag, publish, remote setting, archive, historical milestone, or existing release artifact was changed.
