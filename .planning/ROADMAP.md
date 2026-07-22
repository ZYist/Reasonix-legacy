# Roadmap: reasonix-legacy

## Overview

`reasonix-legacy` 已完成三个 shipped milestones：v1.0 Pure CLI、v1.1 Risk Foundations & Maintenance Simplification，以及 v1.3 Stable Release Hardening。当前活跃里程碑为 **v1.3.1 LTS Release**：把已通过本地稳定版审计的 1.3 基线转化为用户可安装、可验证、具备明确支持期限与升级路径的 `reasonix-legacy@1.3.1` 正式 LTS 发布。里程碑保持 DeepSeek-first，不引入 provider 抽象，也不把远程 GitHub operator actions 或真实 bot UAT 伪装为仓库内自动化。

## Milestones

- ✅ **v1.0 Pure CLI** — Phases 1-4 (shipped 2026-07-05) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Risk Foundations & Maintenance Simplification** — Phases 5-9 (shipped 2026-07-17) — [archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.3 Stable Release Hardening** — Phases 10-13 (shipped 2026-07-18) — [archive](milestones/v1.3-ROADMAP.md)
- 🚧 **v1.3.1 LTS Release** — Phases 14-17 (started 2026-07-22)

## Phases

<details>
<summary>✅ v1.0 Pure CLI (Phases 1-4) — SHIPPED 2026-07-05</summary>

- [x] Phase 1: Web Panel Removal (2/2 plans) — completed 2026-07-03
- [x] Phase 2: Bot Decoupling to Standalone CLI (3/3 plans) — completed 2026-07-04
- [x] Phase 3: Desktop GUI Removal (1/1 plan) — completed 2026-07-04
- [x] Phase 4: Build Chain Cleanup & Full Regression (2/2 plans) — completed 2026-07-05

</details>

<details>
<summary>✅ v1.1 Risk Foundations & Maintenance Simplification (Phases 5-9) — SHIPPED 2026-07-17</summary>

- [x] Phase 5: Governance Decisions (1/1 plan) — completed 2026-07-13
- [x] Phase 6: Repository Truth Alignment (3/3 plans) — completed 2026-07-13
- [x] Phase 7: Bilingual i18n Boundary (1/1 plan) — completed 2026-07-13
- [x] Phase 8: Critical Path Characterization (3/3 plans) — completed 2026-07-13
- [x] Phase 9: CI and Flaky Visibility (1/1 plan) — completed 2026-07-13

</details>

<details>
<summary>✅ v1.3 Stable Release Hardening (Phases 10-13) — SHIPPED 2026-07-18</summary>

- [x] Phase 10: Package Identity Unification (2/2 plans) — completed 2026-07-17
- [x] Phase 11: Supply Chain and Security Contract (2/2 plans) — completed 2026-07-18
- [x] Phase 12: Windows Release Automation (2/2 plans) — completed 2026-07-18
- [x] Phase 13: Candidate Packaging and Stable Reassessment (2/2 plans) — completed 2026-07-18

</details>

### Phase 14: 1.3.1 Identity and LTS Contract

**Goal:** 维护者和用户面对的 package、lockfile、CLI、维护文档与发布合同一致指向 `reasonix-legacy@1.3.1`，并以一份明确的 LTS 支持合同固化 1.3.x 的支持期限、patch 范围、安全响应、EOL 与并行维护规则。
**Depends on:** v1.3 closeout (Phase 13)
**Requirements:** REL-01, REL-02, LTS-01, LTS-02, LTS-03, LTS-04, LTS-05
**Success Criteria:**

1. `reasonix-legacy --version`、root package/lockfile、运行时版本显示、README/CHANGELOG/governance 与 milestone 一致标识为 `1.3.1` / `v1.3.1`，并有自动 guard 阻止身份漂移。
2. 自动检查会阻止 `reasonix`/`dsnix` bin、错误 semver、错误 tag convention 或上游同名 release identity 重新进入当前发布表面，同时允许历史 archive 保持原样。
3. 维护文档明确写出 1.3.x 的支持期限为"至少 6 个月或下一稳定版本发布后 90 天（取较晚者）"，并给出起止/触发规则、允许的 LTS patch 类型和安全响应 best-effort 边界。
4. 维护文档明确 1.4/下一稳定版发布后的 1.3.x 并行维护规则、至少 30 天 EOL 通知和下一 LTS 升级路径；并声明 1.2 仅作为历史版本保留，不作为 LTS、不接受常规 patch。

**Plans:** 0/0 plans defined (planning pending)

### Phase 15: Migration and Release Runbook

**Goal:** 为 1.2 用户提供可执行的 `reasonix`/`dsnix` → `reasonix-legacy` 迁移、验证与回滚路径，并建立覆盖人工 UAT 与远端授权边界的 release runbook，准备 GitHub Release 内容合同，但不执行任何未授权远端发布。
**Depends on:** Phase 14
**Requirements:** MIG-01, MIG-02, MIG-03, OPS-01, OPS-04, OPS-05, OPS-06
**Success Criteria:**

1. 1.2 用户可按文档从旧 `reasonix`/`dsnix` 命令迁移到唯一 `reasonix-legacy` 命令，验证安装版本与入口，并能清楚区分 fork 的 `v1.3.1` 发布与仓库中的上游历史 lineage 标签。
2. 用户可按文档在升级前备份配置/会话、升级后执行基础 smoke、并在失败时回滚到已知本地环境，文档不把 1.2 称为受支持 LTS。
3. 维护者拥有按顺序留证的发布 runbook（候选冻结 → tag 前检查 → plain `v1.3.1` tag → Windows CI/CodeQL → npm publish → registry smoke → GitHub Release → 发布后核验），GitHub Release 内容合同涵盖 SHA/checksums/支持期限/安装升级回滚/已知限制/人工验证状态。
4. 交互式 TTY、Telegram、Weixin 的人工 UAT 有可执行清单与结果记录格式；所有 tag/push/publish/release/远端设置变更均标注为需显式 operator 授权，无法用真实凭据/网络执行的项目必须明确标为未验证或 best-effort，而不是自动通过。

**Plans:** 0/0 plans defined (planning pending)

### Phase 16: Immutable Candidate and Publish Gates

**Goal:** 在不可变候选上完成 Windows clean verify、production audit、真实 npm pack、清单/checksum、外部隔离安装证据，并校验 publish workflow 只有在全部门禁通过时才允许发布 `reasonix-legacy@1.3.1`，但不实际执行未授权 publish。
**Depends on:** Phase 15
**Requirements:** REL-03, VER-01, VER-02, VER-03, VER-04, OPS-02
**Success Criteria:**

1. 维护者可在 Windows + Node.js 24.15.0 + npm 11.16.0 + PowerShell 的 clean checkout 上复现 `npm ci`、完整 verify、文档 guard 与 production audit，并记录每个命令的退出码；候选绑定到不可变 source/tree SHA、plain `v1.3.1` tag 与对应 checksum。
2. 维护者可从同一不可变候选生成真实 npm tarball，记录 inventory、npm integrity、SHA-256/SHA-512，并证明包中包含 CLI runtime、tree-sitter grammars 与必需文档。
3. 用户可在仓库外干净目录安装候选 tarball，运行 `reasonix-legacy --version`/`--help`/基础 `doctor` 启动 smoke；安装结果不暴露 `reasonix`/`dsnix` bin，也不含生产 `workspace:*`。
4. npm publish workflow 只有在 package 名称/版本、plain tag、Windows toolchain、docs/lint/typecheck/build/tests/production audit/pack smoke 全部通过后才允许发布；维护者可证明 audited candidate 到正式发布 commit 之间不存在未重新验证的产品/依赖/workflow/文档漂移。

**Plans:** 0/0 plans defined (planning pending)

### Phase 17: External Release Validation and LTS Promotion

**Goal:** 在获得明确 operator authorization 后，核验正式 tag/CI/CodeQL/npm/GitHub Release，并从 npm registry 本身安装实际发布物复核 integrity/bin/smoke，记录人工 UAT 状态，只有所有必要条件满足后才宣布 1.3.1 LTS；未授权或外部状态未满足时保持 human/operator checkpoint，不得虚构完成。
**Depends on:** Phase 16
**Requirements:** OPS-03
**Operator gate:** 本 phase 的全部实质步骤（git tag/push、npm publish、GitHub Release、branch protection、live credential UAT）均为需授权的 operator action；仓库自动化只能验证前置条件、准备 runbook 和记录结果。未获得明确授权前，本 phase 保持 `blocked-on-operator`，不得标记完成。
**Success Criteria:**

1. 在明确 operator 授权下，维护者可证明 plain `v1.3.1` tag 已创建、Windows CI/CodeQL 通过、`reasonix-legacy@1.3.1` 已发布到 npm registry，并记录每步证据与执行者。
2. 发布后维护者可从 npm registry 本身（而非本地 tarball）安装 `reasonix-legacy@1.3.1`，核对 registry integrity、唯一 bin、版本/帮助输出与基础 smoke。
3. 交互式 TTY、Telegram、Weixin 的人工 UAT 结果被如实记录；未执行的凭据/网络/TTY 项目明确标为未验证或 best-effort。
4. 仅在 registry 安装复核、人工 UAT 状态与支持期限合同全部满足后，1.3.1 才被宣布为 LTS；若任一前置条件未满足，phase 保持 checkpoint 并记录阻塞原因，不虚构完成。

**Plans:** 0/0 plans defined (planning pending)

## Dependency Order and Guardrails

- Phase 14 必须先把身份与 LTS 支持合同固化，后续迁移文档与发布 runbook 不得围绕旧版本或模糊支持期限编写。
- Phase 15 只产出文档与 runbook，不执行 tag/push/publish 或远端设置变更；人工 UAT 与 operator authorization 边界必须显式化。
- Phase 16 在不可变候选上验证，使用仓库外临时目录执行隔离安装，不复用开发 workspace 的 global link/bin；不得把未运行的 live UAT 写成 PASS。
- Phase 17 是唯一允许触达真实远端发布物的 phase，且每一步都要求显式 operator 授权；未授权时保持 checkpoint，不虚构完成。
- 所有阶段保持 DeepSeek-first，不创建 provider abstraction 或多模型配置面，也不恢复 `reasonix`/`dsnix` bin。

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-4. Pure CLI | v1.0 | 8/8 | Complete | 2026-07-05 |
| 5-9. Risk Foundations | v1.1 | 9/9 | Complete | 2026-07-17 |
| 10. Package Identity Unification | v1.3 | 2/2 | Complete | 2026-07-17 |
| 11. Supply Chain and Security Contract | v1.3 | 2/2 | Complete | 2026-07-18 |
| 12. Windows Release Automation | v1.3 | 2/2 | Complete | 2026-07-18 |
| 13. Candidate Packaging and Stable Reassessment | v1.3 | 2/2 | Complete | 2026-07-18 |
| 14. 1.3.1 Identity and LTS Contract | v1.3.1 | 0/0 | Planning | — |
| 15. Migration and Release Runbook | v1.3.1 | 0/0 | Planning | — |
| 16. Immutable Candidate and Publish Gates | v1.3.1 | 0/0 | Planning | — |
| 17. External Release Validation and LTS Promotion | v1.3.1 | 0/0 | Planning (operator gate) | — |

## Next Milestone Readiness

- Active milestone: **v1.3.1 LTS Release** (Phases 14-17, started 2026-07-22).
- v1.3.1 requirements: 21 total, 21/21 mapped across Phases 14-17.
- Phase 14 is the next phase to plan and execute.
- Archived v1.3 requirements live at `.planning/milestones/v1.3-REQUIREMENTS.md`.

---
*Updated: 2026-07-22 after creating v1.3.1 LTS Release roadmap*
*v1.3.1 requirements: 21/21 mapped*
