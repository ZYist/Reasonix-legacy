# Phase 10: Package Identity Unification - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase establishes one current package, executable, and version identity: `reasonix-legacy` at `1.3.0`. It removes the obsolete `dsnix` workspace/shim/publication path and the `reasonix` CLI alias, updates the maintained documentation surface, and adds an automated drift guard. It does not redesign providers, migrate internal configuration paths/scopes, or perform the broader dependency, CI, publication, and candidate-release work assigned to Phases 11-13.

</domain>

<decisions>
## Implementation Decisions

### Public package and executable identity
- **D-01:** The root npm package remains `reasonix-legacy` and becomes version `1.3.0`.
- **D-02:** The root package exposes exactly one CLI bin: `reasonix-legacy` → `dist/cli/index.js`.
- **D-03:** Remove the `reasonix` and `dsnix` CLI aliases immediately; there is no compatibility window, redirect, deprecation shim, or migration alias.
- **D-04:** Delete the complete `packages/dsnix` workspace package and all current workspace/lock/shim references to it.
- **D-05:** Delete `.github/workflows/publish-dsnix.yml`; Phase 12 owns the remaining root publication workflow redesign.

### Version authority and display contract
- **D-06:** Current package metadata, lockfile root metadata, runtime version output, maintained README/docs, governance text, and v1.3 milestone authority must agree on `1.3.0` / `v1.3`.
- **D-07:** `reasonix-legacy --version` must print the explicit product identity `reasonix-legacy 1.3.0`; the old `legacy-X.Y.Z` user-facing format is retired.
- **D-08:** Historical CHANGELOG entries, archived milestones, archived upstream material, and existing tags remain unchanged. A new current v1.3 entry may be added without rewriting history.
- **D-09:** The identity/version consistency guard scans only maintained current surfaces and must fail if old executable/package publication identities or version drift reappear.

### Scope guardrails
- **D-10:** Keep the existing `~/.reasonix` configuration directory; it is an internal persisted path, not a CLI alias migration target for v1.3.
- **D-11:** Keep internal workspace scopes such as `@reasonix/core-utils`; they are not public CLI aliases and are out of scope unless a direct publication conflict is discovered.
- **D-12:** Preserve the DeepSeek-first, single-provider product direction. No provider abstraction or multi-model adaptation is introduced.
- **D-13:** Windows with Node.js `v24.15.0`, npm `11.16.0`, and PowerShell is the only mandatory validation baseline. Other operating systems and Node versions are non-blocking.
- **D-14:** Do not push, tag, publish, change remote branch protection, or rewrite historical release artifacts.

### the agent's Discretion
- Exact test file placement and whether the consistency guard extends `scripts/check-docs.mjs` or uses a focused companion test, provided `npm run verify` enforces it.
- Mechanical wording changes in maintained docs, provided examples consistently use `reasonix-legacy` and historical records remain untouched.
- Lockfile regeneration approach, provided it is produced by the pinned Windows npm baseline and contains no `dsnix` workspace/package record.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone and release decision authority
- `.planning/ROADMAP.md` — Phase 10 goal, requirements mapping, success criteria, dependency ordering, and v1.3 guardrails.
- `.planning/REQUIREMENTS.md` — ID-01..ID-04 and VER-01..VER-02 acceptance requirements.
- `.planning/PROJECT.md` — DeepSeek-first product scope and current milestone constraints.
- `.planning/STATE.md` — current phase position, locked user decisions, blockers, and operator-only actions.
- `.planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md` — stable-readiness evidence and the version/package/publication drift findings that Phase 10 closes; its old recommendation to repair `dsnix` is superseded by D-03..D-05.

### Current identity implementation
- `package.json` — root package version, bin map, workspaces, scripts, and publish contents.
- `package-lock.json` — installed package graph and root/workspace identity records.
- `src/version.ts` — runtime version parsing and display contract.
- `tests/version.test.ts` — current version behavior tests.
- `scripts/check-docs.mjs` — maintained-document and live-entrypoint consistency gate.

### Current maintained documentation
- `README.md` — primary installation, invocation, version, and repository identity.
- `README.zh-CN.md` — Chinese installation and invocation surface.
- `REASONIX.md` — repository truth and maintenance scope.
- `CONTRIBUTING.md` — contributor commands and current package/branch contract.
- `.claude/CLAUDE.md` — current local agent command guidance.
- `docs/cli-reference.md` — public CLI examples checked against built help.
- `docs/governance.md` — package/milestone/version authority.
- `CHANGELOG.md` — append-only release history; add v1.3 current entry without editing historical entries.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/version.ts`: already centralizes package version extraction and version-line formatting; update rather than duplicate version logic.
- `scripts/check-docs.mjs`: already checks required docs, built CLI commands, live URLs, and maintained links; it is the natural home or integration point for the new current-surface identity guard.
- Existing CLI/version tests: can be extended to assert the sole bin name and exact `reasonix-legacy 1.3.0` output.

### Established Patterns
- Package metadata is read from the root `package.json` during build/runtime; `dist` is generated and should not become a second hand-maintained version authority.
- Documentation checks intentionally distinguish current maintained surfaces from `docs/archive/` and `.planning/milestones/`; the new guard must preserve that boundary.
- GSD changes are committed atomically by plan/task and verified before phase completion.

### Integration Points
- Root `package.json` and `package-lock.json` define install-time executable names.
- `src/version.ts` feeds `dist/cli/index.js --version` and CLI help/version tests.
- `npm run verify` must transitively run the identity/document drift guard.
- Root README, bilingual README, CLI reference, governance, contributing guidance, and local agent instructions form the maintained user-facing command surface.

</code_context>

<specifics>
## Specific Ideas

- Treat `reasonix-legacy` as the literal product name everywhere on the maintained current surface, including version output.
- Prefer deletion over compatibility logic: there should be no runnable `reasonix` or `dsnix` executable after installing the v1.3 package.
- Validate the generated lockfile on the declared Windows/Node/npm baseline rather than preserving stale root version fields by hand.

</specifics>

<deferred>
## Deferred Ideas

- Dependency vulnerability remediation and security contract updates belong to Phase 11.
- Mandatory Windows CI, CodeQL branch alignment, root npm publish/tag policy, and release-mirror cleanup belong to Phase 12.
- Clean candidate packaging, isolated tarball installation, negative alias checks, and final stable reassessment belong to Phase 13.
- Migration of `~/.reasonix` or internal `@reasonix/*` scopes is explicitly not planned for v1.3.

</deferred>

---

*Phase: 10-package-identity-unification*
*Context gathered: 2026-07-17*
