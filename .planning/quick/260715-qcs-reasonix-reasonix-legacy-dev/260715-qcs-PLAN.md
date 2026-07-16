---
quick_id: 260715-qcs
phase: quick-260715-qcs
plan: "01"
type: execute
wave: 1
depends_on: []
autonomous: true
requirements: [QCS-DOCS-01]
files_modified:
  - README.md
  - README.upstream.md
  - README.upstream.zh-CN.md
  - REASONIX.md
  - CONTRIBUTING.md
  - docs/ARCHITECTURE.md
  - docs/CLI-REFERENCE.md
  - docs/.nojekyll
  - docs/arch-i18n.js
  - docs/architecture.html
  - docs/assets/
  - docs/brand/
  - docs/cli-ref-i18n.js
  - docs/cli-reference.html
  - docs/configuration.html
  - docs/design/
  - docs/download.html
  - docs/favicon.svg
  - docs/guide-i18n.js
  - docs/guide.css
  - docs/i18n.js
  - docs/index.html
  - docs/logo.svg
  - docs/motion.js
  - docs/robots.txt
  - docs/sitemap.xml
  - docs/src/
  - docs/styles.css
  - docs/archive/upstream-reasonix/
  - docs/README.md
  - docs/getting-started.md
  - docs/cli-reference.md
  - docs/configuration.md
  - docs/architecture.md
  - docs/qq-connect.md
  - docs/qq-connect.zh-CN.md
  - docs/telegram-connect.md
  - docs/telegram-connect.zh-CN.md
  - docs/weixin-connect.md
  - docs/weixin-connect.zh-CN.md
  - packages/dsnix/README.md
  - packages/dsnix/package.json
  - scripts/check-docs.mjs
  - src/skills.ts
  - src/cli/cpu-prof.ts
  - src/cli/ui/feedback.ts
  - src/cli/ui/mcp-lifecycle.ts
  - src/cli/ui/slash/handlers/basic.ts
  - tests/feedback.test.ts
  - tests/skills.test.ts
  - tests/slash.test.ts
must_haves:
  truths:
    - "历史上游 Reasonix 文档仍可查阅，但任何入口都明确标为 2026-07-15 的只读历史快照。"
    - "reasonix-legacy 用户从根 README 能进入一套只描述 dev 分支 Pure CLI、ACP 与三种无头通道的当前文档。"
    - "命令、配置、架构和通道说明可追溯到当前 package.json、Commander 注册、slash registry、src/config.ts 与 .env.example。"
    - "README、贡献指南、dsnix 包说明和 CLI 内置链接都指向 ZYist/reasonix-legacy 的当前维护入口，上游只保留归属或特定历史 issue 引用。"
    - "维护文档中的本地链接和关键 CLI 覆盖可由无新增依赖的自动检查重复验证。"
  artifacts:
    - "docs/archive/upstream-reasonix/ARCHIVE.md — 历史快照边界、来源、日期和风险提示。"
    - "docs/README.md — 当前维护文档总入口和维护规则。"
    - "docs/getting-started.md — 与当前源码安装和首次运行一致的入门说明。"
    - "docs/cli-reference.md — 当前 shell 与 slash 命令参考。"
    - "docs/configuration.md — 当前配置文件、环境变量、优先级与通道配置说明。"
    - "docs/architecture.md — Pure CLI、共享 loop、HeadlessHost、ACP 和持久化边界。"
    - "REASONIX.md — 继续位于根目录、供项目记忆加载器使用的当前维护知识。"
    - "scripts/check-docs.mjs — 当前文档结构、相对链接、仓库入口和 CLI 命令覆盖检查。"
  key_links:
    - "README.md -> docs/README.md -> 当前指南与 archive 索引。"
    - "docs/cli-reference.md -> dist/cli/index.js --help 与 src/cli/ui/slash/commands.ts。"
    - "docs/configuration.md -> src/config.ts、src/index/config.ts 与 .env.example。"
    - "src/cli/ui/feedback.ts、src/cli/ui/slash/handlers/basic.ts、src/skills.ts -> ZYist/reasonix-legacy 当前维护 URL。"
