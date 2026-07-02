# Codebase Structure

**Analysis Date:** 2026-07-02

## Directory Layout

```
reasonix-legacy/
├── src/                       # TypeScript source — the agent itself
│   ├── cli/                   # CLI entry + Ink TUI (React) + subcommands
│   │   ├── commands/          # Commander subcommand handlers (chat, code, run, acp, ...)
│   │   ├── ui/                # Ink TUI: App.tsx, cards, primitives, hooks, state, theme, slash
│   │   │   ├── cards/         # One card component per event type (ToolCard, DiffCard, ...)
│   │   │   ├── primitives/    # Card, CardHeader, Pill, Pulse, Countdown
│   │   │   ├── hooks/         # React hooks (useEventSubscriber, useScrollback, ...)
│   │   │   ├── state/         # TUI state store + reducer + hydrate (events → cards)
│   │   │   ├── slash/         # Slash-command parser + handlers
│   │   │   ├── theme/         # Color themes
│   │   │   ├── layout/        # Layout primitives
│   │   │   ├── dashboard/     # Loop-to-dashboard broadcast bridge
│   │   │   └── effects/       # Side-effect orchestrators
│   │   └── edit/              # Edit-confirm flow wiring
│   ├── loop.ts                # CacheFirstLoop — the agent loop (core)
│   ├── loop/                  # Loop helpers: dispatch, healing, streaming, shrink, thinking, errors
│   ├── client.ts              # DeepSeekClient + Usage (HTTP/SSE)
│   ├── context-manager.ts     # Token budget + history fold logic
│   ├── tools.ts               # ToolRegistry + dispatch
│   ├── tools/                 # Tool implementations
│   │   ├── fs/                # Filesystem tooling (edit, glob, outline, search, regex-runner)
│   │   ├── shell/             # Shell execution (exec, parse)
│   │   ├── filesystem.ts      # registerFilesystemTools
│   │   ├── shell.ts           # registerShellTools (run_command, jobs)
│   │   ├── web.ts             # registerWebTools (web_search, web_fetch)
│   │   ├── plan*.ts           # Plan-mode tool + types + errors + core
│   │   ├── todo.ts            # Todo tool
│   │   ├── choice.ts          # Choice/confirmation tool
│   │   ├── memory.ts          # Memory read/write tools
│   │   ├── subagent.ts        # Subagent spawn tool
│   │   ├── skills.ts          # Built-in skill subagent tools
│   │   ├── scaffold.ts        # Project scaffolding tool
│   │   ├── java-source.ts     # Java source tool
│   │   ├── code-query.ts      # Code-query tool (delegates to src/code-query/)
│   │   ├── rate-limit.ts      # ToolRateLimiter
│   │   ├── read-tracker.ts    # Tracks read files for edit-file gating
│   │   ├── truncated-result-saver.ts
│   │   ├── shell-chain.ts     # Shell operator parsing
│   │   └── jobs.ts            # JobRegistry for background processes
│   ├── mcp/                   # Model Context Protocol client + transports
│   │   ├── client.ts          # McpClient
│   │   ├── registry.ts        # bridgeMcpTools, truncateForModel*
│   │   ├── stdio.ts / sse.ts / streamable-http.ts   # Transports
│   │   ├── spec.ts / transport-from-spec.ts         # Spec parsing
│   │   ├── catalog.ts / dot-mcp-json.ts             # Catalog + .mcp.json discovery
│   │   ├── marketplace-overlay/                     # Marketplace layer
│   │   ├── drift.ts / latency.ts / preflight.ts / reconnect.ts / inspect.ts / summary.ts
│   │   └── types.ts           # MCP JSON-RPC types
│   ├── repair/                # Tool-call repair (the differentiator)
│   │   ├── index.ts           # ToolCallRepair
│   │   ├── flatten.ts         # Schema flattening
│   │   ├── scavenge.ts        # Dangling tool_call scavenging
│   │   ├── storm.ts           # StormBreaker — repeat-loop detection
│   │   └── truncation.ts      # Truncated-JSON recovery
│   ├── memory/                # Session + memory storage
│   │   ├── runtime.ts         # ImmutablePrefix, AppendOnlyLog, VolatileScratch
│   │   ├── session.ts         # Session JSONL load/append/rewrite
│   │   ├── user.ts            # User memory (applyMemoryStack, MemoryStore)
│   │   ├── project.ts         # Project memory (REASONIX.md)
│   │   └── subdir.ts
│   ├── core/                  # Event-log kernel + primitives
│   │   ├── events.ts          # LoopEvent / typed event definitions
│   │   ├── reducers.ts        # Pure projections over events
│   │   ├── eventize.ts        # Eventizer — pub/sub
│   │   ├── event-redaction.ts
│   │   ├── pause-gate.ts      # PauseGate singleton
│   │   ├── pause-policy.ts
│   │   ├── inflight.ts        # InflightSet
│   │   ├── lru.ts             # LruCache + TtlLruCache
│   │   ├── atomic-write.ts    # Atomic file writes
│   │   └── lazy.ts
│   ├── server/                # Dashboard HTTP server
│   │   ├── index.ts           # createServer + token + loopback guard
│   │   ├── router.ts          # handleApi dispatcher
│   │   ├── context.ts         # DashboardContext
│   │   ├── assets.ts          # SPA + static asset serving
│   │   └── api/               # One handler per endpoint (loop, mcp, sessions, tools, ...)
│   ├── acp/                   # ACP (NDJSON JSON-RPC 2.0) server
│   │   ├── server.ts / dispatch.ts / gates.ts / protocol.ts
│   ├── code/                  # `reasonix code` sandboxed editing surface
│   │   ├── lifecycle.ts / lifecycle-policy.ts / auto-git-rollback.ts
│   │   ├── checkpoints.ts / pending-edits.ts / diff-preview.ts
│   │   ├── edit-blocks.ts / file-encoding.ts / plan-store.ts / prompt.ts / setup.ts
│   ├── code-query/            # Tree-sitter code search/symbols
│   │   ├── find-in-code.ts / grammar-map.ts / parser.ts / symbols.ts
│   ├── index/                 # Semantic index
│   │   ├── config.ts
│   │   └── semantic/          # builder, chunker, embedding, store, tool, ollama-launcher, preflight, i18n
│   ├── adapters/              # JSONL event source/sink adapters
│   ├── ports/                 # Port interfaces (event-sink, hook-runner, memory-store, model-client, tool-host, checkpoint-store)
│   ├── desktop/               # Desktop ingress: QQ, Telegram, Weixin routing + login-shell-path
│   ├── qq/ / telegram/ / weixin/   # Chat-network integrations
│   ├── i18n/                  # Locale string tables (EN, JA, de, ru, zh-CN)
│   ├── net/                   # Proxy (undici global dispatcher)
│   ├── telemetry/             # stats, usage, cache-diagnostics, subagent-distillation
│   ├── transcript/            # Transcript log/replay/diff
│   ├── java/                  # Java-specific helpers
│   ├── config.ts              # All persisted config + key/baseURL loading
│   ├── env.ts                 # loadDotenv + env helpers
│   ├── hooks.ts               # PreToolUse / PostToolUse / UserPromptSubmit / Stop hooks
│   ├── retry.ts               # fetchWithRetry
│   ├── tokenizer.ts           # DeepSeek tokenizer (data/deepseek-tokenizer.json.gz)
│   ├── types.ts               # Shared types (ChatMessage, ToolCall, ToolSpec, JSONSchema)
│   ├── version.ts             # VERSION + update detection
│   ├── skills.ts              # SkillStore
│   ├── workspaces.ts          # Workspace resolution
│   ├── session-import.ts / session-title.ts / slash-usage.ts
│   ├── prompt-fragments.ts / frontmatter.ts / gitignore.ts
│   ├── at-mentions.ts / at-mentions-url.ts
│   ├── tools.ts               # ToolRegistry
│   ├── client.ts              # DeepSeekClient
│   ├── loop.ts                # CacheFirstLoop
│   ├── context-manager.ts     # ContextManager
│   └── index.ts               # Library entry — re-exports public API
├── packages/                  # npm workspaces
│   ├── core-utils/            # @reasonix/core-utils — shared helpers (compaction, derive-prefix, tool-kind, permission-types, approval-prompt, tildeify)
│   ├── dsnix/                 # `dsnix` alias bin forwarding to reasonix
│   └── ink/                   # Private Ink fork (React reconciler + Yoga) for the TUI
├── dashboard/                 # Dashboard SPA (Vite + TS), built into dashboard/dist
├── desktop/                   # Desktop runtime shell
├── tests/                     # Vitest test suite
├── tools/                     # Bench / probe / scan scripts (.mjs/.mts)
├── scripts/                   # Build/postinstall/perf/probe scripts
│   └── perf/
├── benchmarks/                # Benchmark harnesses
├── data/                      # Bundled data (deepseek-tokenizer.json.gz)
├── docs/                      # Documentation
├── examples/                  # Example projects
├── package.json               # Root manifest — reasonix-legacy, workspaces, scripts
├── tsconfig.json              # Root TS config
├── tsup.config.ts             # Build config (CLI + library bundles → dist/)
├── vitest.config.ts           # Test config
├── biome.json                 # Lint + format config
├── stryker.config.mjs         # Mutation testing config
└── .env.example               # Documented env vars (do not read .env)
```

