# Phase 5: Governance Decisions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-07-13
**Phase:** 5-governance-decisions
**Areas discussed:** version authority, repository identity, development branch policy, coverage policy

## HG-01 — Version authority
| Option | Description | Selected |
|---|---|---|
| A | Package semver authoritative; GSD milestone may remain independent | |
| B | GSD milestone and package semver must align | ✓ |

**User's choice:** 1B
**Notes:** Current fork package semver is authoritative; milestone naming must align. Historical upstream tags remain lineage only. No tag movement or release action.

## HG-02 — Repository identity
| Option | Description | Selected |
|---|---|---|
| A | Current links point to ZYist fork; upstream retained only as attribution | ✓ |
| B | Continue showing upstream operational assets | |

**User's choice:** 2A
**Notes:** All operations are restricted to the user's ZYist fork and must not interfere with the original author's branches.

## HG-03 — Development branch policy
| Option | Description | Selected |
|---|---|---|
| A | `dev` pushes run CI; PR remains recommended for `main` | ✓ |
| B | Protected-PR-only path into `main` | |

**User's choice:** 3A

## HG-04 — Coverage policy
| Option | Description | Selected |
|---|---|---|
| A | Risk-based policy; global baseline is non-regression reference, scenarios protect critical paths | ✓ |
| B | Immediate global hard threshold | |

**User's choice:** 4A

## the agent's Discretion
- Documentation layout and cross-linking while preserving the locked semantics.

## Deferred Ideas
- Repository truth edits: Phase 6.
- Characterization and fresh coverage baseline: Phase 8.
- CI implementation and external branch settings: Phase 9.
