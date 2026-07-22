# Phase 15 Plan: Migration and Release Runbook

**Milestone:** v1.3.1 LTS Release
**Phase:** 15
**Goal:** 为 1.2 用户提供可执行迁移/验证/回滚路径，并建立覆盖人工 UAT 与远端授权边界的 release runbook 与 GitHub Release 内容合同，不执行未授权远端发布。
**Requirements:** MIG-01, MIG-02, MIG-03, OPS-01, OPS-04, OPS-05, OPS-06
**Verify baseline:** `npm run verify` + `node scripts/check-docs.mjs` 全绿；不触发任何远端副作用。

## Plans

### 15-01 — Migration guide (1.2 → 1.3.1)

**Covers:** MIG-01, MIG-02, MIG-03
**Files:**
- `docs/migrating-to-1.3.md`（新建）— 安装迁移（卸载旧 `reasonix`/`dsnix`，安装 `reasonix-legacy@1.3.1`）、命令与版本验证（`reasonix-legacy --version`/`--help`）、升级前配置/会话备份、升级后基础 smoke、失败时回滚到已知本地环境、fork `v1.3.1` 发布与上游历史 lineage 标签区分；明确 1.2 不是 LTS。
- `docs/README.md` — 链接迁移文档。
- `scripts/check-docs.mjs` — `requiredDocs` 增加 `docs/migrating-to-1.3.md`。

**Acceptance:**
- 文档覆盖 MIG-01..MIG-03 全部条款，用户可照此完成迁移与回滚。
- check-docs 退出 0。

### 15-02 — Release runbook, UAT checklist, and GitHub Release content contract

**Covers:** OPS-01, OPS-04, OPS-05, OPS-06
**Files:**
- `docs/release-runbook.md`（新建）— 有序 runbook（每步含操作、证据要求、operator 授权边界）：候选冻结 → tag 前检查 → plain `v1.3.1` tag → Windows CI/CodeQL → npm publish → registry smoke → GitHub Release → 发布后核验；GitHub Release 内容合同；交互式 TTY/Telegram/Weixin 人工 UAT 清单与结果记录格式；operator 授权总则（OPS-06）。
- `docs/README.md` — 链接 runbook。
- `scripts/check-docs.mjs` — `requiredDocs` 增加 `docs/release-runbook.md`。

**Acceptance:**
- runbook 覆盖 OPS-01、OPS-04..OPS-06 全部条款。
- 不声称未执行的 branch protection 或 live UAT 已完成；远端动作均标注需显式授权。
- check-docs 退出 0。

## Execution Order

15-01 → 15-02。

## Verification (goal-backward)

| Success Criterion (ROADMAP) | Evidence |
|------------------------------|----------|
| 1.2 → reasonix-legacy 迁移/验证/回滚 + lineage 区分 | 15-01 docs/migrating-to-1.3.md |
| 配置/会话备份 + smoke + 回滚，1.2 不称 LTS | 15-01 |
| 有序留证 runbook + GitHub Release 内容合同 | 15-02 docs/release-runbook.md |
| UAT 清单 + operator 授权边界，未执行项标 best-effort | 15-02 |