## Directory Purposes

**`src/loop.ts` + `src/loop/`:**
- Purpose: The agent loop — the heart of the project.
- Contains: `CacheFirstLoop` class, dispatch chunking, healing, streaming, thinking-mode handling, shrink/force-summary, error classification.
- Key files: `src/loop.ts` (1272 lines), `src/loop/dispatch.ts`, `src/loop/streaming.ts`, `src/loop/healing.ts`, `src/loop/shrink.ts`, `src/loop/errors.ts`.

**`src/tools/` + `src/tools.ts`:**
- Purpose: All internal tool implementations + the registry.
- Contains: One `registerXxxTools(registry, opts)` per domain (filesystem, shell, web, plan, todo, memory, choice, subagent, skills, java-source, code-query, scaffold). `ToolRegistry` (`src/tools.ts`) handles dispatch, schema flatten, rate limit, interceptors, augmenters, plan-mode gating.
- Key files: `src/tools.ts` (532 lines), `src/tools/filesystem.ts`, `src/tools/shell.ts`.

**`src/mcp/`:**
- Purpose: MCP (Model Context Protocol) client — bridges external MCP servers as tool providers.
- Contains: `McpClient`, three transports (stdio, SSE, streamable-HTTP), spec parsing, catalog, `.mcp.json` discovery, marketplace overlay, drift/latency/preflight/reconnect diagnostics, inspect, summary.
- Key files: `src/mcp/client.ts`, `src/mcp/registry.ts` (`bridgeMcpTools`, `truncateForModel*`).

