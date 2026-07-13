# Phase 6: Repository Truth Alignment - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

<domain>
## Phase Boundary
Align current user-facing documentation, AI codebase maps, project state, and active test configuration with the live Pure CLI repository. Preserve historical CHANGELOG content, archived milestones, compatibility data, and the legitimate terminal `reasonix stats` dashboard.
</domain>

<decisions>
## Implementation Decisions
### Current identity and documentation
- Current operational links point to `ZYist/Reasonix-legacy`; upstream remains explicitly attributed as history.
- English and Simplified Chinese README are current canonical entry documents. Japanese content is not expanded in this phase.
- Current package/milestone version is 1.1.0/v1.1 and the product is CLI/TUI only; QQ, Telegram, and Weixin are standalone CLI commands.
### Current planning truth
- Rewrite stale `.planning/codebase` maps against live paths; do not retain removed dashboard/Tauri surfaces as current architecture.
- Keep `reasonix stats` described as a terminal report; “dashboard” in that command is not the removed Web dashboard.
### Test configuration
- Remove dead Tauri aliases, desktop globs, and their unused mocks from active Vitest configuration.
- Preserve tests for compatibility data structures when they still exercise live `src/config.ts` behavior.
### the agent's Discretion
- Exact README badge/link presentation and codebase-map structure, provided current-vs-historical ownership is unmistakable.
</decisions>

<canonical_refs>
## Canonical References
- `docs/governance.md` — locked version, fork, branch, and coverage policy.
- `.planning/ROADMAP.md` Phase 6 — scope and success criteria.
- `.planning/REQUIREMENTS.md` TRUTH-01..04 — acceptance requirements.
- `package.json`, `src/`, `tests/`, `vitest.config.ts` — live facts.
- `.planning/milestones/v1.0-ROADMAP.md` and `CHANGELOG.md` — preserved history.
</canonical_refs>

<code_context>
## Existing Code Insights
### Reusable Assets
- `src/cli/commands/{qq,telegram,weixin}.ts` and `src/cli/headless/host.ts` prove standalone channel architecture.
- `src/usage.ts` provides the legitimate terminal stats dashboard.
### Established Patterns
- Current maps live under `.planning/codebase`; archived milestones carry historical architecture.
### Integration Points
- README links and badges, current CHANGELOG preface, codebase maps, Vitest aliases/includes/mocks.
</code_context>

<specifics>
## Specific Ideas
All writes remain local/on the ZYist fork; upstream is read-only.
</specifics>
<deferred>
## Deferred Ideas
- Runtime locale reduction belongs to Phase 7.
- New characterization coverage belongs to Phase 8.
- CI trigger changes belong to Phase 9.
</deferred>
