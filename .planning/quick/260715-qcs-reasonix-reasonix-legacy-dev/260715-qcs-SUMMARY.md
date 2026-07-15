---
phase: quick
plan: 260715-qcs
subsystem: documentation
tags: [documentation, cli, channels, archive, regression-tests]

requires:
  - phase: existing dev maintenance baseline
    provides: current reasonix-legacy CLI, configuration, channel, and repository surfaces
provides:
  - dated lossless archive of obsolete upstream product documentation and static website
  - source-backed current documentation hub for CLI, configuration, architecture, and channels
  - automated documentation integrity checker and regression coverage for maintained links
affects: [README, contributor-guide, runtime-help, package-metadata, future-documentation]

tech-stack:
  added: []
  patterns: [source-of-truth documentation markers, allowlisted historical attribution, TDD link regression]

key-files:
  created:
    - docs/archive/upstream-reasonix/ARCHIVE.md
    - docs/README.md
    - docs/getting-started.md
    - docs/cli-reference.md
    - docs/configuration.md
    - docs/architecture.md
    - docs/weixin-connect.md
    - docs/weixin-connect.zh-CN.md
    - scripts/check-docs.mjs
  modified:
    - README.md
    - REASONIX.md
    - CONTRIBUTING.md
    - packages/dsnix/README.md
    - packages/dsnix/package.json
    - src/skills.ts
    - src/cli/cpu-prof.ts
    - src/cli/ui/feedback.ts
    - src/cli/ui/mcp-lifecycle.ts
    - src/cli/ui/slash/handlers/basic.ts
    - tests/feedback.test.ts
    - tests/skills.test.ts
    - tests/slash.test.ts

key-decisions:
  - "Preserve obsolete upstream product material as a dated read-only archive rather than deleting or rewriting historical evidence."
  - "Treat live package, CLI, slash registry, configuration, and channel sources as documentation authority, with explicit source-of-truth markers."
  - "Point all maintained runtime and contributor entrypoints at ZYist/reasonix-legacy while retaining upstream only as attribution or a specific historical issue reference."

patterns-established:
  - "Current documentation carries a source-of-truth marker and is reachable from docs/README.md."
  - "scripts/check-docs.mjs validates structure, relative links, CLI command coverage, archive navigation, and maintenance URL allowlists without dependencies."

requirements-completed: [QCS-DOCS-01]

coverage:
  - id: QCS-D1
    description: "Obsolete upstream READMEs, working knowledge, architecture/CLI references, and static website are preserved under a dated warning archive."
    requirement: QCS-DOCS-01
    verification:
      - kind: integration
        ref: "Task 1 archive existence/survivor Node check"
        status: pass
    human_judgment: false
  - id: QCS-D2
    description: "Current documentation covers source installation, every top-level CLI command, configuration, Pure CLI architecture, and QQ/Telegram/Weixin in English and Chinese."
    requirement: QCS-DOCS-01
    verification:
      - kind: integration
        ref: "npm run build && node scripts/check-docs.mjs"
        status: pass
    human_judgment: false
  - id: QCS-D3
    description: "Repository, issue, about, QQ setup, contributor, and dsnix entrypoints resolve to the maintained fork with regression tests."
    requirement: QCS-DOCS-01
    verification:
      - kind: unit
        ref: "vitest: tests/feedback.test.ts, tests/skills.test.ts, tests/slash.test.ts"
        status: pass
      - kind: integration
        ref: "Biome focused check, npm run typecheck, git diff --check"
        status: pass
    human_judgment: false

duration: 27min
completed: 2026-07-15
status: complete
---

# Quick Task 260715-qcs: Reasonix Legacy Documentation Rebuild Summary

**Lossless upstream documentation archive plus a source-verified maintenance docs tree, automated integrity checker, and tested current-fork runtime links.**

## Performance

- **Duration:** 27 min
- **Started:** 2026-07-15T11:16:27Z
- **Completed:** 2026-07-15T11:43:19Z
- **Tasks:** 3
- **Files created/modified:** 86

## Accomplishments

- Preserved the obsolete upstream README set, working knowledge, architecture/CLI references, design material, and complete static site under `docs/archive/upstream-reasonix/` with a dated read-only warning and current-doc navigation.
- Rebuilt the active docs hub, getting started, CLI, configuration, architecture, and bilingual QQ/Telegram/Weixin guides from live `dev` sources, while retaining `REASONIX.md` as current project working knowledge.
- Added a dependency-free docs checker and TDD regressions that enforce current relative links, top-level CLI coverage, archive navigation, and `ZYist/reasonix-legacy` maintenance URLs.

## Task Commits

Each implementation task was committed atomically:

1. **Task 1: Losslessly archive obsolete upstream product documentation** — `b5727fae` (docs)
2. **Task 2: Rebuild the current maintenance documentation tree** — `9df16205` (docs)
3. **Task 3 RED: Add failing current-maintenance-link tests** — `f020931b` (test)
4. **Task 3 GREEN: Align live documentation entrypoints** — `90b3d3ad` (feat)

_TDD order was preserved: the focused tests failed against old upstream targets in `f020931b`, then passed after `90b3d3ad`._

## Files Created/Modified

