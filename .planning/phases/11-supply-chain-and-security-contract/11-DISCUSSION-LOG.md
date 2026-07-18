# Phase 11: Supply Chain and Security Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 11-supply-chain-and-security-contract
**Areas discussed:** dependency remediation, security policy scope, install-script provenance, raw error regression coverage

---

## Dependency remediation strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Direct 8.x upgrades in root deps | Update `undici` and `ws` in `package.json`, regenerate `package-lock.json`, and prove a clean production audit | ✓ |
| Temporary audit suppression | Keep vulnerable versions and waive the audit in docs/tooling | |
| Future-phase deferral | Leave the findings for Phase 12 or 13 | |

**User's choice:** `[auto] recommended default` → Direct 8.x upgrades in root deps.
**Notes:** Phase 11 owns the actual security remediation; the fix must be observable from a fresh `npm audit --omit=dev`.

---

## Security policy scope

| Option | Description | Selected |
|--------|-------------|----------|
| Match current maintained CLI surfaces only | Security policy covers `reasonix-legacy` CLI/TUI, ACP/MCP, and QQ/Telegram/Weixin commands only | ✓ |
| Keep historical surfaces for context | Continue mentioning removed dashboard/server/Tauri surfaces in current policy | |
| Collapse to package-only scope | Mention only the npm package and omit channel/runtime surfaces | |

**User's choice:** `[auto] recommended default` → Match current maintained CLI surfaces only.
**Notes:** Retired dashboard/server/Tauri surfaces stay historical evidence only, not current support scope.

---

## Install-script provenance handling

| Option | Description | Selected |
|--------|-------------|----------|
| Maintain a reviewed provenance record plus regression guard | Document root/install-script packages and fail verification on unreviewed drift | ✓ |
| Reviewer-memory only | Rely on humans to remember which install scripts are acceptable | |
| Silent allowlist | Auto-approve current install scripts without an auditable review record | |

**User's choice:** `[auto] recommended default` → Maintain a reviewed provenance record plus regression guard.
**Notes:** The repository currently has root `prepare` plus dev/optional lockfile install scripts; Phase 11 should make that review explicit.

---

## Raw error regression coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Re-verify existing redaction seam and add focused channel-command tests | Preserve current implementation unless a regression is found | ✓ |
| Rebuild error handling from scratch | Replace the current scrubber/host/channel structure preemptively | |
| Defer to final release audit | Trust old evidence and skip new automated coverage | |

**User's choice:** `[auto] recommended default` → Re-verify existing redaction seam and add focused channel-command tests.
**Notes:** Quick-task evidence suggests the leak was already fixed; Phase 11 should lock that in as milestone evidence.

---

## the agent's Discretion

- Pick the exact secure patch versions within the compatible `8.x` lines.
- Decide whether specific contract checks live in the docs checker, dedicated tests, or both.
- Structure the install-script provenance document as a maintained review artifact rather than a one-off planning note.

## Deferred Ideas

- CI/CodeQL/publication workflow realignment remains Phase 12.
- Final candidate packaging and isolated install evidence remain Phase 13.
