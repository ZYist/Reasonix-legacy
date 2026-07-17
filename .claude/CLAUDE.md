<!-- GSD:project-start source:PROJECT.md -->

## Project

**reasonix-legacy**

DeepSeek 原生的命令行编程 agent。通过 CLI/TUI 暴露一个**缓存优先(cache-first)**的 agentic loop,自动修复模型输出的工具调用 JSON,并在 token 预算内折叠上下文。面向希望在终端内用 DeepSeek 完成编程任务、并严格控制 token 成本的开发者。

本仓库是上游的 fork；当前 package 为 1.3.0，当前 GSD milestone 为 v1.3。

**Core Value:** 在终端里跑一个**低成本、不中断**的 DeepSeek 编程 agent——缓存优先把 token 成本压到最低,工具调用 JSON 自修复保证 loop 不被坏输出打断。这是面板/UI 都可以失败、唯独不能失败的那一件事。

### Constraints

- **Tech stack**: TypeScript + tsup 打包;Node ≥22;Ink(React)TUI;Commander CLI;Vitest / Biome / Stryker。
- **Identity**: npm package 与唯一 CLI 二进制入口均为 `reasonix-legacy`（→ `dist/cli/index.js`）。
- **不回归**: 核心 loop / 工具 / 记忆 / MCP / AcP 代码零回归;tree-sitter grammars 构建链保留。

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript (ES2022 / ESNext modules, `strict` + `noUncheckedIndexedAccess`) — all CLI, agent loop, MCP, tools, and TUI logic. Source under `src/`, `packages/*/src/`.

## Runtime

- Node.js `>=22` (enforced via `engines` in `package.json` and `src/cli/node-version-guard.ts`; CLI re-execs with a larger V8 heap via `src/cli/heap-limit-launch.ts`).
- npm (lockfile `package-lock.json` present and committed).
- npm workspaces — root `workspaces: ["packages/*"]`.

## Frameworks

- Custom agent loop — `CacheFirstLoop` in `src/loop.ts` (+ `src/loop/`): DeepSeek-native, cache-first, tool-call repair (`src/repair/`), reasoning retention (`src/loop/reasoning-retention.ts`).
- React 19 + custom Ink fork (`packages/ink/`, aliased to `ink` in `tsconfig.json`/`vitest.config.ts`) — TUI rendering. `react-reconciler` + `yoga-layout` drive the terminal renderer.
- commander 12 — CLI parsing (`src/cli/index.ts`).
- Vitest 2 (`vitest.config.ts`) — `pool: "forks"` for per-file process isolation (tokenizer BPE / tree-sitter wasms / native handles). Coverage via `@vitest/coverage-v8`.
- Stryker 9 (`stryker.config.mjs`) — mutation testing (`npm run test:mutation`).
- `@testing-library/react`, `react-test-renderer`, `ink-testing-library` — component tests.
- jsdom 29 — DOM environment for select tests.
- tsup 8 (`tsup.config.ts`) — bundles `src/index.ts` (library, with DTS) and `src/cli/index.ts` (CLI, noExternal `[/.*/]`, node banner) to `dist/`. Target `node22`, ESM only.
- esbuild 0.21 — bundler backend for tsup.
- tsx 4 — `dev` / `chat` script runner.
- TypeScript 5.6 (`tsconfig.json`) — `target: ES2022`, `moduleResolution: Bundler`, path aliases `@/* → src/*` and `ink → packages/ink/src/index.ts`.
- Biome 1.9 (`biome.json`) — lint + format (double quotes, semicolons, 100-col, 2-space).
- simple-git-hooks — `pre-commit: npm run lint`, `pre-push: npm run verify`.

## Key Dependencies

