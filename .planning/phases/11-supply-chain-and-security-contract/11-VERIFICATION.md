---
phase: 11-supply-chain-and-security-contract
verified: 2026-07-18T16:38:00+08:00
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 11: Supply Chain and Security Contract Verification Report

**Phase Goal:** 稳定版候选不再携带已知 high/critical 生产漏洞，且安全支持合同与当前 CLI-only 产品表面一致。
**Verified:** 2026-07-18T16:38:00+08:00
**Status:** passed
**Re-verification:** Yes — milestone closeout backfill on the current Phase 13 candidate tree.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The maintained production dependency graph currently ships with no high or critical vulnerabilities. | ✓ VERIFIED | `npm audit --omit=dev` re-ran during milestone closeout on `d595d30b7e568b8b3e27417b739b3b20fbee5128` and returned `found 0 vulnerabilities`. |
| 2 | Install-script provenance is documented and current repository checks forbid undisclosed production install scripts. | ✓ VERIFIED | `docs/install-script-provenance.md` records the reviewed install-script set and root `prepare` hook, while `scripts/check-docs.mjs` passed its install-script-review validation against `package-lock.json`. |
| 3 | The maintained security policy now matches the real `reasonix-legacy` product surface instead of retired dashboard / server / Tauri surfaces. | ✓ VERIFIED | `SECURITY.md` scopes support to the CLI/TUI package, ACP/MCP, and optional QQ / Telegram / Weixin channels; the documentation guard passed after checking for drift back toward removed surfaces. |
| 4 | Secret-bearing channel/controller failure paths remain protected by automated regression coverage. | ✓ VERIFIED | The closeout re-run of `npm run verify` passed with `281` test files and `3800` tests, preserving the Phase 11 redaction and headless-host regression suites described in `11-02-SUMMARY.md`. |
| 5 | Phase 11 hardening remains compatible with the current shipped candidate state. | ✓ VERIFIED | The current tree passed `npm run verify`, `node scripts/check-docs.mjs`, and `npm audit --omit=dev` together, proving the dependency, policy, and regression contract still holds after later milestone work. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` / `package-lock.json` | Secure `undici` / `ws` resolutions and reproducible lock state | ✓ VERIFIED | Current root metadata remains `reasonix-legacy@1.3.0`; closeout audit on the installed production graph reports zero vulnerabilities. |
| `docs/install-script-provenance.md` | Reviewed install-script provenance and root `prepare` contract | ✓ VERIFIED | File exists and is enforced by the passing docs checker. |
| `scripts/check-docs.mjs` | Rejects provenance drift and removed-surface drift | ✓ VERIFIED | Re-ran successfully during closeout. |
| `SECURITY.md` | Current CLI-only support boundary with maintained channels only | ✓ VERIFIED | The policy matches the shipped surface and excludes retired dashboard/server/Tauri claims. |
| Regression tests | Error redaction and install-script / package-identity guards | ✓ VERIFIED | Included in the passing full `npm run verify` execution. |

### Command Timeline (all times Asia/Shanghai on 2026-07-18)

| Time | Command | Exit | Key Result |
|------|---------|------|------------|
| 16:36 | `npm run verify` | 0 | Full build/lint/typecheck/test suite passed: `281` files, `3800` tests passed, `15` skipped, `0` failed. |
| 16:37 | `node scripts/check-docs.mjs` | 0 | Documentation, install-script provenance, and maintained-surface drift checks passed. |
| 16:38 | `npm audit --omit=dev` | 0 | Production dependency graph reported `found 0 vulnerabilities`. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SEC-01 | 11-01 | `undici` / `ws` on safe compatible versions with reproducible lock results | ✓ SATISFIED | The current locked production graph passes `npm audit --omit=dev`; the reviewed Phase 11 summaries recorded the dependency remediation and lock refresh. |
| SEC-02 | 11-01 | No high / critical production vulnerabilities after clean install | ✓ SATISFIED | Closeout audit result: `found 0 vulnerabilities`. |
| SEC-03 | 11-02 | `SECURITY.md` accurately reflects the maintained CLI-only product surface | ✓ SATISFIED | Current `SECURITY.md` plus passing docs checks confirm the maintained surface and removed-surface exclusions. |
| SEC-04 | 11-01 | Install-script provenance review is documented and enforced | ✓ SATISFIED | `docs/install-script-provenance.md` exists and `scripts/check-docs.mjs` validates it against `package-lock.json`. |
| SEC-05 | 11-02 | Historical raw error-message leakage seam remains redacted or prevented by regression coverage | ✓ SATISFIED | The full verification run passed the maintained channel/headless-host suites carried forward from Phase 11. |

### Accepted Manual / External / Deferred Items

- No live credential-based channel exercise was required for this phase verification.
- This report verifies repository state only; it does not claim remote publication or GitHub administration.

### Gaps Summary

No unresolved Phase 11 verification gap remains. The supply-chain and security contract established in Phase 11 is still satisfied by the current v1.3 candidate tree.

---

_Verified: 2026-07-18T16:38:00+08:00_
_Verifier: Codex (gsd-verifier inline fallback)_