<!-- refreshed: 2026-07-02 -->
# Architecture

**Analysis Date:** 2026-07-02

## System Overview

Reasonix-legacy is a DeepSeek-native coding agent exposed as a CLI/TUI, an ACP JSON-RPC server, a desktop app, and a programmatic TypeScript library. The core is a **cache-first agentic loop** that streams model responses, dispatches tool calls, repairs malformed/truncated tool-call JSON, folds context when the prompt-token budget is breached, and persists every transition as an event in an append-only log.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          Surfaces / Hosts                            │
├──────────────────┬──────────────────┬──────────────┬────────────────┤
│  CLI / TUI (Ink) │  Dashboard HTTP  │  ACP (NDJSON │  Desktop (QQ / │
│  `src/cli/*`     │  `src/server/*`  │  JSON-RPC)   │  Telegram /    │
│                  │                  │  `src/acp/*` │  Weixin)       │
└────────┬─────────┴────────┬─────────┴──────┬───────┴────────────────┘
         │                  │                │
         ▼                  ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Cache-first Agent Loop                           │
│   `CacheFirstLoop`  `src/loop.ts`  +  `src/loop/*`                   │
│   step() → stream model → dispatch tools → repair → fold/compact     │
├──────────────────────┬──────────────────────┬────────────────────────┤
│ ContextManager       │ ToolCallRepair       │ ContextManager fold    │
│ `src/context-        │ `src/repair/*`       │ `src/context-          │
│  manager.ts`         │ (flatten/scavenge/   │  manager.ts`           │
│                      │  storm/truncation)   │                        │
└──────────┬───────────┴──────────┬───────────┴────────────┬───────────┘
           │                       │                        │
           ▼                       ▼                        ▼
┌──────────────────────┬──────────────────────┬────────────────────────┐
│ DeepSeekClient       │ ToolRegistry         │ Memory / Event Log     │
│ `src/client.ts`      │ `src/tools.ts` +     │ AppendOnlyLog,         │
│ (fetch + retry +     │ `src/tools/*` +      │ ImmutablePrefix,       │
│  SSE streaming)      │ `src/mcp/*`          │ VolatileScratch        │
│                      │                      │ `src/memory/runtime.ts`│
│                      │                      │ `src/memory/session.ts`│
└──────────────────────┴──────────────────────┴────────────────────────┘
           │                       │                        │
           ▼                       ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DeepSeek API    │   Local fs / shell / web / Java / code-query /    │
│  (HTTPS)         │   MCP servers / Ollama embeddings                 │
│                  │   `~/.reasonix/sessions/*.jsonl`                  │
└─────────────────────────────────────────────────────────────────────┘
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
| Dashboard server | Loopback HTTP server with per-boot CSRF token, serves dashboard SPA + JSON API | `src/server/index.ts`, `src/server/router.ts`, `src/server/api/*.ts` |
| ACP server | NDJSON JSON-RPC 2.0 protocol surface (editor/IDE integration) | `src/acp/server.ts`, `src/acp/{dispatch,gates,protocol}.ts` |
| CLI/TUI | Commander entry point + Ink (React) terminal UI; cards, slash, effects, hooks | `src/cli/index.ts`, `src/cli/ui/App.tsx` |
| Semantic index | Local code-semantic embeddings (Ollama) for retrieval tool | `src/index/semantic/{builder,store,embedding,tool}.ts` |
| Config | All persisted user settings: API keys, base URLs, hooks, MCP catalog, rate limits | `src/config.ts` |

## Pattern Overview

**Overall:** Event-sourced agentic loop with strict layering — Surfaces → Loop → Client/Tools/Memory → External.

**Key Characteristics:**
- **Cache-first design.** `ImmutablePrefix` is frozen and fingerprinted; `sortToolSpecs` (`src/memory/runtime.ts:30`) uses locale-independent codepoint compare to avoid cache churn. Adding a tool costs one cache-miss turn.
- **Event-sourced kernel.** Every transition is an appended `LoopEvent` (`src/loop/types.ts`, `src/core/events.ts`); views are pure reducer projections (`src/core/reducers.ts`). No mutation of past events.
- **Repair-as-first-class.** Models emit malformed JSON; `ToolCallRepair` + `src/repair/*` flatten schemas, scavenge dangling tool_calls, detect storm loops, and recover truncated arguments before the request 400s.
- **Token-budget defense in depth.** `ContextManager` uses layered thresholds (`TURN_START_FOLD_THRESHOLD=0.9`, `HISTORY_FOLD_THRESHOLD=0.75`, `FORCE_SUMMARY_THRESHOLD=0.8` of ctxMax) with normal, aggressive, and forced-summary folds, plus fold-economics gates.
- **Injectable boundaries.** `CacheFirstLoopOptions` accepts a client, prefix, tools, hooks, `confirmationGate`, and `rebuildSystem` callback — the loop is fully testable without I/O.
- **Multi-surface, single core.** CLI/TUI, HTTP dashboard, ACP, and desktop all drive the same `CacheFirstLoop`.

## Layers

**Surfaces (Host layer):**
- Purpose: Accept input from humans / editors / chat networks and translate to loop calls.
- Location: `src/cli/`, `src/server/`, `src/acp/`, `src/desktop/`, `src/qq/`, `src/telegram/`, `src/weixin/`
- Contains: Commander commands, Ink React components, HTTP router, JSON-RPC dispatcher, chat ingress.
- Depends on: `CacheFirstLoop`, `@reasonix/core-utils`, `src/config.ts`.
- Used by: End users / IDEs / mobile.

**Agent Loop layer:**
- Purpose: Orchestrate one turn: stream → tool calls → repair → fold → next iter.
- Location: `src/loop.ts`, `src/loop/*`, `src/context-manager.ts`, `src/repair/*`
- Contains: `CacheFirstLoop.step()` generator, dispatch, healing, streaming, thinking-mode handling, shrink/force-summary.
- Depends on: `DeepSeekClient`, `ToolRegistry`, `ImmutablePrefix`/`AppendOnlyLog`, `ContextManager`, `ToolCallRepair`, hooks (`src/hooks.ts`), telemetry.
- Used by: Every surface.

**Client / Tool / Memory layer:**
- Purpose: I/O primitives — talk to DeepSeek, run tools, persist events.
- Location: `src/client.ts`, `src/tools.ts`, `src/tools/*`, `src/mcp/*`, `src/memory/*`, `src/core/*`
- Contains: HTTP/SSE client, internal tool implementations (`filesystem`, `shell`, `web`, `plan`, `todo`, `memory`, `subagent`, `skills`, `java-source`, `code-query`), MCP bridging, session log + memory stack, PauseGate, Eventizer.
- Depends on: `src/config.ts`, `src/env.ts`, `src/tokenizer.ts`, `src/net/proxy.ts`, Node `fs`/`child_process`.
- Used by: Loop layer.

**Infrastructure layer:**
- Purpose: Cross-cutting concerns — config, env, i18n, proxy, telemetry, retry, hooks, version.
- Location: `src/config.ts`, `src/env.ts`, `src/i18n/*`, `src/net/proxy.ts`, `src/telemetry/*`, `src/retry.ts`, `src/hooks.ts`, `src/version.ts`, `src/tokenizer.ts`
- Contains: Config read/write, undici global dispatcher install, usage aggregation, cache diagnostics, hook spawning.
- Depends on: Node built-ins + `undici`, `eventsource-parser`.
- Used by: All upper layers.

## Data Flow

### Primary Request Path (a single turn)

1. Surface calls `loop.run(userInput, onEvent)` or iterates `loop.step()` async generator (`src/loop.ts:733`, `src/loop.ts:1257`).
2. User message appended to `AppendOnlyLog`; `UserMessageEvent` emitted (`src/core/events.ts:14`).
3. `ContextManager` estimates request tokens; if `> TURN_START_FOLD_THRESHOLD` (0.9), pre-iter fold (`src/context-manager.ts:42`).
4. `DeepSeekClient.chatStream(...)` streams SSE deltas; `ModelDeltaEvent`s emitted per `content`/`reasoning`/`tool_args` channel (`src/loop/streaming.ts`, `src/client.ts`).
5. `ToolCallRepair.normalize(...)` fixes malformed JSON; `StormBreaker` rejects repeat loops (`src/repair/index.ts`, `src/repair/storm.ts`).
6. `dispatchToolCallsChunked(...)` dispatches parallel-safe tools concurrently through `ToolRegistry.dispatch`, gated by `PauseGate` confirmations and PreToolUse hooks (`src/loop/dispatch.ts`, `src/tools.ts`).
7. Each result emits `ToolResultEvent`; oversized results shrunk via `shrinkOversizedToolResults*` (`src/loop/shrink.ts`).
8. Loop iterates until no tool calls, iteration cap (`maxIterPerTurn`, default 50) triggers `forceSummaryAfterIterLimit`, or abort.
9. Post-response: if prompt tokens `> HISTORY_FOLD_THRESHOLD` (0.75), `ContextManager` synthesizes a fold summary and rewrites the session log.

### Session Resume Flow

1. `CacheFirstLoop` constructor loads prior messages via `loadSessionMessages` (`src/memory/session.ts`).
2. `healLoadedMessagesByTokens` shrinks oversized tool output; `stampMissingReasoningForThinkingMode` repairs thinking-mode calls; `stripDroppableReasoningContent` prunes stale reasoning (`src/loop/healing.ts`, `src/loop/reasoning-retention.ts`).
3. Healed log persisted via `rewriteSession`; `SessionStats.seedCarryover(...)` restores cumulative cost/turn/cache counts (`src/loop.ts:275-313`).

**State Management:**
- **Append-only event log** (`AppendOnlyLog`) is the source of truth; `VolatileScratch` holds the current turn's in-flight content before commit.
- **ImmutablePrefix** holds frozen system+tools+fewShots; mutated only on `/new` via `rebuildSystem` callback.
- **PauseGate** singleton bridges UI confirmations to tools/loop.
- **Abort propagation:** `_turnAbort: AbortController` threaded through HTTP fetch + every tool dispatch so Esc cancels in-flight work (`src/loop.ts:194`).

## Key Abstractions

**ToolDefinition / ToolRegistry:**
- Purpose: Declarative tool spec + dispatch with `readOnly`, `parallelSafe`, `stormExempt`, `readOnlyCheck`, `skipTruncationSave` flags.
- Examples: `src/tools/filesystem.ts`, `src/tools/shell.ts`, `src/tools/web.ts`, `src/tools/plan.ts`, `src/tools/todo.ts`, `src/tools/subagent.ts`, `src/tools/memory.ts`, `src/tools/skills.ts`, `src/tools/java-source.ts`, `src/tools/code-query.ts`.
- Pattern: Each tool module exports `registerXxxTools(registry, opts)`; surfaces compose them into one `ToolRegistry`. MCP tools bridged via `bridgeMcpTools` (`src/mcp/registry.ts`).

**ImmutablePrefix:**
- Purpose: Stable, hashable chat prefix for prompt-cache hits.
- Examples: `src/memory/runtime.ts:42`.
- Pattern: Tool specs sorted locale-independently; fingerprint invalidated on mutation.

**LoopEvent:**
- Purpose: Discriminated-union event types emitted by `step()`; surfaces reduce them to UI/dashboard.
- Examples: `src/loop/types.ts`, `src/core/events.ts` (`user.message`, `model.delta`, `model.final`, `tool.preparing/intent/dispatched/denied/result`, `slash.invoked`).
- Pattern: Consumers subscribe via `loop.run(input, onEvent)` or `Eventizer` (`src/core/eventize.ts`).

**Cache Diagnostic:**
- Purpose: Track prefix hash drift so cache misses are explainable.
- Examples: `src/telemetry/cache-diagnostics.ts`; emitted by `appendCacheDiagnostic` after each turn (`src/loop.ts`).

## Entry Points

**CLI / TUI:**
- Location: `src/cli/index.ts`
- Triggers: `reasonix` / `dsnix` bin (package.json `bin` → `dist/cli/index.js`); also `npm run dev` (`tsx src/cli/index.ts`).
- Responsibilities: Guards (node version, heap limit, BEL strip), proxy install, Commander subcommands (`setup`, `code`, `chat`, `run`, `acp`, `desktop`, `stats`, `doctor`, `commit`, `sessions`, `events`, `replay`, `diff`, `mcp`, `update`, `import-sessions`, `prune-sessions`), default action launches the Ink TUI.

**Library:**
- Location: `src/index.ts`
- Triggers: `import { CacheFirstLoop, DeepSeekClient, ToolRegistry, ... } from "reasonix-legacy"`.
- Responsibilities: Re-exports the public API (client, loop, memory, tools, MCP, telemetry, transcript, hooks, version).

**Dashboard HTTP server:**
- Location: `src/server/index.ts`
- Triggers: `--dashboard` flag in TUI or explicit start.
- Responsibilities: Loopback HTTP server, per-boot CSRF token, serves dashboard SPA + routes API to `src/server/router.ts` → `src/server/api/*`.

**ACP server:**
- Location: `src/acp/server.ts`
- Triggers: `reasonix acp` subcommand (editor integrations).
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

**What happens:** Editing or rewriting already-emitted log entries corrupts fold summaries and replay diffs.
**Why it's wrong:** `AppendOnlyLog` is the source of truth; consumers (dashboard, replay, transcript writer) assume immutability.
**Do this instead:** Append a corrective event or use the explicit `rewriteSession` / `compactHistory` paths in `src/memory/session.ts` and `src/loop.ts:333`, which are the sanctioned mutation surface.

### Locale-sensitive sorting of tool specs

**What happens:** `localeCompare` reshuffles tool order by host locale → serialized prefix changes → every turn becomes a cache miss.
**Why it's wrong:** DeepSeek's prompt cache is keyed by the full tool list; churn destroys the cache.
**Do this instead:** Use `sortToolSpecs` in `src/memory/runtime.ts:30`, which compares codepoints (`<` / `>`), never `localeCompare`.

### Constructing `fetch` closures before proxy install

**What happens:** Clients capture Node's default dispatcher and ignore `HTTPS_PROXY`.
**Why it's wrong:** Corporate/proxy users silently bypass their proxy or fail to reach DeepSeek.
**Do this instead:** Call `installProxyIfConfigured` (`src/net/proxy.ts:237`) at the very top of `src/cli/index.ts` before constructing any client — see `src/cli/index.ts:54`.

## Error Handling

**Strategy:** Defensive + heal-and-continue. The loop never throws on malformed model output; it repairs and retries.

**Patterns:**
- `formatLoopError` / `errorMeta` / `is4xxError` / `is5xxError` / `isDeepSeekHost` / `probeDeepSeekReachable` classify errors and produce user-facing text (`src/loop/errors.ts`).
- `fetchWithRetry` + `loadRateLimit` in `src/retry.ts` and `src/client.ts` handle 429/5xx with exponential backoff.
- `ToolCallRepair` returns a `RepairReport`; the loop proceeds with repaired calls and logs what changed (`src/repair/index.ts`).
- Hooks return exit codes: `0` pass, `2` block on Pre*, other = warn (`src/hooks.ts`).
- Abort is non-fatal: an aborted turn yields a synthetic `[aborted by user ...]` message rather than throwing (`src/loop.ts:857-867`).

## Cross-Cutting Concerns

**Logging:** Append-only JSONL session log at `~/.reasonix/sessions/<name>.jsonl` via `AppendOnlyLog` (`src/memory/session.ts`, `src/memory/runtime.ts`); transcript writer (`src/transcript/log.ts`) mirrors events to a replayable transcript. Stderr is used for one-line operational notices (`▸ session ...: healed N entries`).

**Validation:** JSON-schema validation lives in `ToolRegistry.dispatch` (`src/tools.ts`); malformed schemas are flattened via `analyzeSchema`/`flattenSchema` (`src/repair/flatten.ts`) before being sent to DeepSeek. Per-tool fingerprint of last schema-validation failure is tracked.

**Authentication:** API key persisted by `src/config.ts` (`saveApiKey`/`loadApiKey`); supports DeepSeek, Baidu, Metaso, Perplexity, Exa, Ollama, Brave keys. Dashboard uses a 32-byte per-boot CSRF token compared with `constantTimeEquals` (`src/server/index.ts`).

**Internationalization:** `src/i18n/*` provides EN / JA / de / ru / zh-CN string tables; surfaced via `t(...)` and reloaded at runtime (`src/cli/ui/hooks/useLanguageReload.ts`).

**Telemetry:** `src/telemetry/stats.ts` (`SessionStats`, `TurnStats`), `src/telemetry/usage.ts` (usage-log aggregation), `src/telemetry/cache-diagnostics.ts` (prefix-hash drift), `src/telemetry/subagent-distillation.ts` (subagent spawn storm accounting).

---

*Architecture analysis: 2026-07-02*
