# Phase 4: Build Chain Cleanup & Full Regression - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning
**Mode:** auto (`--auto`; all gray areas auto-selected, recommended option chosen per area, single-pass per `modes/auto.md`)

<domain>
## Phase Boundary

里程碑 M1 收尾 phase：把前三期剥离后残留的**构建链/CI/文档碎片**清零,并跑通**全量回归**证明纯 CLI 路径零回归。本 phase 不再删任何运行时代码(`dashboard/`+`desktop/`+`src/server/`+`src/desktop/`+`desktop.ts` 已在 1/2/3 期移除),只清理它们留在**构建配置、CI 工作流、发布脚本、项目文档、测试套件**里的痕迹,并以 `npm run verify` 全绿 + 逐命令冒烟作为交付证据。

**In scope:**

- **PANEL-04 构建链残留清理**(`package.json` / scripts / CI / 文档):
  - `scripts/postinstall.mjs`——整文件 `git rm`(已是 `desktop/package.json` no-op,但仍随 `files` 发布到 npm,属残留);同步从 `package.json` 的 `scripts.postinstall` 与 `files` 数组移除
  - `scripts/sync-desktop-version.mjs`——整文件 `git rm`(孤儿,唯一消费者 `release.yml` 也退役)
  - `.github/workflows/release.yml`——整文件 `git rm`(休眠 Tauri 打包工作流,仅 `desktop-v*` tag 触发;Rust 矩阵 + R2/GitHub updater endpoint + Apple/Windows 签名一并消失)
  - `.github/workflows/ci.yml`——步骤名 `Build (tsup + dashboard)` → `Build (tsup)`(步骤实际跑 `npm run build` 已无 dashboard,仅名过时);researcher 核实 CI 无其他 dashboard/desktop/rust 残留
  - `CLAUDE.md`——裁剪已失真的 desktop/Rust/Tauri 段(Special: Desktop Subdir、Rust language 行、desktop stack、INTEGRATIONS desktop updater、Platform Requirements 里 Tauri bundle 行),与"纯 CLI"现状对齐
- **SAFE-01 纯 CLI 命令逐命令冒烟**:`chat`/`code`/`run`/`acp`/`commit`/`sessions`/`replay`/`diff`/`mcp`/`doctor`/`stats`/`update`/`import-sessions`/`prune-sessions` + 2/3 期新增 `qq`/`telegram`/`weixin`,按 GA-3 hybrid 深度冒烟
- **SAFE-02 tree-sitter + code-query 保留可用**:确认 `scripts/copy-tree-sitter-grammars.mjs` 仍在 `build` 链、`src/code-query/` 未被误删,按 GA-4 跑 `scripts/e2e-code-query.mts` + `scripts/e2e-dist-grammars.mts` 证明 grammars 解析 + dist 打包正常
- **SAFE-03 全量 `npm run verify` 绿**:build/lint/typecheck 已绿(STATE.md 03 记录);核心动作是让 `npm run test` 从 22 pre-existing-red 收敛到全绿或已分类(GA-1 triage)

**Out of scope(红线):**

- 删除任何仍存活的运行时代码——核心 loop/工具/记忆/MCP/AcP/i18n/channel 协议层零改动
- `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/`——**贯穿红线,任何删除清单不得包含**
- 新增 CLI 功能或重写 channel 协议(M1 只做精简)
- 把"非本里程碑引起的预存红测试"全部修绿(GA-1 判定为 triage-split:evidence-defer 而非 rabbit-hole;见 deferred)
- 删除 `publish-npm.yml` / `publish-dsnix.yml`——它们发布 CLI 本体,保留

**关键约束(贯穿):** 核心零回归;CLI 二进制入口(`reasonix`/`dsnix` → `dist/cli/index.js`)+ `write-cli-package-marker.mjs` ESM marker 保留(01-01 防回归契约);`simple-git-hooks` `prepare`/`pre-push` 链路不因删 `postinstall` 而断;每 plan 保纯 CLI 可用(MVP 垂直切片)。

</domain>

<decisions>
## Implementation Decisions

### SAFE-03 pre-existing-red 测试 triage 标尺 (D-01)

