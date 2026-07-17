# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Pure CLI

**Shipped:** 2026-07-05
**Phases:** 4 | **Plans:** 8 | **Timeline:** 2026-07-02 → 2026-07-05 (~4 天,~2.9h 执行)

### What Was Built

- **纯 CLI 收敛** — Web 面板(`dashboard/` + `src/server/`)+ Tauri 桌面 GUI(`desktop/` + 3555 行 sidecar god module + `src/desktop/`)整体物理移除,`reasonix desktop` 退役为 i18n 薄 stub。
- **HeadlessHost 无头对话宿主** — `src/cli/headless/`(host + turn-driver + gate-bridges)复刻 `buildRuntimeFor` recipe,QQ/Telegram/微信经同一宿主 + 同一 `GateCallbacks` 形状作为独立 CLI 命令运行,脱离 Tauri JSON-RPC,核心 loop/PauseGate/工具集零重实现。
- **干净构建链** — `postinstall.mjs`/`sync-desktop-version.mjs`/`release.yml` 退役,`package.json`/`ci.yml`/`.claude/CLAUDE.md` 对齐纯 CLI,`npm pack` 输出 9.2 MB / 168 文件 CLI-only tarball。
- **零回归证明** — 14 baseline 红收敛到 3 个 evidence-deferred 预存红;19 命令 `--help` 全绿、8 离线命令功能冒烟、tree-sitter `code-query` 跨 6 语言 e2e 存活。

### What Worked

- **垂直切片 MVP phase** — 每个 phase 交付"系统仍可工作"的切片,纯 CLI 路径始终可用;依赖序 1(面板)→ 2(机器人解耦)→ 3(删 GUI)→ 4(构建+回归)让删 sidecar 前宿主就位,无中断。
- **D-01 三段式 pre-existing 证明** — (baseline 红 + git-diff 未触 + HEAD 同款失败)让"预存红"分类可审计、不静默、不 rabbit-hole,4 个 milestone 红修绿、3 个预存红 deferred 都有据。
- **fresh-baseline 纪律** — `fabricated-numeric-baselines` 规则强制分类前重跑 `npm test` 计数,纠正了"22 红"的错误记忆(实际 14)。
- **cache-first 核心复用被运行时证明** — `reasonix code` live 回合模型调用原生 `read_file` 读到 `0.55.0`;`reasonix run` live 回合 MCP bridge + cache 50% + telemetry 全链路存活。核心 loop 在多次剥离后仍未回归。
- **sidecar 字节级冻结直到就绪才删** — Phase 2 全程 `git diff --stat src/cli/commands/desktop.ts src/desktop/` 为空(D-09),保证 Phase 3 删 sidecar 时三 bot 已有独立宿主。

### What Was Inefficient

- **plan 耦合分析低估表面文件数** — 01-01 漏列 `handle-assistant-final.ts`、`observability.ts`、12 个面板专属测试,typecheck/运行时才暴露。grep 全树一次性找齐比按计划清单逐文件改更可靠。
- **plan verify-gate 措辞与运行时实际不符** — 多处 `<verify>` 写 `node --import tsx tests/X.test.ts`(实际需 vitest 的 React/mock 环境)或 dotted-literal i18n grep(实际是 nested-object 语法)。每 plan 执行时都要现场校正。
- **fabricated numeric baseline 一开始就出现** — STATE.md/模型回忆的"22 红"是错的;若没有强制 fresh count,triage 会基于错误基线。

### Patterns Established

- **删除 recipe** — 剥离 surface 时:`git rm` 目录 + grep 全树找齐所有 import(含动态 import、测试)+ 清 i18n 死串 + 保 build 绿,一次性清零。
- **Retirement stub** — `program.command("X").description("removed...").action(() => { console.error(t("commands.X.retired")); process.exit(1); })`,保 Commander 链但零 attack surface。
- **HeadlessHost + GateCallbacks 对象注入** — channel adapter 的稳定注入契约(TUI 包 ref shim,无头直接闭包),取代 TUI `*Ref` 模式,让 adapter 脱离 React/Ink。
- **Scoped gate when pre-existing-red** — 全量 vitest 绿不是当前 phase 的信号时:structure grep + survivor scoped vitest + deleted-file 确认,把全量绿留给负责 SAFE 的 phase。
- **baseline-comparison 三段证明** — 预存红分类的标准证据格式。

### Key Lessons

