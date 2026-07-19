---
phase: 13-candidate-packaging-and-stable-reassessment
plan: 01
subsystem: candidate-packaging-evidence
status: complete
completed: 2026-07-19
requirements_completed: [PKG-01, PKG-02, PKG-03]
source_candidate_sha: cc8bbad1d99b396773274b708382dca4909a6340
source_candidate_tree: ca7a220afcf3dd2a2258e35f10e51ef726894d6e
one-liner: Rebuilt Phase 13 packaging evidence from a clean immutable candidate with external, parseable, hash-bound artifacts.
---

# Phase 13 Plan 01: Candidate Packaging Evidence Summary

Produced reproducible packaging evidence for `reasonix-legacy@1.3.0` from clean source candidate `cc8bbad1d99b396773274b708382dca4909a6340` (tree `ca7a220afcf3dd2a2258e35f10e51ef726894d6e`).

## Delivered

- Verified the candidate in detached clean worktree `D:\workspace\reasonix_legacy_v13_verify` on Windows with Node `v24.15.0` and npm `11.16.0`.
- Recorded clean status before and after verification and kept all evidence outside the checkout at `D:\workspace\reasonix_legacy_v13_evidence\cc8bbad1`.
- Captured a structured per-command exit-code/timestamp/log chain in `commands.json`.
- Preserved raw npm pack output as logs and wrote separately parsed, standalone JSON to `results/pack-dry-run.json` and `results/pack.json`.
- Created and hashed `reasonix-legacy-1.3.0.tgz`: SHA-256 `50bcd5abd29696d41dcedf6e853a0b3033e171c5ab4fe18cdd7f0e39c69c0b31`; npm shasum `f436614d5eb0273d6e5241a324b0f10e7826225e`; size `8,804,910` bytes; 170 entries.
- Verified the packed manifest contains no production `workspace:*` and no production `ink`, and retains only the `reasonix-legacy` bin.
- Installed the tarball into a fresh external directory and verified `reasonix-legacy --version` and `--help`; legacy `reasonix` and `dsnix` bins were absent.

## Verification

- `npm ci` — exit 0.
- `npm run verify` — exit 0; 281 files, 3,800 passed, 15 skipped, 0 failed.
- `node scripts/check-docs.mjs` — exit 0.
- `npm audit --omit=dev --json` — exit 0; 0 production vulnerabilities.
- dry-run pack and real pack — exit 0; parsed JSON validated.
- isolated install, version, and help — exit 0.

## Evidence

External root: `D:\workspace\reasonix_legacy_v13_evidence\cc8bbad1`.

The directory is intentionally retained so all referenced paths remain valid.