**`src/repair/`:**
- Purpose: Repair malformed model output so the loop never dies on bad JSON.
- Contains: `ToolCallRepair`, schema flattening, scavenging, storm detection, truncation recovery.
- Key files: `src/repair/index.ts`, `src/repair/flatten.ts`, `src/repair/storm.ts`, `src/repair/truncation.ts`.

**`src/memory/`:**
- Purpose: Persistent event log + memory stack.
- Contains: `ImmutablePrefix` (frozen chat prefix), `AppendOnlyLog`/`VolatileScratch` (event log), `session.ts` (JSONL session I/O), `user.ts` (user memory), `project.ts` (project memory / REASONIX.md).
- Key files: `src/memory/runtime.ts`, `src/memory/session.ts`.

**`src/core/`:**
- Purpose: Event-log kernel + shared primitives.
- Contains: Typed `LoopEvent` definitions, pure `reducers`, `Eventizer` pub/sub, `PauseGate` singleton, `InflightSet`, `LruCache`/`TtlLruCache`, `atomic-write`.
- Key files: `src/core/events.ts`, `src/core/reducers.ts`, `src/core/eventize.ts`, `src/core/pause-gate.ts`.

**`src/cli/`:**
- Purpose: CLI entry + Ink TUI.
- Contains: Commander entry (`index.ts`), `commands/` subcommand handlers, `ui/` Ink React app.
- Key files: `src/cli/index.ts` (716 lines), `src/cli/ui/App.tsx`, `src/cli/ui/state/store.ts`.

