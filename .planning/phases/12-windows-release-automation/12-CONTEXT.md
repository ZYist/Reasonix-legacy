# Phase 12: Windows Release Automation - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Align the maintained release automation surface with the actual v1.3 contract: Windows-only GitHub Actions, pinned Node.js `24.15.0` + npm `11.16.0` + PowerShell, real `v1` default branch plus `dev` development branch guidance, a root-only `reasonix-legacy` npm publish workflow, and an explicit npm-only asset policy with the obsolete desktop/Tauri mirror assumptions retired.

</domain>

<decisions>
## Implementation Decisions

### CI baseline and branch model
- **D-01:** `.github/workflows/ci.yml` must stop advertising the historical Ubuntu/Node 22 matrix and instead run only on `windows-latest` with Node.js `24.15.0`, npm `11.16.0`, and PowerShell.
- **D-02:** The CI workflow must expose the release-hardening gates explicitly: install (`npm ci`), docs (`node scripts/check-docs.mjs`), lint, typecheck, build, full tests (with the existing retry wrapper), coverage summary, and the benchmark dry-run.
- **D-03:** CI and CodeQL triggers must follow the real branch model only: `v1` as default/release branch and `dev` as development branch. Current maintained files must not claim a `main` branch exists.
- **D-04:** GitHub branch protection remains a manual operator setting. Repository files may document the required checks and recommended targets, but must not pretend that protection is enforced automatically by code.

### CodeQL alignment
- **D-05:** `.github/workflows/codeql.yml` must analyze the same maintained branches (`v1`, `dev`) and use the Windows baseline so the security scan reflects the supported release environment.
- **D-06:** CodeQL may keep its dedicated analysis flow, but it must pin the same Node/npm baseline and build the maintained repository rather than relying on historical `main`-branch defaults.

### Publish workflow contract
- **D-07:** `.github/workflows/publish-npm.yml` remains the single publication workflow and publishes only the root `reasonix-legacy` package.
- **D-08:** The publish workflow must use the documented plain-tag convention (`v1.3.0` style), verify that the tag matches `package.json`, and run the same Windows v1.3 release gates before `npm publish`.
- **D-09:** Publication stays maintainer-operated. This phase may harden workflow checks and documentation, but it must not auto-push tags, publish from the local session, or fake remote release evidence.

### Asset policy and retired automation
- **D-10:** `release-mirror.yml`'s desktop/Tauri mirror contract is retired in this fork and should be removed rather than kept as a dormant assumption.
- **D-11:** Maintained documentation must say clearly that the current stable release artifact is the npm package only; no desktop/Tauri bundle or mirror pipeline remains in scope.

### Verification guards
- **D-12:** `scripts/check-docs.mjs` and focused repository tests must fail if workflows or maintained docs drift back to `main`, Ubuntu/Node 22 matrix assumptions, retired release-mirror/Tauri publish language, or mismatched Windows release baseline facts.
- **D-13:** The existing Phase 10/11 identity and security guards remain authoritative; Phase 12 extends them with branch/workflow/release automation checks instead of replacing them.

### Scope guardrails
- **D-14:** This phase changes only repository automation, documentation, and verification guards. It does not perform GitHub admin configuration, real tag pushes, npm publication, or live chat-channel UAT.
- **D-15:** Candidate tarball inspection, isolated install validation, and final stable reassessment remain Phase 13 work.

### the agent's Discretion
- Exact workflow step granularity, provided the required Windows release gates remain visible and enforced.
- Whether branch/release automation drift checks live primarily in `scripts/check-docs.mjs`, `tests/package-identity.test.ts`, or both, provided `npm run verify` catches the regressions.
- The specific wording used to document the `v1`/`dev` branch model and npm-only asset policy, provided maintained docs and workflows stay aligned.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone authority and release constraints
- `.planning/ROADMAP.md` — Phase 12 goal, requirements WIN-01..WIN-03 and PUB-01..PUB-02, success criteria, and release-hardening guardrails.
- `.planning/REQUIREMENTS.md` — authoritative wording for the Windows release automation and publish-contract requirements.
- `.planning/PROJECT.md` — current product boundary and milestone constraints for the maintained fork.
- `.planning/STATE.md` — current phase position, blockers, and operator-only actions.
- `.planning/.continue-here.md` — prior-session checkpoint that explicitly routes the next action to Phase 12 discussion.

