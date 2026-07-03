# Phase 2: Bot Decoupling to Standalone CLI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-03
**Phase:** 2-Bot Decoupling to Standalone CLI
**Mode:** `--auto` (chain via `/gsd-progress --next --auto`) — all gray areas auto-selected; each question resolved with the recommended option without interactive prompting.
**Areas discussed:** Headless host extraction locus, QQ command surface, Channel→loop gate reversal, Telegram/Weixin migration order, Sidecar coexistence contract

---

## Headless host extraction locus

| Option | Description | Selected |
|--------|-------------|----------|
| 新建 `src/cli/headless/` 模块 | 从 `desktop.ts` `buildRuntimeFor` recipe 提取 host,独立于 Tab/RPC/TUI,可独立测试 | ✓ |
| 就地重构 `desktop.ts` | 在 3555 行文件内提取,触碰 RPC dispatch / Tab 状态机不可回归面 | |
| 塞进 `chat.tsx`/`code.tsx` | 复用 TUI 入口的 loop 装配,但 TUI 与无头职责正交 | |

**Selection:** `src/cli/headless/` 新模块 (recommended)
**Notes:** `desktop.ts:1376-1400` `buildRuntimeFor` 是已验证可用的 loop recipe(Phase 1 验证 4/4 时同一 recipe 跑通),复刻提取而非重发明,最大化满足 BOT-03。

---

## QQ command surface

| Option | Description | Selected |
|--------|-------------|----------|
| 顶层子命令 `reasonix qq`,复用 `code` 模式 toolset | 带 filesystem/shell/web 完整工具,机器人能编程 | ✓ |
| 顶层子命令 `reasonix qq`,复用 `chat` 模式 toolset | filesystem-less 子集,机器人无法读写文件 | |
| 复用 `desktop` 子命令加 flag | 仍走 sidecar RPC,未脱离 Tauri JSON-RPC | |

**Selection:** `reasonix qq` 顶层子命令 + code 模式完整 toolset (recommended)
**Notes:** `reasonix chat` 的 filesystem-less 设计按 01-VERIFICATION 备注仅属 TUI 模式;无头机器人需文件/执行能力。命令层只做装配 + lifecycle。

---

## Channel→loop gate reversal

| Option | Description | Selected |
|--------|-------------|----------|
| gate-callback 闭包对象替代 `*Ref` | adapter 接收 `GateCallbacks` 纯函数闭包,剥离 React/Ink ref 依赖 | ✓ |
| 保留 `*Ref` 注入,在宿主层造 mock ref | 假装 TUI ref 存在,泄漏 React 抽象进无头层 | |
| 重写 channel adapter | 违反 BOT-02「迁移现有接入,不重写协议/out-of-scope」 | |

**Selection:** gate-callback 闭包对象 (recommended)
**Notes:** 现 `UseQQChannelArgs` 依赖 ~15 个 `onXxxConfirmRef` 经 Ink ref 注入;改为对象注入点。分片/Markdown/访问描述逻辑留 `src/qq/` 不动,复刻 `parseRunPermissionChoice` 等解析范式(`desktop.ts:1866-1882`)。

---

## Telegram/Weixin migration order

| Option | Description | Selected |
|--------|-------------|----------|
| 02-03 内统一迁移到同一 `HeadlessHost` | 三 channel 公共签名已一致,平行 adapter,统一迁移避分叉 | ✓ |
| 逐个独立适配三类 gate 桥接 | 产出三份 gate 桥接分叉,后续难收敛 | |
| 仅迁 Telegram,微信延到 Phase 3 | 拆碎 BOT-02,微信扫码登录需无头宿主才能脱离 desktop | |

**Selection:** 02-03 统一迁移 (recommended, matches ROADMAP plan 02-03)
**Notes:** QQ 优先(02-02)因是当前 sidecar 唯一深度耦合者;TG/微信在 02-03 经同宿主 + 同 gate-callback 形状迁移。

---

## Sidecar coexistence contract

| Option | Description | Selected |
|--------|-------------|----------|
| `desktop.ts`/sidecar 不删不可回归,新命令并存 | 契合 BOT 成功标准 4,QQ 已迁出但 sidecar 未删 | ✓ |
| 本 phase 删除 sidecar | 越界 Phase 3;QQ 尚未保证无头宿主可用前删宿主会断 QQ | |
| 本 phase 只删 sidecar 内 QQ,保留外壳 | 删 sidecar 内代码需先确保新入口绿灯,属 Phase 3 边界 | |

**Selection:** sidecar 不可回归,双入口并存 (recommended, matches success criterion 4)
**Notes:** 短期 QQ 双入口(sidecar + `reasonix qq`)可接受;`QQ_LOCK_FILE` PID 锁防同账号双开。协议层共享、宿主层分离。Phase 3 删 sidecar 时移除 desktop 内 QQ 宿主代码。

---

## Claude's Discretion

- adapter 内消息分片/Markdown 规整沿用 channel 模块默认值
- 启动 i18n 文案复用现有 strings + 新 key 走 `t()` 同步 5 locale(01-02 契约)
- workspace 解析:`--workspace` > cwd > throw(不静默回退)

## Deferred Ideas

- 删除 `desktop.ts` / sidecar / `src/desktop/*` → Phase 3
- sidecar 与新命令 QQ 宿主去重 → Phase 3
- `reasonix qq` 子命令细粒度 flag → plan 阶段(02-02)
- 三 adapter 提取 `BaseChannelAdapter` 基类去重 → 02-03 plan 层判断,或延后 Phase 4
