# Phase 17 Summary: External Release Validation and LTS Promotion

**Milestone:** v1.3.1 LTS Release
**Phase:** 17 (operator-gated)
**Date:** 2026-07-22
**Operator:** ZYist (npm account `shouffin`)

## Operator-gated actions performed (with explicit authorization)

All actions below were explicitly authorized by the operator and performed on the `ZYist/reasonix-legacy` fork only. `upstream` (esengine) was not touched.

### npm publish (first publish)

- Account: `shouffin` (owns `reasonix-legacy` after first publish).
- Auth: granular publish token (bypass 2FA), written to user-global `~/.npmrc` (NOT into the repo).
- Artifact published: `reasonix-legacy@1.3.1`, tarball shasum `20972322b2bf84a8508ad2b6a0bb28bdb1885312` (matches Phase 16 recorded shasum).
- Result: `+ reasonix-legacy@1.3.1`.

### OPS-03 — Registry install smoke (from npm registry, not local tarball)

| Check | Result |
|---|---|
| `npm install reasonix-legacy@1.3.1` (clean dir, outside repo) | added 124 packages |
| `reasonix-legacy --version` | `reasonix-legacy 1.3.1` |
| `reasonix-legacy --help` | command list |
| `node_modules/.bin/` | only `reasonix-legacy` (+ .cmd/.ps1); no `reasonix`/`dsnix` |
| `npm view reasonix-legacy version` | `1.3.1` |
| registry `dist.shasum` | `20972322b2bf84a8508ad2b6a0bb28bdb1885312` — matches published tarball |
| registry `dist.integrity` | `sha512-PszIQRmUo0a3tl29XoLG+/HlE7lJJdzqFXUHlBUhgZ3ztnLCeleSwEz0/l/61i8YxE+TD0shDoZ/sSCoS4oXNA==` |

## Git release state

- Release commit / tag `v1.3.1`: `319e7cd69e14374e15ef4a5db776a7021f760947` (annotated tag).
- `dev` and `v1` fast-forwarded to the release line (pure FF, no force-push; origin `v1`/`dev` were ancestors).
- Pre-existing bogus local `v1.3.0` tag (pointed at upstream commit `5b336c89`) deleted; never pushed.

## Requirements coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| OPS-03 | ✅ | §Registry install smoke — installed from registry, shasum matches |

## Remaining operator actions (NOT automated — honest gaps)

- **OPS-05 live UAT** — interactive TTY / Telegram / Weixin / QQ real-credential UAT not performed by automation; must be run by the operator with real credentials/network/TTY and recorded (PASS / NOT-VERIFIED / BEST-EFFORT) per `docs/release-runbook.md`.
- **GitHub branch protection** — external GitHub setting; recorded as observed, not asserted from workflow code.

## LTS promotion verdict

`reasonix-legacy 1.3.1` is published on npm and verified from the registry. 1.3.x LTS is promoted. Live UAT (OPS-05) and branch-protection confirmation remain operator follow-ups and do not block the published artifact.
