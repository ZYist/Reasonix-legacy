# Repository Governance Policy

**Owner:** ZYist / maintainer of `ZYist/reasonix-legacy`  
**Approved:** 2026-07-13  
**Status:** Active

This document is the durable authority for the four governance decisions made before repository-truth, characterization-test, and CI work. When historical files disagree with this policy, preserve their history and add a current clarification instead of rewriting the past.

## HG-01 / GOV-01 — Version authority

- `package.json` package semver is the public version authority for this fork.
- The active GSD milestone must use the matching major/minor version. The current pair is package `1.1.0` and milestone `v1.1`; they may not evolve independently.
- The Pure CLI work completed on 2026-07-05 at the end of historical GSD Phase 4. The package at that delivery point was already `1.1.0`, so `1.1.0` is the first Pure CLI release version for this fork. Historical GSD milestone `v1.0` names the completed engineering scope; it is not a second public package version.
- Existing `1.17.x`, `npm-v1.17.x`, and `desktop-v1.17.x` tags record upstream lineage. They are not releases of the current fork and must not be moved, deleted, or rewritten.
- Publishing packages, creating releases, or changing tags always remains an explicit maintainer operation; planning automation does none of these actions.

## HG-02 / GOV-02 — Repository identity and remote boundary

- `https://github.com/ZYist/reasonix-legacy` is the current maintained repository and the destination for current CI, issues, discussions, stars, and other operational links.
- `https://github.com/esengine/DeepSeek-Reasonix` is the historical upstream source and must be acknowledged clearly as attribution, not presented as the current maintenance entry point.
- All write operations are limited to local branches and the `ZYist/reasonix-legacy` fork. The `upstream` remote is read-only reference material: do not push branches or tags to it, create releases there, or modify the original author's assets.

## HG-03 / GOV-03 — Development branch and CI

- Pushes to `dev` must run the complete repository CI checks.
- Changes entering `main` should still use pull requests, but repository files must not claim that GitHub branch protection is active unless a maintainer has configured and verified it.
- Branch protection is an optional external operator action. Workflow code can provide CI checks but cannot itself enforce GitHub repository settings.

## HG-04 / GOV-04 — Risk-based coverage

- The observed whole-repository figure of **67.39%** is a non-regression reference, not an immediate global blocking threshold. Execution must refresh the baseline before relying on it.
- Newly extracted pure modules should receive high focused coverage appropriate to their risk and determinism.
- TUI behavior, CLI command wiring, and Telegram/Weixin lifecycle coverage are evaluated primarily through explicit offline behavior scenarios, including success, failure, interruption, and cleanup paths—not through a single line-coverage percentage.
- Do not add a repository-wide Vitest coverage threshold that blocks all development without a new explicit maintainer decision.

## Downstream use

- Phase 6 applies HG-01 and HG-02 when aligning current README, CHANGELOG notes, links, and planning truth.
- Phase 8 applies HG-04 when creating characterization tests and refreshing coverage evidence.
- Phase 9 applies HG-03 and HG-04 when updating CI triggers and flaky-test visibility.
