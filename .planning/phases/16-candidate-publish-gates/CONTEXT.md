# Phase 16 Context: Immutable Candidate and Publish Gates

**Milestone:** v1.3.1 LTS Release
**Phase:** 16
**Depends on:** Phase 15 (migration + runbook)
**Requirements:** REL-03, VER-01, VER-02, VER-03, VER-04, OPS-02

## Goal

在不可变候选上完成 Windows clean verify、production audit、真实 npm pack、清单/checksum、外部隔离安装证据，并校验 publish workflow 只有在全部门禁通过时才允许发布 `reasonix-legacy@1.3.1`，但不实际执行未授权 publish。

## Candidate

- Source SHA (HEAD): `058fba15b258947911d4466d523eadbc85f911ba`
- Tree SHA: `e48350bb70ed1fb3929fe9d08d98de7f2db328b5`
- Branch at verification: `backup/dev-snapshot-20260720`（候选验证基于 SHA；正式发布需 operator 确认该 SHA 落到 `v1`）
- Version: `reasonix-legacy 1.3.1`

## Scope

**In scope (all local, no publish):**
- VER-01：clean checkout 上 `npm ci`/verify/check-docs/production audit 复现，记录退出码。
- VER-02：真实 `npm pack`，记录 inventory、npm integrity、SHA-256/SHA-512，证明含 CLI runtime + 8 grammar + 必需文档（README/LICENSE）。
- VER-03：仓库外干净目录安装候选 tarball，`--version`/`--help` smoke，确认唯一 bin、无 `reasonix`/`dsnix`、无生产 `workspace:`。
- VER-04：audited candidate 到 release commit 无未重验漂移（候选 == release commit）。
- REL-03：候选绑定到不可变 source/tree SHA + plain `v1.3.1` tag convention + checksum。
- OPS-02：静态核验 publish workflow 门禁顺序（全部 release gates 先于 `npm publish`；tag 格式与 package.json 版本匹配）。

**Out of scope (Phase 17 operator gate):**
- git tag/push、npm publish、GitHub Release、registry smoke、live UAT。

## Risks / Guardrails

- 隔离安装必须在仓库外执行（npm 会向父级项目归并），避免污染父 package.json/lock。
- 不执行 `npm publish`、不创建 tag、不触达 registry。

## Open Questions

无。
