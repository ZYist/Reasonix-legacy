---
title: reasonix-legacy High-Risk AI Remediation Guide
status: active
created: 2026-07-13
last_verified: 2026-07-13
based_on: .planning/quick/260713-e2u-assess-current-project/260713-e2u-SUMMARY.md
scope: AI-guided remediation of repository high-risk items
---

# reasonix-legacy 高风险整改：AI 修改指南

## 1. 文档用途

本报告是后续 AI 修改高风险区域时的**执行契约**，不是一次性建议清单。任何 AI 在处理版本治理、文档事实源、关键测试盲区、CI 或大型模块重构前，应先读本文，再读对应 live source。

本文只规定安全顺序、边界和验收标准，不替人做产品决策。凡标记为 **HUMAN GATE** 的事项，AI 必须暂停并取得明确选择；不得自行“选一个合理默认值”。

### 1.1 当前结论

项目核心工程基线健康，但高风险集中在四个方向：

1. 对外版本/产品身份与仓库实际状态不一致。
2. TUI、CLI command wiring、Telegram/Weixin 生命周期等用户关键路径覆盖很低。
3. `.planning`、README 与测试配置仍保存已删除 desktop/dashboard 的旧事实。
4. `App.tsx`、`config.ts`、`loop.ts` 等复杂度热点不适合无保护重构。

### 1.2 证据基线（2026-07-13）

- 产品源码基线：`47ef8c25`（之后的 `796ad191` 仅增加项目评估文档）。
- `npm run verify`：PASS。
- Vitest：270 files、3738 passed、15 skipped、0 failed。
- Coverage：lines 67.39%、functions 75.76%、branches 79.33%。
- `src/cli/ui/App.tsx`：约 4146 行；coverage 约 0.09%。
- `use-telegram-channel.ts` / `use-weixin-channel.ts`：coverage 约 0.26% / 0.27%。
- 当前不存在：`desktop/`、`src/server/`、`src-tauri/`、`packages/dashboard/`。
- 当前活跃开发分支：`dev`；`.github/workflows/ci.yml` 只监听 `main`。

这些数字是快照，不是永久事实。后续 AI 开始执行前必须重跑基线，不得复制旧数字当作当前结果。

---

## 2. AI 统一执行协议

### 2.1 开工前读取顺序

1. 本文：`.planning/HIGH-RISK-AI-GUIDE.md`
2. `.planning/STATE.md`
3. `.planning/PROJECT.md`
4. `.planning/ROADMAP.md`
5. 目标 work package 指定的 live source/test/config
6. 最近相关 commit：`git log -- <paths>`

`.planning/codebase/*.md` 当前包含已知旧事实，只能作为历史线索，不能作为源码存在性的权威。路径和依赖必须用 `git grep`、`git ls-files`、真实 import graph 复核。

### 2.2 每次只处理一个 work package

- 一个 quick task / phase 只处理本文一个 WP。
- 不得把 README 清理、coverage 补齐、CI 修改和 App 拆分放入同一提交。
- 发现旁支问题时记录 deferred item，不顺手修。
- 每个提交只表达一个行为或一个治理变化。

### 2.3 Fresh baseline

开始前至少运行：

```powershell
git status --short --branch
npm run verify
npm run test:coverage --silent
```

若任务仅修改文档，可复用同一 clean-HEAD 上 24 小时内的 verify 结果，但必须运行：

```powershell
git diff --check
git grep -n '<关键旧词或路径>' -- <目标文档范围>
```

任何测试失败都必须先分类：本次引入、基线已有、环境/凭据阻塞。禁止只写“pre-existing”而不给 fresh baseline 和 HEAD 对照证据。

### 2.4 修改方法

1. 先写/更新能观察当前行为的测试或检查。
2. 使测试在修改前刻画现状；修 bug 时应先得到预期红。
3. 最小实现，不做“顺便现代化”。
4. 先 targeted tests，再 `npm run verify`。
5. 涉及 coverage 时再跑 `npm run test:coverage --silent`。
6. 提交前 `git diff --check`，确认无无关文件。
7. 原子提交；不使用含糊的 `cleanup` / `misc fixes` 提交信息。

### 2.5 必须保护的系统不变量

后续整改不得破坏：

