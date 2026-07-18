---
quick: 260718-nva
status: complete
analysis_branch: dev
remote_ref: origin/dev
remote_sha: b540a507c1ffb4835846fc256e6df206a5c6d040
local_sha: d595d30b7e568b8b3e27417b739b3b20fbee5128
local_only_commits: 20
snapshot_date: 2026-07-18
---

# 本地 `dev` 与远程 `origin/dev` 差异报告

## 1. 结论摘要

在执行 `git fetch --all --prune` 刷新远程引用后，本地 `dev` 与其跟踪分支 `origin/dev` 的关系为：

- 远程基线：`origin/dev` = `b540a507c1ffb4835846fc256e6df206a5c6d040`
- 分析时本地 HEAD：`d595d30b7e568b8b3e27417b739b3b20fbee5128`
- ahead / behind：本地 **ahead 20，behind 0**
- `merge-base(origin/dev, HEAD)` 与 `origin/dev` 完全相同，说明这 20 个提交是从远程 `dev` 顶端线性追加出来的，没有需要先合并的远程新提交。
- 累计提交差异：**139 个文件，新增 3,646 行，删除 868 行**。

这 20 个本地提交不是 20 个彼此独立的功能。它们构成一条比较清晰的演进链：

1. 先完成两项只写报告、不改运行时代码的 quick 评估；
2. 归档 v1.1，并启动 v1.3 “Stable Release Hardening” 里程碑；
3. 完成 Phase 10，把包名、CLI 命令、版本显示和文档统一为 `reasonix-legacy`；
4. 完成 Phase 11 的依赖审计、安装脚本来源证明、安全策略校准和密钥脱敏回归测试；
5. 最后用一个 WIP/checkpoint 提交停在 Phase 12（Windows 发布自动化）开始前。

因此，本地相对远程最重要的产品变化是：**项目身份从历史的 `reasonix` / `dsnix` 混合状态收敛为唯一维护身份 `reasonix-legacy`，同时补强供应链与安全证据；但 Windows 发布自动化尚未进入已提交实现。**

## 2. 比较口径

本报告只分析下面这个提交区间：

```text
origin/dev..d595d30b
```

使用的核心命令：

```powershell
git fetch --all --prune
git rev-list --left-right --count origin/dev...HEAD
git merge-base origin/dev HEAD
git log --reverse origin/dev..HEAD
git diff --shortstat origin/dev..HEAD
git diff --stat origin/dev..HEAD
```

远程 `origin/dev` 最新提交为：

```text
b540a507  2026-07-16  chore(planning): archive v1.1 phase artifacts and refresh intel
```

分析时本地最新提交为：

```text
d595d30b  2026-07-18  wip: phase-12-transition paused at 3/4
```

> 注意：当前工作区还有未提交修改和未跟踪文件。它们不属于 `origin/dev..HEAD` 的 20 个提交，本报告在第 7 节单独说明，避免把“已提交但未推送”和“尚未提交”混在一起。

## 3. 变化规模与分布

累计差异为：

```text
139 files changed, 3646 insertions(+), 868 deletions(-)
```

按路径粗分：

| 区域 | 变更文件数 | 主要内容 |
|---|---:|---|
| `.planning/` | 28 | v1.1 归档、v1.3 需求/路线图、Phase 10/11 计划、总结、验证和交接状态 |
| `src/` | 51 | 把用户可见及内部运行时身份从旧命令名统一为 `reasonix-legacy` |
| `tests/` | 23 | 版本/包身份防漂移、运行时命令身份、安装脚本来源、频道密钥脱敏回归 |
| 文档与根目录 Markdown | 27 | README、CLI 指南、连接指南、安全策略、贡献与架构文档的命令名统一 |
| 自动化、package、scripts、examples 等 | 13 | 删除 dsnix 发布流、调整 package/bin、文档检查器和依赖锁 |

需要注意两个“大提交”：

- `14624bdf` 修改 79 个文件，主要是全仓运行时和测试文本的旧命令身份清理；
- `d595d30b` 修改 21 个文件，虽然标题是 WIP，但实际同时承载了完整 Phase 11 交付和 Phase 12 交接信息。

