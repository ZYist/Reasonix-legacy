# Roadmap: reasonix-legacy

## Overview

v1.3 把 2026-07-17 稳定版评估的本地发布阻塞项收敛为四个顺序 work package：先统一 package/CLI 身份并彻底删除 `dsnix`，再修复生产依赖和安全合同，随后把 CI/CodeQL/发布 workflow 对齐到真实 Windows 维护环境，最后从 clean install 到隔离 tarball 安装完成稳定版复评。里程碑保持 DeepSeek-first，不引入 provider 抽象，也不把远程 GitHub operator actions 或真实 bot UAT伪装为仓库内自动化。

## Milestones

- ✅ **v1.0 Pure CLI** — Phases 1-4 (shipped 2026-07-05) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 Risk Foundations & Maintenance Simplification** — Phases 5-9 (shipped 2026-07-17) — [archive](milestones/v1.1-ROADMAP.md)
- 🚧 **v1.3 Stable Release Hardening** — Phases 10-13 (in progress)

## Phases

### Phase 10: Package Identity Unification

**Goal:** 用户和维护者只面对 `reasonix-legacy` package/CLI，所有 `dsnix`/旧 bin 与 1.2/1.1/0.55 当前版本漂移从发布路径中消失。
**Depends on:** Phase 9
**Requirements:** ID-01, ID-02, ID-03, ID-04, VER-01, VER-02
**Success Criteria:**

1. 安装根 package 后只生成 `reasonix-legacy` bin；`reasonix` 与 `dsnix` 不再由当前 package 提供。
2. `packages/dsnix`、相关 workspace/lock record、shim runtime 和 publish workflow 的当前发布路径为零。
3. `reasonix-legacy --version`、package/lock/runtime、README、CHANGELOG、governance 与 milestone 一致指向 `1.3.0` / `v1.3`。
4. 自动检查会阻止当前维护表面重新出现旧 bin、`dsnix` 或版本/tag convention 漂移，同时允许历史 archive 保持原样。

**Plans:** 2/2 plans complete

- [x] 10-01 — Package graph and runtime identity
- [x] 10-02 — Maintained docs and identity drift guard

### Phase 11: Supply Chain and Security Contract

**Goal:** 稳定版候选不再携带已知 high/critical 生产漏洞，且安全支持合同与当前 CLI-only 产品表面一致。
**Depends on:** Phase 10
**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria:**

1. `undici`/`ws` 与 lockfile 更新后，clean `npm audit --omit=dev` 无 high/critical finding，完整离线 suite 保持通过。
2. `SECURITY.md` 只声明当前 `reasonix-legacy` CLI/TUI、MCP/ACP 和 chat channel 表面，不再提已删除 dashboard/server/Tauri。
3. npm install scripts 的来源与必要性有可审计记录，没有静默 auto-approve。
4. 历史 raw-error 风险被测试确认；若仍存在，用户可见错误被脱敏且失败退出/诊断语义不回归。

**Plans:** TBD

### Phase 12: Windows Release Automation

**Goal:** 仓库内 CI、CodeQL、branch 指引和 npm publish contract 与真实 `v1`/`dev` 分支及 Windows Node 24.15.0 维护标准一致。
**Depends on:** Phase 11
**Requirements:** WIN-01, WIN-02, WIN-03, PUB-01, PUB-02
**Success Criteria:**

1. 强制 CI 只使用 Windows、Node 24.15.0、npm 11.16.0、PowerShell，并执行完整 install/docs/lint/typecheck/build/test gates。
2. CI、CodeQL、CONTRIBUTING、governance 与 protection 指引统一使用 `v1` default + `dev` development 模型，不引用不存在的 `main`。
3. root publish workflow 只发布 `reasonix-legacy`，以文档化的 `v1.3.0` tag convention 触发，并复用 v1.3 Windows release gates。
4. `publish-dsnix.yml` 消失；desktop/Tauri mirror 假设被退役，npm-only asset policy 明确。

**Plans:** TBD

### Phase 13: Candidate Packaging and Stable Reassessment

**Goal:** 维护者可在当前 Windows 标准环境中从 clean tree 复现、打包、隔离安装并审计一个可判定的 v1.3 stable candidate。
**Depends on:** Phase 12
**Requirements:** PKG-01, PKG-02, PKG-03, REL-01, REL-02
**Success Criteria:**

1. clean `npm ci` + `npm run verify` 在 Windows/Node 24.15.0/npm 11.16.0 下 0 failed，且完整 slow/tokenizer/jobs suite 未被裁剪。
2. root tarball 仅含运行必需内容，不含 secrets/planning/removed surfaces/`dsnix`，八个 WASM 与 tokenizer/types/CLI 均存在。
3. 隔离目录安装 tarball 后，`reasonix-legacy --version`/`--help` 可用，`reasonix`/`dsnix` 不存在。
4. 文档 guard 覆盖 version/package/bin/tag/security facts；最终稳定版复评报告绑定候选 SHA，并清楚区分本地通过、外部 operator action 与未运行 live UAT。

**Plans:** TBD

## Dependency Order and Guardrails

- Phase 10 必须先删除旧 package/bin/workspace 身份，后续 lock、security 和 publish 工作不得继续围绕 `dsnix` 修补。
- Phase 11 的 dependency/lock 更新必须在 Phase 10 package graph 稳定后进行，并以 clean install + full suite 证明兼容。
- Phase 12 只修改仓库内 automation/文档；不得自动 push、tag、publish 或更改远程 branch protection。
- Phase 13 使用新临时目录执行隔离安装，不复用开发 workspace 的 global link/bin；复评不得把未运行的 live UAT 写成 PASS。
- 所有阶段保持 DeepSeek-first，不创建 provider abstraction 或多模型配置面。

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-4. Pure CLI | v1.0 | 8/8 | Complete | 2026-07-05 |
| 5-9. Risk Foundations | v1.1 | 9/9 | Complete | 2026-07-17 |
| 10. Package Identity Unification | v1.3 | 2/2 | Complete    | 2026-07-17 |
| 11. Supply Chain and Security Contract | v1.3 | 0/TBD | Not started | — |
| 12. Windows Release Automation | v1.3 | 0/TBD | Not started | — |
| 13. Candidate Packaging and Stable Reassessment | v1.3 | 0/TBD | Not started | — |

---
*Roadmap created: 2026-07-17 · v1.3 requirements: 21/21 mapped*
