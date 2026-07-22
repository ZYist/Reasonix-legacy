<!-- refreshed: 2026-07-22 -->
# Architecture

**Analysis Date:** 2026-07-22

## System Overview

`reasonix-legacy@1.3.1` is an ESM Node.js agent framework and CLI. The root manifest exposes a library entry at `src/index.ts` and exactly one executable identity, `reasonix-legacy`, implemented by `src/cli/index.ts` and bundled to `dist/cli/index.js` by `tsup.config.ts`.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         Invocation surfaces                              │
├─────────────────┬─────────────────────┬──────────────────────────────────┤
│ Library API     │ CLI / Ink TUI       │ ACP + messaging channels         │
│ `src/index.ts`  │ `src/cli/index.ts`  │ `src/cli/commands/acp.ts`         │
│                 │ `src/cli/ui/`       │ `src/cli/headless/`               │
└────────┬────────┴──────────┬──────────┴────────────────┬─────────────────┘
         │                   │                           │
         └───────────────────┴──────────────┬────────────┘
                                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    Agent orchestration kernel                            │
│ `src/loop.ts` + `src/loop/` + `src/context-manager.ts`                   │
│ Immutable prefix, append-only history, model streaming, repair, hooks    │
└──────────────────────────┬──────────────────────────┬────────────────────┘
                           │                          │
                           ▼                          ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────┐
│ Capability dispatch                 │  │ Event and view projections    │
│ `src/tools.ts`, `src/tools/`         │  │ `src/core/eventize.ts`        │
│ `src/mcp/`, `src/code/setup.ts`      │  │ `src/core/reducers.ts`        │
└──────────────────┬───────────────────┘  │ `src/cli/ui/state/`           │
                   │                      └──────────────┬────────────────┘
                   ▼                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ External effects and durable state                                       │
│ `src/client.ts`, `src/memory/`, `src/transcript/`, `src/adapters/`,       │
│ `src/qq/`, `src/telegram/`, `src/weixin/`                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Package/API boundary | Re-export the supported library surface; add public APIs here only after implementing them in a focused module. | `src/index.ts` |
| CLI composition root | Guard runtime startup, install proxy behavior, define the command tree, and lazy-load command handlers. | `src/cli/index.ts` |
| Code-mode composition | Resolve the workspace, build rooted capabilities, create a project-specific system prompt, then delegate rendering to chat mode. | `src/cli/commands/code.tsx` |
| Interactive composition | Initialize setup/session selection, MCP runtime, terminal behavior, and the React/Ink application. | `src/cli/commands/chat.tsx` |
| Agent loop | Own model/tool iteration, message history, hooks, repair, budgets, cancellation, context pressure, and usage events. | `src/loop.ts` |
| Context policy | Decide and perform semantic history folds while retaining active constraints and tool pairing. | `src/context-manager.ts` |
| Capability registry | Normalize schemas, enforce plan mode/interceptors/rate limits, dispatch tools, and bound tool results. | `src/tools.ts` |
| Code toolset factory | Register workspace-rooted filesystem, shell, memory, query, planning, skill, subagent, web, and optional semantic tools. | `src/code/setup.ts` |
| Model adapter | Implement DeepSeek-compatible chat, streaming, model listing, balance lookup, and HTTP error handling. | `src/client.ts` |
| Event kernel | Define typed append-only events and pure projection view contracts. | `src/core/events.ts` |
| Event adapter | Translate raw `LoopEvent` values into typed kernel events for replay and external surfaces. | `src/core/eventize.ts` |
| Headless host | Assemble a transport-neutral loop for standalone QQ, Telegram, and Weixin processes. | `src/cli/headless/host.ts` |
| ACP adapter | Manage ACP sessions and translate stdio JSON-RPC requests and loop events. | `src/cli/commands/acp.ts` |
| TUI runtime | Render React components through the repository-owned Ink/Yoga terminal renderer. | `packages/ink/src/index.ts` |
| Shared utilities | Supply pure cross-surface helpers such as compaction markers, tool kinds, permission prompts, and path display. | `packages/core-utils/src/index.ts` |

## Pattern Overview

**Overall:** Modular monolith with surface-specific composition roots, a shared agent-loop kernel, registry-based capabilities, and event-driven projections.

