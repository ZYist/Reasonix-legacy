---
quick_id: 260719-o2f
slug: assess-ahead-commit-readability
status: complete
completed: 2026-07-19
base_ref: origin/dev
base_sha: b540a507c1ffb4835846fc256e6df206a5c6d040
version_base_ref: legacy-1.2
version_base_sha: 4fb560e3a5d6c81f87bddbb08aa86e610480fffe
head_sha: 107bf9b43a71edc4454f6a61adf585c2191e8701
---

# 提交可读性与后续维护评估

## 结论

**当前 `origin/dev..HEAD` 的提交历史可读性为中等偏低，人工审核和后续维护会有明显成本，但还没有失控。**

最重要的判断是：**不建议把 `legacy-1.2..HEAD` 全部压成一笔 mega commit。** 一笔提交会减少日志数量，却会显著损害 review、bisect、revert 和 cherry-pick 能力。更合适的做法是先建立备份引用，再把版本跨度整理成约 5–7 笔按功能边界划分的提交。

## 分析范围

截至 2026-07-19，已刷新 `origin/dev`：

- `origin/dev`: `b540a507c1ffb4835846fc256e6df206a5c6d040`
- 当前 `HEAD`: `107bf9b43a71edc4454f6a61adf585c2191e8701`
- `origin/dev..HEAD`: **23 笔领先提交**
- 项目自身 `legacy-1.2..HEAD`: **34 笔提交**
- `legacy-1.2`: `4fb560e3a5d6c81f87bddbb08aa86e610480fffe`

报告主要评估 23 笔本地领先提交；如果目标是“从本项目 1.2.0 到 1.3.0 只留一笔”，实际必须处理完整的 34 笔版本跨度，而不只是 23 笔。

## 结构化统计

### 23 笔领先提交

| 指标 | 结果 | 影响 |
|---|---:|---|
| 提交数 | 23 | 数量本身不算大，但主题跨度很大 |
| 唯一变更文件 | 152 | 单次版本审核范围较宽 |
| 新增/删除行 | +4,572 / -1,054 | 不是纯文档小修，包含实质代码和发布合同变更 |
| docs 提交 | 14/23 | 历史被大量 planning/closeout 提交切碎 |
| `wip` 提交 | 1 | `d595d30b` 明确是暂停中的中间状态 |
| 无 commit body | 23/23 | 没有记录动机、风险、测试和后续动作 |
| 跨多个变更类别的提交 | 6/23 | 部分提交同时改代码、测试、文档、CI 和 planning |
| 高频重复修改文件 | 16 个 | 其中 `.planning/STATE.md` 被触碰 10 次，容易造成状态漂移 |

变更内容按文件范围分为：

- planning：36 个文件，约 3,120 行新增、251 行删除；
- 源代码/运行时：57 个文件；
- 测试：23 个文件；
- CI/发布/依赖：12 个文件；
- 普通文档：24 个文件。

### 从项目 1.2.0 到当前 HEAD

`legacy-1.2..HEAD` 实际是 34 笔提交、261 个文件、约 `+7,814/-2,541` 行，其中包含 78 个 planning 文件。这个范围明显不适合直接作为一笔人工审核提交。

## 具体可读性问题

### 1. 元数据提交比例过高

`origin/dev..HEAD` 中有 14 笔 `docs` 提交，另有 2 笔 `chore` 提交。它们分别记录 quick 任务、阶段上下文、路线图、归档和状态变更。

这些记录对 GSD 追踪有价值，但对普通 Git 审核者而言，会把真正需要审查的产品变化分散在大量 planning 提交之间。审核者必须先判断某个提交是不是产品行为变更，才能继续阅读。

### 2. 所有提交都没有正文

提交标题大多符合 Conventional Commits，但没有 body。例如：

- `feat(10-01): unify package and bin identity`
- `fix(10-02): remove old command identity from runtime surfaces`
- `fix(release): harden Windows gated npm publication`

标题能说明“改了什么”，但没有说明：

- 为什么需要这个改动；
- 哪些旧行为被有意删除；
- 兼容性影响是什么；
- 使用了哪些验证命令；
- 是否存在未完成的远程/手动动作。

对于发布、包身份和 CI 合同这类跨层变更，缺少正文会明显增加人工复核成本。

### 3. `d595d30b` 是明确的 WIP 且范围混杂

提交标题为：

```text
wip: phase-12-transition paused at 3/4
```

该提交涉及 21 个文件、约 `+1,064/-54` 行，同时包含 planning、普通文档、发布配置和测试。它把“未完成的阶段状态”和“已经可以被审查的代码变化”放在同一个提交中。

风险：

- 不能把它当作稳定的 release checkpoint；
- `git bisect` 可能落到中间状态；
- 审核者无法仅凭提交边界判断哪些部分已经承诺、哪些只是临时过渡；
- 后续修复 `cc8bbad1` 必须结合前面的 WIP 一起理解。

### 4. `14624bdf` 太宽，属于机械替换与行为变更混合

```text
fix(10-02): remove old command identity from runtime surfaces
```

该提交修改 79 个文件、约 `+322/-291` 行，覆盖：

- CLI runtime；
- UI；
- i18n；
- examples/benchmarks；
- docs；
- tests；
- 配置与脚本。

