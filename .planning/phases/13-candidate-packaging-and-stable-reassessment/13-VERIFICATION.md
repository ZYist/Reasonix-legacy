---
phase: 13-candidate-packaging-and-stable-reassessment
status: passed
verified: 2026-07-19
requirements: [PKG-01, PKG-02, PKG-03, REL-01, REL-02]
candidate_sha: cc8bbad1d99b396773274b708382dca4909a6340
candidate_tree: ca7a220afcf3dd2a2258e35f10e51ef726894d6e
evidence_root: D:\workspace\reasonix_legacy_v13_evidence\cc8bbad1\
---

# Phase 13 Verification: Candidate Packaging and Stable Reassessment

## Goal

维护者可在 Windows 标准环境中从 clean tree 复现、打包、隔离安装并审计 v1.3 stable candidate。

## Result: PASSED

本报告绑定 **source candidate** `cc8bbad1d99b396773274b708382dca4909a6340` 和 tree `ca7a220afcf3dd2a2258e35f10e51ef726894d6e`。clean worktree 为 `D:\workspace\reasonix_legacy_v13_verify`，证据写入 checkout 外部的 `D:\workspace\reasonix_legacy_v13_evidence\cc8bbad1`。

### Direct evidence

- clean-tree provenance and final status are recorded; both status outputs are empty;
- `npm ci`, `npm run verify`, docs check, production audit, pack dry-run, real pack, isolated install, version, and help all exited `0`;
- `npm run verify`: 281 test files passed, 3,800 tests passed, 15 skipped, 0 failed;
- `npm audit --omit=dev --json`: 0 production vulnerabilities;
- `pack-dry-run.json` and `pack.json` are standalone parseable JSON (raw stdout remains in `.log` files);
- packed artifact is `reasonix-legacy-1.3.0.tgz`, SHA-256 `50bcd5abd29696d41dcedf6e853a0b3033e171c5ab4fe18cdd7f0e39c69c0b31`, npm shasum `f436614d5eb0273d6e5241a324b0f10e7826225e`;
- packed manifest has package/bin identity `reasonix-legacy@1.3.0`, no production `workspace:*`, and no production `ink`;
- isolated install exposes `reasonix-legacy` only; `reasonix` and `dsnix` are absent.

## Release readiness boundary

The local candidate is release-ready. This does **not** claim that GitHub branch protection, tag push, remote CI/CodeQL, GitHub Release, npm publish, or live Telegram/Weixin/interactive-TTY UAT were executed.

## Evidence index

- `provenance.json`
- `commands.json`
- `results/final-clean-status.json`
- `results/pack-dry-run.json`
- `results/pack.json`
- `results/pack-analysis.json`
- `results/install-smoke.summary.json`
- `artifacts/reasonix-legacy-1.3.0.tgz`
