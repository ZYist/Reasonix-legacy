---
quick: 260717-bvq
phase: quick-260717-bvq
plan: "01"
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: []
files_modified:
  - .planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md

must_haves:
  truths:
    - "稳定版判断绑定到一个明确 commit、分支、工作树状态和检查时间，而不是沿用历史通过记录。"
    - "构建、文档、lint、typecheck、测试、打包、依赖审计和发布链结果逐项可追溯，并保留失败退出码。"
    - "package、lockfile、CLI 显示版本、README、CHANGELOG、治理政策、tag 与发布 workflow 的一致性被交叉核对。"
    - "CI、CodeQL、branch protection、SECURITY.md、开放 UAT、延期缺陷与里程碑阻塞项被分类为 blocking 或 non-blocking。"
    - "最终只给出 READY、READY WITH CONDITIONS、NOT READY 三种 verdict 之一，并列出发布前动作。"
  artifacts:
    - path: .planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md
      provides: "带证据矩阵、阻塞项分类和稳定版 verdict 的发布就绪评估"
  key_links:
    - from: package.json
      to: package-lock.json
      via: "npm ci 可复现安装与根包版本/工作区元数据一致性"
    - from: package.json
      to: src/version.ts
      via: "构建后的 reasonix --version 必须反映 package semver"
    - from: package/version sources
      to: README.md, CHANGELOG.md, docs/governance.md
      via: "当前用户与治理文本不得声明互相冲突的稳定版本"
    - from: .github/workflows/ci.yml
      to: assessed commit
      via: "GitHub Actions 结果的 headSha 必须匹配被评估 commit"
    - from: .github/workflows/publish-npm.yml and publish-dsnix.yml
      to: package.json and packages/dsnix/package.json
      via: "tag 校验、包名和依赖键必须与实际发布物一致"
---

<objective>
评估当前 reasonix-legacy 版本是否适合作为稳定版，并产出可审计的发布结论与行动清单。

Purpose: 用当前 commit 的本地门禁、打包结果、远端 CI/发布状态、文档治理、安全策略和开放验证事实替代历史快照或主观判断。
Output: `.planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md`，包含唯一 verdict、blocking/non-blocking findings、证据缺口和发布建议。

本任务仅做发布就绪评估，不修改产品、依赖、文档、workflow、tag、release 或远端设置；不加入或规划多模型适配。
</objective>

<execution_context>
@C:/Users/zhangyujia/.codex/gsd-core/workflows/execute-plan.md
@C:/Users/zhangyujia/.codex/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/v1.1-MILESTONE-AUDIT.md
@.planning/milestones/v1.1-phases/05-governance-decisions/05-VERIFICATION.md
@.planning/milestones/v1.1-phases/06-repository-truth-alignment/06-VERIFICATION.md
@.planning/milestones/v1.1-phases/07-bilingual-i18n-boundary/07-VERIFICATION.md
@.planning/milestones/v1.1-phases/08-critical-path-characterization/08-VERIFICATION.md
@.planning/milestones/v1.1-phases/09-ci-and-flaky-visibility/09-VERIFICATION.md
@package.json
@package-lock.json
@packages/dsnix/package.json
@README.md
@REASONIX.md
@CHANGELOG.md
@src/version.ts
@scripts/check-docs.mjs
@.github/workflows/ci.yml
@.github/workflows/codeql.yml
@.github/workflows/publish-npm.yml
@.github/workflows/publish-dsnix.yml
@.github/workflows/release-mirror.yml
@docs/governance.md
@docs/ci-branch-protection.md
@docs/channel-lifecycle-testing.md
@SECURITY.md
@CONTRIBUTING.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: 采集可复现的本地发布与包证据</name>
  <files>.planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md</files>
  <action>
创建评估报告并固定 `assessed_at`、OS、Node/npm 版本、当前分支和完整 commit SHA。建立 `## Evidence matrix` 与 `## Build and package gates`，每一项记录命令、开始时间、退出码、耗时、PASS/FAIL/NOT RUN 和必要的关键输出；不要只写“通过”。

先采集 `git status --short --branch`、`git rev-parse HEAD`、`git branch --show-current`、`git remote -v`、`git describe --tags --always --dirty`、`git tag --points-at HEAD` 与最近提交摘要。工作树含 tracked/untracked 变更、release commit 不明确、origin 不是当前维护 fork、或 tag 指向与版本不一致时，保留原始事实并建立 finding；不得清理、stash、commit、tag 或 push。

逐项执行并继续收集独立门禁，即使前一项失败：`npm ci --dry-run`；dry-run 通过后执行 `npm ci`，失败则将 clean-install 标为 FAIL 并把后续检查注明为基于现有依赖状态；随后运行 `npm run build`、`node scripts/check-docs.mjs`、`npm run lint`、`npm run typecheck`、`npm test --silent`、`node dist/cli/index.js --version`、`node dist/cli/index.js --help`、`npm pack --dry-run --json`、`npm audit --omit=dev --json`。不得运行带修复或写回参数的 audit/install 命令。

