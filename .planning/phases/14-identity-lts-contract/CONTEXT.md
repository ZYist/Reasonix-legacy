# Phase 14 Context: 1.3.1 Identity and LTS Contract

**Milestone:** v1.3.1 LTS Release
**Phase:** 14
**Depends on:** v1.3 closeout (Phase 13, shipped 2026-07-18)
**Requirements:** REL-01, REL-02, LTS-01, LTS-02, LTS-03, LTS-04, LTS-05

## Goal

维护者和用户面对的 package、lockfile、CLI、维护文档与发布合同一致指向 `reasonix-legacy@1.3.1`，并以一份明确的 LTS 支持合同固化 1.3.x 的支持期限、patch 范围、安全响应、EOL 与并行维护规则。

## Why This Phase First

身份与支持合同是后续所有 phase 的前置：迁移文档（Phase 15）必须引用确定的 1.3.1 版本号和支持期限；候选验证（Phase 16）必须绑定到固定身份；外部发布（Phase 17）必须依据已固化的 LTS 合同决定 patch 范围。先锁定身份，避免后续阶段围绕旧版本号或模糊支持政策编写。

## Current State (evidence)

- `package.json`: `version: "1.3.0"`, `name: "reasonix-legacy"`, `bin: { "reasonix-legacy": "dist/cli/index.js" }`.
- `src/version.ts`: `VERSION` 从 `package.json` 动态读取，`DISPLAY_NAME = "reasonix-legacy"`；`--version`/statusline 自动跟随 package.json，无需手改运行时常量（仅 line 47 注释示例提到 `1.3.0`）。
- `package-lock.json` 根记录 `version: "1.3.0"`。
- `scripts/check-docs.mjs`（drift guard）硬编码：`package version === "1.3.0"`、README 须含 `reasonix-legacy 1.3.0`、governance 须含 `package \`1.3.0\` and milestone \`v1.3\``、STATE 须匹配 `milestone: v1.3`、CHANGELOG 须含 `## [1.3.0] — 2026-07-17`。
- README.md、CONTRIBUTING.md、docs/governance.md、CHANGELOG.md 均含 `1.3.0` 引用。
- v1.3 已建立的身份 guard（bin/name/dsnix/lock/CI/CodeQL/install-script）保持有效，本 phase 只扩展版本断言，不削弱现有门禁。

## Scope

**In scope:**
- `1.3.0` → `1.3.1` 身份提升：package.json、package-lock.json 根、README、CHANGELOG、docs/governance.md、src/version.ts 注释。
- drift guard（check-docs.mjs）版本断言更新到 1.3.1 / v1.3.1，并新增对 LTS 合同文档存在与 STATE milestone 的断言。
- 新建 LTS 支持合同文档（`docs/lts-policy.md`），覆盖 LTS-01..LTS-05。
- docs hub（docs/README.md）链接新 LTS 文档。
- 现有 `tests/package-identity.test.ts` 等引用 1.3.0 的测试同步更新。

**Out of scope (deferred to later phases):**
- 迁移文档与 release runbook（Phase 15）。
- 不可变候选验证、真实 pack、隔离安装（Phase 16）。
- tag/push、npm publish、GitHub Release、branch protection、live UAT（Phase 17 operator gate）。
- 任何远端发布动作。

## Key Decisions

- **唯一 LTS 主线为 1.3.x**：1.2 仅作历史版本保留，不作为 LTS、不接受常规 patch（LTS-05）。
- **支持期限**：至少 6 个月，或下一稳定版本发布后 90 天，取较晚者（LTS-01）。
- **patch 范围**：安全修复、凭据/数据泄漏修复、安装/启动阻断修复、关键回归、必要依赖升级、文档澄清（LTS-02）。
- **安全响应**：critical/high 给出确认与修复/缓解目标；资源不足时不虚构 SLA，标 best-effort（LTS-03）。
- **EOL/并行维护**：1.4 发布后并行维护规则、≥30 天 EOL 通知、下一 LTS 升级路径（LTS-04）。
- **保持 DeepSeek-first**，不引入 provider 抽象；保持唯一 `reasonix-legacy` bin。

## Risks / Guardrails

- drift guard 同时是发布门禁，更新版本断言时不能意外放宽 dsnix/reasonix 旧 bin 检查或 CI/CodeQL 基线断言。
- 所有变更保持本地可验证（`npm run verify` + `node scripts/check-docs.mjs`），不触发任何远端副作用。
- lockfile 根版本更新后需保证 `npm ci` 仍干净，不引入新依赖。

## Open Questions

无（需求已在 REQUIREMENTS.md 与路线图完全确定，自动模式下直接进入规划）。