**Key Characteristics:**
- Keep direction inward: `src/cli/`, `src/acp/`, and channel modules assemble or adapt the kernel; `src/loop.ts` does not import UI or channel transports.
- Keep model-visible capabilities behind `ToolRegistry`; built-ins register in `src/tools/`, MCP tools bridge through `src/mcp/registry.ts`, and code mode composes both in `src/code/setup.ts`.
- Keep the cacheable request prefix immutable through `ImmutablePrefix`, while mutable conversation state lives in `AppendOnlyLog` and ephemeral per-iteration state lives in `VolatileScratch` in `src/memory/runtime.ts`.
- Use raw `LoopEvent` as the internal streaming protocol in `src/loop/types.ts`, then adapt it through `Eventizer` in `src/core/eventize.ts` or `TurnTranslator` in `src/cli/ui/state/TurnTranslator.ts`.
- Keep workspace packages limited to the live `packages/core-utils/` and `packages/ink/` workspaces declared by `package.json`; both are bundled into root outputs through `tsup.config.ts`.

## Layers

**Surface and Composition Layer:**
- Purpose: Convert command-line, terminal, ACP, or messaging input into configured agent turns and surface output back to the caller.
- Location: `src/cli/index.ts`, `src/cli/commands/`, `src/cli/ui/`, `src/cli/headless/`, `src/acp/`, `src/qq/`, `src/telegram/`, `src/weixin/`.
- Contains: Commander registration, React/Ink UI, JSON-RPC server, channel protocol clients, permission bridges, and process lifecycle handlers.
- Depends on: The orchestration kernel, configuration, capability factories, persistence, and transport adapters in `src/loop.ts`, `src/config.ts`, `src/code/setup.ts`, and `src/memory/`.
- Used by: The sole public executable declared in `package.json`; the `desktop` token in `src/cli/index.ts` is only a failing compatibility stub and is not a runtime surface.

**Orchestration Layer:**
- Purpose: Execute a user turn as a streaming model/tool loop with deterministic cache shape and bounded failure behavior.
- Location: `src/loop.ts`, `src/loop/`, `src/context-manager.ts`, `src/repair/`, `src/memory/runtime.ts`.
- Contains: Request construction, model escalation/thinking behavior, malformed tool-call repair, tool scheduling, history folding, cancellation, and usage accounting.
- Depends on: `DeepSeekClient` in `src/client.ts`, `ToolRegistry` in `src/tools.ts`, hooks in `src/hooks.ts`, and core pause/event primitives in `src/core/`.
- Used by: TUI `src/cli/ui/App.tsx`, one-shot execution `src/cli/commands/run.ts`, ACP `src/cli/commands/acp.ts`, headless channels `src/cli/headless/host.ts`, and library consumers through `src/index.ts`.

**Capability Layer:**
- Purpose: Present model-callable schemas and safely execute local, remote, or nested-agent capabilities.
- Location: `src/tools.ts`, `src/tools/`, `src/mcp/`, `src/code/setup.ts`, `src/code-query/`, `src/java/`, `src/index/semantic/`.
- Contains: Built-in tool definitions, dispatch gates, filesystem and shell execution, jobs, memory, planning, skills, subagents, web access, MCP transport/bridging, code queries, and optional semantic search.
- Depends on: Workspace configuration in `src/config.ts`, pause policy in `src/core/pause-gate.ts`, and file/process/network primitives.
- Used by: `CacheFirstLoop` through the `ToolRegistry` contract in `src/loop.ts`.

**State and Projection Layer:**
- Purpose: Retain model history and project/user state, persist sessions/transcripts/events, and derive UI/protocol-specific views.
- Location: `src/memory/`, `src/transcript/`, `src/core/events.ts`, `src/core/reducers.ts`, `src/adapters/`, `src/cli/ui/state/`.
- Contains: JSONL sessions, explicit transcripts, typed event sidecars, deterministic reducers, TUI card state, and memory-stack assembly.
- Depends on: Atomic file helpers in `src/core/atomic-write.ts` and shared message types in `src/types.ts`.
- Used by: The loop, TUI, replay/diff commands, ACP, and headless channel adapters.

**Infrastructure and Shared Runtime Layer:**
- Purpose: Supply the public model client, terminal renderer, common pure helpers, configuration, localization, retries, and proxy installation.
- Location: `src/client.ts`, `src/config.ts`, `src/net/`, `src/i18n/`, `src/retry.ts`, `packages/core-utils/`, `packages/ink/`.
- Contains: DeepSeek-compatible HTTP/SSE access, runtime configuration, ESM-compatible terminal rendering, and cross-module primitives.
- Depends on: Node 22 APIs and root dependencies declared in `package.json`.
- Used by: All higher layers; build aliases for `ink` are defined in `tsconfig.json` and `vitest.config.ts`.