## 4. 按工作主题解释

### A. 两项 quick 评估：只形成决策材料

提交：`94079ba8`、`3f045e1c`

这两项提交只改 `.planning/`，没有修改产品代码：

- API 供应商切换评估认为项目已有自定义 OpenAI-compatible endpoint 的基础，但缺少多配置档案、统一解析、能力诊断和安全迁移；建议未来采用 `provider` / `ApiProfile` 形态，而不是只覆盖 `baseUrl`。
- 稳定版就绪度评估梳理了发布身份、供应链、安全合同、Windows 自动化、候选包验证等缺口，为后面的 v1.3 里程碑提供输入。

它们的作用是“调研和定方向”，不是已上线功能。

### B. 关闭 v1.1，建立 v1.3 Stable Release Hardening

提交：`9557d46d`、`c6121c6b`、`65ece447`、`4921682f`、`60ef9ac9`

这一组主要重构 GSD 规划面：

- 把 v1.1 的 roadmap、requirements、audit 移入 `.planning/milestones/` 归档；
- 删除根目录中已经归档的 v1.1 活跃源文件，避免旧里程碑继续冒充当前计划；
- 启动 v1.3，并定义四个阶段：
  1. Phase 10：Package Identity Unification；
  2. Phase 11：Supply Chain and Security Contract；
  3. Phase 12：Windows Release Automation；
  4. Phase 13：Candidate Packaging and Stable Reassessment。

这组提交本身几乎不改变运行时行为，但确立了后续提交的目标和验收边界。

### C. Phase 10：包、命令和版本身份统一

提交：`c32bc151` 至 `3ba7c81b`，共 10 个提交。

这是 20 个提交中最明显的用户可见变化。

#### 核心产品变化

`d54ccc6b`：

- 根包版本从 `1.2.0` 升至 `1.3.0`；
- `package.json` 的 `bin` 从历史的 `reasonix` / `dsnix` 双入口收敛为唯一的 `reasonix-legacy`；
- 删除 `packages/dsnix/` 兼容 shim；
- 删除 `.github/workflows/publish-dsnix.yml`，不再维护独立 dsnix 发布路径；
- 调整 `src/version.ts` 与版本测试，使 CLI 对外暴露 legacy 身份。

`ee795559`：

- 补充并修正版本测试，明确 `reasonix-legacy --version` 的身份和版本输出契约。

`1dae14d5` 与 `14624bdf`：

- 将 README、CLI 文档、连接指南、贡献文档、安全文档中的命令示例统一为 `reasonix-legacy ...`；
- 清理 CLI 命令帮助、TUI 文案、i18n、doctor/update/version、MCP、配置、遥测、会话日志等运行时表面中的旧 `reasonix` / `dsnix` 命令身份；
- 同步更新大量测试期望，避免用户仍被引导执行已删除的命令。

#### 防回归措施

`5fc9ddf8` 与 `000d8484`：

- 新增 `tests/package-identity.test.ts`；
- 扩展 `scripts/check-docs.mjs`；
- 检查 package 名称、bin、版本和文档/运行时表面，防止旧身份重新漂回仓库。

#### 规划闭环

`c32bc151`、`2223d7f6`、`2c85de17`、`3f7a4555`、`e9d03366`、`3ba7c81b` 分别记录讨论、计划、计划总结和最终验证。最终验证文件声明 Phase 10 达成：维护身份只剩 `reasonix-legacy`。

### D. Phase 11：供应链与安全合同

提交：`d595d30b`

虽然提交标题是 `wip: phase-12-transition paused at 3/4`，但它并不只是一个空 checkpoint。该提交实际包含已完成的 Phase 11 工作：

#### 依赖与安装脚本审计

- 更新生产依赖 `undici` 和 `ws` 的安全版本范围，并刷新 `package-lock.json`；
- 新增 `docs/install-script-provenance.md`，记录根 `prepare` 脚本和 lockfile 中全部 `hasInstallScript` 项；
- 扩展 `scripts/check-docs.mjs`，让来源清单、根脚本契约、生产依赖不得带安装脚本等要求成为自动检查；
- 新增 `tests/install-script-provenance.test.ts`，并补强 package identity 测试；
- Phase 总结记录当时 `npm audit --omit=dev` 的 high/critical/total 均为 0。