- `eventsource-parser` 3 — SSE parsing for `DeepSeekClient.stream` (`src/client.ts`).
- `undici` 8 — fetch + global proxy dispatcher (`src/net/proxy.ts` installs `ProxyAgent`).
- `zod` 4 — config + tool schema validation (`src/config.ts`, repair schema analysis).
- `web-tree-sitter` 0.26 + language grammars (`tree-sitter-{go,java,javascript,python,rust,typescript}`) — code query / symbol extraction (`src/code-query/parser.ts`, `scripts/copy-tree-sitter-grammars.mjs`).
- `commander` 12 — CLI.
- `chalk`, `cli-highlight`, `slice-ansi`, `wrap-ansi`, `string-width`, `cli-boxes`, `indent-string`, `strip-ansi`, `qrcode`, `iconv-lite`, `node-html-parser`, `picomatch`, `ignore`, `semver`, `ws`, `signal-exit`, `auto-bind`, `lodash-es`, `get-east-asian-width`, `emoji-regex`, `bidi-js`, `@alcalzone/ansi-tokenize`, `code-excerpt`, `stack-utils`, `usehooks-ts`, `supports-hyperlinks` — TUI / terminal / parsing utilities.
- `grammy` 1.43 — Telegram bot (`src/telegram/bot.ts`).
- `ws` 8 — QQ bot gateway WebSocket client (`src/qq/bot.ts`).
- `qrcode` — WeChat login QR (`src/weixin/bot.ts`).
- React 19, react-reconciler, yoga-layout — TUI rendering.
- `marked` 15, `highlight.js` 11, `preact` 10, `htm` 3, `uplot` 1.6 — dev/build helpers and charting.

## Configuration

- `.env` loaded by `loadDotenv()` (`src/env.ts`) — minimal hand-rolled parser; does not override already-set vars.
- `.env.example` documents required keys (existence only; contents not loaded here).
- DeepSeek key resolution: `process.env.DEEPSEEK_API_KEY` ← CLI bridges from `~/.reasonix/config.json` (`src/config.ts`).
- Config file: `~/.reasonix/config.json` (read/written via `atomicWriteSync` in `src/core/atomic-write.ts`).
- Base URL override: `DEEPSEEK_BASE_URL` env or config `baseUrl` (default `https://api.deepseek.com`); Azure-compatible hosts detected in `DeepSeekClient._isAzureEndpoint()`.
- `tsconfig.json` (root, library/CLI), `packages/*/tsconfig.json`.
- `tsup.config.ts` (two-entry bundle).
- `biome.json` (lint/format; ignores `dist`, `node_modules`, `coverage`, `*.d.ts`, `packages/ink/**`).
- `vitest.config.ts` (aliases React/Ink; coverage `include: ["src/**"]`).
- `stryker.config.mjs` (mutation testing).
- `scripts/copy-tree-sitter-grammars.mjs`.

## Platform Requirements

- Node.js 22+ (CI matrix pins node `"22"` on ubuntu-latest + windows-latest in `.github/workflows/ci.yml`).
- OS: Windows, macOS, or Linux. Tests tolerate Windows scheduler hiccups via `vitest` `retry: 1`.
- CLI: package `reasonix-legacy` exposes the sole `reasonix-legacy` binary → `dist/cli/index.js`.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Project Context

## Naming Patterns

- `kebab-case.ts` for modules: `context-manager.ts`, `pause-gate.ts`, `at-mentions.ts`, `tool-call-ready.ts`.
- One responsibility per file; when a file grows large, split into a same-named directory of submodules (see `src/loop/`, `src/tools/shell/`, `src/mcp/`).
- Test files mirror the subject with a `.test.ts` suffix and live in `tests/` (flat), e.g. `tests/loop.test.ts` ↔ `src/loop.ts`, `tests/repair/flatten.test.ts` ↔ `src/repair/flatten.ts`.
- `camelCase` for functions and variables: `fetchWithRetry`, `truncateForModel`, `formatLoopError`.
- `PascalCase` for classes and class factories: `CacheFirstLoop`, `ToolRegistry`, `DeepSeekClient`, `ImmutablePrefix`.
- `UPPER_SNAKE_CASE` for module-level constants, often exported: `DEFAULT_RETRYABLE_STATUSES`, `HISTORY_FOLD_THRESHOLD`, `DEEPSEEK_CONTEXT_TOKENS`.
- `PascalCase`: `ChatMessage`, `ToolSpec`, `LoopEvent`, `RetryOptions`.
- Prefer `interface` for object shapes; `type` for unions and aliases.
- Option bags are typed as `XOptions` (e.g. `LoopOptions`, `RetryOptions`, `McpClientOptions`) and passed by name — split responsibilities rather than growing an option bag past ~5 flags.
- Don't re-export a type across files just to share it; move it to the file that owns the concept.
- String-literal unions preferred over runtime enums: `export type Role = "system" | "user" | "assistant" | "tool"` (`src/types.ts`).
- Discriminated unions for events with a literal `type` field (`src/core/pause-gate.ts`, `src/core/events.ts`).

## Code Style