### Prior phase outputs that constrain Phase 12
- `.planning/phases/10-package-identity-unification/10-CONTEXT.md` — public identity, version authority, and Windows baseline decisions that Phase 12 must preserve.
- `.planning/phases/11-supply-chain-and-security-contract/11-CONTEXT.md` — security scope, Windows baseline, and operator/manual-action guardrails that remain in force.
- `.planning/phases/11-supply-chain-and-security-contract/11-01-SUMMARY.md` — install-script provenance and docs checker extensions that Phase 12 should reuse.
- `.planning/phases/11-supply-chain-and-security-contract/11-02-SUMMARY.md` — security-contract guard patterns and the explicit boundary that CI/CodeQL/publish automation belongs to Phase 12.
- `.planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md` — the stable-readiness assessment whose workflow/branch/publish findings are being closed here.

### Current automation and governance surface
- `.github/workflows/ci.yml` — existing CI triggers, matrix, and notification behavior that must move from `main`/Ubuntu/Node 22 to the Windows v1.3 contract.
- `.github/workflows/codeql.yml` — current CodeQL trigger branches and runner assumptions.
- `.github/workflows/publish-npm.yml` — root publish workflow to realign with the Windows release gates and current tag convention.
- `.github/workflows/release-mirror.yml` — obsolete release-mirror/Tauri workflow slated for retirement.
- `docs/ci-branch-protection.md` — maintained guidance for required checks and manual protection setup.
- `docs/governance.md` — authoritative branch/release governance text.
- `CONTRIBUTING.md` — maintainer and contributor release/branch guidance.

### Existing verification hooks
- `scripts/check-docs.mjs` — maintained docs/workflow drift checker that should absorb release automation contract assertions.
- `tests/package-identity.test.ts` — existing repository contract test that already guards package identity and can grow phase-12 workflow assertions.
- `package.json` — current package name, version, scripts, publish contract, and `prepublishOnly` hook.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-docs.mjs` already enforces current-surface documentation and workflow facts; it is the natural place to codify the Windows release automation contract.
- `tests/package-identity.test.ts` already scans maintained docs and workflow files for public-surface drift; it can extend to branch/workflow/tag policy assertions without adding a whole new harness.
- `scripts/ci-test-with-retry.mjs` and `scripts/coverage-summary.mjs` are the existing CI test/reporting flow and should be preserved under the new Windows-only runner.

### Established Patterns
- Current release-hardening phases preserve historical archives and upstream evidence while updating only the maintained surface.
- Repository truth prefers explicit, source-controlled contracts over unstated GitHub settings or maintainer memory.
- Windows + Node.js `24.15.0` + npm `11.16.0` + PowerShell is already the milestone-wide validation baseline and should become the workflow baseline too.

### Integration Points
- `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`, and `.github/workflows/publish-npm.yml` jointly define the current automation and release gate contract.
- `docs/ci-branch-protection.md`, `docs/governance.md`, and `CONTRIBUTING.md` are the maintained human-facing branch/release instructions that must match the workflows.
- `scripts/check-docs.mjs` and `tests/package-identity.test.ts` provide the automated enforcement points that keep the docs/workflows from drifting after this phase lands.

</code_context>

<specifics>
## Specific Ideas

- Prefer deleting `release-mirror.yml` over keeping a CLI-only no-op that still encodes desktop/Tauri assumptions.
- Keep the publish tag namespace plain and current (`v1.3.0` style) rather than reintroducing `npm-v*` or desktop-specific prefixes.
- Make the Windows baseline visible in the workflows themselves by pinning Node/npm and using PowerShell explicitly rather than assuming runner defaults.

</specifics>

<deferred>
## Deferred Ideas

- Candidate tarball composition, isolated install checks, and final stable reassessment remain Phase 13.
- Remote GitHub branch protection, tag pushes, GitHub Releases, and npm publication remain manual maintainer actions outside local autonomous execution.
- Live Telegram/Weixin/TTY UAT remains manual and must not be represented as automated repository coverage.

</deferred>

---

*Phase: 12-windows-release-automation*
*Context gathered: 2026-07-18*