- **D-01:** 对 22 个 pre-existing-red 测试文件取 **triage-split** 策略(非 fix-all,非 minimal-baseline),分三桶处置:
  1. **孤儿测试 → 整文件删**:7 个 `dashboard-*.test.ts(x)`(`dashboard-composer-ime`/`dashboard-css-vars`/`dashboard-server-bridge-refresh`/`dashboard-session-url`/`dashboard-settings-baidu`/`dashboard-sidebar-new-chat-layout`/`dashboard-token-persistence`)测的是已删 `src/server/` + dashboard UI 表面,镜像 Phase 1 删 12 个面板专属测试的约定,直接 `git rm`。
  2. **本里程碑引起或便宜可修 → 修**:`headless-gate-bridges`/`headless-host`(Phase 2 新代码,若红是真 bug 或测试 setup 引用已删 desktop 类型)、`mcp-server-list`(若因 `src/server` 移除断引)、`version`(若 0.55.0 版本号失配)等,逐文件判断后修到绿。
  3. **预存且与本里程碑无关 → evidence-defer**:`ui-*`(~14 个 TUI 组件测试)、`ssh-remote`、`mcp-runtime-failures`、`hydrate-cards`(STATE.md 已记 Biome suppressions 预存警告)等若是 milestone 前就红、且修复成本高/与精简无关,沿用 Phase 2 Telegram UAT 的 **acknowledged-deferred** 模式——在 VERIFICATION 记录文件名+失败原因+证据+非本 phase 引起,留 fix cycle,**不静默留红、也不强行 rabbit-hole**。
  - **"零回归"释义:** SAFE-03 的零回归 = **无 NEW red**(本 phase 构建清理未引入新失败)+ 孤儿清零;不等于"修好仓库里所有历史预存红"。researcher/executor须用 `git stash`/baseline 对比证明哪些红是 pre-existing(D-01 桶 3 的判据)。

### PANEL-04 构建链/CI 退役广度 (D-02)

- **D-02:** 取 **full-sweep**(非 dormant-only):`release.yml`、`postinstall.mjs`、`sync-desktop-version.mjs` 三件直接 `git rm`;`ci.yml` 步骤名校正;CLAUDE.md desktop/Rust/Tauri 段裁剪。理由:PANEL-04 明文 = "构建链全面简化,CLI 独立构建发布";休眠 Tauri 工作流 + 孤儿脚本 + 随包发布的 no-op postinstall + 过时 CI 步骤名 + 失真文档**全部是构建链残留**,留着违背"clean build chain"意图。安全性:`postinstall.mjs` 对发布 tarball 本就是 no-op(无 `desktop/package.json` 即 `process.exit(0)`),移除不影响 `npm install`;`release.yml` 仅 `desktop-v*` tag 触发,删后常规 push/PR/NPM 发布不受影响;git 历史保留删除物。`prepare`(`simple-git-hooks`)独立于 `postinstall`,不受影响。

### SAFE-01 CLI 命令冒烟深度 (D-03)

- **D-03:** 取 **hybrid**(非纯 `--help`、非全功能 happy-path):
  - **全部命令**跑 `--help`/启动冒烟(证明 import 图无断裂、Commander 注册无残留 desktop 引用)——这是删除构建链后最便宜的回归网。
  - **离线可跑命令**(`stats`/`doctor`/`commit`/`sessions`/`replay`/`diff`/`mcp`/`acp`)跑功能 happy-path(读真实 session/config,验证核心路径)。
  - **需 live key/TTY/外部服务的命令**(`chat`/`code`/`run` 需 DeepSeek key + TTY;`qq`/`telegram`/`weixin` 需 bot 凭据)——有 key 跑一轮真 turn(沿用 01-02 `reasonix code` read_file→0.55.0 模式 / 02-VERIFICATION QQ full-turn live);无 key 沿用 Phase 2 Telegram **acknowledged-deferred**(缺 token 不阻塞本 phase 完成)。`update`/`import-sessions`/`prune-sessions` 跑 `--help` + 干跑参数校验。

### SAFE-02 tree-sitter/code-query 验证方法 (D-04)

- **D-04:** 取 **跑现成 e2e 脚本**(`scripts/e2e-code-query.mts` + `scripts/e2e-dist-grammars.mts`)为首选验证:仓库已自带这两个 purpose-built 脚本,跑通即证明 grammars 能解析 + dist 打包了 grammar 产物,比"build 步骤还在"的静态检查强、比 live agent turn 轻。若 e2e 脚本本身红/缺失,escalate 到 live `reasonix code` 调 `code-query` 工具或先修 e2e。`scripts/copy-tree-sitter-grammars.mjs` 必须留在 `build` script(已确认在),`src/code-query/` 不得出现在任何删除清单。

