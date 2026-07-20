# Phase 13: Candidate Packaging and Stable Reassessment - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce a locally auditable v1.3 stable candidate from the maintained Windows release baseline. The candidate must prove: clean `npm ci` + `npm run verify` on Windows/Node.js `24.15.0`/npm `11.16.0`, tarball contents limited to the real runtime surface, isolated install behavior for the packaged CLI, and a final reassessment report that binds the evidence to the candidate SHA while clearly separating local PASS evidence from manual external actions and unrun live UAT.

</domain>

<decisions>
## Implementation Decisions

### Candidate verification baseline
- **D-01:** Candidate verification must run on the maintained local baseline only: Windows, Node.js `24.15.0`, npm `11.16.0`, and PowerShell.
- **D-02:** The required release proof starts with a fresh `npm ci` followed by full `npm run verify`; slow/tokenizer/jobs coverage must stay included.
- **D-03:** The phase may reuse the current workspace for `npm ci` and `npm run verify`, but tarball-install validation must happen in a brand-new temporary directory rather than through an existing global link or dev checkout bin.

### Tarball evidence
- **D-04:** `npm pack --dry-run --json` is the authoritative packaging inventory for candidate contents and exclusions.
- **D-05:** The candidate tarball must include the maintained CLI/runtime surface (`dist`, types, tokenizer assets, README/LICENSE, and the required grammar/runtime WASM files) while excluding `.planning`, session/credential artifacts, removed dashboard/Tauri/desktop surfaces, and any `dsnix` content.
- **D-06:** If the current pack output already satisfies the contract, Phase 13 should record evidence rather than making unnecessary product changes.

### Isolated install validation
- **D-07:** A real tarball install into a fresh temporary directory must prove that `reasonix-legacy --version` and `reasonix-legacy --help` work from the packaged artifact.
- **D-08:** The isolated install must also prove that no `reasonix` or `dsnix` executable is produced.

### Final reassessment report
- **D-09:** The final stable reassessment must bind evidence to the current candidate SHA and include exact commands/results for clean verify, tarball inspection, and isolated install.
- **D-10:** The report must explicitly separate local PASS evidence from manual operator actions that were not executed here (GitHub settings, tag push, npm publish) and from live UAT that still remains out of scope.
- **D-11:** Existing docs guards from Phases 10-12 remain the release-fact authority unless Phase 13 finds a concrete gap that must be patched.

### Scope guardrails
- **D-12:** This phase does not push tags, publish packages, modify remote GitHub settings, or fake Telegram/Weixin/TTY live UAT.
- **D-13:** If packaging evidence reveals a real contract gap, the fix should be the smallest change needed and must be re-verified locally before reassessment is written.

### the agent's Discretion
- How to script or capture tarball evidence, provided the commands and results are reproducible from the report.
- Whether Phase 13 needs zero product changes (evidence-only) or a small corrective patch based on observed packaging output.
- The exact split between candidate evidence notes and the final reassessment report, provided PKG-01..03 and REL-01..02 are all traceable.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone authority and current release contract
- `.planning/ROADMAP.md` — Phase 13 goal, requirements PKG-01..PKG-03 and REL-01..REL-02, and guardrails on local vs manual actions.
- `.planning/REQUIREMENTS.md` — authoritative wording for candidate packaging and final reassessment requirements.
- `.planning/PROJECT.md` — current product boundary for the maintained fork.
- `.planning/STATE.md` — source of truth for current phase position.
- `.planning/.continue-here.md` — current resume checkpoint after Phase 12 closure.

### Prior phase outputs that Phase 13 must not contradict
- `.planning/phases/10-package-identity-unification/10-VERIFICATION.md` — public package/bin/version identity facts that the tarball install must preserve.
- `.planning/phases/11-supply-chain-and-security-contract/11-01-SUMMARY.md` — dependency and install-script provenance constraints that remain part of the release candidate.
- `.planning/phases/11-supply-chain-and-security-contract/11-02-SUMMARY.md` — maintained security surface and redaction evidence that the final report must reference accurately.
- `.planning/phases/12-windows-release-automation/12-01-SUMMARY.md` — Windows CI/CodeQL/branch contract now in force.
- `.planning/phases/12-windows-release-automation/12-02-SUMMARY.md` — npm-only publish contract and retired mirror automation.

### Runtime/package sources of truth
- `package.json` and `package-lock.json` — package identity, version, and lock-root contract.
- `scripts/check-docs.mjs` — maintained release-fact/doc drift guard.
- `tests/package-identity.test.ts` — repository identity and workflow contract assertions.
- `docs/governance.md` and `docs/ci-branch-protection.md` — maintained release policy and Windows baseline.
- `dist/`, `src/version.ts`, and build outputs produced by `npm run build` — packaged runtime surface.

### Commands this phase is expected to exercise
- `npm ci`
- `npm run verify`
- `npm pack --dry-run --json`
- `npm pack`
- isolated install commands in a fresh temporary directory
</canonical_refs>

<constraints>
## Constraints

- Maintain DeepSeek-first scope; do not introduce provider abstraction or new product features.
- Do not mutate historical archives, historical tags, or upstream assets.
- Keep manual actions explicitly labeled as manual/not-run in the final report.
- Treat the tarball contents and isolated install as candidate evidence, not as permission to publish.
</constraints>

<unknowns>
## Known Unknowns / Risks

- The tarball may still contain extra files or miss required runtime assets.
- The isolated install may expose missing packaged dependencies, missing executable shims, or unexpected extra bins.
- `npm ci` + `npm run verify` from a fresh dependency state may surface environment-sensitive failures not seen in the already-warm workspace.
</unknowns>

<verification_targets>
## Verification Targets

- Clean local candidate verification on Windows/Node.js `24.15.0`/npm `11.16.0`.
- Exact tarball inventory proving includes/excludes.
- Isolated installed CLI behavior and bin absence/presence.
- Final reassessment report bound to the candidate SHA with a clear manual-actions disclosure.
</verification_targets>

<deferred>
## Explicitly Deferred / Manual

- GitHub branch protection changes.
- Tag creation/push and npm publication.
- Live Telegram/Weixin/TTY UAT.
</deferred>

---

*Phase: 13-candidate-packaging-and-stable-reassessment*
*Context gathered: 2026-07-18*
