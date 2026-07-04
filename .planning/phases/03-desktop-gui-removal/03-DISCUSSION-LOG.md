# Phase 3: Desktop GUI Removal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-04
**Phase:** 3-Desktop GUI Removal
**Areas discussed:** desktop.ts 删除粒度, src/desktop/ 助手策略, 构建链/CI 切分, reasonix desktop 退役行为, i18n 死串清理时机

---

## Gray areas selected for discussion

| Option (从 present_gray_areas) | 描述 | Selected |
|--------|-------------|----------|
| 删除边界与 carve-out | desktop.ts + src/desktop/ 助手的删除粒度与 carve-out 策略 | ✓ |
| 构建链/CI 切分 | 删 desktop/ 目录(本期)与清构建链(Phase 4)的分界 | ✓ |
| desktop 命令退役行为 | 退役后 reasonix desktop 的运行时表现 | ✓ |
| i18n 死串与测试清理 | desktop/sidecar i18n 死串清理时机 | ✓ |

用户在 present_gray_areas 阶段选中全部 4 个领域(可多选)。

---

## desktop.ts 删除粒度

| Option | Description | Selected |
|--------|-------------|----------|
| 整文件删除 (推荐) | researcher 先 grep 确认 src/ 内 HeadlessHost 之外无消费者(Phase 2 已接管 buildRuntimeFor recipe 与 gate 桥接范式 @1866-1882),确认后整文件 git rm | ✓ |
| 逐片段 carve-out | 逐个导出审查,保留任何看起来通用的片段再删其余 | |

**User's choice:** 整文件删除(推荐)
**Notes:** Phase 2 的 HeadlessHost 已复刻 `buildRuntimeFor`(@1376-1400)、`RuntimeState`/`Tab` 形状、gate 桥接范式;desktop.ts 3555 行唯一运行时职责是已退役 sidecar,整删最干净。若 researcher 发现意外消费者,把片段迁入 `src/cli/headless/` 再删整文件。

---

## src/desktop/ 助手删除策略

| Option | Description | Selected |
|--------|-------------|----------|
| 全删 + researcher 验消费者 (推荐) | 整目录删;researcher grep login-shell-path/memory-browser 消费者——有非 desktop 消费者则迁到 packages/core-utils 或对应子目录再删,无则同删 | ✓ |
| 仅删 qq-*.ts 四件 | 保守保留 login-shell-path + memory-browser,只删 sidecar 专属的 qq-*.ts | |
| 全删不验证 | 直接删整个 src/desktop/,信任 HeadlessHost 已接管 | |

**User's choice:** 全删 + researcher 验消费者(推荐)
**Notes:** qq-{ingress,remote-commands,settings,turn-routing}.ts 四件无悬念(sidecar 专属);login-shell-path.ts 与 memory-browser.ts 名字通用,需 researcher grep 判定去留——有则迁、无则删。

---

## 构建链/CI 切分

| Option | Description | Selected |
|--------|-------------|----------|
| 本期只保绿,清理全留 Phase 4 (推荐) | Phase 3 只做「让 npm run build/typecheck/lint 仍退出 0」的最小修复;files/postinstall/typecheck trim、release.yml 退役、Rust toolchain 移除归 Phase 4(PANEL-04) | ✓ |
| 本期一并清构建链 | Phase 3 删 desktop/ 同时清掉所有相关 build/CI/workflow 引用 | |
| 本期删完即止,不碰构建链 | 完全不碰构建链,即使 build 断裂也留 Phase 4 修 | |

**User's choice:** 本期只保绿,清理全留 Phase 4(推荐)
**Notes:** 契合 ROADMAP 的 PANEL-02(本期)vs PANEL-04(Phase 4)切分 + MVP 垂直切片红线。判据:本期 build/typecheck/lint 退出 0 即达标。release.yml 仅 `desktop-v*` tag 触发、不挡常规 CI,可安全留 Phase 4。researcher 需核 desktop/ 是否为 root workspace 成员(maps 显示是独立嵌套 npm 项目)。

---

## reasonix desktop 退役行为

| Option | Description | Selected |
|--------|-------------|----------|
| 薄 stub + i18n 迁移提示 (推荐) | 保留薄 stub 子命令注册,执行时打印 i18n 迁移文案(指向 qq/telegram/weixin)+ 非零退出,走 t() + 5 locale | ✓ |
| 完全注销,走默认报错 | 从 Commander 移除注册,走 Commander 默认 unknown-command 报错 | |
| 静默无操作退出 0 | 保留 stub 但什么都不做,静默退出 0 | |

**User's choice:** 薄 stub + i18n 迁移提示(推荐)
**Notes:** 迁移提示必须指向 reasonix qq/telegram/weixin(老 desktop 用户场景=远程控制机器人)。契合「log+crash > silent wrong output」与 5-locale i18n 契约。

---

## i18n 死串清理时机

| Option | Description | Selected |
|--------|-------------|----------|
| 本期清,沿用 01-02 模式 (推荐) | 沿用 Phase 1 的 01-02(删面板同期清 93 条死串、收敛 116→24),本期删 desktop 同期清死串 + 同步 5 locale | ✓ |
| 留 Phase 4 统一收敛 | 把 i18n 死串与构建链清理合并到 Phase 4 一次性处理 | |

**User's choice:** 本期清,沿用 01-02 模式(推荐)
**Notes:** 测试删除走 Phase 1 既有约定(删仅覆盖已移除表面的测试),属 Claude 裁量,未单独提问。合法引用(清理中发现的非死串 desktop 字面量)作 drift 基线保留。

---

## 完成度检查

| Option | Description | Selected |
|--------|-------------|----------|
| 准备生成 CONTEXT (推荐) | 5 项决策已足够指导 researcher 与 planner | ✓ |
| 补聊机器人冒烟深度 | 三通道(尤其 Phase 2 deferred 的 Telegram)冒烟到「启动无报错」还是「完整收发一轮」 | |
| 补聊 CC switch 随之消失 | cc_switch.rs(desktop-only SQLite)随 desktop 删除一并移除是否预期 | |

**User's choice:** 准备生成 CONTEXT(推荐)
**Notes:** 用户确认 5 项决策足够;机器人冒烟深度与 CC switch 消均留作 Claude 裁量 / researcher 事实判定(已写入 CONTEXT 的 Claude's Discretion 与 deferred)。

---

## Claude's Discretion

- 测试删除范围(镜像 Phase 1 删 12 个面板专属测试的约定;同时覆盖存活核心逻辑的测试保留并剔除 desktop 断言)
- D-04 stub 的具体文案、退出码值、是否进 `--help`
- 新增 i18n key 命名(遵循 `src/i18n/types.ts` 契约)
- 三通道冒烟深度(启动级 vs 完整收发);Telegram 缺 token 则延续 Phase 2 acknowledged-deferred

## Deferred Ideas

- 构建链全面简化(files/postinstall/typecheck/build trim、CLI 独立构建发布)→ Phase 4(PANEL-04)
- release.yml 退役 + R2/GitHub updater endpoint 下线 + Rust toolchain 从 CI/CLAUDE.md 移除 → Phase 4
- 全量 npm run verify 回归 + 逐命令冒烟 + tree-sitter/code-query 保留验证 → Phase 4(SAFE-01/02/03)
- CC switch / MCP state 随 desktop 删除消失——预期内无 CLI 需求;若后续有 CLI 侧 CC switch 需求,另开 phase