### Claude's Discretion

- **CLAUDE.md 裁剪边界**:具体删哪些 desktop/Rust 行/段由 plan 阶段定;原则是"与纯 CLI 现状对齐、删除已失真陈述",保留仍真实的部分(如 Node ≥22、tsup、tree-sitter、Ink fork)。CLAUDE.md 是项目指令(每 session 加载),裁剪后须仍能正确指导后续工作。
- **桶 2 vs 桶 3 的逐文件归类**:22 个红文件的精确归属(修 vs defer)由 executor 跑测试 + baseline 对比后判定,context 层只锁定 triage 标尺(D-01)不锁定逐文件结论。
- **`release-mirror.yml` / 其他 workflows**:researcher 核实是否引用 `desktop-v*` tag 或 Tauri 产物;若是 desktop-only 则随 D-02 退役,若同时镜像 CLI tag 则保留 CLI 部分。`publish-npm.yml`/`publish-dsnix.yml` 保留(发布 CLI 本体)。
- **冒烟退出码/i18n**:本 phase 是删除+验证,预期不新增用户可见串;若退役 `reasonix desktop` stub(03-01 已是薄 stub)需调文案,走现有 i18n 5-locale 契约。
- **桶 3 defer 的 evidence 格式**:沿用 02-VERIFICATION.md Acknowledged Gaps 风格(文件名 + 失败摘要 + 证明非本 phase 引起 + 留 fix cycle)。

### Folded Todos

无待办匹配本 phase(STATE.md Pending Todos = None;`cross_reference_todos` 返回 `todo_count: 0`)。

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

无外部 SPEC/ADR(本仓库为 fork,无 ADR 体系);关键约束散落在 `.planning/` 文档与 `.claude/CLAUDE.md`。canonical refs 以文档章节 + 代码锚点为主。

### Requirements & constraints
- `.planning/REQUIREMENTS.md` §PANEL-04 / §SAFE-01 / §SAFE-02 / §SAFE-03 + Out of Scope — 本期必须满足的 4 项 + 不得越界红线(不删 tree-sitter/code-query、不重写 channel 协议、不加 CLI 功能)
- `.planning/ROADMAP.md` §Phase 4 — Goal + 4 条 Success Criteria + 2 个 plan(`04-01` 构建链简化 / `04-02` 全量回归)定义
- `.planning/PROJECT.md` §Constraints / §Key Decisions / §Context「当前进度」— tech stack、CLI 二进制入口、tree-sitter 构建链保留、phase 依赖序 1→2→3→4、M1 三条决策
- `.claude/CLAUDE.md` §Constraints / §Conventions / §Configuration / §Special: Desktop (Tauri) Subdir — D-02 裁剪靶(Desktop/Rust/Tauri 段已失真);同时是 tech stack/命名/注释规范的来源(保留)

### Prior phase context(继承,不重问)
- `.planning/phases/03-desktop-gui-removal/03-CONTEXT.md` — **D-03 构建链切分边界**(本期只做保 build 绿的最小修复,完整 trim 留 Phase 4)+ deferred 明确列出 `files`/`postinstall`/`typecheck` trim、`release.yml` Tauri 退役、Rust 矩阵移除、CLAUDE.md Rust 段、R2/GitHub updater endpoint 归 Phase 4——本期执行的清单基础
- `.planning/phases/03-desktop-gui-removal/03-VERIFICATION.md`(若存在) + STATE.md §Deferred Items — 22 文件 pre-existing-red 的清单(dashboard-*、headless-*、version、ssh-remote、mcp-runtime-failures、ui-*、hydrate-cards)+ 「全量 vitest 绿是 Phase 4 SAFE-03 职责,无一由 desktop removal 引起」的 baseline 声明(D-01 桶 3 判据)
- `.planning/phases/02-bot-decoupling-to-standalone-cli/02-VERIFICATION.md` — Telegram UAT acknowledged-deferred 模式(D-01 桶 3 / D-03 无 key 命令的 template)
- `.planning/phases/01-web-panel-removal/` — Phase 1 删 12 个面板专属测试的孤儿测试删除约定(D-01 桶 1 的先例)

