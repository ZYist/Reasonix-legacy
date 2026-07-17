# Phase 10: Package Identity Unification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 10-package-identity-unification
**Areas discussed:** package identity, CLI aliases, obsolete dsnix path, version display, maintained documentation, compatibility boundaries, validation platform

---

## Public identity

| Option | Description | Selected |
|--------|-------------|----------|
| Keep `reasonix` as CLI alias | Package is `reasonix-legacy`, but retain the shorter executable for compatibility. | |
| Keep `dsnix` shim temporarily | Repair and deprecate the separate shim before later removal. | |
| One package and one executable | Use only `reasonix-legacy`; remove both old aliases and the shim immediately. | ✓ |

**User's choice:** npm package and CLI are both `reasonix-legacy`; remove all `dsnix` mapping and do not retain old aliases.
**Notes:** The user explicitly preferred simplifying the current product over spending work on compatibility with the obsolete identity.

---

## Version authority

| Option | Description | Selected |
|--------|-------------|----------|
| Preserve `legacy-X.Y.Z` display | Change metadata only and keep the existing branded version line. | |
| Explicit package identity | Display `reasonix-legacy 1.3.0` and synchronize current package/lock/docs/governance. | ✓ |
| Derive from milestone only | Leave package version unchanged until final release packaging. | |

**User's choice:** Start v1.3 development with a unified `reasonix-legacy` identity.
**Notes:** Historical tags, archived milestones, and old CHANGELOG entries are evidence and must not be rewritten.

---

## Compatibility boundaries

| Option | Description | Selected |
|--------|-------------|----------|
| Rename all `reasonix` strings | Also migrate `~/.reasonix`, internal scopes, archives, and historical material. | |
| Current public surface only | Remove old public package/CLI/publication identities while preserving internal paths and history. | ✓ |
| Compatibility transition | Keep aliases and add warnings for one release. | |

**User's choice:** No public compatibility alias; standardize the maintained release surface only.
**Notes:** `~/.reasonix` and `@reasonix/core-utils` are not treated as old CLI mappings.

---

## Validation baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Cross-platform matrix | Require Windows, Ubuntu, macOS, and multiple Node versions. | |
| Windows pinned baseline | Require Windows, Node.js v24.15.0, npm 11.16.0, and PowerShell only. | ✓ |
| Best-effort local checks | Do not pin toolchain versions. | |

**User's choice:** Use only the current Windows Node environment as the mandatory test standard.
**Notes:** Other environments may provide information but cannot block v1.3.

---

## Product direction

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-provider adaptation | Add abstractions for other model providers during v1.3. | |
| DeepSeek-first | Keep the current specialized product direction and focus v1.3 on release hardening. | ✓ |

**User's choice:** Multi-model adaptation is unnecessary for this milestone.
**Notes:** This keeps the optimization differentiated from generic competitors rather than diluting DeepSeek-specific behavior.

---

## the agent's Discretion

- Structure the identity/version guard and focused tests so long as `npm run verify` enforces them.
- Apply mechanical current-document wording updates without touching archives or historical entries.
- Regenerate the lockfile with the pinned Windows npm version.

## Deferred Ideas

- Security dependency upgrades and raw-error review: Phase 11.
- CI/CodeQL/publish workflow and branch model alignment: Phase 12.
- Candidate tarball isolation and stable reassessment: Phase 13.
