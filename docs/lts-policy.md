# 1.3.x LTS Support Policy

<!-- source-of-truth: package.json; docs/governance.md; .planning/REQUIREMENTS.md -->

`reasonix-legacy` 1.3.x is the maintained Long-Term Support (LTS) line of
[`ZYist/reasonix-legacy`](https://github.com/ZYist/reasonix-legacy). This document
is the durable authority for the support duration, patch scope, security response,
end-of-life (EOL) notice, and parallel-maintenance rules of the 1.3.x LTS line.

The current LTS release is `reasonix-legacy 1.3.1` (milestone `v1.3.1`). See
[`governance.md`](governance.md) for version authority and the
[`CHANGELOG.md`](../CHANGELOG.md) for release contents.

## Support duration (LTS-01)

1.3.x is supported for the **longer** of:

- **at least 6 months** from the `1.3.1` release date; or
- **90 days after the next stable release** (for example, a hypothetical `1.4.0`).

The line is supported until the later of those two dates. The next stable release
does not immediately retire 1.3.x; see [Parallel maintenance](#parallel-maintenance-lts-04)
below.

Support means: the maintained branch (`v1`) accepts the patch categories listed in
[Patch scope](#patch-scope-lts-02), release automation can cut follow-up `1.3.x`
patch tags, and maintainers answer issues filed against the 1.3.x line on a
best-effort basis.

## Patch scope (LTS-02)

Only changes that preserve the installed behavior contract of `reasonix-legacy`
are eligible for a 1.3.x patch release. The allowed patch categories are:

- **Security fixes** — fixes for vulnerabilities reported against the CLI/TUI,
  MCP/ACP surfaces, or chat channels.
- **Credential or data-leak fixes** — fixes that prevent secrets, tokens, or
  user data from being written to logs, telemetry, or shared locations.
- **Install/startup blocker fixes** — fixes for `npm install`, `reasonix-legacy`
  startup, or first-run failures on the maintained baseline
  (Windows + Node.js 24.15.0 + npm 11.16.0 + PowerShell).
- **Critical regressions** — fixes for behavior that worked in a prior 1.3.x
  release and broke in a later one.
- **Necessary dependency upgrades** — dependency bumps required to resolve a
  security advisory or an install blocker; not general dependency refreshes.
- **Documentation clarifications** — corrections to maintained docs that prevent
  user error or misstate the support contract.

New product features, new surfaces, provider/model abstractions, and protected
core refactors are **not** eligible for 1.3.x patches. They belong on the next
stable line or a dedicated follow-up milestone.

## Security response (LTS-03)

For **critical** and **high** severity reports against the 1.3.x LTS line:

- The maintainer will acknowledge the report and aim to provide a fix or
  documented mitigation.
- When maintainer resources allow, the target is a fix in the next 1.3.x patch.
- This is a **best-effort** commitment by a small maintenance team. This policy
  does not promise a hard SLA, a fixed response time, or a guaranteed patch
  date. Where a target cannot be met, the report will say so honestly rather
  than fabricate a timeline.

Report security issues through the process described in
[`../SECURITY.md`](../SECURITY.md). Do not open public issues for sensitive
reports.

## End-of-life and parallel maintenance (LTS-04)

When the next stable release (for example `1.4.0`) ships:

- 1.3.x enters **parallel maintenance**: it continues to receive the patch
  categories above, but new non-critical work moves to the next stable line.
- The maintainer will give **at least 30 days notice** before 1.3.x reaches
  end-of-life. Notice is given via the repository README/CHANGELOG and the
  GitHub release notes of the current LTS.
- The upgrade path to the next LTS (or the next stable line) will be documented
  in the migration guide at release time.

Once 1.3.x reaches EOL it no longer receives patches. Users should move to the
then-current stable line.

## Relationship to 1.2 (LTS-05)

`1.2` is **historical only**. It is not an LTS line, is not republished, and does
not receive routine patches or compatibility fixes. Users on 1.2 should migrate
to `reasonix-legacy 1.3.1` — see the migration guide. Historical 1.2 tags and
entries remain in the repository as provenance, not as a supported release.

## Operator-action boundary

Creating tags, pushing, publishing to npm, publishing GitHub Releases, changing
branch protection, and running live credential UAT are **explicit operator
actions**. Repository automation (CI, the publish workflow, this document) can
verify preconditions and record results, but it does not perform or fabricate
those actions. A local green build is not equivalent to a published, registry-
installed release.