## Data Flow

### Primary Interactive Code Path

1. The sole CLI entry applies Node/version/heap/terminal guards, resolves bare invocation to setup or code mode, and lazy-loads the selected command (`src/cli/index.ts:1`, `src/cli/index.ts:95`).
2. Code mode resolves the workspace, creates a rooted `ToolRegistry` through `buildCodeToolset`, builds `codeSystemPrompt`, and passes both into chat mode (`src/cli/commands/code.tsx:48`, `src/code/setup.ts:62`).
3. Chat mode renders the Ink root and passes session, tools, MCP runtime, and code-mode callbacks into `App` (`src/cli/commands/chat.tsx:133`, `src/cli/commands/chat.tsx:219`).
4. `App` constructs one `DeepSeekClient`, immutable prefix, and `CacheFirstLoop`; later hook/root changes mutate controlled loop inputs without replacing the append-only log (`src/cli/ui/App.tsx:917`, `src/cli/ui/App.tsx:925`).
5. `CacheFirstLoop.step` streams model output, repairs tool calls, runs hooks, dispatches capabilities, persists results, folds history under pressure, and repeats until a final response (`src/loop.ts:488`, `src/loop.ts:1174`, `src/loop.ts:1227`).
6. TUI handlers translate loop events into card/state events and render them through the local Ink package (`src/cli/ui/hooks/handle-stream-events.ts`, `src/cli/ui/state/TurnTranslator.ts`, `packages/ink/src/index.ts`).

### One-Shot Run Path

1. `run` optionally connects MCP servers and registers their tools before building the immutable prefix (`src/cli/commands/run.ts:72`, `src/cli/commands/run.ts:77`).
2. It constructs `DeepSeekClient`, `ImmutablePrefix`, and `CacheFirstLoop`, then iterates `loop.step(task)` without React/Ink (`src/cli/commands/run.ts:143`, `src/cli/commands/run.ts:177`).
3. It writes deltas/tools to stdio, appends usage, optionally records a transcript, and closes MCP clients (`src/cli/commands/run.ts:177`, `src/cli/commands/run.ts:209`).

### ACP Path

1. `AcpServer` parses one JSON-RPC object per stdin line and dispatches registered request or notification handlers (`src/acp/server.ts`).
2. `acpCommand` creates per-client sessions; each session owns a rooted toolset, MCP clients, loop, eventizer, and abort controller (`src/cli/commands/acp.ts:67`, `src/cli/commands/acp.ts:157`).
3. Raw loop events pass through `Eventizer`; `dispatchKernelEvent` maps model/tool/error events into ACP `session/update` notifications on stdout (`src/core/eventize.ts`, `src/acp/dispatch.ts`).
4. Permission pauses are correlated to the active ACP session with `AsyncLocalStorage` and resolved through ACP requests (`src/cli/commands/acp.ts:213`, `src/acp/gates.ts`).

### Headless Channel Path

1. QQ, Telegram, and Weixin commands boot one shared transport-neutral host, while protocol/access behavior remains in `src/qq/`, `src/telegram/`, and `src/weixin/` (`src/cli/headless/host.ts:204`).
2. `HeadlessHost.create` builds the same code toolset, prompt, client, immutable prefix, loop, and eventizer used by other code-capable surfaces (`src/cli/headless/host.ts:110`).
3. `runHeadlessTurn` binds a session with `AsyncLocalStorage`, iterates `loop.step`, eventizes output, captures final text, and classifies abort/error outcomes (`src/cli/headless/turn-driver.ts`).
4. Channel commands send final text and bridge pause requests back through per-session replies; shared permission plumbing lives in `src/cli/headless/gate-bridges.ts`.

**State Management:**
- Treat `ImmutablePrefix`, `AppendOnlyLog`, and `VolatileScratch` in `src/memory/runtime.ts` as separate cacheable, durable-conversation, and ephemeral state domains.
- Keep turn/session mutation inside `CacheFirstLoop` in `src/loop.ts`; context folds are delegated to `ContextManager` in `src/context-manager.ts`.
- Treat typed kernel events in `src/core/events.ts` as append-only except for the explicit `session.compacted` replacement projection; replay is pure in `src/core/reducers.ts`.
- Keep TUI rendering state in `src/cli/ui/state/`; do not make UI cards the model-history source of truth.

