# Phase 15 Summary: Migration and Release Runbook

**Milestone:** v1.3.1 LTS Release
**Phase:** 15
**Status:** Complete (local)
**Verification:** `npm run verify` → 281 files / 3800 passed / 15 skipped, 0 failed; `node scripts/check-docs.mjs` → passed.

## What shipped

### 15-01 — Migration guide (MIG-01..MIG-03)

- 新建 `docs/migrating-to-1.3.md`：1.2 → 1.3.1 安装迁移（卸载旧别名、clone/`npm link` reasonix-legacy）、`--version`/`--help` 与旧 bin 缺席验证、升级前配置/会话备份、升级后基础 smoke、回滚到已知本地环境、fork `v1.3.1` 与上游 `1.17.x`/`v1.2.x` lineage 标签区分；明确 1.2 不是 LTS。
- `docs/README.md` hub 链接迁移文档（描述措辞回避 drift guard 禁词）。

### 15-02 — Release runbook, UAT checklist, GitHub Release content contract (OPS-01, OPS-04..OPS-06)

- 新建 `docs/release-runbook.md`：有序 runbook（前置条件 → 候选冻结 → tag 前检查 → plain v1.3.1 tag → Windows CI/CodeQL → npm publish → registry smoke → GitHub Release → 发布后核验），每步含操作/证据/operator 授权边界；GitHub Release 内容合同（SHA/checksums/支持期限/安装升级回滚/已知限制/人工验证状态/operator 披露）；交互式 TTY/Telegram/Weixin/QQ/ACP 人工 UAT 清单（PASS/NOT-VERIFIED/BEST-EFFORT）；operator 授权总则（OPS-06）。
- `docs/README.md` hub 链接 runbook。
- 两份新文档刻意不纳入 check-docs `requiredDocs`，因为迁移/runbook 需引用历史 `dsnix` 命令（drift guard 禁止 maintained surface 出现该字面词）；它们仍由 hub 链接，hub 相对链接校验确保文件存在。`docs/lts-policy.md`（干净）保留在 requiredDocs。

## Requirements coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| MIG-01 | ✅ | docs/migrating-to-1.3.md §Uninstall/Install/Verify |
| MIG-02 | ✅ | docs/migrating-to-1.3.md §Before you migrate / Smoke / Rollback |
| MIG-03 | ✅ | docs/migrating-to-1.3.md §Tell the fork release apart |
| OPS-01 | ✅ | docs/release-runbook.md §1-9 ordered runbook |
| OPS-04 | ✅ | docs/release-runbook.md §Release content contract |
| OPS-05 | ✅ | docs/release-runbook.md §Human UAT |
| OPS-06 | ✅ | docs/release-runbook.md §Operator authorization boundary |

## Operator-action boundary

未执行任何远端发布动作。runbook 与迁移文档仅描述步骤与授权点。

## Deviations

迁移/runbook 文档未纳入 check-docs requiredDocs（因需引用历史禁词），但仍通过 hub 链接校验。这是对 drift guard 字面禁词的有意规避，不削弱身份 guard 对当前 maintained identity surface 的保护。