---

<objective>
将已失效的上游 Reasonix 产品文档无损归档，并以当前 `dev` 分支的真实 CLI、配置、架构和通道能力重建 reasonix-legacy 的可维护文档入口。

Purpose: 防止用户和后续维护 agent 继续把已删除的 Web dashboard、Tauri desktop、上游发布路径或旧仓库链接当成当前事实，同时保留历史来源与设计材料。
Output: 一个带明确历史标签的上游文档快照、一套当前文档树、修复后的仓库/CLI 入口，以及可重复运行的文档一致性检查。
</objective>

<execution_context>
@C:/Users/zhangyujia/.codex/gsd-core/workflows/execute-plan.md
@C:/Users/zhangyujia/.codex/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@.planning/codebase/ARCHITECTURE.md
@.planning/codebase/STRUCTURE.md
@.planning/codebase/CONVENTIONS.md
@.planning/codebase/INTEGRATIONS.md
@.planning/milestones/v1.1-phases/06-repository-truth-alignment/06-01-SUMMARY.md
@.planning/milestones/v1.1-phases/06-repository-truth-alignment/06-02-SUMMARY.md
@README.md
@REASONIX.md
@docs/ARCHITECTURE.md
@docs/CLI-REFERENCE.md
@docs/governance.md
@package.json
@.env.example
@src/cli/index.ts
@src/cli/ui/slash/commands.ts
@src/config.ts
@src/index/config.ts
@src/cli/headless/host.ts
@src/cli/commands/qq.ts
@src/cli/commands/telegram.ts
@src/cli/commands/weixin.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: 无损归档已失效的上游产品文档</name>
  <files>README.upstream.md, README.upstream.zh-CN.md, REASONIX.md, docs/ARCHITECTURE.md, docs/CLI-REFERENCE.md, docs/.nojekyll, docs/arch-i18n.js, docs/architecture.html, docs/assets/, docs/brand/, docs/cli-ref-i18n.js, docs/cli-reference.html, docs/configuration.html, docs/design/, docs/download.html, docs/favicon.svg, docs/guide-i18n.js, docs/guide.css, docs/i18n.js, docs/index.html, docs/logo.svg, docs/motion.js, docs/robots.txt, docs/sitemap.xml, docs/src/, docs/styles.css, docs/archive/upstream-reasonix/</files>
  <action>使用 `git mv` 保留历史：把两个根目录 upstream README 放入 `docs/archive/upstream-reasonix/root/README.en.md` 与 `README.zh-CN.md`；把当前根 `REASONIX.md` 的旧 working-knowledge 内容移动到 `docs/archive/upstream-reasonix/root/REASONIX.md`，根路径将在 Task 2 以当前内容重建；把旧 `docs/ARCHITECTURE.md`、`docs/CLI-REFERENCE.md` 及完整 GitHub Pages 静态站点文件/目录移动到 `docs/archive/upstream-reasonix/site/`，保持站点内部的相对目录结构。创建 `docs/archive/upstream-reasonix/ARCHIVE.md`，明确这是 2026-07-15 从历史上游继承的只读快照，包含已删除产品面和可能失效的安装/发布链接，不是当前操作指南，并链接到 `docs/README.md`。不要删除历史内容，也不要移动或复制 `benchmarks/`、`packages/**/README.md`、`CONTRIBUTING.md`、`SECURITY.md`、`CODE_OF_CONDUCT.md`、`docs/governance.md`、`docs/ci-branch-protection.md`、当前通道/生命周期文档或任何 `.planning/` artifact。</action>
  <verify>
    <automated>node -e "const fs=require('node:fs');const must=['docs/archive/upstream-reasonix/ARCHIVE.md','docs/archive/upstream-reasonix/root/README.en.md','docs/archive/upstream-reasonix/root/README.zh-CN.md','docs/archive/upstream-reasonix/root/REASONIX.md','docs/archive/upstream-reasonix/site/ARCHITECTURE.md','docs/archive/upstream-reasonix/site/CLI-REFERENCE.md','docs/archive/upstream-reasonix/site/index.html','benchmarks/README.md','packages/dsnix/README.md','CONTRIBUTING.md','SECURITY.md','docs/governance.md'];const gone=['README.upstream.md','README.upstream.zh-CN.md','docs/index.html','docs/download.html','docs/design/agent-dashboard.html'];if(must.some(p=>!fs.existsSync(p))||gone.some(p=>fs.existsSync(p)))process.exit(1)"</automated>
  </verify>
  <done>历史 README、working knowledge、架构/CLI 参考和旧静态站点全部存在于带日期与警告的 archive 中；原活跃位置不再暴露旧站点；明确排除的当前、治理、基准、包内和规划文档仍留在原位。</done>
