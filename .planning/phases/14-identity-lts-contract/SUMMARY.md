# Phase 14 Summary: 1.3.1 Identity and LTS Contract

**Milestone:** v1.3.1 LTS Release
**Phase:** 14
**Status:** Complete (local)
**Verify baseline:** Windows + Node.js 24.15.0 + npm 11.16.0 + PowerShell
**Verification:** `npm run verify` → 281 files / 3800 passed / 15 skipped, 0 failed; `node scripts/check-docs.mjs` → passed.

## What shipped

### 14-01 — Release identity bump 1.3.0 → 1.3.1 (REL-01, REL-02)

- `package.json` version → `1.3.1`; `package-lock.json` root version → `1.3.1`.
- `src/version.ts` 注释示例 → `1.3.1`（运行时 VERSION 仍动态读取 package.json，自动传播到 `--version`/statusline）。
- `README.md`、`docs/governance.md`、`CONTRIBUTING.md`、`.github/workflows/publish-npm.yml` 的版本/tag 示例 → 1.3.1 / v1.3.1。
- `CHANGELOG.md` 顶部 fork policy 行更新到 1.3.1，并新增 `## [1.3.1] — 2026-07-22` 条目。
- `scripts/check-docs.mjs` drift guard 全部版本断言（package version、README 字符串、governance pair、STATE milestone 正则、CHANGELOG entry、publish tag example、built CLI identity）更新到 1.3.1 / v1.3.1；dsnix/reasonix/CI/CodeQL/install-script 门禁未削弱。
- `tests/package-identity.test.ts`、`tests/cli-bundle-version-marker.test.ts` 同步到 1.3.1。

### 14-02 — LTS support contract document (LTS-01..LTS-05)

- 新建 `docs/lts-policy.md`，覆盖：支持期限（≥6 个月或下一稳定版后 90 天，取较晚者）、patch 允许范围、安全响应 best-effort 边界、EOL（≥30 天通知）与并行维护规则、下一 LTS 升级路径、1.2 历史版本声明、operator-action 边界。
- `docs/README.md` docs hub 链接 `lts-policy.md`。
- `scripts/check-docs.mjs` `requiredDocs` 增加 `docs/lts-policy.md`（自动获得 source-of-truth marker + hub link 校验）。

## Requirements coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| REL-01 | ✅ | package/lock/runtime/docs/workflow 一致 1.3.1；check-docs built CLI identity 断言 |
| REL-02 | ✅ | check-docs 保留并扩展版本/bin/tag/dsnix 断言 |
| LTS-01 | ✅ | docs/lts-policy.md §Support duration |
| LTS-02 | ✅ | docs/lts-policy.md §Patch scope |
| LTS-03 | ✅ | docs/lts-policy.md §Security response |
| LTS-04 | ✅ | docs/lts-policy.md §EOL and parallel maintenance |
| LTS-05 | ✅ | docs/lts-policy.md §Relationship to 1.2 |

## Operator-action boundary

本 phase 未执行任何远端发布动作（无 tag/push/publish/release/branch protection/live UAT）。所有变更本地可验证。

## Deviations

无偏离。版本提升范围与 PLAN.md 一致。