- `reasonix` 与 `dsnix` 均指向 `dist/cli/index.js`。
- Node.js `>=22` 和 ESM 打包契约。
- `package.json` library exports 与 CLI bundle marker。
- cache-first loop、工具调用 JSON repair、context folding。
- memory/event log、MCP、ACP、tree-sitter code-query。
- QQ、Telegram、Weixin 独立 CLI 入口与共享 HeadlessHost。
- `scripts/copy-tree-sitter-grammars.mjs` 与 `src/code-query/`。
- 已退役命令若保留 compatibility stub，不得因 README 清理顺手删除。
- secret redaction、gate FIFO、微信 QR SIGINT、HeadlessHost onEvent 等已修复行为。

### 2.6 全局禁止事项

- 禁止一次性重写 `App.tsx`。
- 禁止仅为提高 coverage 执行无断言测试或对实现行逐行 mock。
- 禁止把历史 CHANGELOG 中的 desktop/dashboard 记录批量删除；历史记录不是当前功能声明。
- 禁止把合法的 `reasonix stats` 文本 dashboard 与已删除的 Web dashboard 混为一谈。
- 禁止重新引入 Tauri/Web UI 依赖。
- 禁止在没有 HUMAN GATE 决策时 bump version、改 package name、重写 tags 或改变分支政策。
- 禁止删除 bot/channel 代码，理由仅仅是 live UAT 需要外部凭据。
- 禁止把全局 coverage 百分比当成唯一目标。

---

## 3. 人工决策门（HUMAN GATES）

### HG-01：版本命名权威

**冲突：** `package.json=1.1.0`、ROADMAP 的 v1.1 未规划、README 的 upstream 0.54.2、CHANGELOG 的 0.55.0、历史 1.17.x tags 并存。

开始 WP-01 前，人必须明确：

- npm package semver 是否是对外唯一版本；
- GSD milestone 是否允许与 package semver 独立；
- 旧 1.17.x tags 是 upstream lineage 还是当前 fork release；
- 当前 fork 应把哪个 commit/版本称为首次 Pure CLI release。

**AI 不得做的事：** 猜测“最高版本号就是正确版本”、删除/移动 tags、自动发布。

### HG-02：公开仓库身份

人必须确认 README 的 CI/stars/discussions/oosmetrics 链接应继续展示 upstream 资产，还是全部切到 `ZYist/reasonix-legacy`。可保留 attribution，但“当前维护入口”和“历史来源”必须分开表达。

### HG-03：开发分支策略

二选一并记录：

1. `dev` push 也运行 CI；或
2. `dev` 只是本地/集成分支，所有进入 `main` 的改动必须通过受保护 PR。

AI 可修改 workflow，但无法仅靠仓库文件保证 GitHub branch protection；外部设置必须列为 operator action。

### HG-04：coverage policy

人需要批准关键路径目标。建议：

- 全仓 67.39% 先作为非回归参考，不立即设激进硬阈值；
- 对新提取的纯模块要求高覆盖；
- 对 TUI/渠道采用行为场景清单，而不是追逐行覆盖。

未经批准，AI 不应直接在 Vitest 中加入会阻塞所有开发的全仓 threshold。

---

## 4. 风险矩阵与执行顺序

| Work package | 风险 | 优先级 | 前置 | 主要产物 |
|---|---|---:|---|---|
| WP-00 决策固化 | 误改版本/仓库/分支政策 | P0 | 无 | ADR/PROJECT decisions |
| WP-01 对外身份收敛 | 用户安装与版本认知错误 | P0 | HG-01, HG-02 | README/CHANGELOG/version policy |
| WP-02 内部事实源收敛 | AI 基于不存在的架构规划 | P0 | WP-01 基本术语确定 | codebase maps/STATE/test config |
| WP-03 高风险路径特征测试 | UI/渠道回归无法被发现 | P1 | HG-04 | focused tests/coverage baseline |
| WP-04 CI 与 flaky 可见性 | dev 变更缺远端矩阵保护 | P1 | HG-03 | CI trigger/reporting |
| WP-05 复杂度拆分 | 大模块修改高回归率 | P2 | WP-03 对对应行为已有保护 | 小步重构 |

强制顺序：**WP-00 → WP-01/WP-02 → WP-03/WP-04 → WP-05**。

---

## 5. WP-00：固化人工决策

### 目标

把 HG-01..04 的答案写成可引用事实，防止不同 AI 每次重新解释。

### 推荐修改位置