- 2-space indent, 100-char line width.
- Double quotes, always-semicolons, trailing commas everywhere.
- `organizeImports` enabled — let Biome sort imports; do not hand-order.
- Run `npm run lint:fix` / `npm run format` to auto-apply.
- `style.noNonNullAssertion`: off (allowed).
- `style.useImportType`: warn — use `import type` for type-only imports.
- `suspicious.noExplicitAny`: off, BUT per CONTRIBUTING "No `any` without a `// biome-ignore` and a reason." In practice `any` appears in test fixtures and JSON parsing; production code prefers narrow types and adds an ignore comment with justification.
- Ignored paths: `dist`, `node_modules`, `coverage`, `*.d.ts`, `packages/ink/**`.
- `strict: true`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- Target `ES2022`, `module: ESNext`, `moduleResolution: Bundler`.
- Path aliases: `@/*` → `src/*`, `ink` → `packages/ink/src/index.ts`.
- `isolatedModules: true` — every file must be independently transpilable (matters for tsup/esbuild builds).
- `biome check src tests`
- `tsc --noEmit`
- `tsup` build
- `vitest run` (incl. `tests/comment-policy.test.ts`)
- Wired into git hooks via `simple-git-hooks`: `pre-commit` = lint, `pre-push` = full `verify`.

## Import Organization

- `@/*` → `src/*` (configured in both `tsconfig.json` and `vitest.config.ts`).
- `ink` → local `packages/ink/src/index.ts` (the vendored Ink fork).

## Comments

| Rule | What it bans |
|------|--------------|
| Module header ≤ 2 lines | Block-comment essays at top of file |
| No "Phase N" narrative | `Phase 1/2/...` in comments |
| No version narrative | `v1.2.3` references in comments |
| No incident/conversation narrative | "user reported", "screenshot showed", "introduced in v", "regression from v", fix-for-issue refs |
| No section banners | `// ─── helpers ───`, `// === ...` |
| TODO/HACK must carry `(#nnn)` anchor | Bare `TODO:` or `HACK:` fails; write `TODO(#1234): ...` |
| **FIXME banned entirely** | Fix now or open an issue + `TODO(#nnn)` |
| No translator notes | "translator's note", "English version", etc. |
| Block comments ≤ 3 lines | Prefer one-line |

- A hidden constraint ("Yoga miscounts wrap → must clamp to width-1").
- A workaround for a specific bug.
- A subtle invariant the type system can't express.

## Error Handling

- Don't wrap internal calls in try/catch "just in case" — trust your own code.
- Don't validate things the type system already proves.
- Boundary code (user input, network, filesystem, child-process spawn) DOES validate.
- No "graceful fallback" that silently masks bugs. **Log + crash > silent wrong output.**
- **Network retry** — `src/retry.ts` `fetchWithRetry`. Classifies HTTP status (`DEFAULT_RETRYABLE_STATUSES = [408,429,500,502,503,504]`), exponential backoff with jitter, never retries aborts or mid-stream body errors (re-billing for desynced output is worse than failing). Configurable via `RetryOptions`.
- **Loop error formatting** — `src/loop/errors.ts` `formatLoopError`. Pattern-matches error message ("maximum context length", `DeepSeek (\d{3}):`) and produces localized user-facing text via the i18n runtime (`t("errors.contextOverflow", ...)`).
- **Confirmation gates (not exceptions)** — destructive/side-effecting tools go through `PauseGate.ask(...)` (`src/core/pause-gate.ts`) which returns a `ConfirmationChoice`. Test code injects a `SpyGate`/`AutoGate` subclass that overrides `ask` (see `tests/shell-tools.test.ts`).
- **Errors as control flow** for tool-driven UI modals: `PlanProposedError`, `ChoiceRequestedError`, `NeedsConfirmationError` (thrown by tools, caught by the loop to surface a modal). These are intentional, not debt.
- **Throw new Error("aborted")** on `AbortSignal` to short-circuit — see `src/retry.ts`.

## Logging

- User-visible strings go through `t("key", { vars })` from `src/i18n/index.ts`. Locales: `EN`, `zh-CN`, `JA`, `de`, `ru`. The runtime is set once via `setLanguageRuntime("EN")` — tests pin it in `tests/setup-lang.ts`.
- i18n strings are self-documenting — no translator notes in code (enforced by comment-policy test).
- Telemetry/usage events are written to JSONL via `src/telemetry/usage.ts` (`appendUsage`, `readUsageLog`), not console.logs.
- No noisy debug `console.log` left in committed code — Biome recommended rules + review push these out.