</task>

<task type="auto">
  <name>Task 2: 基于 dev 分支重建当前维护文档树</name>
  <files>docs/README.md, docs/getting-started.md, docs/cli-reference.md, docs/configuration.md, docs/architecture.md, docs/qq-connect.md, docs/qq-connect.zh-CN.md, docs/telegram-connect.md, docs/telegram-connect.zh-CN.md, docs/weixin-connect.md, docs/weixin-connect.zh-CN.md, REASONIX.md, scripts/check-docs.mjs</files>
  <action>以 live source 而不是旧文档为事实源重写当前文档。`docs/README.md` 作为总入口，区分用户指南、通道指南、维护/治理文档和历史 archive，并记录维护映射：版本/脚本来自 `package.json`，shell 命令来自构建后的 `reasonix --help` 与 `src/cli/index.ts`，slash 命令来自 `src/cli/ui/slash/commands.ts`，配置来自 `src/config.ts`、`src/index/config.ts` 和 `.env.example`。`docs/getting-started.md` 只描述 Node >=22、当前 GitHub 源码安装、build/link、setup 和首轮 code/chat/run；不要声称当前已发布到 npm。`docs/cli-reference.md` 覆盖所有顶层 Commander 命令并按类别概括 slash 命令，明确 terminal stats 与退休 desktop 命令的边界。`docs/configuration.md` 说明 `~/.reasonix/config.json`、环境变量覆盖、API/model/session/MCP/proxy/search/permissions/channel 配置和 secret 处理，不把残留 desktop-only 类型字段宣传为受支持界面。`docs/architecture.md` 描述 CLI/TUI、共享 cache-first loop、tool repair、HeadlessHost 三通道、ACP、session/events 与当前目录边界。重写根 `REASONIX.md` 为短小的当前项目 working knowledge，保留其作为项目记忆加载入口的语义，并链接当前 docs；不得把它改名或只做跳转页。重写 QQ/Telegram 中英文指南，移除已删除 GUI 流程，改为 standalone command 与当前 TUI 连接流程；新增 Weixin 中英文指南，按 live command/config/QR 生命周期与 allowlist 代码说明。创建零依赖 `scripts/check-docs.mjs`：`--structure-only` 检查必需文件、docs hub 覆盖和每篇文档的 source-of-truth 标记；完整模式再检查非 archive 的相对 Markdown 链接、README 到 docs/archive 的入口、所有顶层 CLI 命令在 `docs/cli-reference.md` 中出现，以及指定 live entrypoint 文件不再把历史上游当作维护地址。archive、CHANGELOG、governance attribution 和特定 upstream issue 引用必须可显式 allowlist。</action>
  <verify>
    <automated>npm run build && node scripts/check-docs.mjs --structure-only</automated>
  </verify>
  <done>当前 docs hub、入门、CLI、配置、架构、三通道双语指南和根 working knowledge 均由 dev 分支真实接口重建；结构检查通过且没有把 archive 内容重新暴露为当前说明。</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: 修复所有当前维护入口并锁定链接回归</name>
  <files>README.md, CONTRIBUTING.md, packages/dsnix/README.md, packages/dsnix/package.json, src/skills.ts, src/cli/cpu-prof.ts, src/cli/ui/feedback.ts, src/cli/ui/mcp-lifecycle.ts, src/cli/ui/slash/handlers/basic.ts, tests/feedback.test.ts, tests/skills.test.ts, tests/slash.test.ts</files>
  <behavior>
    - `/about` 显示当前 `ZYist/reasonix-legacy` 仓库与当前文档入口，同时保留 MIT 信息。
    - feedback URL 与 CPU profile 提示把用户送到当前 fork 的 issue surface。
    - 内置 QQ setup skill 指向当前 fork 的 configuration 与 QQ 指南，不再把历史站点作为官方配置入口。
    - 根 README 能进入 docs hub 和带警告的 upstream archive；CONTRIBUTING 与 dsnix 元数据不再把历史上游当成 clone、docs、homepage 或 bugs 入口。
    - 完整 docs checker 对缺失相对链接、遗漏顶层 CLI 命令或 live entrypoint 中的非 allowlist 历史维护 URL 返回非零。
  </behavior>
  <action>先更新现有测试期望，再修改 live entrypoints。根 `README.md` 增加“当前文档”入口并把 upstream README 链接改到 archive snapshot；上游仓库链接只保留明确 attribution。`CONTRIBUTING.md` 的 clone/架构入口改到当前 fork 与新 docs。`packages/dsnix/README.md` 和 `packages/dsnix/package.json` 保留 package-local 文件，不归档；将 canonical package、repository、homepage、bugs 和安装状态与 `reasonix-legacy` 当前事实对齐。将 `/about`、feedback issue、CPU profile issue command 和内置 QQ setup skill 的维护链接改到 `ZYist/reasonix-legacy`；保留 `src/cli/ssh-remote.ts` 对 upstream issue 2140 的特定历史引用。更新 `src/cli/ui/mcp-lifecycle.ts` 的设计说明路径到 archive。扩充 `tests/slash.test.ts`、`tests/feedback.test.ts`、`tests/skills.test.ts` 以锁定这些当前入口。最后运行 `scripts/check-docs.mjs` 完整模式，修复它发现的所有非 archive 断链；不要改写 CHANGELOG、治理记录或 archive 原文来消除历史 URL。</action>
  <verify>
    <automated>npm run build && node scripts/check-docs.mjs && npx --no-install vitest run tests/feedback.test.ts tests/skills.test.ts tests/slash.test.ts && npx --no-install biome check scripts/check-docs.mjs src/skills.ts src/cli/cpu-prof.ts src/cli/ui/feedback.ts src/cli/ui/mcp-lifecycle.ts src/cli/ui/slash/handlers/basic.ts tests/feedback.test.ts tests/skills.test.ts tests/slash.test.ts && npm run typecheck && git diff --check</automated>
  </verify>
  <done>所有当前入口与运行时帮助链接指向当前 fork/当前 docs，归属与历史 issue 仍准确保留；三组聚焦测试、文档完整检查、Biome、typecheck 和 diff hygiene 全部通过。</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| 历史 archive → 当前用户 | 用户可能把旧安装、桌面、dashboard 或 upstream release 指令误认为当前支持路径。 |