#### 安全策略与密钥脱敏

- 重写 `SECURITY.md`，删除已退役 dashboard、本地 HTTP server、Tauri 等不再维护的安全范围；
- 明确当前维护范围是 CLI/TUI、ACP、MCP、QQ/Telegram/Weixin 频道及其权限和凭据边界；
- 扩展 Telegram、QQ、Weixin 命令测试，验证错误写入 stderr 前会把频道 token 和 DeepSeek key 替换为 `[redacted]`；
- 文档检查器增加安全范围防漂移约束。

#### 交接状态

- 新增 Phase 11 的两个计划、上下文、讨论记录和完成总结；
- 更新 `.planning/ROADMAP.md` / `.planning/STATE.md`，把项目推进到 Phase 12；
- 新增 `.planning/.continue-here.md` 和 `.planning/HANDOFF.json`，明确当时停在 Phase 12 discussion 前，Windows CI/CodeQL/publish automation 尚未开始。

因此，该提交的真实含义是：**Phase 11 已完成并验证，Phase 12 尚未开始，仓库被有意识地停在可恢复的交接点。**

## 5. 逐提交说明

| # | 提交 | 日期 | 文件 / 行数 | 在做什么 |
|---:|---|---|---:|---|
| 1 | `94079ba8` | 2026-07-16 | 3 / `+406 -7` | 写 API provider/profile 切换能力评估；只产出 quick 计划与报告，不实现功能。 |
| 2 | `3f045e1c` | 2026-07-17 | 3 / `+451 -7` | 评估稳定版发布就绪度，为 v1.3 hardening 列出缺口与建议。 |
| 3 | `9557d46d` | 2026-07-17 | 8 / `+434 -180` | 归档 v1.1 的 requirements、roadmap、audit，并整理 milestone/project/state。 |
| 4 | `c6121c6b` | 2026-07-17 | 2 / `+0 -141` | 删除根 `.planning/` 中已归档的 v1.1 活跃源文件，防止双份真相。 |
| 5 | `65ece447` | 2026-07-17 | 2 / `+14 -17` | 把当前项目状态切换到 v1.3 Stable Release Hardening。 |
| 6 | `4921682f` | 2026-07-17 | 1 / `+91 -0` | 定义 v1.3 的身份、供应链、安全、Windows 发布、候选包复评需求。 |
| 7 | `60ef9ac9` | 2026-07-17 | 2 / `+85 -24` | 创建 v1.3 四阶段 roadmap，并规定阶段依赖和不得自动发布等 guardrail。 |
| 8 | `c32bc151` | 2026-07-17 | 2 / `+203 -0` | 记录 Phase 10 包身份统一的讨论上下文和锁定决策。 |
| 9 | `2223d7f6` | 2026-07-17 | 1 / `+8 -4` | 在项目 STATE 中记录 Phase 10 context 已完成。 |
| 10 | `2c85de17` | 2026-07-17 | 4 / `+191 -9` | 为 Phase 10 建立 10-01/10-02 两个实施计划。 |
| 11 | `d54ccc6b` | 2026-07-17 | 9 / `+55 -207` | 版本升到 1.3.0；bin 只保留 `reasonix-legacy`；删除 dsnix shim 与发布 workflow。 |
| 12 | `ee795559` | 2026-07-17 | 1 / `+18 -10` | 修正版本测试，锁定 `reasonix-legacy` 的版本显示契约。 |
| 13 | `3f7a4555` | 2026-07-17 | 3 / `+41 -6` | 写 10-01 完成总结并推进 Phase 状态。 |
| 14 | `1dae14d5` | 2026-07-17 | 19 / `+94 -89` | 把维护文档中的命令示例和产品称呼统一为 `reasonix-legacy`。 |
| 15 | `5fc9ddf8` | 2026-07-17 | 2 / `+148 -7` | 新增包身份测试并增强文档检查器，防止旧身份回归。 |
| 16 | `14624bdf` | 2026-07-17 | 79 / `+322 -291` | 全仓清理运行时、CLI/TUI、i18n、测试和示例中的旧命令身份。 |
| 17 | `000d8484` | 2026-07-17 | 2 / `+59 -5` | 扩大运行时身份覆盖测试，补足前一提交的防回归面。 |
| 18 | `e9d03366` | 2026-07-17 | 1 / `+47 -0` | 写 10-02 文档/运行时身份对齐的完成总结。 |
| 19 | `3ba7c81b` | 2026-07-17 | 5 / `+151 -46` | 写 Phase 10 最终验证并把包身份统一标记为完成。 |
| 20 | `d595d30b` | 2026-07-18 | 21 / `+1064 -54` | 完成 Phase 11 的依赖/安装脚本/安全策略/脱敏测试，并创建 Phase 12 前的暂停交接。 |

