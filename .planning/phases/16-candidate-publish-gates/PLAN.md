# Phase 16 Plan: Immutable Candidate and Publish Gates

**Milestone:** v1.3.1 LTS Release
**Phase:** 16
**Requirements:** REL-03, VER-01, VER-02, VER-03, VER-04, OPS-02

## Plan 16-01 — Candidate verification and publish-gate audit (single plan)

**Steps:**
1. 记录候选 source/tree SHA（HEAD `058fba15` / tree `e48350bb`）。
2. VER-01：clean verify（`npm run verify` 全绿）、`node scripts/check-docs.mjs` exit 0、`npm audit --omit=dev` 0 vulnerabilities，记录退出码。
3. VER-02：真实 `npm pack` → `reasonix-legacy-1.3.1.tgz`（170 文件 / 8805321 bytes），记录 npm shasum/integrity、SHA-256、SHA-512；inventory 证明 8 grammar WASM + CLI entry + README/LICENSE，无 secrets/planning/dsnix/workspace。
4. VER-03：仓库外（`$LOCALAPPDATA/Temp/rx-iso-131`）`npm install --omit=dev --ignore-scripts <tarball>` → `--version` 输出 `reasonix-legacy 1.3.1`、`--help` 正常、`.bin` 仅 `reasonix-legacy`（+ .cmd/.ps1）、无生产 `workspace:`。
5. REL-03/VER-04：候选 == release commit（同一 SHA），绑定 plain `v1.3.1` tag convention + checksum；无未重验漂移。
6. OPS-02：静态核验 `.github/workflows/publish-npm.yml` 门禁顺序（check-docs/lint/typecheck/build/ci-test/tau-bench-dry 全部先于 `npm publish --access public`；tag 格式 `^v\d+\.\d+\.\d+$` 且与 package.json 版本匹配）。
7. 产出 VERIFICATION.md 记录全部证据。
8. 清理临时 tarball 与隔离安装目录，确认工作树除 STATE.md 外干净。

**Acceptance:**
- VER-01..VER-04、REL-03、OPS-02 全部有 SHA 绑定证据。
- 未执行任何远端发布动作。
- `node scripts/check-docs.mjs` exit 0；`npm run verify` 0 failed。