| 仓库源码/配置 → 人工文档 | 命令与配置在代码中演进，文档副本可能漂移并诱导错误操作。 |
| 文档示例 → 本地凭据/外部服务 | API key、bot token、allowlist 和代理示例可能泄露真实 secret 或放宽访问边界。 |
| CLI 内置链接 → GitHub/文档站点 | 运行时生成的 URL 会把用户导向 issue、setup 与维护入口，错误目标会造成身份混淆。 |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-QCS-01 | Spoofing | docs/archive + README navigation | high | mitigate | Task 1 添加日期、只读快照和非当前指南警告；Task 3 保证所有当前导航先进入 docs hub。 |
| T-QCS-02 | Tampering | CLI/config documentation drift | medium | mitigate | Task 2 记录 live source mapping 并用 `scripts/check-docs.mjs` 比对顶层 CLI 与结构；Task 3 将检查纳入验收。 |
| T-QCS-03 | Information Disclosure | configuration/channel examples | medium | mitigate | Task 2 只使用明显占位值，明确 token/API key 不提交，并保留 fail-closed owner/allowlist 说明。 |
| T-QCS-04 | Repudiation | upstream provenance | low | mitigate | Task 1 使用 `git mv` 和 archive manifest 保存来源、日期、原路径；Task 3 不改写 CHANGELOG 与治理历史。 |
| T-QCS-05 | Spoofing | runtime about/feedback/setup URLs | medium | mitigate | Task 3 用聚焦测试锁定当前 fork URL，并由 docs checker 对指定 live entrypoint 做 allowlist 检查。 |
</threat_model>