## 6. 影响与风险判断

### 正向影响

1. **发布身份更一致**：npm package、CLI bin、版本输出、文档和运行时提示不再混用 `reasonix` / `dsnix`。
2. **维护面收窄**：删除 dsnix shim 和独立发布流，减少重复发布与兼容成本。
3. **防漂移能力增强**：package identity、文档引用、安装脚本清单、安全范围和密钥脱敏都有自动测试或检查器。
4. **供应链证据更完整**：依赖更新、lockfile、install-script provenance 和生产 audit 形成可追踪链条。
5. **规划状态可恢复**：v1.1 被归档，v1.3 Phase 10/11 有上下文、计划、总结、验证与 handoff。

### 需要关注的风险

1. **破坏性 CLI 变更**：旧的 `reasonix` 和 `dsnix` bin 被删除；依赖旧命令的脚本、全局 link、文档或用户习惯必须迁移到 `reasonix-legacy`。
2. **提交粒度不均衡**：`14624bdf` 和尤其 `d595d30b` 很大；后者标题是 WIP，却包含完整 Phase 11 交付，后续审阅或 cherry-pick 不够直观。
3. **发布自动化尚未完成**：已提交历史只推进到 Phase 12 前的 checkpoint；不能把这 20 个提交理解为“稳定版发布链路已经全部完成”。
4. **评估文档不是功能**：provider switching 与 stable readiness 两个 quick 提交只是分析结论，不能当作已实现能力。
5. **验证记录依赖当时环境**：Phase 总结声明测试、build、verify、audit 通过，但本报告没有重跑完整测试套件；本次任务只验证 Git 历史和报告完整性。

## 7. 当前未提交工作区：与 20 个提交分开看

在本次任务开始时，工作区不是 clean 状态：

- 已跟踪文件相对 HEAD 还有约 **19 个文件、`+494 -589`** 的未提交差异；
- 另有未跟踪的 v1.3 audit/requirements/roadmap、Phase 11 verification、Phase 12/13 目录和 closeout evidence 等文件；
- 这些内容看起来是在继续推进并收尾 Phase 12/13 及 v1.3，但它们尚未进入本报告分析的 20 个提交。

因此要区分：

- **20 个 local-only commits**：已经提交，但尚未推送到 `origin/dev`；
- **dirty working tree**：还没有提交，可能继续改变最终要推送的内容。

本次报告没有 reset、stash、clean、checkout 或改写这些用户已有修改。

## 8. 建议下一步

1. 如果要推送，先单独审阅当前未提交工作区，决定是否形成 Phase 12/13 和 v1.3 closeout 的后续提交。
2. 在 push 前至少运行仓库规定的 `npm run verify`，并针对 package identity、install-script provenance、频道脱敏做重点检查。
3. 检查旧命令迁移影响：本机全局 link、脚本、README 外部链接和使用者文档都应改为 `reasonix-legacy`。
4. 考虑在推送前整理 `d595d30b` 的说明：如果不重写历史，至少在 PR 描述中明确它实际完成 Phase 11，并仅在 Phase 12 前暂停。
5. 推送前再次执行：

```powershell
git fetch origin
git rev-list --left-right --count origin/dev...dev
git log --oneline origin/dev..dev
git diff --check origin/dev..dev
```

若远程仍为 `0 20`（不计本报告的 GSD 元数据提交），则可确认没有新的远程分叉。
