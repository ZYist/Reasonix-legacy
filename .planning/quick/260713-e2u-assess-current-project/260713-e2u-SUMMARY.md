---
quick: 260713-e2u
status: complete
branch: dev
commits: []
---

# Quick Task 260713-e2u — 当前项目健康评估

## 总体判断

reasonix-legacy 当前不是“代码失控的 legacy”，而是一个**核心工程质量较强、刚完成大规模收敛，但产品与项目事实源尚未同步收口**的维护型项目。

最值得肯定的是：Pure CLI 重构之后，当前完整质量门禁全部通过，核心 loop、工具、MCP、记忆与打包链仍保持较强测试基础。最需要警惕的不是立即可见的构建失败，而是三类逐渐积累的偏差：**版本/路线图身份不一致、文档仍描述已删除的产品面、关键交互层覆盖率极低且文件过大**。

简化评价：

- 工程基线：良好
- 核心架构：方向清晰，但存在复杂度热点
- 测试数量：很强
- 测试分布：不均衡，交互与渠道边缘较弱
- 项目治理：规划过程成熟，但当前事实源有明显漂移
- 下一阶段准备度：代码已准备好，产品范围尚未准备好

## 已验证事实

- `npm run verify` 通过：build、Biome lint、TypeScript typecheck、Vitest 全绿。
- Vitest：270 个测试文件、3738 个测试通过、15 个跳过、0 失败。
- 覆盖率：lines/statements 67.39%，functions 75.76%，branches 79.33%。
- Git：`dev` 与 `origin/dev` 0 ahead / 0 behind；执行前工作树干净。
- 规模：1117 个 tracked files；约 531 个 TypeScript 源文件、270 个测试文件。
- v1.0 Pure CLI 的 4/4 phases、8/8 plans、10/10 requirements 已完成；v1.1 尚未规划。
- 已删除的 `desktop/`、`src/server/`、`src-tauri/`、`packages/dashboard/` 当前均不存在。

## 优势

### 1. 核心价值明确，架构收敛方向正确

项目没有继续维护 Web、Tauri、CLI 多套表面，而是回到 cache-first DeepSeek coding agent 的核心价值。HeadlessHost 让 QQ/Telegram/微信复用核心运行时，而不是复制 agent loop；这是正确的边界收敛。

### 2. 当前可构建、可测试、可发布

完整门禁在本机一次通过，不是“局部测试绿”。构建同时覆盖 library 与 CLI bundle，tree-sitter grammar 复制链仍在；CI 还覆盖 Ubuntu/Windows、Node 22、coverage 与 τ-bench dry run。

### 3. 核心模块测试质量明显高于一般 legacy 项目

工具、shell、transcript 等核心区域覆盖率普遍在 88%–96% 左右。此前预存红测试已经收敛，目前不存在 STATE.md 曾记录的 3 个红测试。这说明项目不只是拥有大量测试，也具备把历史失败归零的能力。

### 4. 变更纪律和复盘能力强

规划中保留了删除 recipe、fresh-baseline、预存红三段证明、阶段 review/security/UAT/verification。这些过程资产对于 AI 辅助维护尤其有价值，能减少“凭记忆判断回归”的风险。

### 5. 活跃维护且近期修复有针对性

近期提交覆盖 secret redaction、bot 事件反馈、gate 并发、微信 QR 中断、HeadlessHost 去重以及 TUI composer 布局，说明项目仍在处理真实可靠性问题，而非只做文档性重构。

## 主要风险

### 高：对外产品身份与仓库真实状态不一致

- `package.json` 已是 `1.1.0`，但 ROADMAP 写着 “v1.1 not yet planned”。
- README 顶部仍称 “ships upstream 0.54.2”。
- CHANGELOG 最新主版本记录为 0.55.0；仓库历史 tag 又以 1.17.x 为主。
- README 仍把已删除的 Tauri desktop、desktop QQ 入口和 embedded dashboard 描述为当前能力；部分徽章与链接仍指向 upstream `esengine/reasonix`，而 package repository 指向当前 fork。

影响：用户无法可靠判断自己安装的是什么，维护者也难以定义“1.1.0 已交付”与“v1.1 尚未规划”的区别。发布、bug report 与兼容性承诺会变得模糊。

### 高：关键交互层覆盖率与测试总数不匹配

总体有 3738 个测试，但覆盖分布很不均衡：

- `src/cli/ui/App.tsx` 约 4146 行，line coverage 仅 0.09%。
- `use-telegram-channel.ts` 约 0.26%，`use-weixin-channel.ts` 约 0.27%。
- 多个 CLI command module 为 0%，包括 run、commit、mcp、mcp-browse。
- Weixin 目录整体约 16.74%。

影响：核心纯函数很稳，但近期实际出现问题的 TUI 布局、命令编排和聊天渠道生命周期恰好处在覆盖盲区。测试数量会制造比真实情况更强的安全感。

### 中高：项目事实源已经漂移