1. **删 GUI 前先解耦寄生宿主** — QQ 原寄生在桌面 sidecar,删 sidecar 前必须先把 bot 解耦到独立宿主,否则删完 QQ 无家可归。依赖序锁定是关键。
2. **fresh-baseline 强制** — 任何"预存红 N 个"的断言,分类前必须重跑计数;模型/文档的数字回忆不可信。
3. **verify gate 要匹配运行时** — plan 的 `<verify>` 命令应写实际可运行的(vitest vs node --import tsx、nested-object vs dotted-literal grep),否则每 plan 都要现场纠偏。
4. **耦合分析用 grep 而非记忆** — 删 surface 前用 `grep -rn 'from "X'` 找齐全部引用(含测试、动态 import),比按计划清单逐文件改更不易漏。

### Cost Observations

- Model: inherit(glm-5.1 全程)。
- 平均 ~24 min/plan(01-01 57min 最重;04-01 7min 最轻)。
- 总执行 ~2.9h(4 phase / 8 plan),不含 planning/discuss/review/verification 周期。
- Notable: Phase 4 回归 plan(04-02)是最值钱的——把 14 红收敛到 3 预存红,用三段证明把"回归"从信仰变成审计事实。

---

## Milestone: v1.1 — Risk Foundations & Maintenance Simplification

**Shipped:** 2026-07-17
**Phases:** 5 | **Plans:** 9

### What Was Built

- 固化版本、fork、`dev` CI 和风险 coverage 四项治理政策。
- 对齐当前文档、规划 maps 与测试配置，移除 Tauri 测试残留。
- 将 runtime i18n 收敛到 `en`/`zh-CN` 并提供安全迁移。
- 为 TUI、关键 CLI command 和 Telegram/Weixin 生命周期补齐离线特征测试。
- 为 CI 增加跨平台首轮/诊断重试可见性。

### What Worked

- 先做 human-governance gate，再让身份、测试和 CI 改动引用同一事实源。
- 按风险面拆分工作包，避免 i18n、测试、文档与 CI 的高风险编辑互相污染。
- 使用离线 fake transport、fake TTY 和 synthetic events 保护用户可观察行为。

### What Was Inefficient

- phase 目录在正式 milestone closeout 前被提前移入 archive，导致 `init.manager` 无法投影已完成状态。
- REQUIREMENTS traceability 在 audit 通过后仍保持 Pending，正式归档时需要补同步。
- 版本治理结论随后被 package 1.2.0 与历史发布链再次打破，说明“文档政策”必须配合自动一致性门禁。

### Patterns Established

- 关键路径采用 characterization test，而不是按覆盖率百分比补无意义断言。
- 真实凭据/网络/TTY UAT 与自动化测试明确分层。
- CI retry 必须保留首轮失败证据，不能只呈现最终绿色。

### Key Lessons

1. 正式 closeout 前不要提前移动 phase 目录；若必须移动，readiness 工具也要能读取 archive。
2. 版本、package、bin、lockfile、运行时版本和 release workflow 需要自动一致性检查，单靠治理文档会再次漂移。
3. 支持矩阵应匹配真实维护环境；v1.3 将 Windows / Node 24.15.0 设为唯一强制标准。

### Cost Observations

- Model mix: inherited project profile。
- Sessions: milestone work concentrated on 2026-07-13, with closeout on 2026-07-17。
- Notable: 9 plans in one implementation day; most value came from deterministic characterization and explicit governance boundaries。

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 Pure CLI | ~4 天 | 4 | 建立 GSD phase 工作流(.discuss → .plan → .execute → .verify);确立删除 recipe + retirement stub + 三段预存红证明 |
| v1.1 Risk Foundations | 1 implementation day + closeout | 5 | 建立治理 gate、双语边界、离线 characterization 与 flaky retry 可见性 |

### Cumulative Quality

| Milestone | Test Files | verify 状态 | Zero-Dep Additions |
|-----------|------------|-------------|--------------------|
| v1.0 Pure CLI | 3 failed \| 266 passed | build/lint/typecheck exit 0 | 0(纯删除/解耦里程碑,无新依赖) |
| v1.1 Risk Foundations | 278 files / 3783 passed / 15 skipped | full verify + retry wrapper passed | 0 |

### Top Lessons (Verified Across Milestones)

1. *(v1.0 首个里程碑,待跨里程碑验证)* fresh-baseline 纪律 + 三段 pre-existing 证明,让"回归零"可审计。
2. *(待验证)* 删寄生宿主前先解耦,依赖序锁定保系统全程可用。