## Function Design

- **Small, single-purpose.** Split files (not functions) when growth happens — `src/loop.ts` delegates to `src/loop/{dispatch,errors,healing,shrink,streaming,thinking,...}.ts`.
- **Prefer narrow typed parameters** over option bags; once a bag exceeds ~5 optional flags, split responsibilities.
- **Return concrete types**, not `any`. Public API surface is snapshotted in `tests/public-api.test.ts` — unintended changes fail CI.
- **Readonly by default**: `readonly ToolSpec[]`, `readonly number[]` for inputs that shouldn't mutate.

## Module Design

- Named exports only. No default exports observed in `src/`.
- Separate `export { ... }` (values) from `export type { ... }` (types) — see `src/index.ts` for the canonical grouping pattern.
- **No barrel `index.ts` re-exports** unless they meaningfully shrink the public surface. `src/index.ts` is the legitimate library entry (and is snapshotted by `tests/public-api.test.ts`); subdirectory `index.ts` files exist only where they consolidate a real API (`src/i18n/index.ts`, `src/mcp/types.ts`).
- Visual/unicode width → `string-width`.
- Grapheme segmentation → `Intl.Segmenter`.
- ANSI strip → ships with `string-width`.
- Colors in components → `src/theme.ts` constants, never raw hex.

## Git / Commit Conventions

- Imperative mood, scope tag, why-not-what: `feat(ui): ...`, `fix(loop): ...`, `chore(release): ...`.
- One logical change per commit; refactors land separately from features.
- **No `Co-Authored-By: Claude` trailer.**
- Don't edit `CHANGELOG.md` in PRs — maintainer-only at release time.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `CacheFirstLoop` | One-turn agentic loop: stream model deltas, dispatch tool calls, repair, fold, emit events | `src/loop.ts` |
| `ContextManager` | Token budgeting, history folding (normal/aggressive/forced-summary), pinned-constraint extraction | `src/context-manager.ts` |
| `DeepSeekClient` | Chat completions + SSE streaming, retry/backoff, multi-vendor `Usage` normalization | `src/client.ts` |
| `ToolRegistry` | Tool definition/dispatch, schema auto-flatten, plan-mode gating, rate limiting, interceptors/augmenters | `src/tools.ts` |
| `ToolCallRepair` | Repair malformed/truncated tool-call JSON, storm detection, scavenging dangling calls | `src/repair/index.ts`, `src/repair/{flatten,scavenge,storm,truncation}.ts` |
| `ImmutablePrefix` | Frozen system+tools+fewShots prefix; cache fingerprinting; sorted tool specs | `src/memory/runtime.ts` |
| `AppendOnlyLog` / `VolatileScratch` | Append-only event log + scratch buffer; windowed tail reads; session persistence | `src/memory/runtime.ts`, `src/memory/session.ts` |
| `Eventizer` / events | Event-log kernel: typed events (`src/core/events.ts`) + reducer projections (`src/core/reducers.ts`) | `src/core/eventize.ts`, `src/core/events.ts` |
| `PauseGate` | Singleton confirmation/approval gate injected into tools and loop | `src/core/pause-gate.ts` |
| MCP subsystem | Bridge external MCP servers (stdio / SSE / streamable-HTTP) as tool providers | `src/mcp/client.ts`, `src/mcp/registry.ts`, `src/mcp/{stdio,sse,streamable-http}.ts` |
| ACP server | NDJSON JSON-RPC 2.0 protocol surface (editor/IDE integration) | `src/acp/server.ts`, `src/acp/{dispatch,gates,protocol}.ts` |
| CLI/TUI | Commander entry point + Ink (React) terminal UI; cards, slash, effects, hooks | `src/cli/index.ts`, `src/cli/ui/App.tsx` |
| Semantic index | Local code-semantic embeddings (Ollama) for retrieval tool | `src/index/semantic/{builder,store,embedding,tool}.ts` |
| Config | All persisted user settings: API keys, base URLs, hooks, MCP catalog, rate limits | `src/config.ts` |

## Pattern Overview

