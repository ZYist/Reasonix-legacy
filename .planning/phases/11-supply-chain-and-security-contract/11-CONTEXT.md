# Phase 11: Supply Chain and Security Contract - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase hardens the current `reasonix-legacy` release candidate so the maintained CLI-only product no longer ships with known high-severity production dependency findings and its documented security/support contract matches the repository's real surfaces. It covers production dependency remediation, auditable npm install-script provenance, the maintained security policy, and re-verification of the historical bot/headless raw-error leak fixes. It does not redesign CI/CodeQL/publication workflows (Phase 12) or perform the final clean-install/tarball/stable-candidate reassessment (Phase 13).

</domain>

<decisions>
## Implementation Decisions

### Production dependency remediation
- **D-01:** Fix the production audit findings by updating the direct `undici` and `ws` dependencies in the root package and regenerating `package-lock.json` on the pinned Windows/Node/npm baseline.
- **D-02:** Do not hide the audit with ignores, suppressions, or unverifiable operator notes; the maintained repository must reach a clean `npm audit --omit=dev` result from a fresh install.
- **D-03:** Keep the remediation at the current product surface only. Phase 11 may update tests and documentation that enforce the contract, but it must not pull CI/publication/tagging work from Phase 12.

### Security support contract
- **D-04:** `SECURITY.md` must describe only the maintained `reasonix-legacy` npm package, CLI/TUI, embedded ACP/MCP server surfaces, and the QQ/Telegram/Weixin channel commands.
- **D-05:** Removed dashboard, local HTTP server, desktop/Tauri, and other retired surfaces must not appear as currently maintained scope in security policy text.
- **D-06:** The support policy remains maintainer-operated and release-bound: only the latest published `reasonix-legacy` minor is supported, and remote GitHub/admin actions remain explicit operator work.

### npm install-script provenance
- **D-07:** Record install-script provenance in a maintained repository document rather than relying on implicit npm behavior or unreviewed allowlists.
- **D-08:** The provenance record must cover both the repository root `prepare` script and every current `package-lock.json` entry with `hasInstallScript: true`, including whether the script is dev-only, optional, platform-specific, and why it is needed.
- **D-09:** Add an automated guard that fails if a new non-reviewed install-script package appears or if a production dependency starts requiring install scripts without the provenance record being updated.

### Raw error redaction regression scope
- **D-10:** Re-verify the previously fixed raw `Error.message` leak paths in QQ, Telegram, Weixin, and headless-host error reporting using repository tests rather than live secrets.
- **D-11:** Preserve the existing shared redaction seam (`collectBotSecrets` + `redactSecretsInText` + `formatHeadlessError`) unless a regression is found.
- **D-12:** If a regression is discovered, patch the shared sanitization path and extend focused regression tests; otherwise, keep the implementation stable and strengthen coverage/documented evidence only.

### Scope guardrails
- **D-13:** Windows with Node.js `v24.15.0`, npm `11.16.0`, and PowerShell remains the mandatory validation baseline.
- **D-14:** Do not push, tag, publish, mutate GitHub branch protection, or claim live Telegram/Weixin/TTY UAT as automated coverage.
- **D-15:** Preserve the DeepSeek-first, single-provider direction; no provider abstraction or new channel features are introduced here.

### the agent's Discretion
- Exact secure dependency patch versions within the compatible `8.x` lines, provided `npm audit --omit=dev` becomes clean and the full verification suite stays green.
- Whether contract guards live in `scripts/check-docs.mjs`, focused Vitest files, or both, provided they run under the existing `npm run verify` path.
- The presentation format of the install-script provenance table, provided every current install-script source is auditable and future drift fails CI/local verification.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone authority and release readiness
- `.planning/ROADMAP.md` — Phase 11 goal, requirements, sequencing, and release-hardening boundaries.
- `.planning/REQUIREMENTS.md` — SEC-01..SEC-05 acceptance requirements.
- `.planning/PROJECT.md` — current product boundary, Windows validation standard, and deferred release constraints.
- `.planning/STATE.md` — current milestone/phase state and operator-only actions.
- `.planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md` — stable-readiness findings that Phase 11 closes (production audit failures, outdated security scope, and install-script review gap).
- `.planning/quick/260706-co7-redact-secrets-in-bot-command-error-outp/260706-co7-VERIFICATION.md` — prior verification evidence for the raw error redaction seam that Phase 11 must re-confirm.