- `.planning/PROJECT.md`：Key Decisions
- 若版本/分支政策需要长期解释：新增 `docs/` 下 ADR，或项目既有 ADR 位置
- `.planning/STATE.md`：只记录当前 focus/decision 摘要，不堆完整论证

### AI 步骤

1. 展示冲突证据和 2–3 个互斥选项。
2. 等待用户选择；不自动默认。
3. 将选择、理由、适用范围、回退条件写入决策记录。
4. 不在同一任务顺便改 README、CI 或版本号。

### 验收

- HG-01..04 每项都有明确 owner 和状态。
- 后续任务能引用稳定路径中的决策。
- 无产品源码和发布动作。

### 停止条件

用户没有给出明确选择；存在两个互斥的 locked decisions；当前 repo/package 所有权无法确认。

---

## 6. WP-01：对外身份与版本事实收敛

### 风险说明

README 仍描述已删除 desktop/dashboard，并混合 fork、upstream 与当前 package 版本。该问题影响用户安装、功能预期和 bug report，优先于内部重构。

### 目标文件

- `README.md`
- `README.zh-CN.md`
- `README.ja-JP.md`
- `package.json`
- `CHANGELOG.md`（只新增当前说明，不篡改历史条目）
- `docs/qq-connect*.md` 及被 README 直接链接的当前功能文档
- `src/version.ts`、`src/cli/commands/version.ts`（仅 HG-01 要求改变显示策略时）
- publish workflows（仅在 package/repo 决策要求时）

### 修改边界

- Attribution 可保留，但 upstream history 与 current maintenance 必须分栏。
- 删除“当前 desktop client / embedded Web dashboard”声明；历史 CHANGELOG 保留。
- QQ 文档改成 standalone CLI 事实，不再指引 desktop Settings。
- 保留 `stats` 命令中表示终端统计视图的 dashboard 术语。
- 若 `reasonix desktop` 是 retirement stub，只更新文档，不擅自移除命令。
- 不在此 WP 改 agent loop、TUI 或渠道实现。

### 推荐步骤

1. 以 `git grep` 分类每处 `desktop|Tauri|dashboard|0.54.2|0.55.0|1.1.0|esengine/reasonix`：
   - current user claim
   - historical record
   - legitimate stats dashboard
   - attribution/external link
2. 先改英文 canonical README，再同步中/日文；不要让三份文档各自发明功能。
3. 根据 HG-01 写一段版本政策和 migration/lineage 说明。
4. 根据 HG-02 校正维护入口、issue、CI、stars/discussions 链接。
5. 运行文档 grep，确认只剩有意保留的历史/统计引用。

### 验证

```powershell
git grep -n -E 'Desktop client|Tauri|embedded web dashboard|设置.*QQ|0\.54\.2' -- README*.md docs
npm run build
node dist/cli/index.js --version
node dist/cli/index.js --help
npm pack --dry-run
```

若 package/version 代码发生变化，再运行完整 `npm run verify`。

### 验收

- 用户从任一 README 得到相同的当前功能边界。
- package 版本、CLI 显示、CHANGELOG current section 与版本政策一致。
- 当前维护入口指向正确仓库；upstream 仅作为来源说明。
- npm dry-run 仍只包含预期 CLI/library 资产。

### 停止/回滚条件

- HG-01/HG-02 未决。
- 修改需要发布 token、删除 tag 或改 npm owner。
- README 清理导致合法 stats dashboard 文档被误删。

---

## 7. WP-02：内部事实源与已删除表面的残留收敛

### 风险说明

当前 planning maps、Vitest config 和少量测试仍引用已删除 desktop/Tauri。后续 AI 若把这些文件当权威，会规划不存在的模块。

### 目标文件

- `.planning/codebase/ARCHITECTURE.md`
- `.planning/codebase/STACK.md`
- `.planning/codebase/STRUCTURE.md`
- `.planning/codebase/INTEGRATIONS.md`
- `.planning/codebase/TESTING.md`
- `.planning/codebase/CONVENTIONS.md`
- `.planning/intel/*`（应由 live scan 刷新，不手工编造）
- `.planning/STATE.md`
- `vitest.config.ts`
- `tests/mocks/tauri-*.ts`
- `tests/mention-parent-entry.test.ts`
- `.gitignore` 中 desktop 构建路径

### 当前已知残留