### Code anchors — 清理目标(D-02 退役 / 校正)
- `scripts/postinstall.mjs` — 9 行 desktop workspace installer,已 no-op(`existsSync("desktop/package.json")` false → exit 0);随 `package.json` `scripts.postinstall` + `files` 一并移除
- `scripts/sync-desktop-version.mjs` — desktop 版本同步孤儿脚本,唯一消费者 `release.yml`
- `.github/workflows/release.yml` — Tauri 打包工作流(`desktop-v*` tag 触发,Rust 矩阵 @28-32、R2+GitHub updater、Apple/Windows 签名)
- `.github/workflows/ci.yml:36` — 步骤名 `Build (tsup + dashboard)`(实际跑 `npm run build`,名过时);`ci.yml` `test:coverage` 步骤会撞 22 红(SAFE-03 改善后 CI 才稳)
- `.claude/CLAUDE.md` §Special: Desktop (Tauri) Subdir / §Languages Rust 行 / §Frameworks Tauri 行 / §Platform Requirements Tauri bundle 行 / §Key Dependencies `@tauri-apps/*` 行 — 裁剪靶

### Code anchors — 复用/不得触碰(reuse, do NOT break)
- `package.json` `build` = `tsup && node scripts/write-cli-package-marker.mjs && node scripts/copy-tree-sitter-grammars.mjs` — 已无 dashboard 依赖(SAFE-02/03 build 基线),`write-cli-package-marker.mjs` ESM marker + `copy-tree-sitter-grammars.mjs` 保留
- `tsup.config.ts` — 双入口(library `src/index.ts` + CLI `src/cli/index.ts`),本期不动
- `tsconfig.json` — `paths` 仅 `@/*` + `ink`,无 dashboard/desktop references(已干净,本期不碰)
- `scripts/copy-tree-sitter-grammars.mjs` + `src/code-query/` + `scripts/e2e-code-query.mts` + `scripts/e2e-dist-grammars.mts` — **贯穿红线 + D-04 验证工具**,不得删
- `src/acp/server.ts`(注意:是 ACP 的 `./server.js`,非已删的 `src/server/`)— live 保留,scout 已确认 `src/acp/{dispatch,gates}.ts` 的 `./server.js` import 指向它,非 drift
- `src/cli/headless/` + `src/{qq,telegram,weixin}/` — Phase 2/3 产物,冒烟验证对象,不改

### Tests — D-01 triage 靶(researcher/executor 跑 `npm test` 后逐文件归类)
- **桶 1 孤儿(预期删)**:`tests/dashboard-{composer-ime,css-vars,server-bridge-refresh,session-url,settings-baidu,sidebar-new-chat-layout,token-persistence}.test.ts(x)`
- **桶 2 候选(修)**:`tests/{headless-gate-bridges,headless-host,mcp-server-list,version}.test.ts(x)`(逐文件判 milestone 引起 vs 预存)
- **桶 3 候选(evidence-defer)**:`tests/ui-*.test.tsx`(~14)、`tests/{ssh-remote,mcp-runtime-failures,hydrate-cards}.test.ts`——baseline 对比证明 pre-existing 后 defer

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **现成 e2e 脚本** `scripts/e2e-code-query.mts` + `scripts/e2e-dist-grammars.mts` — SAFE-02 首选验证工具(D-04),purpose-built,无需自造。
- **`coverage-summary.mjs`** — CI 已用作 coverage job summary;`npm run test:coverage` 产物,可佐 SAFE-03 红文件定位。
- **孤儿测试删除 recipe**(Phase 1)— 删仅覆盖已移除表面的测试,镜像即可(D-01 桶 1)。
- **acknowledged-deferred 文档模板**(Phase 2 `02-VERIFICATION.md`)— D-01 桶 3 / D-03 无 key 命令的现成写法。
- **`gsd-tools query commit`** + scoped gate 模式(03-01)— 本期"绿"的验证形态:typecheck/build/lint + scoped structure grep + 逐命令冒烟。

