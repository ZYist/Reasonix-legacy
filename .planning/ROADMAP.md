# Roadmap: reasonix-legacy

## Overview

v1.1 在不改变核心 agent 行为的前提下，先固化四项必须由人决定的治理事实，再对齐当前对外与内部事实源；随后以独立 work package 收缩双语 i18n，补齐高风险用户路径的离线特征测试，最后让活跃开发路径和 flaky retry 在 CI 中可见。特征测试先于任何未来热点模块重构，v1.2 的 REF 要求不属于本路线图。

## Milestones

- ✅ **v1.0 Pure CLI** — Phases 1-4 (shipped 2026-07-05) — [archive](milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 Risk Foundations & Maintenance Simplification** — Phases 5-9 (planned)

## Phases

<details>
<summary>✅ v1.0 Pure CLI (Phases 1-4) — SHIPPED 2026-07-05</summary>

把项目从多前端收敛为纯 CLI，同时保留 QQ/Telegram/微信机器人接入能力。10/10 v1.0 requirements complete；完整 phase details 见 [milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)。

- [x] **Phase 1: Web Panel Removal** — 移除 Web panel 与桥接依赖
- [x] **Phase 2: Bot Decoupling to Standalone CLI** — 将机器人接入解耦为独立 CLI 命令
- [x] **Phase 3: Desktop GUI Removal** — 移除 Tauri desktop 并保留兼容 stub
- [x] **Phase 4: Build Chain Cleanup & Full Regression** — 简化构建链并完成纯 CLI 回归

</details>

### 🚧 v1.1 Risk Foundations & Maintenance Simplification

- [x] **Phase 5: Governance Decisions** - 人工确定版本、仓库、开发分支与 coverage 四项权威政策 (completed 2026-07-13)
- [x] **Phase 6: Repository Truth Alignment** - 让当前用户文档、规划事实和测试依赖与 live repository 一致 (completed 2026-07-13)
- [x] **Phase 7: Bilingual i18n Boundary** - 将运行时语言收缩为可迁移、可回退且 key 对齐的英文与简体中文 (completed 2026-07-13)
- [x] **Phase 8: Critical Path Characterization** - 用离线行为测试保护 TUI、关键 CLI 命令和 Telegram/Weixin 生命周期 (completed 2026-07-13)
- [ ] **Phase 9: CI and Flaky Visibility** - 让活跃开发路径获得完整 CI 门禁并显式报告 retry 后通过

## Phase Details

### Phase 5: Governance Decisions

**Goal**: 维护者和后续自动化可以引用一套由人明确批准的版本、仓库身份、开发分支和关键路径 coverage 政策。
**Depends on**: Phase 4
**Requirements**: GOV-01, GOV-02, GOV-03, GOV-04
**Success Criteria** (what must be TRUE):

  1. 维护者可以查明 npm semver、GSD milestone、历史 tags 与首次 Pure CLI release 的权威关系，而无需从冲突版本号中猜测。
  2. 维护者可以明确区分当前 fork 的维护入口与 upstream attribution，并知道当前公开链接应指向何处。
  3. 维护者可以查明 `dev` push 或受保护 PR 如何获得 CI，以及哪些 GitHub 设置必须由 operator 手工完成。
  4. 维护者可以依据一份获批政策评估全仓非回归基线和 TUI、command、channel 风险覆盖，而不是只看单一全局百分比。

**Plans**: 1/1 plans complete

- [x] 05-01-PLAN.md

### Phase 6: Repository Truth Alignment

**Goal**: 用户和 AI 从当前文档、规划资料及测试配置中获得的项目事实与 live repository 一致，同时历史记录保持完整。
**Depends on**: Phase 5
**Requirements**: TRUTH-01, TRUTH-02, TRUTH-03, TRUTH-04
**Success Criteria** (what must be TRUE):

  1. 用户从英文、简体中文 README 和当前入口文档看到的产品身份、版本、仓库链接与 CLI-only 能力和实际仓库一致。
  2. AI 从 `.planning/codebase`、PROJECT 与 STATE 读取到的架构、目录、集成和测试事实可由 live paths 与 import graph 复核。
  3. 维护者运行当前测试时，不再需要已删除的 Tauri、desktop 或 Web dashboard modules、mocks 或 aliases。
  4. 维护者仍可查阅完整历史 CHANGELOG、归档里程碑和合法的 `reasonix stats` terminal dashboard 叙述。

**Plans**: 3/3 plans complete

- [x] 06-01-PLAN.md
- [x] 06-02-PLAN.md
- [x] 06-03-PLAN.md

### Phase 7: Bilingual i18n Boundary

**Goal**: 用户只面对英文与简体中文两个规范 locale，旧配置和常见别名可安全迁移，维护者无法静默引入双语 key 漂移。
**Depends on**: Phase 6
**Requirements**: I18N-01, I18N-02, I18N-03, I18N-04, I18N-05
**Success Criteria** (what must be TRUE):

  1. 用户在运行时、语言选择界面和发布包中只看到 `en` 与 `zh-CN` 两个规范 locale。
  2. 用户使用受支持的英文或中文 locale 别名时，程序将其归一化为对应规范值并正常启动。
  3. 使用 `ja`、`de`、`ru` 或其他不支持 locale 的现有配置不会导致启动失败；程序按系统语言回退并把配置写回 `en` 或 `zh-CN`。
  4. 维护者修改任一语言文案时，自动 key parity 检查和类型检查会阻止缺失或多余 key。
  5. 用户在当前 README、tests、fixtures 和发布资源中只遇到英文或中文，而历史 CHANGELOG 中的语言记录不被改写。

**Plans**: 1/1 plans complete

- [x] 07-01-PLAN.md

**UI hint**: yes

### Phase 8: Critical Path Characterization

**Goal**: 维护者可以在无真实模型、网络、凭据或交互式 TTY 的环境中验证最易回归的 TUI、CLI command 与 channel 生命周期行为。
**Depends on**: Phase 7
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):

  1. 维护者可以离线验证 TUI composer 的输入、提交、取消、busy/interrupt 等主要状态转换。
  2. 维护者可以离线验证 TUI live output、scrollback/自动跟随和关键用户可见反馈，且不调用真实 DeepSeek 服务。
  3. 维护者可以通过测试观察 `run`、`commit` 与 MCP 关键命令的参数传递、成功输出、错误信息和失败退出行为。
  4. 维护者可以通过测试观察 Telegram 与 Weixin 的启动、事件转发、recoverable/fatal error、关闭和中断清理生命周期。
  5. 默认测试不需要真实网络、bot 凭据或交互式 TTY；剩余 live UAT 明确记录为人工验证而非自动覆盖。