**`src/server/`:**
- Purpose: Dashboard HTTP server (loopback, per-boot CSRF token).
- Contains: HTTP server, router, asset serving, `api/` with one handler per endpoint.
- Key files: `src/server/index.ts`, `src/server/router.ts`, `src/server/api/loop.ts`.

**`src/acp/`:**
- Purpose: ACP (Agent Client Protocol) NDJSON JSON-RPC 2.0 server for editor integration.
- Key files: `src/acp/server.ts`, `src/acp/dispatch.ts`, `src/acp/gates.ts`.

## Key File Locations

**Entry Points:**
- `src/cli/index.ts`: CLI/TUI entry — bin target (`dist/cli/index.js`); Commander subcommands + default Ink TUI launch.
- `src/index.ts`: Library entry — re-exports `CacheFirstLoop`, `DeepSeekClient`, `ToolRegistry`, memory/MCP/telemetry APIs.
- `src/acp/server.ts`: ACP server entry (via `reasonix acp`).
- `src/server/index.ts`: Dashboard HTTP server entry.
- `packages/dsnix/bin.cjs`: `dsnix` alias bin — forwards to `reasonix`.

**Configuration:**
- `src/config.ts` (1870 lines): All persisted config — API keys, base URLs, hooks, MCP catalog, rate limits, dashboard token, proxy.
- `src/env.ts`: `loadDotenv` + env helpers.
- `tsconfig.json` / `tsup.config.ts` / `vitest.config.ts` / `biome.json` / `stryker.config.mjs`: Build/test/lint config.
- `.env.example`: Documented env vars (never read `.env`).

**Core Logic:**
- `src/loop.ts`: `CacheFirstLoop` — agent loop.
- `src/client.ts`: `DeepSeekClient` + `Usage`.
- `src/context-manager.ts`: `ContextManager` — token budget + fold.
- `src/tools.ts`: `ToolRegistry`.
- `src/repair/index.ts`: `ToolCallRepair`.
- `src/memory/runtime.ts`: `ImmutablePrefix`, `AppendOnlyLog`, `VolatileScratch`.

**Testing:**
- `tests/`: Vitest test suite (run via `npm test`).
- `tools/`: Standalone bench/probe/scan scripts (`.mjs`/`.mts`).
- `scripts/probe-*.mts`, `scripts/e2e-*.mts`: Ad-hoc probes and e2e harnesses.

## Naming Conventions

**Files:**
- `kebab-case.ts` for modules: `context-manager.ts`, `read-tracker.ts`, `cache-diagnostics.ts`.
- `kebab-case.tsx` for React components: `App.tsx`, `ToolCard.tsx`, `LiveActivityArea.tsx`; PascalCase component filenames also common (`App.tsx`, `Setup.tsx`).
- `index.ts` per directory as the public surface (e.g., `src/i18n/index.ts`, `src/repair/index.ts`).

**Directories:**
- `kebab-case` for multi-word: `code-query/`, `cli/commands/`, `ui/primitives/`.
- Singular noun for subsystems: `loop/`, `memory/`, `repair/`, `telemetry/`, `transcript/`.