- `docs/archive/upstream-reasonix/` — Dated manifest, archived root documents, and the complete historical static website snapshot.
- `docs/README.md` — Current documentation hub with user, channel, maintenance, governance, and archive navigation.
- `docs/getting-started.md`, `docs/cli-reference.md`, `docs/configuration.md`, `docs/architecture.md` — Source-backed current operational and maintainer references.
- `docs/qq-connect*.md`, `docs/telegram-connect*.md`, `docs/weixin-connect*.md` — Current bilingual standalone/TUI channel guides and access-control boundaries.
- `REASONIX.md` — Current project working knowledge instead of upstream product memory.
- `scripts/check-docs.mjs` — Zero-dependency structure, link, command-coverage, archive-entry, and maintenance-URL checker.
- `README.md`, `CONTRIBUTING.md`, `packages/dsnix/*` — Current docs, clone, repository, package, homepage, bugs, and archive entrypoints.
- `src/skills.ts`, `src/cli/cpu-prof.ts`, `src/cli/ui/feedback.ts`, `src/cli/ui/mcp-lifecycle.ts`, `src/cli/ui/slash/handlers/basic.ts` — Maintained setup, issue, design-reference, and `/about` destinations.
- `tests/feedback.test.ts`, `tests/skills.test.ts`, `tests/slash.test.ts` — Current-fork link regression coverage.

## Decisions Made

- Historical upstream product docs remain byte-preserving history behind an explicit `2026-07-15` archive warning; they are not silently deleted or presented as current guidance.
- Current docs derive claims from `package.json`, built CLI help, Commander/slash registration, configuration sources, and channel command/runtime implementations rather than the archived website.
- QQ documents its runtime first-sender binding fallback; Telegram and Weixin retain fail-closed owner/allowlist startup behavior.
- Upstream URLs remain only for explicit fork attribution and the preserved SSH RFC issue `2140`; active maintenance and issue destinations use `ZYist/reasonix-legacy`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Repaired malformed command-help parsing in the new checker**
- **Found during:** Task 2 verification
- **Issue:** The initial generated JavaScript contained literal line breaks inside a regular expression, causing `node --check` to fail.
- **Fix:** Replaced the fragile newline regex split with `help.split("Commands:")`, then applied Biome formatting and reran structure verification.
- **Files modified:** `scripts/check-docs.mjs`
- **Verification:** `node --check scripts/check-docs.mjs`, `npm run build`, and `node scripts/check-docs.mjs --structure-only`
- **Committed in:** `9df16205`

**2. [Rule 1 - Bug] Removed retired desktop instructions from the built-in QQ setup skill**
- **Found during:** Task 3 maintained-entrypoint update
- **Issue:** The target skill still directed users to removed desktop settings and described desktop tab behavior.
- **Fix:** Reframed setup around the standalone `reasonix qq` command, TUI `/qq connect`, current config/environment sources, and current fork docs.
- **Files modified:** `src/skills.ts`
- **Verification:** `tests/skills.test.ts`, focused Biome check, and full docs checker
- **Committed in:** `90b3d3ad`

---

**Total deviations:** 2 auto-fixed bugs (Rule 1)
**Impact on plan:** Both fixes were required for executable checker correctness and accurate Pure CLI guidance; no architectural or dependency scope was added.

## Issues Encountered

- The first checker write escaped `\r?\n` incorrectly; fixed before the Task 2 commit.
- The expected TDD RED run failed in all three focused areas (feedback/CPU destination, QQ skill links, and `/about` links), confirming the tests exercised the intended stale behavior.

## Verification

All required checks passed from a clean working tree after the final implementation commit:

- `npm run build`
- `node scripts/check-docs.mjs`
- `npx --no-install vitest run tests/feedback.test.ts tests/skills.test.ts tests/slash.test.ts` — 205 passed, 4 pre-existing skips
- `npx --no-install biome check scripts/check-docs.mjs src/skills.ts src/cli/cpu-prof.ts src/cli/ui/feedback.ts src/cli/ui/mcp-lifecycle.ts src/cli/ui/slash/handlers/basic.ts tests/feedback.test.ts tests/skills.test.ts tests/slash.test.ts`
- `npm run typecheck`
- `git diff --check`
- `git status --short` — clean before workflow artifact creation

## Known Stubs

No goal-blocking stubs exist in the maintained documentation or runtime entrypoints. Stub-pattern matches are intentional safe credential placeholders in current examples, preserved strings inside the read-only historical archive, or test fixtures; none flow to a current UI as unwired data.

## Threat Review

- Archive-to-user spoofing is mitigated by the dated warning manifest and current-doc links.
- Documentation drift is mitigated by source-of-truth markers and the executable docs checker.
- Secret disclosure is mitigated by obvious placeholders and explicit credential handling warnings.
- Runtime identity spoofing is mitigated by focused tests and maintenance-URL allowlisting.
- No unplanned network endpoint, authentication path, schema change, or trust-boundary file access was introduced.

## User Setup Required

None - no external service configuration or new dependency is required.

## Next Phase Readiness

- Current docs and runtime maintenance links are ready for use on `dev`.
- Future CLI/config/channel changes should update their source-of-truth documents and keep `node scripts/check-docs.mjs` green.
- Benchmark reports, package-local history, contributor/security/governance evidence, planning artifacts, and the specific upstream SSH issue reference remain preserved.

---
*Quick task: 260715-qcs*
*Completed: 2026-07-15*

## Self-Check: PASSED

- Required summary, archive, current docs, channel guides, and checker files exist.
- Task commits `b5727fae`, `9df16205`, `f020931b`, and `90b3d3ad` are present in Git history.
- SUMMARY frontmatter contains `status: complete`.