`git grep` 仍能在 planning maps、`vitest.config.ts`、`.gitignore` 和 `tests/mention-parent-entry.test.ts` 找到 desktop/Tauri。Tauri mocks 是否可删必须由 live imports 证明，不能因文件名旧就直接删除。

### 修改边界

- 优先重新 map live codebase；不要逐句修补一份整体过时的架构图。
- `.planning/milestones/`、`.planning/phases/` 是历史证据，不做全局词语清洗。
- `.planning/intel/*.json` 应通过项目工具生成，不能凭报告手写依赖图。
- 删除 Tauri aliases/mocks 前必须证明 tracked live tests/source 没有 import。
- `mention-parent-entry.test.ts` 若测试的是仍有价值的通用路径行为，应迁移到 live owner，而不是直接删除测试。

### 推荐步骤

1. 记录 live top-level dirs 和 import graph。
2. 重新生成/刷新 codebase maps 与 intel。
3. 更新 STATE 中已完成、已修复或失效的 concern；历史表格保留但标记 superseded。
4. 对 Vitest desktop include 和 Tauri aliases 做红/绿清理：
   - 先 `git grep` 证明无 live consumer；
   - 删除 config entry；
   - 再删除未使用 mocks；
   - 跑完整测试。
5. 审核 `.gitignore` desktop paths；仅在确认不再支持旧分支工作流后删除。

### 验证

```powershell
git grep -n -E '@tauri-apps|desktop/src|src/server|src-tauri|packages/dashboard' -- `
  ':!.planning/milestones/**' ':!.planning/phases/**' ':!CHANGELOG.md'