解析 pack JSON 并记录包名、版本、文件数、压缩/解压大小和文件清单风险：确认 CLI 入口、类型声明、tree-sitter grammars、tokenizer、README、LICENSE 等运行必需物存在；确认 `.planning`、凭据文件、测试转录、源码外私密配置、已移除 Web/desktop 产物不进入 tarball。对命令失败、缺失文件或异常大包分别建立 blocker 候选，不修改打包配置。
  </action>
  <verify>
    <automated>node -e "const fs=require(\"fs\");const p=\".planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md\";const s=fs.readFileSync(p,\"utf8\");for(const x of [\"git rev-parse HEAD\",\"npm ci --dry-run\",\"npm run build\",\"node scripts/check-docs.mjs\",\"npm run lint\",\"npm run typecheck\",\"npm test --silent\",\"npm pack --dry-run --json\",\"npm audit --omit=dev --json\"])if(!s.includes(x))throw new Error(\"missing evidence: \"+x)"</automated>
  </verify>
  <done>报告绑定到当前 commit，并完整记录 clean-install、构建、docs、lint、typecheck、tests、CLI 冒烟、pack 与 production dependency audit 的独立结果。</done>
</task>

<task type="auto">
  <name>Task 2: 审计版本发布链、CI、安全治理与开放验证</name>
  <files>.planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md</files>
  <action>
扩展报告的 `## Package and version consistency`、`## CI, governance, and security` 与 `## UAT and open risks`。把根 `package.json`、lockfile 根记录、workspace 包、构建后的 CLI 版本、README 当前版本、CHANGELOG 最新当前维护条目、governance 版本权威、当前 milestone、HEAD tags 与 npm registry dist-tag 放入同一矩阵；任何数值差异都必须显式列出，不能以“历史文件”名义自动忽略当前声明。

审阅 `publish-npm.yml`、`publish-dsnix.yml`、`release-mirror.yml`：核对 tag namespace、校验的 package path、实际 npm 包名、workspace dependency key、prepublish 门禁、发布 token 权限、已移除 surface 的残留假设和 mirror 所需资产。运行 `npm view reasonix-legacy version dist-tags --json` 与 `npm view dsnix version dependencies --json`；registry 不可达或包不存在时记录命令、错误和证据缺口，不猜测远端状态。

使用 GitHub CLI（可用时）运行 `gh run list --repo ZYist/reasonix-legacy --workflow ci.yml --limit 20 --json databaseId,headSha,headBranch,event,status,conclusion,createdAt,url`、对应 CodeQL 查询、`gh release list --repo ZYist/reasonix-legacy --limit 20`，并检查 main/dev branch protection、开放 code-scanning/Dependabot alerts。只有 headSha 与 assessed commit 相同的成功 run 才能证明该 commit 的 CI；CLI 缺失、未认证或权限不足必须标为 UNKNOWN evidence gap。不要创建 workflow dispatch、release、tag 或修改保护规则。

将 `docs/governance.md`、`docs/ci-branch-protection.md`、`SECURITY.md`、`CONTRIBUTING.md` 与当前 CLI-only 产品面交叉核对，特别检查受支持包名/版本、已移除 surface、报告渠道、branch protection 声明和发布责任边界。结合 STATE、milestone audit、各 phase verification 与 `docs/channel-lifecycle-testing.md`，列出仍未运行的 credential/network/TTY UAT、accepted/deferred defects、外部 operator actions 和任何开放 blocker；区分“历史已通过证据”和“本次仍有效证据”。多模型适配不进入 finding、建议或发布条件。
  </action>
  <verify>
    <automated>node -e "const fs=require(\"fs\");const s=fs.readFileSync(\".planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md\",\"utf8\");for(const x of [\"## Package and version consistency\",\"## CI, governance, and security\",\"## UAT and open risks\",\"publish-npm.yml\",\"publish-dsnix.yml\",\"SECURITY.md\",\"channel-lifecycle-testing.md\"])if(!s.includes(x))throw new Error(\"missing audit section/source: \"+x)"</automated>
  </verify>
  <done>版本、lockfile、registry、tag、发布 workflows、当前 commit CI/CodeQL、安全政策和未完成 UAT/延期风险都有来源、状态和严重度。</done>
</task>

<task type="auto">
  <name>Task 3: 给出稳定版 verdict 与阻塞清单</name>
  <files>.planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md</files>
  <action>
在报告顶部完成 `## Verdict`，且只允许 `READY`、`READY WITH CONDITIONS`、`NOT READY` 之一。随后完成 `## Blocking findings`、`## Non-blocking findings` 与 `## Release recommendation`；每条 finding 使用稳定 ID，包含 severity、证据、影响、解除条件、建议 owner，不能把失败门禁或证据缺失埋在叙述中。

使用以下裁决规则：只有工作树/commit 可发布、clean install 与全部本地门禁通过、包内容和版本权威一致、发布 workflow 与实际 package identity 相符、当前 commit 的必要 CI/CodeQL 可证实、无 critical/high production dependency 或安全阻塞、无当前文档对稳定版能力的重大误述时，才可判 `READY`。不存在代码/包/安全硬阻塞，但仅剩有边界的外部操作或人工 UAT，且每项有明确责任人、动作和发布前/发布后时点时，可判 `READY WITH CONDITIONS`。任一硬门禁失败、版本/lock/tag/workflow 冲突、稳定版当前文档或安全范围失实、必要远端证据无法确认、或广告能力存在未处置高风险缺陷时，判 `NOT READY`。