## Key Abstractions

**CacheFirstLoop:**
- Purpose: Central agent execution state machine shared by every maintained agent surface.
- Examples: `src/loop.ts`, `src/loop/dispatch.ts`, `src/loop/streaming.ts`, `src/loop/healing.ts`.
- Pattern: Stateful orchestrator around immutable prefix, append-only history, streaming model adapter, and registry dispatch.

**ToolRegistry:**
- Purpose: Single enforcement point for model-visible schemas and capability execution.
- Examples: `src/tools.ts`, `src/code/setup.ts`, `src/mcp/registry.ts`.
- Pattern: Registry/command pattern with interceptors, schema normalization, plan-mode policy, rate limits, cancellation, and result bounding.

**Eventizer and Reducers:**
- Purpose: Convert operational loop events into stable typed records and deterministic projections.
- Examples: `src/core/eventize.ts`, `src/core/events.ts`, `src/core/reducers.ts`, `src/adapters/event-sink-jsonl.ts`.
- Pattern: Event log plus pure reducer projections; `tests/architecture-invariants.test.ts` protects determinism and append-only behavior.

**PauseGate:**
- Purpose: Decouple a tool needing confirmation from the surface that asks and resolves the question.
- Examples: `src/core/pause-gate.ts`, `src/acp/gates.ts`, `src/cli/headless/gate-bridges.ts`, `src/cli/ui/ShellConfirm.tsx`.
- Pattern: Process-level asynchronous gate with surface adapters and policy-based auto-resolution.

**Ports:**
- Purpose: Declare narrow contracts for model, tool, memory, checkpoint, hook, and event boundaries.
- Examples: `src/ports/model-client.ts`, `src/ports/tool-host.ts`, `src/ports/memory-store.ts`, `src/ports/checkpoint-store.ts`, `src/ports/hook-runner.ts`, `src/ports/event-sink.ts`.
- Pattern: Hexagonal seams; the event port has live JSONL adapters in `src/adapters/`, while the other port interfaces are boundary contracts rather than the current loop wiring.

## Entry Points

**Published library:**
- Location: `src/index.ts` -> `dist/index.js` and `dist/index.d.ts` via `tsup.config.ts`.
- Triggers: ESM import of the root package export declared in `package.json`.
- Responsibilities: Expose the supported client, loop, tool, memory, transcript, MCP, repair, configuration, and utility APIs.

**Published CLI:**
- Location: `src/cli/index.ts` -> `dist/cli/index.js` via `tsup.config.ts`.
- Triggers: The sole `reasonix-legacy` bin mapping in `package.json`.
- Responsibilities: Guard startup and route setup, code/chat/run, ACP, channels, diagnostics, session/transcript, MCP, and index commands.

**Programmatic examples:**
- Location: `examples/basic-chat.ts`, `examples/tool-use.ts`, `examples/replay-and-diff.ts`, `examples/mcp-server-demo.ts`.
- Triggers: Developer execution with TypeScript tooling.
- Responsibilities: Demonstrate supported library-level construction without defining production entry points.

## Architectural Constraints

- **Runtime/module system:** Use Node 22+ ESM, `.js` suffixes in TypeScript relative imports, ES2022 output semantics, and bundler module resolution as configured by `package.json` and `tsconfig.json`.
- **Threading:** The main orchestration is asynchronous on the Node event loop; only explicitly `parallelSafe` tools may run concurrently through `src/loop/dispatch.ts`. Regex isolation uses a worker thread in `src/tools/fs/regex-runner.ts`; shell jobs and stdio MCP use child processes in `src/tools/jobs.ts` and `src/mcp/stdio.ts`.
- **Global state:** The confirmation singleton is `pauseGate` in `src/core/pause-gate.ts`; headless request correlation is `headlessContext` in `src/cli/headless/turn-driver.ts`. Keep session-specific loop/tool/job state instance-owned in `src/loop.ts` and `src/code/setup.ts`.
- **Prefix stability:** Register all built-in and MCP tools before constructing `ImmutablePrefix`; `src/cli/commands/run.ts` and `src/cli/commands/acp.ts` explicitly preserve this ordering.
- **Surface isolation:** Keep `src/cli/headless/host.ts` free of React, Ink, ACP, and channel transport imports. Put protocol-specific behavior in `src/qq/`, `src/telegram/`, `src/weixin/`, or `src/acp/`.
- **Workspace authority:** Add code only within the root package, `packages/core-utils/`, or `packages/ink/` unless `package.json` is deliberately expanded; these are the only live workspace members under `packages/`.
- **Circular imports:** No circular-import checker is configured in `biome.json`, `tsconfig.json`, or `.github/workflows/ci.yml`; preserve the inward dependency direction above and avoid importing CLI/UI modules from the loop, tools registry, memory runtime, or core event kernel.