- **Cache-first design.** `ImmutablePrefix` is frozen and fingerprinted; `sortToolSpecs` (`src/memory/runtime.ts:30`) uses locale-independent codepoint compare to avoid cache churn. Adding a tool costs one cache-miss turn.
- **Event-sourced kernel.** Every transition is an appended `LoopEvent` (`src/loop/types.ts`, `src/core/events.ts`); views are pure reducer projections (`src/core/reducers.ts`). No mutation of past events.
- **Repair-as-first-class.** Models emit malformed JSON; `ToolCallRepair` + `src/repair/*` flatten schemas, scavenge dangling tool_calls, detect storm loops, and recover truncated arguments before the request 400s.
- **Token-budget defense in depth.** `ContextManager` uses layered thresholds (`TURN_START_FOLD_THRESHOLD=0.9`, `HISTORY_FOLD_THRESHOLD=0.75`, `FORCE_SUMMARY_THRESHOLD=0.8` of ctxMax) with normal, aggressive, and forced-summary folds, plus fold-economics gates.
- **Injectable boundaries.** `CacheFirstLoopOptions` accepts a client, prefix, tools, hooks, `confirmationGate`, and `rebuildSystem` callback — the loop is fully testable without I/O.
- **Multi-surface, single core.** CLI/TUI and ACP all drive the same `CacheFirstLoop`.

## Layers

- Purpose: Accept input from humans / editors / chat networks and translate to loop calls.
- Location: `src/cli/`, `src/acp/`, `src/qq/`, `src/telegram/`, `src/weixin/`
- Contains: Commander commands, Ink React components, JSON-RPC dispatcher, chat ingress.
- Depends on: `CacheFirstLoop`, `@reasonix/core-utils`, `src/config.ts`.
- Used by: End users / IDEs / mobile.
- Purpose: Orchestrate one turn: stream → tool calls → repair → fold → next iter.
- Location: `src/loop.ts`, `src/loop/*`, `src/context-manager.ts`, `src/repair/*`
- Contains: `CacheFirstLoop.step()` generator, dispatch, healing, streaming, thinking-mode handling, shrink/force-summary.
- Depends on: `DeepSeekClient`, `ToolRegistry`, `ImmutablePrefix`/`AppendOnlyLog`, `ContextManager`, `ToolCallRepair`, hooks (`src/hooks.ts`), telemetry.
- Used by: Every surface.
- Purpose: I/O primitives — talk to DeepSeek, run tools, persist events.
- Location: `src/client.ts`, `src/tools.ts`, `src/tools/*`, `src/mcp/*`, `src/memory/*`, `src/core/*`
- Contains: HTTP/SSE client, internal tool implementations (`filesystem`, `shell`, `web`, `plan`, `todo`, `memory`, `subagent`, `skills`, `java-source`, `code-query`), MCP bridging, session log + memory stack, PauseGate, Eventizer.
- Depends on: `src/config.ts`, `src/env.ts`, `src/tokenizer.ts`, `src/net/proxy.ts`, Node `fs`/`child_process`.
- Used by: Loop layer.
- Purpose: Cross-cutting concerns — config, env, i18n, proxy, telemetry, retry, hooks, version.
- Location: `src/config.ts`, `src/env.ts`, `src/i18n/*`, `src/net/proxy.ts`, `src/telemetry/*`, `src/retry.ts`, `src/hooks.ts`, `src/version.ts`, `src/tokenizer.ts`
- Contains: Config read/write, undici global dispatcher install, usage aggregation, cache diagnostics, hook spawning.
- Depends on: Node built-ins + `undici`, `eventsource-parser`.
- Used by: All upper layers.

## Data Flow

### Primary Request Path (a single turn)

### Session Resume Flow

- **Append-only event log** (`AppendOnlyLog`) is the source of truth; `VolatileScratch` holds the current turn's in-flight content before commit.
- **ImmutablePrefix** holds frozen system+tools+fewShots; mutated only on `/new` via `rebuildSystem` callback.
- **PauseGate** singleton bridges UI confirmations to tools/loop.
- **Abort propagation:** `_turnAbort: AbortController` threaded through HTTP fetch + every tool dispatch so Esc cancels in-flight work (`src/loop.ts:194`).

## Key Abstractions