### Current package and dependency surface
- `package.json` — direct production dependencies, root lifecycle scripts, and verification commands.
- `package-lock.json` — resolved dependency graph and current `hasInstallScript` records.
- `SECURITY.md` — maintained security/support policy to align with the CLI-only product.
- `scripts/check-docs.mjs` — existing documentation/identity drift gate that can be extended for security/install-script contracts.

### Error redaction and channel surfaces
- `src/core/event-redaction.ts` — shared secret-redaction primitives.
- `src/config.ts` — `collectBotSecrets` and channel secret loading.
- `src/cli/headless/host.ts` — `formatHeadlessError` and the headless stderr/return seam.
- `src/cli/commands/qq.ts` — QQ command error/sendFailed handling.
- `src/cli/commands/telegram.ts` — Telegram command error/sendFailed handling.
- `src/cli/commands/weixin.ts` — Weixin command error/sendFailed handling.
- `tests/event-redaction.test.ts` — current shared redaction coverage.
- `tests/headless-host.test.ts` — current headless-host scrub coverage.
- `tests/qq-command.test.ts` — command assembly harness that can grow focused stderr-redaction checks.
- `tests/telegram-command.test.ts` — command assembly harness that can grow focused stderr-redaction checks.
- `tests/weixin-command.test.ts` — command assembly harness that can grow focused stderr-redaction checks.

### Maintained documentation surfaces
- `docs/README.md` — maintained docs hub and current product boundary.
- `docs/configuration.md` — documented credential/redaction behavior.
- `docs/channel-lifecycle-testing.md` — manual/live channel testing boundary and sanitized evidence rules.
- `docs/governance.md` — release/governance authority that must stay aligned with security policy.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-docs.mjs` already enforces current-surface documentation/identity rules and is the natural home for additional maintained security-policy assertions.
- The three channel-command tests already stub host/channel wiring; they can exercise `sendFailed` and `onError` stderr paths without live bots or credentials.
- `tests/event-redaction.test.ts` and `tests/headless-host.test.ts` already encode the shared scrubber/headless seam, so SEC-05 can be strengthened without introducing a second redaction implementation.

### Established Patterns
- Maintained-current documentation is deliberately separated from archived upstream materials and milestone archives; new guards must keep that boundary intact.
- Phase verification is Windows-first and prefers focused automated tests plus `npm run verify` rather than broad remote/operator steps.
- The channel commands snapshot bot secrets once per process and route error strings through `redactSecretsInText`; regression tests should preserve that pattern instead of bypassing it.

### Integration Points
- `package.json` + `package-lock.json` define both the production audit surface and the repository install-script surface.
- `npm audit --omit=dev`, `npm run build`, and `npm run verify` are the concrete Phase 11 validation gates.
- `SECURITY.md`, `docs/README.md`, and the docs checker together form the maintained security/support contract.

</code_context>

<specifics>
## Specific Ideas

- Treat install-script provenance as a maintained release contract: document exactly which scripts run, why they exist, and why none currently expand the production runtime surface.
- Prefer regression guards that fail on new production install scripts or reintroduced retired security surfaces rather than relying on reviewer memory.
- Preserve the current redaction architecture unless tests prove a real leak remains.

</specifics>

<deferred>
## Deferred Ideas

- Windows CI/CodeQL/publication workflow realignment belongs to Phase 12.
- Final `npm pack`, isolated tarball install, candidate SHA evidence, and release reassessment belong to Phase 13.
- Live Telegram/Weixin/TTY UAT remains manual and must be recorded outside automated repository verification.

</deferred>

---

*Phase: 11-supply-chain-and-security-contract*
*Context gathered: 2026-07-18*