给出按执行顺序排序的发布前清单和“重新评估命令集”，说明哪些 blocker 必须修复后重跑全套证据、哪些 non-blocker 可以在 release notes 中披露。结论只评估当前 DeepSeek-first 单模型产品，不提出供应商抽象或多模型工作。
  </action>
  <verify>
    <automated>node -e "const fs=require(\"fs\");const s=fs.readFileSync(\".planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md\",\"utf8\");if(!/## Verdict\\s+`?(READY|READY WITH CONDITIONS|NOT READY)`?/.test(s))throw new Error(\"missing valid verdict\");for(const x of [\"## Blocking findings\",\"## Non-blocking findings\",\"## Release recommendation\",\"assessed commit\"])if(!s.includes(x))throw new Error(\"missing final section: \"+x)"</automated>
  </verify>
  <done>报告给出唯一、规则一致且可行动的稳定版 verdict，所有阻塞与非阻塞项可追溯到本次证据。</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| working tree → release artifact | 未提交或未跟踪内容可能使本地测试结果与实际 tag/tarball 不一致。 |
| package metadata → npm registry | 本地包名、版本、dependency key 与 registry/dist-tag 或 publish workflow 可能漂移。 |
| GitHub Actions/API → local assessment | 远端 run、release、protection 与 alert 结果需要认证且必须匹配 assessed commit。 |
| credentials/live services → UAT evidence | Telegram/Weixin、npm、GitHub 凭据和真实消息不得写入评估 artifact。 |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-QRR-01 | Tampering | git/tag/pack evidence | high | mitigate | 固定 SHA、dirty 状态、HEAD tags 与 pack JSON；不执行任何清理、tag 或 push。 |
| T-QRR-02 | Spoofing | package/repository identity | high | mitigate | 交叉核对 package metadata、origin、README、governance、registry 与 publish workflows。 |
| T-QRR-03 | Repudiation | assessment conclusions | medium | mitigate | 每个 gate 记录命令、时间、退出码、关键输出和 finding ID。 |
| T-QRR-04 | Information Disclosure | pack files and live UAT | high | mitigate | 检查 tarball 文件清单；报告只保留脱敏状态，不记录 token、账号、QR、消息或私有路径。 |
| T-QRR-05 | Denial of Service | flaky/partial test evidence | medium | mitigate | 分开记录首次本地测试和 CI retry 语义，不把 retry pass 当作 clean pass。 |
| T-QRR-06 | Elevation of Privilege | release workflows | high | mitigate | 审查 workflow permissions、secrets 使用、tag guards 和 package target，不触发远端发布。 |
| T-QRR-SC | Tampering | npm locked install and dependencies | high | mitigate | 不新增依赖；用 lockfile clean-install check、production audit 和 pack inspection 验证现有供应链。 |
</threat_model>

<source_audit>
| Source | Item | Plan coverage | Status |
|--------|------|---------------|--------|
| GOAL | 评估当前版本是否适合作为稳定版并明确阻塞项与建议 | Tasks 1-3 | COVERED |
| REQ | clean git/release state；build/lint/typecheck/tests；docs/package/version；CI/governance/security/UAT/blockers | Tasks 1-3 | COVERED |
| RESEARCH | 无研究阶段，按 quick-task 约束 | N/A | EXCLUDED |
| CONTEXT | 仅做 release-readiness assessment；输出三态 verdict；不做多模型适配 | Tasks 1-3 | COVERED |
</source_audit>

<verification>
- 仅创建或修改 `260717-bvq-SUMMARY.md`；`git diff --name-only` 不得出现产品源码、package/lockfile、docs、workflow、STATE 或其他规划文件。
- 报告中的历史通过记录必须标注日期，不能替代 2026-07-17 对 assessed commit 的 fresh evidence。
- 每个 FAIL/UNKNOWN 都进入 finding 列表；不得因为其他门禁通过而省略。
- verdict 与裁决规则一致，blocking 与 non-blocking 分类无自相矛盾。
- 不包含真实 secrets、账号、消息、QR、私有路径或完整敏感 API 响应。
</verification>

<success_criteria>
- 当前 commit、工作树、tag、origin 与远端 release/registry 状态可追溯。
- clean install、build、docs check、lint、typecheck、tests、CLI smoke、pack 与 production audit 均有独立结果。
- 版本与发布链跨 package、lockfile、workspace、CLI、README、CHANGELOG、governance、workflow 和 registry 完成一致性核对。
- CI/CodeQL/branch protection/security/UAT/deferred blocker 事实均被审查并标出 evidence gap。
- 最终 verdict 为 READY、READY WITH CONDITIONS 或 NOT READY，附 blocking/non-blocking findings 和按顺序执行的发布建议。
- 评估范围不包含多模型适配。
</success_criteria>

<output>
Create `.planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md` when done.
</output>