npm run verify
npm run test:coverage --silent
```

### 验收

- live architecture 文档不再列出不存在的表面。
- Vitest 没有无 consumer 的 desktop glob/Tauri aliases。
- 删除 mocks 后 270-file 基线没有意外减少；若数量变化，必须逐项解释。
- coverage 变化可解释，不能因 include 范围缩小制造“虚假提升”。

### 停止/回滚条件

- 删除 alias 后发现动态 import 或 workspace consumer。
- 测试数量下降但无法说明具体被移除的测试。
- map 工具输出与 live tree 明显矛盾。

---

## 8. WP-03：关键用户路径特征测试

### 风险说明

当前总测试数很高，但 orchestration/UI/channel 层覆盖接近零。直接重构这些模块不安全。

### 原则

- 先刻画行为，再重构。
- 测试用户可观察契约，不锁死内部 hook 数量或组件层级。
- 网络、DeepSeek、Telegram、微信、QQ 全部通过 dependency seam/fake 隔离；默认测试不得访问真实服务。
- live credential UAT 单独列出，不伪装成自动化测试。

### WP-03A：TUI/App 特征测试

**入口：**

- `src/cli/ui/App.tsx`
- 已有可复用模式：`tests/ui-reducer.test.ts`、`tests/ui-stream-events.test.ts`、`tests/cardstream-architecture.test.tsx`、`tests/composer-hint.test.tsx`、`tests/chat-scroll-wheel.test.ts`

**优先场景：**

1. live output 增长时 composer 保持稳定、输入值不丢。
2. scrollback 与自动跟随底部切换。
3. submit/busy/interrupt 状态转换。
4. permission/choice/checkpoint modal 的确认与取消。
5. session switch/workspace switch 不泄漏上一会话状态。

**方法：**

- 优先测试现有 reducer/translator/layout 边界。
- 若 App 无法注入 fake loop/clock/process，先做最小 seam extraction；该提取必须行为等价并由测试覆盖。
- 不要求一次 mount 完整 4000 行 App 才算有效。

**禁止：** snapshot 整个终端帧作为唯一断言；mock 所有内部 hooks；为测试而导出大量私有状态。

### WP-03B：CLI command wiring

**入口：**

- `src/cli/commands/run.ts`
- `src/cli/commands/commit.ts`
- `src/cli/commands/mcp.ts`
- `src/cli/commands/mcp-browse.tsx`
- `src/cli/commands/index.ts`

**复用模式：** `tests/qq-command.test.ts`、`tests/telegram-command.test.ts`、`tests/weixin-command.test.ts`、`tests/events-command.test.ts`、`tests/mcp-runtime-failures.test.ts`。

**优先契约：** flags → options 映射、退出码、stderr 脱敏、shutdown、配置错误、动态 import/boot collaborator 只调用一次。

### WP-03C：Telegram/Weixin 生命周期

**入口：**

- `src/telegram/use-telegram-channel.ts`
- `src/weixin/use-weixin-channel.ts`
- `src/telegram/{bot,channel,access}.ts`
- `src/weixin/{bot,channel,access,account}.ts`
- `src/cli/headless/{host,turn-driver,gate-bridges,surface-notifier}.ts`

**优先契约：**

1. start/stop/shutdown 幂等。
2. SIGINT/SIGTERM 在 boot、QR、active 三个窗口都清理资源。
3. recoverable error 与 fatal error 行为不同。
4. onEvent → 用户可见 notice 的映射不泄漏 secret。
5. 并发 gate reply FIFO 不回归。
6. channel credential 缺失时给出可操作错误，不挂住进程。

### Coverage 策略

- 记录全仓基线，但按场景验收。
- 新提取的 pure helper/reducer 建议 lines/branches ≥90%。
- command/channel orchestration 以关键分支全覆盖为目标。
- App.tsx 行覆盖不应作为单次任务 KPI；目标是逐步把行为移入可测边界。

### 验证

```powershell
npx vitest run tests/ui-reducer.test.ts tests/ui-stream-events.test.ts tests/cardstream-architecture.test.tsx
npx vitest run tests/qq-command.test.ts tests/telegram-command.test.ts tests/weixin-command.test.ts tests/headless-host.test.ts tests/headless-gate-bridges.test.ts
npm run verify
npm run test:coverage --silent
```

具体任务应加入新测试文件，而不是机械复用以上清单。

### 验收

- 每个被改高风险行为至少有一个修改前可解释、修改后稳定的行为断言。
- 无真实网络/凭据依赖。
- 没有通过降低 include 范围或加入无断言测试提高 coverage。
- 全量 270-file 基线保持或明确增加。

### 停止/回滚条件

- 为测试必须改动核心 public API，但没有先设计 seam。
- 测试只能依赖真实 Telegram/微信/DeepSeek。
- 出现大面积 snapshot churn，无法解释用户行为变化。

---

## 9. WP-04：CI 与 flaky 可见性

### 目标文件

- `.github/workflows/ci.yml`
- `vitest.config.ts`
- 可能新增只负责 flaky/slow-test 汇总的 script

### 修改边界

- CI 分支触发必须服从 HG-03。
- 不因 jobs/tokenizer 测试较慢直接删除它们。
- 不立即移除全局 retry；先让“首轮失败、重试通过”可观察。
- branch protection 是外部配置，报告 operator action，不能声称 YAML 已完成保护。

### 推荐步骤

1. 根据 HG-03 增加 `dev` push 或记录 PR-only enforcement。
2. 保持 Ubuntu + Windows / Node 22 矩阵。
3. 对 retry 事件生成独立 summary；确认 Vitest reporter 能提供可靠信号后再实现。
4. 将 slow/flaky 测试按原因分类；只对确定的 scheduler/process 测试保留 retry，避免全仓掩盖 flake。
5. 不在同一提交升级 Actions 或 npm dependencies。

### 验证

- 本地 YAML 结构检查。
- `npm run verify`。
- PR/测试分支观察两平台 workflow 实际运行。
- 人工确认 branch protection 或 dev trigger 已生效。

### 验收

- 活跃开发路径必经远端 CI。
- retry-after-failure 在 job summary 可见。
- 两平台门禁保持 build/lint/typecheck/test/coverage/τ-bench dry-run。

### 停止条件

- HG-03 未决。
- 需要 GitHub admin 权限但当前操作者没有。
- 新 reporter 只能通过吞掉原始 test exit code 工作。

---

## 10. WP-05：复杂度热点拆分

### 前置条件

- 对应行为已由 WP-03 特征测试保护。
- 本次拆分不同时改变用户行为。
- 每个 plan 只拆一个职责边界。

### 10.1 `src/cli/ui/App.tsx`

当前包含 App shell、loop setup、session/workspace、history、submit、plan、choice/checkpoint modal 等多类职责。

**安全拆分顺序：**

1. 纯函数与 reducer（输入/输出明确）。
2. 外部副作用 adapter（clock/process/fs/loop callbacks）。
3. 单一 modal/controller hook。
4. session/workspace orchestration。
5. 最后才移动 render composition。

**不建议：** 新建一个同样巨大的 `useAppController.ts`；一次移动数千行；同时替换状态管理库。

### 10.2 `src/config.ts`

按 schema/defaults、parse/validate、migration、read/write 分离。先保证旧配置 round-trip、缺失字段默认、损坏配置恢复和 secret 不出现在错误日志。

### 10.3 `src/loop.ts`

只提取可证明的状态转换或 adapter；不要在同一阶段改变 cache prefix、tool repair、folding 与 event semantics。涉及这些不变量时必须有 prefix/cache 和 repair 回归测试。

### 10.4 大型 tools 与 i18n

- `web.ts` / `filesystem.ts`：分离 pure parsing/policy 与 IO executor。
- i18n：优先增加 key parity/生成检查，再考虑拆文件；不得让不同语言 silently 丢 key。

### 拆分提交规则

- 一个提交一个职责。
- 尽量保持 rename/move 与行为修改分开。
- 每次提交后 targeted tests + typecheck；plan 结束跑 full verify。
- 任何性能或输出变化必须独立提交并有基准/快照解释。

### 验收

- 原模块职责减少，而不是代码简单搬到另一个巨型文件。
- public API 和用户输出不变，除非另有显式 feature plan。
- 新边界可独立测试且没有 circular dependency。
- coverage 不下降；关键新模块达到批准目标。

### 停止/回滚条件

- diff 同时触及 loop、config、App 三个热点。
- 为消除类型错误开始扩大 public API。
- 需要禁用 strict/noUncheckedIndexedAccess 或跳过测试。
- 新抽象产生更多跨层 imports 或循环依赖。

---

## 11. 推荐的任务切片

不要创建“修复全部高风险项”的单一 phase。建议拆成：

1. **Decision task**：版本、repo、branch、coverage 四项决策。
2. **Docs identity task**：三语 README + QQ 文档 + version policy。
3. **Planning truth task**：codebase maps/intel/STATE 刷新。
4. **Dead Tauri test-config task**：live grep → config/mocks 清理 → full verify。
5. **TUI characterization task**：composer/live-output/scroll。
6. **Command wiring task**：run/commit/mcp。
7. **Channel lifecycle task**：Telegram/Weixin shutdown/error/event。
8. **CI task**：dev/PR policy + retry visibility。
9. 后续按模块分别拆 App、config、loop/tools。

每个任务都应有独立 PLAN/SUMMARY 和原子 commit；前一个任务未验证时不得自动串到后一个。

---

## 12. 后续 AI 可复制任务模板

```markdown
Task: <只写一个 WP/子切片>

