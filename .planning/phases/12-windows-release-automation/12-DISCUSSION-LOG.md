# Phase 12: Windows Release Automation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 12-windows-release-automation
**Areas discussed:** CI baseline, branch model, CodeQL alignment, publish workflow contract, asset policy and retired automation

---

## CI baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Keep cross-platform historical matrix | Preserve Ubuntu and Windows plus older Node baselines for broader smoke coverage. | |
| Windows-only pinned release baseline | Run CI only on Windows with Node.js `24.15.0`, npm `11.16.0`, and PowerShell. | ✓ |
| Best-effort runner defaults | Leave the workflow on floating runner/runtime versions. | |

**User's choice:** `[auto] recommended default` → Windows-only pinned release baseline.
**Notes:** The milestone already declared Windows + Node.js `24.15.0` + npm `11.16.0` + PowerShell as the mandatory validation environment.

---

## Branch model

| Option | Description | Selected |
|--------|-------------|----------|
| Continue using `main` in docs/workflows | Treat `main` as the release/default branch even though the fork uses different branches. | |
| Align to `v1` default and `dev` development branches | Update CI, CodeQL, and maintained docs to describe only the real branch model. | ✓ |
| Document branch choice later | Leave branch naming ambiguous until after the stable candidate. | |

**User's choice:** `[auto] recommended default` → Align to `v1` default and `dev` development branches.
**Notes:** Repository files must stop referring to a nonexistent `main` branch while still making clear that protection settings are operator-managed.

---

## CodeQL alignment

| Option | Description | Selected |
|--------|-------------|----------|
| Keep CodeQL on historical defaults | Leave `codeql.yml` on `main` and Ubuntu for minimal churn. | |
| Match maintained branches and Windows baseline | Run CodeQL on `v1` / `dev` and pin the same Windows Node/npm baseline as CI. | ✓ |
| Disable CodeQL temporarily | Remove security scanning until after stable release work. | |

**User's choice:** `[auto] recommended default` → Match maintained branches and Windows baseline.
**Notes:** Security automation should follow the maintained release environment rather than old upstream defaults.

---

## Publish workflow contract

| Option | Description | Selected |
|--------|-------------|----------|
| Publish from current Ubuntu shortcut | Keep the existing lightweight publish job and rely on `prepublishOnly` only. | |
| Reuse Windows release gates before publish | Verify `v1.3.0`-style tags, run the Windows docs/lint/typecheck/build/test gates, then publish the root `reasonix-legacy` package. | ✓ |
| Defer publish automation to Phase 13 | Leave workflow alignment incomplete until candidate packaging work starts. | |

**User's choice:** `[auto] recommended default` → Reuse Windows release gates before publish.
**Notes:** Publication remains a maintainer-triggered action; the workflow should simply enforce the same contract as local release verification.

---

## Asset policy and retired automation

| Option | Description | Selected |
|--------|-------------|----------|
| Keep dormant desktop mirror workflow | Preserve `release-mirror.yml` as a no-op in case desktop assets return later. | |
| Retire desktop/Tauri release automation now | Remove the mirror workflow and document the fork as npm-package-only for the stable release. | ✓ |
| Replace with a new GitHub Release asset flow | Keep non-npm release assets as part of the stable release contract. | |

**User's choice:** `[auto] recommended default` → Retire desktop/Tauri release automation now.
**Notes:** This fork's maintained release surface is the npm package; historical desktop/Tauri release behavior remains archive-only context.

---

## the agent's Discretion

- Decide the exact workflow step granularity as long as the Windows release gates remain explicit and enforced.
- Choose whether the drift guard lives primarily in `scripts/check-docs.mjs`, `tests/package-identity.test.ts`, or both.
- Apply documentation wording changes needed to keep branch and release policy aligned across maintained docs.

## Deferred Ideas

- Final candidate packaging and isolated tarball installation remain Phase 13.
- Remote GitHub branch protection, release publication, and tag push execution remain manual maintainer actions.