**Exports:**
- PascalCase for classes/types/interfaces: `CacheFirstLoop`, `ToolRegistry`, `LoopEvent`, `ImmutablePrefix`.
- camelCase for functions/variables: `dispatchToolCallsChunked`, `healLoadedMessagesByTokens`.
- UPPER_SNAKE_CASE for constants: `TURN_START_FOLD_THRESHOLD`, `MID_TURN_STEER_WRAPPER`, `DEFAULT_MAX_ITER_PER_TURN`.
- One `registerXxxTools(registry, opts)` per tool module.

## Where to Add New Code

**New internal tool:**
- Create `src/tools/<name>.ts` exporting `register<Name>Tools(registry: ToolRegistry, opts?): ToolRegistry`.
- Define a `ToolDefinition` with `name`, `parameters` (JSONSchema), `fn`, and flags (`readOnly`, `parallelSafe`, `stormExempt`, `readOnlyCheck`, `skipTruncationSave`).
- Call the registrar from the surface that builds the registry (e.g., `src/cli/commands/chat.tsx`, `src/cli/commands/code.tsx`).
- Export the registrar from `src/index.ts` for library users.

**New CLI subcommand:**
- Add `src/cli/commands/<name>.ts(x)` implementing the command body.
- Register it in `src/cli/index.ts` via `program.command("<name>")...action(...)`.
- Add i18n strings in `src/i18n/EN.ts` and other locale tables.

**New MCP transport:**
- Add `src/mcp/<transport>.ts` implementing the `McpTransport` interface (see `src/mcp/types.ts`).
- Wire it in `transport-from-spec.ts` and `spec.ts` so `parseMcpSpec` recognizes the new `type`.

**New event type:**
- Add the interface to `src/core/events.ts` (extend `EventBase` with a literal `type`).
- Handle it in `src/core/reducers.ts` and `src/cli/ui/state/cards.ts` (or appropriate reducer) so the TUI renders it.

**New dashboard API endpoint:**
- Add `src/server/api/<name>.ts` exporting `handle<Name>(...)` returning `ApiResult`.
- Register the route in `src/server/router.ts` (`handleApi` switch on `head`).
- Add a dashboard SPA client call in `dashboard/src/`.

**New i18n locale:**
- Add `src/i18n/<locale>.ts` exporting the string table (mirror `EN.ts`).
- Register it in `src/i18n/index.ts`.

**New shared utility (cross-surface):**
- Add to `packages/core-utils/src/` and re-export through `packages/core-utils/src/index.ts` or a named subpath in its `package.json` `exports`.

**New test:**
- Co-locate unit tests under `tests/` (Vitest). Run via `npm test`; coverage via `npm run test:coverage`; mutation via `npm run test:mutation`.

**New benchmark / probe:**
- Benchmarks: `benchmarks/`. Ad-hoc probes: `scripts/probe-*.mts` or `tools/*`.

## Special Directories

**`dist/`:**
- Purpose: Build output (tsup) — CLI bundle + library bundle + dashboard vendor CSS + tree-sitter grammars.
- Generated: Yes (by `npm run build`).
- Committed: No.

**`data/`:**
- Purpose: Bundled data assets shipped with the package — currently `deepseek-tokenizer.json.gz` used by `src/tokenizer.ts`.
- Generated: Yes (by `scripts/prepare-tokenizer.ts`).
- Committed: Yes (declared in package.json `files`).

**`dashboard/dist/`:**
- Purpose: Built dashboard SPA, served by `src/server/assets.ts`.
- Generated: Yes (by `npm run build:dashboard`).
- Committed: Yes (declared in package.json `files`).

**`packages/`:**
- Purpose: npm workspaces — `@reasonix/core-utils` (shared helpers), `dsnix` (alias bin), `ink` (private Ink fork).
- Generated: No.
- Committed: Yes.

**`patches/`:**
- Purpose: `patch-package` patches for dependencies (declared in package.json `files`).
- Committed: Yes.

**`.planning/`:**
- Purpose: GSD workflow artifacts (PROJECT.md, ROADMAP.md, codebase maps, etc.).
- Generated: By GSD commands.
- Committed: Yes (project-specific decision).

---

*Structure analysis: 2026-07-02*