`.planning/codebase/ARCHITECTURE.md`、STACK、STRUCTURE、TESTING 仍描述 dashboard、Tauri、desktop 与已删除路径；Vitest 配置仍保留 desktop include 和一整套 Tauri aliases/mocks。STATE.md 的 Blockers/Concerns 还写着 “sidecar 现可安全移除”，但它早已删除。

影响：后续 agent 或维护者按这些文档规划时，会把不存在的模块当作现状，产生错误依赖分析和无效工作。

### 中：复杂度集中在少数超大模块

显著热点包括：

- `src/cli/ui/App.tsx`：约 4146 行
- `src/config.ts`：约 1839 行
- `src/tools/web.ts`：约 1328 行
- `src/loop.ts`：约 1272 行
- `src/tools/filesystem.ts`：约 1069 行
- 各语言 i18n 文件约 2000 行，类型契约也超过 1000 行

影响：修改成本、认知负担和隐式耦合继续上升。尤其 App.tsx 同时又处在近零覆盖状态，直接重构风险较大。

### 中：CI 与实际开发分支策略不完全对齐

CI 只在 push/pull_request 到 `main` 时触发，而当前活跃分支是 `dev`。PR 到 main 能获得门禁，但直接推送 dev 不会自动运行 GitHub Actions。

影响：本地 pre-push 有保护，但它可被跳过，也不等价于 Windows/Linux CI 矩阵。

### 低到中：测试重试掩盖 flaky 信号

Vitest 全局 `retry: 1` 用于吸收 Windows scheduler hiccup；`jobs.test.ts` 本次约 22 秒，bundle/tokenizer smoke 约 10 秒。当前结果是绿的，但系统没有显式记录“首轮失败、重试后通过”的 flake 指标。

## 技术债清单

1. **文档债**：三语 README、QQ 指南、planning codebase maps 与真实 Pure CLI 状态不一致。
2. **版本治理债**：0.54.2 / 0.55.0 / 1.1.0 / 1.17.x 与 “v1.1 未规划”并存，缺少一份明确版本政策。
3. **测试配置债**：已删除 desktop/Tauri 后仍保留 Vitest desktop glob、Tauri alias 与 mocks。
4. **覆盖债**：TUI orchestration、CLI command wiring、Telegram/Weixin channel 生命周期覆盖极低。
5. **结构债**：App.tsx、config.ts、loop.ts、web/filesystem tools 和 i18n 文件过大。
6. **CI 债**：活跃 dev 分支 push 未被远端 CI 直接覆盖。
7. **可观测性债**：全局 retry 没有独立统计 flaky test；最终绿无法显示重试质量。

## 下一步优先级

### P0 — 统一“项目真实状态”和下一里程碑

先定义 v1.1 到底是什么，再继续加功能。建议把它设为短周期“truth convergence + reliability baseline”，而不是立即扩展新表面。

验收目标：

- 明确版本政策，解释 package 1.1.0、规划 v1.1、旧 1.17.x tags 与 fork 基线的关系。
- 三语 README 不再把 desktop/dashboard 作为当前功能；repository/badges/安装说明指向正确项目。
- 刷新 `.planning/codebase/` 与 STATE concerns，删除已失效事实。
- ROADMAP 与 package/CHANGELOG 对同一交付使用同一名称和状态。

### P1 — 为真实高风险路径补“特征测试”，并让 dev 进入 CI

不要先追求全局覆盖率数字；优先锁定最近会改、用户直接触达、当前覆盖接近 0 的路径。

验收目标：

- 为 App composer/live-output/scroll、run/commit/mcp command wiring、Telegram/Weixin 启停与错误恢复建立少量高价值 integration/contract tests。
- 把当前 67.39% line coverage 设为非回归基线，并对关键目录设置更有意义的目标，而不是一次性要求全仓高覆盖。
- CI 增加 `dev` push，或明确所有 dev 变更必须经 PR 到 main 并由 branch protection 强制。
- 单独报告 retry-after-failure，使 flaky 不再隐身。

### P2 — 在测试保护下拆复杂度热点

先测后拆，不建议直接“重写 App.tsx”。按职责逐步提取状态机、command orchestration、render sections 和纯配置 schema。

验收目标：

- App.tsx 不再同时承担会话编排、事件归并、布局和交互状态。
- config 解析/迁移/默认值/持久化边界分离。
- loop 与大型 tools 的纯逻辑和 IO adapter 边界更明确。
- i18n 增加结构生成或一致性检查，降低五份大对象手工同步成本。

## 结论

项目当前**适合继续维护和演进**，并不存在需要停下来“救火式重写”的证据。真正的优先事项是先把事实源、版本身份和高风险测试面收口。完成 P0/P1 后，再拆大型模块会安全得多；反过来先做大重构，容易在当前 TUI/渠道覆盖盲区中制造回归。

## Verification

- `npm run verify` — PASS
- `npm run test:coverage --silent` — PASS
- Tests — 270 files / 3738 passed / 15 skipped / 0 failed
- Coverage — lines 67.39%, functions 75.76%, branches 79.33%
- Git sync — `origin/dev...dev` = `0 0`
- Product source files changed — none