<source_audit>
| SOURCE | ID | Feature/Requirement | Task | Status | Notes |
|--------|----|---------------------|------|--------|-------|
| GOAL | QCS-DOCS-01 | 归档原 Reasonix 已失效文档且不删除历史 | 1 | COVERED | lossless `git mv` + dated archive manifest |
| GOAL | QCS-DOCS-01 | 基于 reasonix-legacy dev 重建可维护项目文档 | 2 | COVERED | live CLI/config/architecture/channel sources |
| GOAL | QCS-DOCS-01 | 修复链接与入口 | 3 | COVERED | README、contributor、package metadata、runtime URLs、checker |
| REQ | QCS-DOCS-01 | 单个 quick plan、1-3 个聚焦任务 | 1-3 | COVERED | 1 个 plan，3 个原子 concern |
| RESEARCH | N/A | quick mode 禁止 research phase | N/A | COVERED | 使用仓库 live source 与既有 codebase maps，无外部依赖或方案选择 |
| CONTEXT | CTX-01 | 先检查 tracked docs 与 CLI/config surfaces 再决定移动 | 1-3 | COVERED | 归档清单排除当前/治理/基准/包内/规划文档 |
| CONTEXT | CTX-02 | benchmark、package-local README、contributor/security/governance/planning 不得误归档 | 1,3 | COVERED | Task 1 明确 survivor set；Task 3 原地修复 package/contributor |
</source_audit>

<verification>
- `npm run build` 后的 `reasonix --help` 与当前 CLI 文档由 checker 交叉验证。
- `node scripts/check-docs.mjs` 对当前 Markdown 相对链接、docs hub、archive 入口、CLI 命令覆盖和维护 URL allowlist 返回 0。
- 聚焦 Vitest 覆盖 `/about`、feedback 与内置 QQ skill 链接；Biome、TypeScript 和 `git diff --check` 通过。
- `git status --short` 只显示计划内 archive relocations、当前文档、入口与测试变更；明确 survivor 文件未被移动。
</verification>

<success_criteria>
- 原上游 README、working knowledge、架构/CLI 参考和静态站点均保存在 `docs/archive/upstream-reasonix/`，且 archive 首页明确日期、来源与失效范围。
- 根 README 的首选文档入口是 `docs/README.md`；当前指南不再描述 Web dashboard、Tauri desktop 或 upstream 维护/发布路径。
- 当前文档覆盖安装、全部顶层 CLI、slash 导航、配置、Pure CLI 架构以及 QQ/Telegram/Weixin 三通道。
- 根 `REASONIX.md` 仍是有效项目记忆文件，但内容与当前 dev 分支一致。
- 当前仓库、issue、about、setup 和 dsnix 元数据入口均指向 `ZYist/reasonix-legacy`；上游只作为明确 attribution 或 allowlisted 历史引用。
- 自动文档检查和聚焦回归测试全部通过，且未引入新依赖。
</success_criteria>

<output>
Create `.planning/quick/260715-qcs-reasonix-reasonix-legacy-dev/260715-qcs-SUMMARY.md` when done.
</output>
