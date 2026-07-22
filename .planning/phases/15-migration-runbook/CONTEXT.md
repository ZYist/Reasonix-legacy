# Phase 15 Context: Migration and Release Runbook

**Milestone:** v1.3.1 LTS Release
**Phase:** 15
**Depends on:** Phase 14 (identity + LTS contract locked to 1.3.1)
**Requirements:** MIG-01, MIG-02, MIG-03, OPS-01, OPS-04, OPS-05, OPS-06

## Goal

为 1.2 用户提供可执行的 `reasonix`/`dsnix` → `reasonix-legacy` 迁移、验证与回滚路径，并建立覆盖人工 UAT 与远端授权边界的 release runbook，准备 GitHub Release 内容合同，但不执行任何未授权远端发布。

## Why This Phase Next

身份已在 Phase 14 锁定为 1.3.1，LTS 合同已固化。迁移文档必须引用确定的版本号和支持期限；release runbook 必须引用已固化的 LTS patch 范围与 operator 边界。本 phase 只产出文档与 runbook，不触碰不可变候选或远端发布物。

## Current State (evidence)

- `docs/getting-started.md` 已有从 GitHub source 安装/build/link 的说明（基于 `reasonix-legacy`）。
- `README.md` 当前版本块已是 `reasonix-legacy 1.3.1`。
- 1.2 历史命令 `reasonix`/`dsnix` 已在 v1.3 删除；本仓库不再提供兼容 bin。
- 上游历史标签 `1.17.x`、`npm-v1.17.x`、`desktop-v1.17.x`、`v1.2.x` 仍存在于仓库（lineage），需在迁移文档中明确区分。
- `.github/workflows/publish-npm.yml` 已是 npm-only、plain `vX.Y.Z` tag、Windows 基线 workflow_dispatch 合同。

## Scope

**In scope:**
- `docs/migrating-to-1.3.md`（新建）：1.2 → 1.3.1 安装迁移、命令验证、配置/会话备份、基础 smoke、回滚路径、fork tag 与上游 lineage 区分（MIG-01..03）。
- `docs/release-runbook.md`（新建）：有序发布 runbook（候选冻结 → tag 前检查 → plain v1.3.1 tag → Windows CI/CodeQL → npm publish → registry smoke → GitHub Release → 发布后核验），每步留证要求与 operator 授权边界（OPS-01, OPS-06）。
- `docs/release-runbook.md` 内含 GitHub Release 内容合同（SHA/checksums/支持期限/安装升级回滚/已知限制/人工验证状态），不声称未执行的 branch protection 或 live UAT（OPS-04）。
- `docs/release-runbook.md` 内含交互式 TTY/Telegram/Weixin 人工 UAT 可执行清单与结果记录格式；无法用真实凭据/网络执行的项目明确标为未验证/best-effort（OPS-05）。
- `docs/README.md` docs hub 链接两份新文档。
- `scripts/check-docs.mjs` `requiredDocs` 增加两份新文档。

**Out of scope:**
- 不可变候选验证、真实 pack、隔离安装、checksum 生成（Phase 16）。
- tag/push、npm publish、GitHub Release、branch protection、live UAT 执行（Phase 17 operator gate）。

## Key Decisions

- 迁移文档明确 1.2 不是 LTS，回滚目标仅是"已知本地环境"，不暗示 1.2 受支持。
- runbook 把所有远端发布动作标注为需显式 operator 授权；仓库自动化只验证前置条件和记录结果。
- UAT 清单区分"可自动化部分"与"需真实凭据/网络/TTY 部分"，后者标 best-effort/未验证。

## Risks / Guardrails

- 新增文档必须通过 check-docs（source-of-truth marker + hub link + 相对链接校验）。
- 不在 runbook 中写入会触发远端副作用的实际命令；只描述步骤与授权点。
- 保持 DeepSeek-first 与唯一 `reasonix-legacy` 身份，不在迁移文档中建议恢复旧 bin。

## Open Questions

无（需求已完全确定，自动模式直接进入规划）。