这种全局身份迁移本身可以是一个逻辑变更，但目前没有 commit body，也没有把“机械命名替换”和“行为语义变化”明确区分。人工审核时需要逐文件确认是否只是 rename，还是引入了实际行为变化。

### 5. 主题顺序大体合理，但审计路径不够直线

Phase 10 的顺序基本是：计划 → package/bin → version → 文档 → 测试 → runtime 修复 → 补充测试 → summary；这对熟悉 GSD 的人可追踪。

但后续又出现：

```text
d595d30b  wip: phase-12-transition paused at 3/4
55be2172  docs(quick...): compare remote and local commits
cc8bbad1  fix(release): harden Windows gated npm publication
107bf9b4  docs(audit): close v1.3 candidate reproducibility gap
```

这使得最终发布结论依赖“WIP → 审计发现问题 → 修复 → 再审计”的回溯路径，而不是一个清晰的 candidate preparation 链。

### 6. 当前工作区还有大量未提交 planning 改动

当前工作区额外存在 50 个未提交路径，主要是 `.planning` 文件和 evidence。它们不属于 `origin/dev..HEAD` 的已提交范围，但会让人工审核者误以为 HEAD 已经包含全部 v1.3 状态。

因此当前维护动作必须明确区分：

- committed source candidate；
- uncommitted planning state；
- 外部 clean verification evidence。

## 对人工审核和维护的影响

| 场景 | 难度 | 原因 |
|---|---|---|
| 粗略了解最终改了什么 | 中 | 最终 diff 能看出大方向，但 152 个文件较宽 |
| 逐提交 review | 中高 | 23 笔提交中 14 笔是 planning/docs，且无正文 |
| 审核包身份/发布流程 | 中高 | 需要跨 `package.json`、lock、CI、guards、docs 和 audit |
| `git bisect` | 高 | 存在 WIP 提交，且部分提交跨层、未声明可测试性 |
| `git revert` 单项功能 | 高 | 大型机械替换和 release 合同变更边界不够细 |
| cherry-pick 单个修复 | 中高 | 后续提交依赖前面的 planning 和身份迁移上下文 |
| 新维护者接手 | 中高 | 必须先阅读 GSD planning，再理解代码和发布合同 |

综合可读性评分：**5/10（可维护，但需要有经验的维护者）**。

## 是否应该全部压成一笔？

### 不推荐：从 `legacy-1.2` 直接生成一笔 mega commit

这样做的优点只有：

- Git log 简短；
- 远端只看到一个版本提交；
- 版本发布入口表面上整洁。

但代价是：

- 261 个文件、约 10,355 行变更无法按功能审核；
- 无法单独 revert package identity、CI、security 或 release automation；
- bisect 只能在 1.2.0 和 1.3.0 之间二分，定位能力大幅下降；
- 后续维护者无法从提交历史理解决策顺序；
- 如果这笔提交出现回归，审查范围会非常大。

因此，“一笔提交”解决的是日志数量问题，不解决可读性问题，反而会降低可维护性。

### 推荐：整理成 5–7 笔逻辑提交

建议保留以下边界：

1. `docs: archive v1.1 and define v1.3 hardening scope`
2. `feat(cli): unify reasonix-legacy package and executable identity`
3. `fix(cli): remove legacy reasonix/dsnix surfaces and update tests`
4. `feat(security): establish install and production dependency contract`
5. `ci(release): enforce Windows-gated npm publication`
6. `test(release): verify candidate packaging and isolated install`
7. `docs(release): record v1.3 audit and manual release boundary`

其中 planning 文件可以集中在第 1 和第 7 笔，不要继续与每个小步骤交错提交。每个功能提交应包含对应测试；每个提交应补充正文，至少写明动机、行为变化和验证命令。

如果必须让 `dev` 只显示一笔，可以采用：

- 先保留 `backup/dev-pre-squash-20260719`；
- 在临时分支上整理为 5–7 笔；
- 最终通过一次 squash merge 生成一个发布提交；
- 同时保留整理后的内部历史分支/tag 供审计和 bisect 使用。

这比直接丢弃所有中间历史安全。

## 维护建议

1. 禁止将 `wip` 提交作为 release candidate 的父链节点，改成临时分支或 `checkpoint` 标签。
2. 为跨层提交补充 commit body，尤其是 package identity、CI、release workflow 和 dependency lockfile 变更。
3. 将机械 rename 与行为变更拆开，或者在正文中明确“纯 rename 文件”和“行为变更文件”。
4. 将 planning/状态文件按 milestone closeout 一次性提交，避免 `.planning/STATE.md` 被多次反复修改。
5. 每个 candidate 提交同时附带测试命令和最终产物摘要。
6. 在重写历史前先处理当前 50 个未提交 planning/evidence 路径，避免把临时证据误加入版本提交。
7. 注意当前本地 `v1.3.0` tag 指向上游无关提交 `5b336c89`；创建本项目发布 tag 前必须先解决 tag 命名冲突。

## 最终判断

后续人工审核和维护**会有中等偏高困难**，主要问题不是提交数量，而是：

- planning 提交占比过高；
- 存在明确的 WIP 提交；
- 大型跨层提交缺少正文；
- 最终 release 修复发生在历史末端；
- 当前工作区还有未提交 planning 状态。

**推荐整理为 5–7 笔逻辑提交，而不是从 1.2.0 到 1.3.0 直接压成一笔。**
