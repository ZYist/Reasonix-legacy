# Phase 5: Governance Decisions - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

<domain>
## Phase Boundary

本阶段只固化版本、仓库身份、开发分支 CI 与 coverage 四项治理政策，形成后续 Phase 6、8、9 可引用的权威事实。不修改产品源码，不移动或创建历史 tag，不发布包，也不代替 GitHub 管理员执行外部设置。

</domain>

<decisions>
## Implementation Decisions

### HG-01 — 版本权威
- **D-01:** GSD milestone 与 `package.json` package semver 必须保持一致；当前两者统一为 v1.1 / 1.1.0，后续不得独立漂移。
- **D-02:** `package.json` semver 是当前 fork 的对外版本权威；README、CHANGELOG 当前说明和规划 milestone 应与它对齐。
- **D-03:** 历史 `1.17.x`、`npm-v1.17.x`、`desktop-v1.17.x` tags 属于 upstream lineage，不定义当前 fork 的 release；不得移动、删除或重写。
- **D-04:** 首次 Pure CLI 交付点是 v1.0 Phase 4 于 2026-07-05 完成的提交历史；由于该交付点的 package semver 已为 `1.1.0`，对外首次 Pure CLI release 版本记为 `1.1.0`。GSD 的历史 v1.0 是工程阶段名称，后续当前 milestone 已对齐为 v1.1。

### HG-02 — 公开仓库身份
- **D-05:** 当前维护入口、CI、stars、discussions、issues 与其他可操作链接均指向 `ZYist/Reasonix-legacy`。
- **D-06:** `esengine/DeepSeek-Reasonix` 仅作为清晰标注的历史来源和 attribution，不得让读者误认为它是当前维护入口。
- **D-07:** 所有写操作仅限本地当前 fork 分支及 `ZYist/Reasonix-legacy`；`upstream` 仅供读取和比对，禁止 push、改 tag 或发布。

### HG-03 — 开发分支策略
- **D-08:** `dev` push 运行完整 CI；进入 `main` 仍推荐通过 PR，但本阶段不声称已有 branch protection。
- **D-09:** GitHub branch protection 等仓库管理员设置若后续采用，必须明确记录为 operator action，不能由 workflow 文件假装保证。

### HG-04 — Coverage policy
- **D-10:** 全仓 67.39% 仅作非回归参考基线，本里程碑不立即加入激进的全仓硬阈值。
- **D-11:** 新提取的纯模块要求高覆盖；具体合理阈值由后续计划结合模块风险和 fresh baseline 决定。
- **D-12:** TUI、commands、Telegram/Weixin 等高风险路径以行为场景清单和离线 characterization 为主要验收，不能只追逐行覆盖率。
- **D-13:** 未经新的人工决策，不得加入会阻塞所有开发的全仓 Vitest coverage threshold。

### the agent's Discretion
- 决策在 PROJECT、ADR 或治理文档中的排版和交叉引用方式，只要上述语义保持唯一且可查。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Governance and roadmap
- `.planning/HIGH-RISK-AI-GUIDE.md` §3 — 四项 human gates 的冲突、约束与建议。
- `.planning/ROADMAP.md` Phase 5 — GOV-01..04 的阶段边界和成功标准。
- `.planning/REQUIREMENTS.md` — v1.1 治理要求及后续依赖关系。
- `.planning/PROJECT.md` — 项目身份、核心价值与 Key Decisions 的长期权威记录。

### Repository evidence
- `package.json` — 当前 fork package semver 权威。
- `.github/workflows/ci.yml` — 当前 CI 触发与矩阵事实（如存在；Phase 9 才修改策略）。
- `README.md` — 当前公开身份与链接，Phase 6 才执行事实对齐。
- `CHANGELOG.md` — 历史版本记录；不得篡改历史条目。

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.planning/HIGH-RISK-AI-GUIDE.md`: 已提供 HG-01..04 的风险依据和后续 work package 边界。
- Git remotes: `origin` 指向 `ZYist/Reasonix-legacy`，`upstream` 指向原作者仓库，可作为只读 lineage 证据。

### Established Patterns
- 治理决定写入 `.planning/PROJECT.md` Key Decisions，阶段上下文为下游 planner 的锁定输入。
- 历史 CHANGELOG/tag 保持不可变，只新增当前 fork 的澄清说明。

### Integration Points
- Phase 6 消费 HG-01/HG-02，对齐 README、CHANGELOG 当前说明和规划事实源。
- Phase 8 消费 HG-04，设计风险导向 characterization tests。
- Phase 9 消费 HG-03/HG-04，调整 `dev` CI 与 flaky 可见性。

</code_context>

<specifics>
## Specific Ideas

所有操作必须限制在用户自己的 `ZYist` fork；不得干扰原作者分支或远端资产。

</specifics>

<deferred>
## Deferred Ideas

- README/CHANGELOG/链接实际改动属于 Phase 6。
- characterization tests 与 fresh coverage baseline 属于 Phase 8。
- CI trigger、双平台矩阵、flaky reporting 与可选 branch protection operator action 属于 Phase 9。

</deferred>

---

*Phase: 05-governance-decisions*
*Context gathered: 2026-07-13*
