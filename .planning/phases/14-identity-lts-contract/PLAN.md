# Phase 14 Plan: 1.3.1 Identity and LTS Contract

**Milestone:** v1.3.1 LTS Release
**Phase:** 14
**Goal:** 维护者和用户面对的 package、lockfile、CLI、维护文档与发布合同一致指向 `reasonix-legacy@1.3.1`，并以 LTS 支持合同固化 1.3.x 的支持期限、patch 范围、安全响应、EOL 与并行维护规则。
**Requirements:** REL-01, REL-02, LTS-01, LTS-02, LTS-03, LTS-04, LTS-05
**Verify baseline:** Windows + Node.js 24.15.0 + npm 11.16.0 + PowerShell；`npm run verify` + `node scripts/check-docs.mjs` 全绿；不触发任何远端副作用。

## Plans

### 14-01 — Release identity bump 1.3.0 → 1.3.1 and drift guard sync

**Covers:** REL-01, REL-02
**Files:**
- `package.json` — version `1.3.0` → `1.3.1`
- `package-lock.json` — 根记录 version → `1.3.1`
- `scripts/check-docs.mjs` — 版本断言（package version、README 字符串、governance pair、STATE milestone 正则、CHANGELOG entry）更新到 1.3.1 / v1.3.1；保持 dsnix/reasonix/CI/CodeQL/install-script 门禁不削弱
- `README.md` — `reasonix-legacy 1.3.0` → `1.3.1`
- `docs/governance.md` — `package \`1.3.0\` and milestone \`v1.3\`` → `1.3.1` / `v1.3.1`（及其余 1.3.0 引用）
- `CONTRIBUTING.md` — tag 示例 `v1.3.0` → `v1.3.1`
- `CHANGELOG.md` — 顶部 fork policy 行 + 新增 `## [1.3.1] — 2026-07-22` 条目
- `.github/workflows/publish-npm.yml` — 示例 tag `v1.3.0` → `v1.3.1`
- `src/version.ts` — line 47 注释示例 `1.3.0` → `1.3.1`
- `tests/package-identity.test.ts` — 全部 1.3.0/v1.3 断言同步到 1.3.1/v1.3.1
- `tests/cli-bundle-version-marker.test.ts` — fixture version 1.3.0 → 1.3.1

**Acceptance:**
- `reasonix-legacy --version` 输出 `reasonix-legacy 1.3.1`。
- `node scripts/check-docs.mjs` 退出码 0。
- `npm run verify` 0 failed。
- drift guard 仍阻止 `reasonix`/`dsnix` bin、错误 semver、错误 tag convention 重新进入（REL-02）。

### 14-02 — LTS support contract document

**Covers:** LTS-01, LTS-02, LTS-03, LTS-04, LTS-05
**Files:**
- `docs/lts-policy.md`（新建）— 1.3.x LTS 支持合同：支持期限（≥6 个月或下一稳定版后 90 天，取较晚者）、patch 允许范围、安全响应 best-effort 边界、EOL（≥30 天通知）与并行维护规则、下一 LTS 升级路径、1.2 历史版本声明。
- `docs/README.md` — docs hub 链接 `lts-policy.md`。
- `scripts/check-docs.mjs` — `requiredDocs` 增加 `docs/lts-policy.md`（自动获得 source-of-truth marker + hub link 校验）。

**Acceptance:**
- 文档可被用户找到并清楚陈述 LTS-01..LTS-05 的全部条款。
- `node scripts/check-docs.mjs` 仍退出 0（新文档带 source-of-truth marker 并被 hub 链接）。
- `npm run verify` 0 failed。

## Execution Order

14-01 → 14-02（14-02 新增 docs 后需再次跑 check-docs 验证 hub 链接与 marker）。

## Verification (goal-backward)

| Success Criterion (ROADMAP) | Evidence |
|------------------------------|----------|
| `--version`/package/lock/runtime/README/CHANGELOG/governance 一致标识 1.3.1 | 14-01 acceptance + check-docs 0 |
| drift guard 阻止旧 bin/错误 semver/错误 tag/上游 identity | 14-01 保留并扩展断言 |
| 支持期限/patch/安全/EOL/并行维护/1.2 声明 | 14-02 docs/lts-policy.md |