Read first:
- .planning/HIGH-RISK-AI-GUIDE.md
- .planning/STATE.md
- <live source/test files>

Human gates:
- <HG id and recorded decision path, or none>

Baseline:
- git status --short --branch
- npm run verify
- <targeted tests>

In scope:
- <exact behavior/files>

Out of scope:
- version bump / dependency upgrade / adjacent refactor / live release

Required sequence:
1. Prove current behavior or stale reference.
2. Add characterization/regression check.
3. Apply minimal change.
4. Run targeted checks.
5. Run full verify.
6. Record evidence and deferred items.

Acceptance:
- <observable truths, not “code cleaned up”>

Stop if:
- human decision missing
- baseline unexpectedly red
- required edit crosses another WP
- real credentials/admin rights are required
```

---

## 13. 完成定义

只有满足以下条件，才可声明高风险整改完成：

- HG-01..04 有明确决策记录。
- README/版本/仓库身份一致且当前功能描述准确。
- live planning maps 与实际目录/import graph 一致。
- Tauri/desktop 测试残留已证明保留或安全移除。
- TUI、command、Telegram/Weixin 的关键行为有特征测试。
- 活跃开发路径受远端双平台 CI 保护。
- retry 后通过不再不可见。
- App/config/loop 的拆分均在测试保护下小步进行。
- `npm run verify` 全绿，coverage 变化有解释。
- 没有重新引入已退役产品表面，也没有破坏核心不变量。

## 14. 报告维护规则

- 每完成一个 WP，在对应 quick/phase SUMMARY 中引用本文和 HG 决策。
- 若风险事实改变，更新 `last_verified` 和证据基线；不要静默改写历史结论。
- 新发现的高风险项先追加“候选风险”，经证据确认后再升级为 WP。
- 本文与 live source 冲突时，以 live source + fresh commands 为事实，并提交本文修正。