## Anti-Patterns

### Reconstructing the Loop During UI Updates

**What happens:** Recreating `CacheFirstLoop` when hooks or the workspace root changes would replace its append-only log and in-flight state; `src/cli/ui/App.tsx` instead guards construction with `loopRef` and updates controlled fields.
**Why it's wrong:** Session history, cache shape, and active tool state are instance-owned in `src/loop.ts`.
**Do this instead:** Preserve one loop per active session and use the explicit root/hook reconfiguration callbacks in `src/cli/commands/code.tsx` and `src/cli/ui/App.tsx`.

### Mutating Capabilities After Prefix Construction

**What happens:** Adding MCP or built-in schemas after `ImmutablePrefix` creation makes model-visible tools diverge from the cached prefix fingerprint.
**Why it's wrong:** Tool schemas participate in prefix hashing in `src/memory/runtime.ts` and are consumed by request construction in `src/loop.ts`.
**Do this instead:** Bridge/register tools first, then build the prefix, following `src/cli/commands/run.ts:77` and `src/cli/commands/acp.ts:166`.

### Bypassing ToolRegistry for Model Calls

**What happens:** Calling a capability implementation directly skips plan-mode enforcement, interceptors, abort gates, rate limits, schema repair, read-before-edit tracking, and truncation handling in `src/tools.ts`.
**Why it's wrong:** The loop assumes all model-originated tool execution passes through `ToolRegistry.dispatch` in `src/loop.ts:522`.
**Do this instead:** Register a `ToolDefinition` under `src/tools/` and compose it through `src/code/setup.ts` or `src/mcp/registry.ts`.

## Error Handling

**Strategy:** Classify errors near infrastructure boundaries, return structured recoverable tool failures to the model, emit typed operational errors to surfaces, and terminate the top-level CLI on uncaught command failures.

**Patterns:**
- Tool validation and policy failures become JSON/string results rather than thrown process failures in `src/tools.ts`; this allows `CacheFirstLoop` to self-correct within the turn.
- Model/network errors are normalized by `DeepSeekClient` in `src/client.ts` and classified for loop/surface metadata in `src/loop/errors.ts`.
- `Eventizer` maps `LoopEvent` failures into typed `error` events in `src/core/eventize.ts`; ACP and headless surfaces translate those through `src/acp/dispatch.ts` and `src/cli/headless/turn-driver.ts`.
- Root command rejection is fatal and explicit through the `program.parseAsync(...).catch(...)` boundary in `src/cli/index.ts`.
- Best-effort persistence paths catch local I/O failures where in-memory progress remains valid, such as history rewrite in `src/context-manager.ts` and terminal event cleanup in `src/cli/ui/App.tsx`.

## Cross-Cutting Concerns

**Logging:** Route interactive state through loop/kernel events and optional JSONL sinks in `src/core/eventize.ts`, `src/adapters/event-sink-jsonl.ts`, and `src/transcript/log.ts`; use stderr for CLI lifecycle/diagnostic messages in `src/cli/commands/`.

**Validation:** Validate configuration in `src/config.ts`, tool required arguments and policies in `src/tools.ts`, MCP specifications/transports in `src/mcp/spec.ts` and `src/mcp/preflight.ts`, and ACP protocol shapes in `src/acp/protocol.ts` and `src/acp/server.ts`.

**Authentication:** Model endpoint configuration is loaded through `src/config.ts`; messaging access decisions are isolated in `src/qq/access.ts`, `src/telegram/access.ts`, and `src/weixin/access.ts`. Never move sensitive values into events; redaction belongs in `src/core/event-redaction.ts`.

**Internationalization:** User-facing terminal and channel text should resolve through `src/i18n/index.ts` with dictionaries in `src/i18n/EN.ts` and `src/i18n/zh-CN.ts`, rather than being embedded in core logic.

---

*Architecture analysis: 2026-07-22*
