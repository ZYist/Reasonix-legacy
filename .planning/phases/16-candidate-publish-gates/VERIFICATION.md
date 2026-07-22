# Phase 16 Verification: Immutable Candidate and Publish Gates

**Milestone:** v1.3.1 LTS Release
**Phase:** 16
**Verified:** 2026-07-22
**Verify baseline:** Windows + Node.js 24.15.0 + npm 11.16.0 + PowerShell
**Candidate SHAs:**
- Source (HEAD): `058fba15b258947911d4466d523eadbc85f911ba`
- Tree: `e48350bb70ed1fb3929fe9d08d98de7f2db328b5`
- Branch at verification: `backup/dev-snapshot-20260720` (SHA-bound; operator must ensure this lands on `v1` before Phase 17)

> 全部步骤本地执行，未触发 tag/push/publish/release/branch-protection/live-UAT（Phase 17 operator gate）。

## VER-01 — Clean verify, docs guard, production audit

| Command | Result |
|---|---|
| `npm ci` | clean（lockfile 与 package.json 一致，无变更） |
| `npm run build` | Build success（dist/cli + DTS + 8 grammar WASM 拷贝） |
| `npm run verify` | 281 test files / 3800 passed / 15 skipped / **0 failed** |
| `node scripts/check-docs.mjs` | exit 0 — "documentation check passed" |
| `npm audit --omit=dev` | **found 0 vulnerabilities** |

## VER-02 — Real npm pack, inventory, checksums

- Tarball: `reasonix-legacy-1.3.1.tgz` — 170 files, 8,805,321 bytes.
- npm shasum: `20972322b2bf84a8508ad2b6a0bb28bdb1885312`
- npm integrity: `sha512-PszIQRmUo0a3tl29XoLG+/HlE7lJJdzqFXUHlBUhgZ3ztnLCeleSwEz0/l/61i8YxE+TD0shDoZ/sSCoS4oXNA==`
- SHA-256: `109058800b5429c4f89a8b6abcf55eff566e3a7f721093ecf3c40d0c30acc78d`
- SHA-512: `3eccc8411994a346b7b65dbd5e82c6fbf1e513b94925dcea157507941521819df3b672c27a5792c04cf4fe5ffad62f18c44f930f4b210e867fb120a84b8a1734`

Inventory（`files` field = `dist`, `data/deepseek-tokenizer.json.gz`, `patches`, `README.md`, `LICENSE`）:

- CLI runtime: `dist/cli/index.js` (+ `dist/cli/package.json` marker) ✓
- 8 grammar WASM: tree-sitter-{go,java,javascript,python,rust,typescript,tsx} + web-tree-sitter ✓
- 必需文档: `README.md`, `LICENSE` ✓（docs/ 按既有 npm 表面不打包，仓库内由 check-docs 校验）
- 禁止项扫描: 无 secrets / `.planning` / `dsnix` 记录 ✓
- 生产 `workspace:` 依赖: 无（packed package.json `dependencies` 全部为正常 semver） ✓

## VER-03 — Isolated install smoke (outside repo)

- Install dir: `$LOCALAPPDATA/Temp/rx-iso-131`（仓库外，避免 npm 归并到父项目）
- Command: `npm install --omit=dev --ignore-scripts <tarball>` → added 124 packages, 0 vulnerabilities.

| Check | Result |
|---|---|
| `reasonix-legacy --version` | `reasonix-legacy 1.3.1` ✓ |
| `reasonix-legacy --help` | 命令列表正常输出 ✓ |
| `node_modules/.bin/` | 仅 `reasonix-legacy`（+ `.cmd` / `.ps1` shim），**无** `reasonix` / `dsnix` ✓ |
| 安装后 package.json | name `reasonix-legacy`, version `1.3.1`, bin `{reasonix-legacy: dist/cli/index.js}` ✓ |
| 生产 `workspace:` 依赖 | 无 ✓ |

## VER-04 — No drift between audited candidate and release commit

候选 SHA == release commit（同一 HEAD `058fba15`）。Phase 14 身份提升、Phase 15 文档、Phase 16 验证均在此 SHA；候选冻结后未再修改产品/依赖/workflow/发布文档。

## REL-03 — Immutable candidate binding

- Source SHA `058fba15b258947911d4466d523eadbc85f911ba` + tree SHA `e48350bb...` 固定候选。
- Plain `v1.3.1` tag convention（`^v\d+\.\d+\.\d+$`），与 package.json `1.3.1` 一致。
- Checksums 见 VER-02。
- 上游历史同名标签（`1.17.x` lineage）不被当作 fork 发布（见 governance.md HG-01 / migrating-to-1.3.md）。

## OPS-02 — Publish workflow gates (static audit)

`.github/workflows/publish-npm.yml`（`workflow_dispatch`，非 `push` 触发）在 `npm publish --access public`（step line 89）之前依次执行：

1. `node scripts/check-docs.mjs`（line 71）
2. `npm run lint`（line 74）
3. `npm run typecheck`（line 77）
4. `npm run build`（line 80）
5. `node scripts/ci-test-with-retry.mjs`（line 83）
6. `npx tsx benchmarks/tau-bench/runner.ts --dry ...`（line 86）

tag 门禁（line 45-65）：tag 必须匹配 `^v\d+\.\d+\.\d+$`、必须存在于 checkout 中、且 `tag.substring(1)` 必须等于 `package.json` version，否则 throw 中止。运行环境：`windows-latest` + Node 24.15.0 + npm 11.16.0 + PowerShell（与 CI/CodeQL 基线一致）。

结论：publish workflow 只有在 package 名称/版本、plain tag、Windows toolchain、docs/lint/typecheck/build/tests/tau-bench dry-run 全部通过后才允许发布 — 满足 OPS-02。未实际 dispatch / publish（Phase 17 operator gate）。

## Requirements coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| REL-03 | ✅ | §REL-03 — SHA + tree + tag convention + checksums |
| VER-01 | ✅ | §VER-01 — verify/check-docs/audit 退出码 |
| VER-02 | ✅ | §VER-02 — pack inventory + integrity + SHA-256/512 |
| VER-03 | ✅ | §VER-03 — isolated install + bin + smoke |
| VER-04 | ✅ | §VER-04 — 候选 == release commit |
| OPS-02 | ✅ | §OPS-02 — publish 门禁顺序 + tag 校验 |

## Operator-action boundary / gaps (honest)

- 本 phase 未执行 npm publish、未创建 tag、未触达 registry。
- 候选位于 `backup/dev-snapshot-20260720`；正式发布前 operator 必须确认 `058fba15` 落到 `v1` 并从该处重新绑定 tag。
- 交互式 TTY/Telegram/Weixin/QQ 的 live 凭据 UAT 未执行（Phase 17，OPS-05 清单已就绪）。