**Plans**: 3/3 plans complete

- [x] 08-01-PLAN.md
- [x] 08-02-PLAN.md
- [x] 08-03-PLAN.md

**UI hint**: yes

### Phase 9: CI and Flaky Visibility

**Goal**: 维护者能确认活跃开发路径经过完整双平台验证，并能从 CI 结果识别被 retry 掩盖的首轮失败。
**Depends on**: Phase 8
**Requirements**: CI-01, CI-02, CI-03
**Success Criteria** (what must be TRUE):

  1. 维护者选定的活跃开发路径会在 Ubuntu 与 Windows / Node 22 上自动执行 build、lint、typecheck 和 tests，并明确提示尚需人工配置的 branch protection。
  2. 维护者可在 CI job 结果或 summary 中区分首轮通过与“首轮失败、重试通过”，原始失败退出语义不会被 reporter 吞掉。
  3. 维护者仍能看到 tokenizer、jobs 和其他必要慢测试执行；任何排除或专门 retry 都附有可查证的原因。

**Plans**: 0/1 plans executed

- [ ] 09-01-PLAN.md

## Dependency Order and Planning Guardrails

- Phase 5 的 HG-01..04 必须由人明确选择；未记录决策时不得开始依赖它们的身份、coverage 或 CI 修改。
- Phase 7 是独立且有边界的 i18n work package，不与事实源、测试或 CI 高风险编辑合并为同一 plan。
- Phase 8 的 characterization tests 必须在任何未来 `App.tsx`、`config.ts`、`loop.ts` 或大型 tools 重构前完成；REF-01..04 属于 v1.2 候选，不映射到本路线图。
- 每个 plan 只处理一个相关 work package；README/identity、planning truth、dead test config、TUI、command wiring、channel lifecycle 和 CI edits 不得混成一个 plan。

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Web Panel Removal | v1.0 | 2/2 | Complete | 2026-07-03 |
| 2. Bot Decoupling to Standalone CLI | v1.0 | 3/3 | Complete | 2026-07-04 |
| 3. Desktop GUI Removal | v1.0 | 1/1 | Complete | 2026-07-04 |
| 4. Build Chain Cleanup & Full Regression | v1.0 | 2/2 | Complete | 2026-07-05 |
| 5. Governance Decisions | v1.1 | 1/1 | Complete   | 2026-07-13 |
| 6. Repository Truth Alignment | v1.1 | 3/3 | Complete   | 2026-07-13 |
| 7. Bilingual i18n Boundary | v1.1 | 1/1 | Complete   | 2026-07-13 |
| 8. Critical Path Characterization | v1.1 | 3/3 | Complete   | 2026-07-13 |
| 9. CI and Flaky Visibility | v1.1 | 0/1 | Planned    |  |

---
*Roadmap created: 2026-07-02 · v1.0 shipped: 2026-07-05 · v1.1 roadmap created: 2026-07-13*
