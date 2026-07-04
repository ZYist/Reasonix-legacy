# Phase 4: Build Chain Cleanup & Full Regression - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-04
**Phase:** 4-Build Chain Cleanup & Full Regression
**Mode:** `--auto` (recommended option auto-selected per area; no interactive AskUserQuestion; single-pass per `modes/auto.md`)
**Areas discussed:** GA-1 SAFE-03 triage / GA-2 PANEL-04 sweep / GA-3 SAFE-01 smoke / GA-4 SAFE-02 verify

---

## GA-1: SAFE-03 pre-existing-red 测试 triage 标尺

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Fix-all-green | 把全部 22 个红文件修到绿(含与本里程碑无关的预存红) | |
| (b) Triage-split | 孤儿测试删 + 本期引起/便宜可修的修 + 预存无关的 evidence-defer | ✓ |
| (c) Minimal-baseline | 仅保证无 NEW red,预存红原样留 + 写 baseline 文档 | |

**Selected:** (b) Triage-split (recommended default)
**Notes:** "零回归"释为「无 NEW red + 孤儿清零」,不等于修好仓库全部历史预存红。镜像 Phase 1 删 12 个面板孤儿测试 + Phase 2 Telegram acknowledged-deferred 双先例。桶 3 判据靠 baseline 对比(`git stash` 本期改动后重跑证明 pre-existing)。

---

## GA-2: PANEL-04 构建链/CI 退役广度

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Full-sweep | 删 release.yml + postinstall.mjs + sync-desktop-version.mjs;校 ci.yml 步骤名;裁 CLAUDE.md desktop/Rust/Tauri 段 | ✓ |
| (b) Dormant-only | 仅移除主动致断的;留休眠 release.yml + 随包 no-op postinstall | |

**Selected:** (a) Full-sweep (recommended default)
**Notes:** PANEL-04 明文「构建链全面简化,CLI 独立构建发布」——休眠工作流 + 孤儿脚本 + 随包 no-op + 过时步骤名 + 失真文档全是残留。postinstall.mjs 对 tarball 本就 no-op,删安全;release.yml 仅 desktop-v* tag 触发,删不挡常规 CI/NPM 发布;git 历史保留删除物。

---

## GA-3: SAFE-01 CLI 命令冒烟深度

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Static `--help` only | 每命令 `--help` 证明 import 图无断裂 | |
| (b) Functional happy-path all | 每命令跑完整 happy-path(含需 key/TTY 的) | |
| (c) Hybrid | 全命令 `--help` + 离线命令功能跑 + 需 key 命令有 key 跑 live turn / 无 key acknowledged-defer | ✓ |

**Selected:** (c) Hybrid (recommended default)
**Notes:** 沿用 01-02/03-01 冒烟先例。需 DeepSeek key/bot 凭据的命令缺凭据时延续 Phase 2 acknowledged-deferred,不阻塞完成。

---

## GA-4: SAFE-02 tree-sitter/code-query 验证方法

| Option | Description | Selected |
|--------|-------------|----------|
| (a) Build-step-presence only | 确认 copy-tree-sitter-grammars.mjs 留在 build | |
| (b) Run e2e scripts | 跑现成 e2e-code-query.mts + e2e-dist-grammars.mts | ✓ |
| (c) Live code-query tool | 经 reasonix code 调 code-query 工具做真 turn | |

**Selected:** (b) Run e2e scripts (recommended default)
**Notes:** 仓库自带 purpose-built e2e 脚本,跑通即证 grammars 解析 + dist 打包。比静态检查强、比 live agent turn 轻(后者引入 key 依赖)。e2e 本身红则 escalate 到 (c) 或先修 e2e。

---

## Claude's Discretion

- CLAUDE.md 裁剪的精确行/段(plan 阶段定,原则:删失真陈述、留仍真实的 Node/tsup/tree-sitter/Ink 部分)。
- 桶 2 vs 桶 3 的逐文件归类(executor 跑测试 + baseline 对比后判)。
- `release-mirror.yml` 是否 desktop-only(researcher 核实;publish-npm/publish-dsnix 保留)。
- 桶 3 defer 的 evidence 格式(沿用 02-VERIFICATION Acknowledged Gaps 风格)。

## Deferred Ideas

- 桶 3 预存红测试的实际修复(ui-* ~14、ssh-remote、mcp-runtime-failures、hydrate-cards)→ fix cycle。
- WR-05 medium + 02 代码质量 WR/IN 项 → fix cycle。
- CC switch CLI 侧需求(若有)→ 新 phase。
- R2/GitHub 外部 updater 资源的手动清理 → 发布运维判断,非代码范围。