- Purpose: Declarative tool spec + dispatch with `readOnly`, `parallelSafe`, `stormExempt`, `readOnlyCheck`, `skipTruncationSave` flags.
- Examples: `src/tools/filesystem.ts`, `src/tools/shell.ts`, `src/tools/web.ts`, `src/tools/plan.ts`, `src/tools/todo.ts`, `src/tools/subagent.ts`, `src/tools/memory.ts`, `src/tools/skills.ts`, `src/tools/java-source.ts`, `src/tools/code-query.ts`.
- Pattern: Each tool module exports `registerXxxTools(registry, opts)`; surfaces compose them into one `ToolRegistry`. MCP tools bridged via `bridgeMcpTools` (`src/mcp/registry.ts`).
- Purpose: Stable, hashable chat prefix for prompt-cache hits.
- Examples: `src/memory/runtime.ts:42`.
- Pattern: Tool specs sorted locale-independently; fingerprint invalidated on mutation.
- Purpose: Discriminated-union event types emitted by `step()`; surfaces reduce them to the TUI.
- Examples: `src/loop/types.ts`, `src/core/events.ts` (`user.message`, `model.delta`, `model.final`, `tool.preparing/intent/dispatched/denied/result`, `slash.invoked`).
- Pattern: Consumers subscribe via `loop.run(input, onEvent)` or `Eventizer` (`src/core/eventize.ts`).
- Purpose: Track prefix hash drift so cache misses are explainable.
- Examples: `src/telemetry/cache-diagnostics.ts`; emitted by `appendCacheDiagnostic` after each turn (`src/loop.ts`).

## Entry Points

- Location: `src/cli/index.ts`
- Triggers: `reasonix-legacy` bin (package.json `bin` → `dist/cli/index.js`); also `npm run dev` (`tsx src/cli/index.ts`).
- Responsibilities: Guards (node version, heap limit, BEL strip), proxy install, Commander subcommands (`setup`, `code`, `chat`, `run`, `acp`, `desktop`, `stats`, `doctor`, `commit`, `sessions`, `events`, `replay`, `diff`, `mcp`, `update`, `import-sessions`, `prune-sessions`), default action launches the Ink TUI.
- Location: `src/index.ts`
- Triggers: `import { CacheFirstLoop, DeepSeekClient, ToolRegistry, ... } from "reasonix-legacy"`.
- Responsibilities: Re-exports the public API (client, loop, memory, tools, MCP, telemetry, transcript, hooks, version).
- Location: `src/acp/server.ts`
- Triggers: `reasonix-legacy acp` subcommand (editor integrations).
- Responsibilities: NDJSON JSON-RPC 2.0 stdio protocol.

## Architectural Constraints

- **Node ≥ 22.** Enforced by `src/cli/node-version-guard.ts`; package.json `engines.node` set to `>=22`.
- **Single-threaded event loop.** Tools may spawn child processes (`run_command`, MCP stdio servers); no worker threads.
- **V8 heap cap workaround.** `src/cli/heap-limit-launch.ts` re-execs above Node's stock 2 GiB cap (issue #1011).
- **Windows BEL suppression.** `src/cli/strip-bel.ts` wraps stdout/stderr before any third-party lib beeps on Windows cmd (#1786).
- **Global state:** `pauseGate` singleton (`src/core/pause-gate.ts`), undici global dispatcher (`src/net/proxy.ts`), `i18n` initialized language.
- **Proxy must be installed early.** `installProxyIfConfigured` runs before any `fetch` closure captures the dispatcher (`src/cli/index.ts:54`, `src/net/proxy.ts`).
- **Circular imports:** Loop re-exports many helpers from `src/loop/*` to preserve a stable public surface (`src/loop.ts:82-95`); `context-manager.ts` imports `healLoadedMessages` from `./loop.js` while `loop.ts` constructs `ContextManager` — kept acyclic by routing through re-exports, not direct back-imports.
- **Cache stability invariant.** Mutating the tool list, system prompt, or few-shots invalidates `ImmutablePrefix`'s fingerprint and forces a cache-miss turn. `sortToolSpecs` is locale-independent on purpose.

## Anti-Patterns

### Mutating past session events

### Locale-sensitive sorting of tool specs

### Constructing `fetch` closures before proxy install

## Error Handling

- `formatLoopError` / `errorMeta` / `is4xxError` / `is5xxError` / `isDeepSeekHost` / `probeDeepSeekReachable` classify errors and produce user-facing text (`src/loop/errors.ts`).
- `fetchWithRetry` + `loadRateLimit` in `src/retry.ts` and `src/client.ts` handle 429/5xx with exponential backoff.
- `ToolCallRepair` returns a `RepairReport`; the loop proceeds with repaired calls and logs what changed (`src/repair/index.ts`).
- Hooks return exit codes: `0` pass, `2` block on Pre*, other = warn (`src/hooks.ts`).
- Abort is non-fatal: an aborted turn yields a synthetic `[aborted by user ...]` message rather than throwing (`src/loop.ts:857-867`).

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