### Established Patterns
- **一职责一文件、git rm 干净删除** — 反向清理(删脚本/工作流/文档)同样整文件 `git rm`,不留 carve-out;git 历史保留。
- **每 plan 保纯 CLI 可用(MVP 垂直切片)** — 04-01 构建链清理后 build 仍退出 0;04-02 回归后 verify 全绿。每 plan 独立可验证。
- **log+crash > silent wrong output** — D-01 桶 3 不静默留红,defer 须写 evidence;D-02 不留休眠 no-op 误导。
- **i18n 5-locale 契约** — 若退役 stub 涉文案,走 `t()` + 5 locale 同步(01-02/03-01 既定)。
- **scoped gate 而非全量** — 03-01 用 structure grep + scoped vitest 证明 desktop removal 不回归;04-02 升级为全量 verify(SAFE-03),但 D-01 把"全绿"标尺明确化。

### Integration Points
- **构建链**:`package.json` `build`/`files`/`scripts.postinstall` ↔ `tsup.config.ts` ↔ `scripts/{write-cli-package-marker,copy-tree-sitter-grammars}.mjs`;删 `postinstall.mjs` 须同步 `package.json` 两处 + 确认 `prepare`(simple-git-hooks)不受影响。
- **CI**:`ci.yml` lint→typecheck→build→test:coverage;SAFE-03 收敛红文件后 CI test 步骤才稳。
- **发布**:`publish-npm.yml`/`publish-dsnix.yml` 发布 `reasonix-legacy`/`@reasonix/dsnix`;删 `release.yml` 不影响 NPM 发布路径。
- **verify 闸门**:`npm run verify` = build + lint + typecheck + test;`pre-push` hook(simple-git-hooks)依赖它全绿。

</code_context>

<specifics>
## Specific Ideas

- D-01 的"baseline 对比"是判桶 3 的关键动作:executor 在 04-02 开头先跑一次 `npm test` 记录红文件清单,与 STATE.md 03 记录的 22 文件 + `git stash` 本 phase 改动后重跑对比,证明哪些红 pre-existing(非构建清理引起)→ 进桶 3。
- D-02 的 `postinstall.mjs` 删除是"随包发布却 no-op"的特例——它 `files` 里占了发布体积却对 tarball 无作用,删它是 PANEL-04"CLI 独立构建发布"的字面兑现(发布的包不再带 desktop 痕迹)。
- D-03 冒烟顺序建议:先全命令 `--help`(一次性网),再离线命令功能跑,最后有 key 的 live turn;无 key 命令最后归 acknowledged-deferred。
- D-04 若 `e2e-code-query.mts`/`e2e-dist-grammars.mts` 跑通,SAFE-02 即达标;不要过度追加 live agent turn 证明(会引入 DeepSeek key 依赖)。
- CLAUDE.md 裁剪(D-02)易被忽略但重要——它是每 session 加载的项目指令,留着失真的 desktop/Rust 段会持续误导后续 agent(包括本 phase 下游的 researcher/planner/executor)。

</specifics>

<deferred>
## Deferred Ideas

- **桶 3 预存红测试的实际修复**(ui-* ~14、ssh-remote、mcp-runtime-failures、hydrate-cards 等)→ **fix cycle**(非本里程碑引起;本 phase 仅 evidence-defer,不 rabbit-hole)。STATE.md 03 Deferred Items 已挂账。
- **WR-05 medium 安全项**(3 个 command controller raw error message 未脱敏)→ fix cycle(02-SECURITY.md AR-06,延续)。
- **02 代码质量 WR-01/03/04/06 + IN-01..06** → fix cycle(02-VERIFICATION.md followups_deferred)。
- **CC switch / MCP state 的 CLI 侧需求**(原 `desktop/src-tauri/src/cc_switch.rs` desktop-only SQLite,随 desktop 删除已消失)→ 若后续有 CLI 侧 CC switch 需求,属新能力,另开 phase(03-CONTEXT deferred 已记)。
- **R2 bucket / GitHub releases 外部 updater 资源本身的清理**(删 release.yml 移除了引用,但外部 bucket/repo 是否手动清理)→ 非代码事项,留作发布运维判断,不在本 phase 代码范围内。

</deferred>

---

*Phase: 4-Build Chain Cleanup & Full Regression*
*Context gathered: 2026-07-04*
*Mode: --auto (auto-selected all gray areas: GA-1 SAFE-03 triage / GA-2 PANEL-04 sweep / GA-3 SAFE-01 smoke / GA-4 SAFE-02 verify; recommended-option per area; single-pass)*
