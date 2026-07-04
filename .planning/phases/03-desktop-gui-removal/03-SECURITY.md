---
phase: 03
slug: desktop-gui-removal
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-04
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
>
> Phase 03 is a pure removal + retirement-stub phase. Its net security effect is
> **attack-surface reduction**: the NDJSON-RPC-over-stdin protocol surface and the
> Tauri desktop shell (with its own SQLite credential/MCP state) are physically gone.
> No new trust boundary is introduced; the only new boundary (`reasonix desktop`
> retirement stub) is strictly narrower than what it replaced.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| CLI 进程内部 → 已删除 sidecar 模块 | 删除 `desktop.ts`/`src/desktop/` 后,任何残留静态/动态 import 会在 CLI 启动时触发 ESM 解析失败(typecheck 不一定发现动态 import,运行时冒烟兜底) | ESM module graph — internal |
| 用户输入 → `reasonix desktop` 退役 stub | 退役命令的 action 是新增攻击面边界:必须只打印 + 非零退出,不读 stdin、不进入旧 NDJSON-RPC-over-stdin 协议 | CLI argv — low sensitivity |
| 已删 `desktop/src-tauri` SQLite → CLI | desktop/src-tauri `cc_switch`/MCP state(desktop-only rusqlite)随删除消失;确认无 CLI 核心依赖该 credential/state 逻辑 | None — deleted with the dir |
| 配置文件 → 运行时 i18n | 新增/删除 i18n key 须 5-locale 一致,否则 `tsc TranslationSchema` 失败;`events.ts` 的 LIVE `t()` 调用须随键删除同步移除 | Static locale strings — low sensitivity |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Tampering (T) | `src/cli/index.ts` 动态 import + tsup `noExternal` bundle | high | mitigate | `await import("./commands/desktop.js")` + `desktopCommand` 标识在 `src/cli/index.ts` = 0(L1 grep,2026-07-04);tsup `noExternal: [/.*/]` build exit 0 证明残留动态 import 会让 esbuild bundle 失败(VERIFICATION Truth #21) | closed |
| T-03-02 | Elevation of Privilege (E) / DoS | `reasonix desktop` 退役 stub action | medium | mitigate | stub action 为同步 `console.error(t("commands.desktop.retired"))` + `process.exit(1)`,不读 stdin、不进入 NDJSON-RPC-over-stdin、不挂起(`src/cli/index.ts:349-356` 实测);冒烟断言非零退出 + 不等待 stdin(VERIFICATION Truth #11 behavioral)。相对旧 sidecar 是攻击面缩减。 | closed |
| T-03-03 | Information Disclosure (I) | `src/cli/commands/events.ts` LIVE 调用 `app.sidecarHint` | medium | mitigate | `sidecarHint` in `src/i18n/types.ts` = 0;`app.sidecarHint` in `src/cli/commands/events.ts` = 0(L1 grep,2026-07-04);空事件分支仍 exit 1 + `noEventsFor`/`lookedAtFile` 提示(VERIFICATION Truth #15)。 | closed |
| T-03-04 | Tampering (T) | `src/desktop/{login-shell-path,memory-browser}.ts` 误删风险 | medium | mitigate | `src/desktop/` 目录已删除(`test ! -d src/desktop` PASS);`login-shell-path`/`memory-browser` 在 `src/` 运行时消费者 = 0(L1 grep,2026-07-04,排除 prose 注释);03-PATTERNS D-02 已确认仅 `desktop.ts` 消费,现已一并删除。 | closed |
| T-03-05 | Information Disclosure (I) | `desktop/src-tauri` `cc_switch`/MCP state SQLite | low | accept | 该 SQLite 承载 CC switch/MCP state,desktop-only,无 CLI 等价物。随 `desktop/` 删除一并消失 —— 攻击面缩减(positive),无 credential/secret-handling 逻辑迁移到 CLI。核心 CLI 的 auth-gate(`pauseGate`)独立于已删代码。 | closed |
| T-03-06 | Information Disclosure (I) | i18n 文案编辑 | low | accept | 新增 `commands.desktop.retired` 与删除 `sidecarHint` 均为静态字符串经 `t()` 出,无 eval/模板注入向量。5-locale 键集由 `tsc TranslationSchema` 强校验(VERIFICATION Truth #20 typecheck exit 0)。 | closed |
| T-03-07 | Tampering (T) | 删除测试文件遗留 runtime 引用盲区(tsconfig exclude `tests/`) | medium | mitigate | 综合 structure grep:`import .*(desktop/src\|src/desktop\|commands/desktop)` = 0;`readFileSync\([^)]*(desktop/src\|../desktop/src-tauri)` = 0(L1 grep,2026-07-04,覆盖 typecheck 漏检 `tests/` 的盲区);survivor `tests/theme-tokens.test.ts` scoped vitest 8 tests pass(VERIFICATION Truth #23-24)。 | closed |
| T-03-SC | Tampering (T) | npm 包安装 | low | accept | 本 phase 为纯删除 + 编辑,不引入任何新依赖(无 npm/pip/cargo install 任务)。Package Legitimacy Audit 不适用。 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (`high`) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-05 | desktop-only SQLite (CC switch/MCP state) deleted with the dir; no credential/secret-handling logic migrates to CLI — net attack-surface reduction, no residual exposure. | PLAN threat_model (D-05) | 2026-07-04 |
| AR-03-02 | T-03-06 | i18n edits are static strings through `t()`; no eval/template injection vector; 5-locale key parity enforced by `tsc TranslationSchema`. | PLAN threat_model | 2026-07-04 |
| AR-03-03 | T-03-SC | Pure removal + edit phase introduces no new dependencies; Package Legitimacy Audit not applicable. | PLAN threat_model | 2026-07-04 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-04 | 8 | 8 | 0 | Claude (gsd-secure-phase, L1 short-circuit) |

**Method:** `register_authored_at_plan_time: true`, `asvs_level: 1`, preliminary `threats_open: 0`
→ short-circuit rule applied (workflow §3): L1 grep-depth verification sufficient, no auditor
spawned. All five `mitigate` threats re-verified against the live tree with structural greps on
2026-07-04; the three `accept` threats carry documented rationale. No threat is at or above the
`high` block threshold and open.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-04
