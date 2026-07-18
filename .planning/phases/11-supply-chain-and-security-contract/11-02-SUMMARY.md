---
phase: 11-supply-chain-and-security-contract
plan: 02
subsystem: security-policy-redaction-guard
status: complete
completed: 2026-07-18
requirements_completed: [SEC-03, SEC-05]
commits: []
---

# Phase 11 Plan 02: Security Policy Alignment and Redaction Regression Evidence Summary

Aligned the maintained security policy with the real `reasonix-legacy` product surface and refreshed automated evidence that secret-bearing error paths stay redacted before reaching user-visible output.

## Delivered

- Rewrote `SECURITY.md` so it now describes only the maintained `reasonix-legacy` CLI / TUI package, ACP and MCP surfaces, and the optional QQ, Telegram, and Weixin channel commands.
- Removed current-scope references to retired dashboard, local HTTP server, and Tauri surfaces, and added a source-of-truth marker pointing back to the maintained code paths.
- Extended `scripts/check-docs.mjs` so drift back toward removed surfaces, or omission of the maintained ones, fails documentation verification automatically.
- Strengthened `tests/telegram-command.test.ts`, `tests/qq-command.test.ts`, and `tests/weixin-command.test.ts` to capture stderr-facing failure paths and assert that plaintext Telegram, QQ, Weixin, and DeepSeek secrets are replaced with `[redacted]` before user-visible output is written.
- Preserved the existing `tests/headless-host.test.ts` coverage as the baseline headless-host regression evidence while adding channel-command assertions for the historical raw-error leak seam.

## Verification

- `node scripts/check-docs.mjs` — passed.
- `npm test -- --run tests/headless-host.test.ts tests/telegram-command.test.ts tests/qq-command.test.ts tests/weixin-command.test.ts` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed.
- `npm run verify` — passed after the install-script test title was renamed to satisfy repository comment policy.

## Notes

- Verification remained fully local; no live credentials, chat services, remote GitHub administration, or publication actions were required.
- The phase intentionally stopped at maintained security-contract and regression-evidence work. CI, CodeQL, and publish automation remain Phase 12 scope.
