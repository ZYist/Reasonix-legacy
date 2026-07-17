# Milestones

## v1.1 Risk Foundations & Maintenance Simplification (Shipped: 2026-07-17)

**Closeout:** verified_closeout · 5 phases · 9 plans · 9 work packages
**Requirements:** 21/21 complete (GOV-01..04, TRUTH-01..04, I18N-01..05, TEST-01..05, CI-01..03)
**Git range:** `b296f0d2` (milestone start) → `9a30e8f7` (milestone audit) · 30 commits · +2,814 / −14,717 lines across 143 files

**Key accomplishments:**

- **治理事实固化（Phase 5）** — 明确 package semver、fork 身份、`dev` CI 和风险导向 coverage policy，形成可引用的 `docs/governance.md`。
- **仓库事实对齐（Phase 6）** — 中英文入口文档、codebase maps 和测试配置与 Pure CLI live source 对齐，并移除遗留 Tauri 测试 aliases/mocks。
- **双语边界（Phase 7）** — 运行时 locale 收敛为 `en`/`zh-CN`，支持别名归一化、旧配置迁移、系统语言 fallback 和字典 key parity。
- **关键路径保护（Phase 8）** — 为 TUI composer/live output、关键 CLI command、Telegram/Weixin 生命周期建立确定性离线特征测试和显式 live-UAT 边界。
- **CI 与 flaky 可见性（Phase 9）** — 活跃分支获得完整 CI 门禁，并通过跨平台 retry wrapper 暴露“首轮失败、诊断重试通过”的结果。

### Known Gaps

- 真实凭据、网络和交互式 TTY 依赖的 Telegram、Weixin 与终端体验仍是人工 UAT，不伪装为自动化通过。
- GitHub branch protection 仍是仓库外 operator action。
- 2026-07-17 稳定版评估识别出的依赖漏洞、版本/发布链漂移、`dsnix` 遗留和发布治理问题已路由到 v1.3。

---

## v1.0 Pure CLI (Shipped: 2026-07-05)

**Closeout:** override_closeout · 4 phases · 8 plans · 19 tasks
**Requirements:** 10/10 complete (PANEL-01..04, BOT-01..03, SAFE-01..03)
**Git range:** `c774479f` (v0.55.0 fork release) → `71538e34` (M1 close) · 82 commits on dev · +11,506 / −87,832 LOC across 374 files

**Key accomplishments:**

- **Web 面板剥离(Phase 1)** — `dashboard/` + `src/server/` + 全部桥接适配整体切除,18 个源文件硬引用清零,12 个面板专属测试删除,CLI 在无面板 node 依赖下 typecheck/build/lint 三件套全绿。
- **面板 i18n 死串清理 + 运行时冒烟(Phase 1)** — `types.ts` 契约 + EN/zh-CN/JA/de/ru 五 locale 键集对齐(基线 116→24);`reasonix code` live 回合模型调用原生 `read_file` 读到 `package.json` 版本 `0.55.0`,证明面板切除零运行时残留。
- **传输协议无关的 HeadlessHost(Phase 2)** — 复刻 `buildRuntimeFor` recipe(`src/cli/headless/`),QQ/Telegram/微信经同一宿主 + 同一 `GateCallbacks` 形状作为独立 CLI 命令运行,脱离 Tauri JSON-RPC;核心 `CacheFirstLoop`/`PauseGate`/完整 `ToolRegistry` 零重实现;`desktop.ts` sidecar 跨三 plan 字节级未动直到 Phase 3 才删。
- **桌面 GUI 移除(Phase 3)** — `reasonix desktop` 退役为 i18n 薄 stub(`console.error` + `process.exit(1)`),Tauri 应用 + 3555 行 sidecar god module + `src/desktop/` + 27 个桌面测试物理删除,三通道与 CLI 核心命令 `--help` 零回归。
- **构建链全面简化(Phase 4)** — `postinstall.mjs` / `sync-desktop-version.mjs` / `release.yml` 退役,`package.json`/`ci.yml` 对齐纯 CLI,`.claude/CLAUDE.md` 裁剪全部 Rust/Tauri/dashboard 段;`npm pack` 输出干净 CLI-only tarball(9.2 MB / 168 files,无 postinstall 钩子)。
- **全量回归收敛(Phase 4)** — 14 baseline 红收敛到 3 个 evidence-deferred 预存红(三段式证明:baseline 红 + git-diff 未触 + HEAD 同款失败);19 个命令 `--help` 全绿、8 个离线命令真实数据功能冒烟、tree-sitter `code-query` 跨 6 语言(TS/Python/Go/Rust/Java/JS)e2e 存活;核心 loop/工具/记忆/MCP/AcP 零回归。

### Known Gaps

- **UAT #2 — weixin 不显示内部反馈(思考过程/工具输出)** — accepted-and-deferred(维护者决议 2026-07-05)。根因非 weixin 专属 bug,而是 Phase-2 既存的共享 `HeadlessHost` 渲染缺口(`runTurn` 未订阅 `turn-driver` 的 `onEvent` 回调 → 全部 channel 都丢弃 reasoning/tool 事件);非 Phase-04 回归(`git diff 9d7b706c..HEAD` 在 `src/` 仅触 `update.ts` + `version.ts`)。定性:pre-existing / out-of-phase-scope / feature(stream-to-chat,适用于全部 3 channel)。路由到 fix cycle 或未来 channel-streaming phase。完整记录见 `04-VERIFICATION.md` §deferred 与 `STATE.md` §Deferred Items。

Known verification overrides: 1 (see STATE.md §Deferred Items).

---
