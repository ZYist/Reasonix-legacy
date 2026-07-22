# Codebase Structure

**Analysis Date:** 2026-07-22

## Directory Layout

```text
reasonix_legacy/
├── src/                    # Root package implementation and both production entries
│   ├── cli/                # Commander CLI, TUI, headless host, and command composition
│   ├── loop/               # Focused pieces of the shared agent loop
│   ├── tools/              # Built-in model-callable capabilities
│   ├── core/               # Events, reducers, pause gates, and low-level primitives
│   ├── code/               # Code-mode prompt, toolset assembly, edits, and checkpoints
│   ├── mcp/                # MCP clients, transports, registry bridge, and marketplace
│   ├── memory/             # Runtime prefix/log state and durable memory/session stores
│   ├── acp/                # ACP protocol/server/event adaptation
│   ├── qq/                 # QQ transport, access rules, and TUI integration hook
│   ├── telegram/           # Telegram transport, access rules, and TUI integration hook
│   ├── weixin/             # Weixin transport, access rules, and TUI integration hook
│   └── ...                 # Adapters, ports, repair, indexing, telemetry, transcript, i18n
├── packages/
│   ├── core-utils/         # Private shared pure utilities workspace
│   └── ink/                # Private repository-owned terminal renderer workspace
├── tests/                  # Root integration/unit/characterization tests
├── examples/               # Programmatic public-API examples
├── scripts/                # Build, CI, smoke, probe, and performance helpers
├── tools/                  # Standalone diagnostic/benchmark utilities
├── benchmarks/             # Evaluation harnesses and committed reference results
├── docs/                   # Maintained user/developer documentation plus archive
├── data/                   # Packaged tokenizer asset
├── .github/                # CI, security analysis, publishing, and project automation
├── package.json            # reasonix-legacy@1.3.1 package/workspace authority
├── tsup.config.ts          # Library and CLI bundle entry configuration
├── tsconfig.json           # Root TypeScript and alias configuration
└── vitest.config.ts        # Test discovery, aliases, process isolation, and coverage
```

Generated or local-only directories such as `dist/`, `coverage/`, `node_modules/`, `.tmp/`, `.reasonix/truncated-results/`, and `.stryker-tmp/` are not source locations; their exclusion/ignore behavior is defined by `.gitignore`, `tsup.config.ts`, and `vitest.config.ts`.

## Directory Purposes

**`src/`:**
- Purpose: Own the root package runtime and public library implementation.
- Contains: Shared agent logic plus CLI, ACP, TUI, channel, model, tool, persistence, and integration modules.
- Key files: `src/index.ts`, `src/cli/index.ts`, `src/loop.ts`, `src/client.ts`, `src/tools.ts`, `src/config.ts`, `src/context-manager.ts`.

**`src/cli/`:**
- Purpose: Own all executable-surface composition and terminal-specific behavior.
- Contains: Startup guards in `src/cli/*.ts`, command handlers in `src/cli/commands/`, transport-neutral bot hosting in `src/cli/headless/`, and React/Ink UI in `src/cli/ui/`.
- Key files: `src/cli/index.ts`, `src/cli/commands/code.tsx`, `src/cli/commands/chat.tsx`, `src/cli/commands/run.ts`, `src/cli/commands/acp.ts`, `src/cli/headless/host.ts`, `src/cli/ui/App.tsx`.

**`src/cli/ui/`:**
- Purpose: Own interactive terminal presentation and user interaction.
- Contains: PascalCase React components, lowercase hooks/helpers, slash dispatch under `src/cli/ui/slash/`, cards under `src/cli/ui/cards/`, layouts under `src/cli/ui/layout/`, primitives under `src/cli/ui/primitives/`, theme modules under `src/cli/ui/theme/`, and state/reducers under `src/cli/ui/state/`.
- Key files: `src/cli/ui/App.tsx`, `src/cli/ui/state/TurnTranslator.ts`, `src/cli/ui/state/reducer.ts`, `src/cli/ui/layout/CardStream.tsx`, `src/cli/ui/slash/commands.ts`.

**`src/loop/`:**
- Purpose: Split focused orchestration behaviors out of the `CacheFirstLoop` facade.
- Contains: Streaming, dispatch, message shaping, healing, thinking, shrink/retention, error classification, and forced-summary behavior.
- Key files: `src/loop/dispatch.ts`, `src/loop/streaming.ts`, `src/loop/messages.ts`, `src/loop/healing.ts`, `src/loop/errors.ts`, `src/loop/force-summary.ts`.

**`src/tools/`:**
- Purpose: Implement capabilities registered into `ToolRegistry`.
- Contains: Top-level capability modules such as `src/tools/filesystem.ts`, `src/tools/shell.ts`, `src/tools/memory.ts`, `src/tools/plan.ts`, and deeper implementations under `src/tools/fs/` and `src/tools/shell/`.
- Key files: `src/tools/filesystem.ts`, `src/tools/shell.ts`, `src/tools/subagent.ts`, `src/tools/skills.ts`, `src/tools/rate-limit.ts`, `src/tools/read-tracker.ts`.

**`src/core/`:**
- Purpose: Own UI-neutral event, policy, concurrency, and atomic primitives.
- Contains: Typed kernel events, eventization, pure reducers, pause policy/gate, inflight tracking, lazy/LRU helpers, redaction, and atomic writes.
- Key files: `src/core/events.ts`, `src/core/eventize.ts`, `src/core/reducers.ts`, `src/core/pause-gate.ts`, `src/core/event-redaction.ts`, `src/core/atomic-write.ts`.

**`src/code/`:**
- Purpose: Assemble code-agent behavior around a workspace root.
- Contains: Toolset creation, generated code prompt, edit parsing/application, lifecycle policy, plan persistence, pending edits, checkpoints, encoding, and auto rollback.
- Key files: `src/code/setup.ts`, `src/code/prompt.ts`, `src/code/edit-blocks.ts`, `src/code/lifecycle.ts`, `src/code/checkpoints.ts`, `src/code/auto-git-rollback.ts`.

**`src/mcp/`:**
- Purpose: Own Model Context Protocol connectivity and tool bridging.
- Contains: Client, stdio/SSE/streamable-HTTP transports, spec parsing, preflight, registry bridging, reconnection, inspection, latency/drift, remote catalog data, and marketplace overlay.
- Key files: `src/mcp/client.ts`, `src/mcp/registry.ts`, `src/mcp/transport-from-spec.ts`, `src/mcp/stdio.ts`, `src/mcp/sse.ts`, `src/mcp/streamable-http.ts`.

**`src/memory/` and `src/transcript/`:**
- Purpose: Own cache-shape/runtime memory, persistent user/project/session data, and replayable transcript behavior.
- Contains: `ImmutablePrefix`/`AppendOnlyLog`/`VolatileScratch` in `src/memory/runtime.ts`, session JSONL handling in `src/memory/session.ts`, memory stacks in `src/memory/user.ts` and `src/memory/project.ts`, and transcript log/replay/diff modules in `src/transcript/`.
- Key files: `src/memory/runtime.ts`, `src/memory/session.ts`, `src/memory/user.ts`, `src/transcript/log.ts`, `src/transcript/replay.ts`, `src/transcript/diff.ts`.

**`src/adapters/` and `src/ports/`:**
- Purpose: Define boundary contracts and concrete persistence adapters without coupling the kernel to every surface.
- Contains: Event JSONL source/sink adapters in `src/adapters/` and model/tool/memory/checkpoint/hook/event interfaces in `src/ports/`.
- Key files: `src/adapters/event-sink-jsonl.ts`, `src/adapters/event-source-jsonl.ts`, `src/ports/event-sink.ts`, `src/ports/model-client.ts`, `src/ports/tool-host.ts`.

**`src/acp/`:**
- Purpose: Implement protocol-level ACP behavior separate from the CLI command composition.
- Contains: NDJSON JSON-RPC server, protocol types, kernel-event dispatch, and permission gates.
- Key files: `src/acp/server.ts`, `src/acp/protocol.ts`, `src/acp/dispatch.ts`, `src/acp/gates.ts`; composition remains in `src/cli/commands/acp.ts`.

**`src/qq/`, `src/telegram/`, and `src/weixin/`:**
- Purpose: Own protocol clients, access decisions, message-channel lifecycle, localized strings, and optional TUI hooks for each messaging provider.
- Contains: Consistent `access.ts`, `bot.ts`, `channel.ts`, `strings.ts`, and `use-*-channel.ts` shapes, with Weixin account helpers in `src/weixin/account.ts`.
- Key files: `src/qq/channel.ts`, `src/telegram/channel.ts`, `src/weixin/channel.ts`, `src/cli/headless/gate-bridges.ts`.

**`src/index/` and `src/code-query/`:**
- Purpose: Provide optional semantic indexing and deterministic syntax-tree code queries.
- Contains: Semantic config/store/builder/chunker/embedding/launcher/tool modules in `src/index/semantic/`, plus tree-sitter grammar mapping and symbol/search helpers in `src/code-query/`.
- Key files: `src/index/config.ts`, `src/index/semantic/tool.ts`, `src/index/semantic/store.ts`, `src/code-query/parser.ts`, `src/code-query/find-in-code.ts`.

**`src/repair/`, `src/telemetry/`, and `src/i18n/`:**
- Purpose: Centralize cross-cutting repair, metrics, and user-facing language behavior.
- Contains: Tool-call/schema repair under `src/repair/`, cost/usage/cache/subagent metrics under `src/telemetry/`, and typed dictionaries under `src/i18n/`.
- Key files: `src/repair/index.ts`, `src/telemetry/stats.ts`, `src/telemetry/usage.ts`, `src/i18n/index.ts`, `src/i18n/types.ts`.

**`packages/core-utils/`:**
- Purpose: Hold pure helpers shared across current root surfaces and bundle boundaries.
- Contains: Source in `packages/core-utils/src/` and focused tests in `packages/core-utils/tests/`.
- Key files: `packages/core-utils/package.json`, `packages/core-utils/src/index.ts`, `packages/core-utils/src/compaction.ts`, `packages/core-utils/src/tool-kind.ts`.

**`packages/ink/`:**
- Purpose: Hold the private React reconciler/Yoga/diff-screen terminal runtime consumed by the TUI.
- Contains: Renderer entry, components, hooks, layout engine, events, terminal parsing, and internal helpers under `packages/ink/src/`.
- Key files: `packages/ink/package.json`, `packages/ink/src/index.ts`, `packages/ink/src/renderer.ts`, `packages/ink/src/layout/engine.ts`, `packages/ink/src/termio/parser.ts`.

**`tests/`:**
- Purpose: Verify root-package units, integrations, command behavior, architecture invariants, and terminal characterization.
- Contains: Flat feature-named `*.test.ts`/`*.test.tsx` files, shared support under `tests/helpers/` and `tests/support/`, test doubles under `tests/mocks/`, protocol/code fixtures under `tests/fixtures/`, and repair suites under `tests/repair/`.
- Key files: `tests/architecture-invariants.test.ts`, `tests/package-identity.test.ts`, `tests/public-api.test.ts`, `tests/helpers/ink-test.ts`, `tests/support/lifecycle-harness.ts`.

**`scripts/`, `tools/`, and `benchmarks/`:**
- Purpose: Keep non-runtime build steps, diagnostics, probes, performance measurements, and evaluation harnesses outside `src/`.
- Contains: Package build helpers in `scripts/write-cli-package-marker.mjs` and `scripts/copy-tree-sitter-grammars.mjs`, diagnostic utilities under `tools/`, profiling under `scripts/perf/`, and evaluation suites under `benchmarks/`.
- Key files: `scripts/check-docs.mjs`, `scripts/coverage-summary.mjs`, `tools/e2e-context-compression.mts`, `benchmarks/README.md`.

**`docs/`:**
- Purpose: Hold maintained documentation and clearly isolated historical reference material.
- Contains: Current CLI/configuration/architecture/channel/release docs at `docs/*.md`; `docs/archive/` is archival material and must not be used as a live runtime or workspace authority.
- Key files: `docs/README.md`, `docs/architecture.md`, `docs/cli-reference.md`, `docs/configuration.md`, `docs/release-runbook.md`.

## Key File Locations

**Entry Points:**
- `src/index.ts`: Published ESM library export surface.
- `src/cli/index.ts`: Sole public `reasonix-legacy` executable and command router.
- `src/cli/commands/code.tsx`: Workspace-aware interactive code-agent launcher.
- `src/cli/commands/chat.tsx`: Generic interactive Ink launcher.
- `src/cli/commands/run.ts`: Non-interactive single-task launcher.
- `src/cli/commands/acp.ts`: ACP stdio server composition.
- `src/cli/headless/host.ts`: Shared headless channel runtime composition.

**Configuration:**
- `package.json`: Package identity, one bin mapping, `packages/*` workspaces, scripts, engines, and dependencies.
- `package-lock.json`: npm dependency/workspace lock authority.
- `tsconfig.json`: Strict ESM TypeScript configuration plus `@/*` and local `ink` aliases.
- `tsup.config.ts`: Separate library and executable bundles; internal workspaces are bundled.
- `vitest.config.ts`: Root and `packages/core-utils` test discovery plus aliases and fork pool.
- `biome.json`: Formatting/lint policy for `src` and `tests` commands.
- `stryker.config.mjs`: Mutation-test configuration.
- `.github/workflows/ci.yml`: Windows build, lint, typecheck, docs, test/coverage, and benchmark gate.
- `.github/workflows/publish-npm.yml`: Version-checked npm publication for `reasonix-legacy`.

**Core Logic:**
- `src/loop.ts`: Agent turn state machine and stable public facade over `src/loop/`.
- `src/context-manager.ts`: Context pressure and history folding policy.
- `src/client.ts`: DeepSeek-compatible model client.
- `src/tools.ts`: Capability registry and enforcement boundary.
- `src/code/setup.ts`: Code-mode capability composition.
- `src/core/events.ts`: Typed event kernel contract.
- `src/memory/runtime.ts`: Immutable prefix, append-only log, and scratch state.

**Testing:**
- `tests/<feature>.test.ts`: Default location for root source tests.
- `tests/<feature>.test.tsx`: Default location for React/Ink component and interaction tests.
- `packages/core-utils/tests/<feature>.test.ts`: Tests for `packages/core-utils/src/`.
- `tests/helpers/ink-test.ts`: TUI rendering harness.
- `tests/fixtures/`: Static protocol and code-query fixtures.

## Naming Conventions

**Files:**
- Use lowercase kebab-case for non-component modules: `src/context-manager.ts`, `src/loop/force-summary.ts`, `src/tools/read-tracker.ts`.
- Use PascalCase for React/Ink component modules: `src/cli/ui/SessionPicker.tsx`, `src/cli/ui/cards/ToolCard.tsx`, `src/cli/ui/layout/CardStream.tsx`.
- Prefix React hooks with `use-` in kebab-case or `use` in Pascal/camel form according to the surrounding directory: `src/telegram/use-telegram-channel.ts`, `src/cli/ui/hooks/useAgentSession.ts`.
- Name tests after the behavior/module with `.test.ts` or `.test.tsx`: `tests/context-manager-fold-timeout.test.ts`, `tests/ui-model-picker.test.tsx`.
- Use `index.ts` only as a deliberate public/barrel or feature entry: `src/index.ts`, `src/repair/index.ts`, `packages/core-utils/src/index.ts`, `packages/ink/src/index.ts`.

**Directories:**
- Use lowercase feature nouns for source areas: `src/memory/`, `src/repair/`, `src/transcript/`.
- Use kebab-case for multiword feature directories: `src/code-query/`, `src/index/semantic/`.
- Mirror protocol providers at one top-level feature directory each: `src/qq/`, `src/telegram/`, `src/weixin/`.
- Keep TUI subareas semantic and plural where appropriate: `src/cli/ui/cards/`, `src/cli/ui/hooks/`, `src/cli/ui/primitives/`.

## Where to Add New Code

**New CLI Command:**
- Primary code: `src/cli/commands/<command>.ts` or `.tsx`; use `.tsx` only when the handler renders React/Ink.
- Registration: Add the lazy command route to `src/cli/index.ts` under the sole `reasonix-legacy` program.
- Tests: Add `tests/<command>-command.test.ts` or a focused characterization test under `tests/`.

**New Public Library Capability:**
- Primary code: Put implementation in the closest `src/<feature>/` module, not directly in the barrel.
- Public export: Add the explicit value/type export to `src/index.ts`.
- Contract tests: Update `tests/public-api.test.ts`; update `tests/package-identity.test.ts` only for intentional package-boundary changes.

**New Model Tool:**
- Implementation: Add `src/tools/<tool>.ts`, with deeper helpers under `src/tools/<tool>/` when needed.
- Registry composition: Register code-capable tools in `src/code/setup.ts`; register transport-provided tools through `src/mcp/registry.ts`.
- Tests: Add `tests/tools-<tool>.test.ts` or `<tool>.test.ts` under `tests/`.
- Constraint: All model-originated execution must pass through `ToolRegistry` in `src/tools.ts`.

**New Loop Behavior:**
- Focused implementation: Add `src/loop/<concern>.ts` and keep `src/loop.ts` as the integrating state-machine facade.
- State/policy: Put context pressure in `src/context-manager.ts`, tool repair in `src/repair/`, or low-level concurrency/event primitives in `src/core/` according to responsibility.
- Tests: Add `tests/loop-<concern>.test.ts` or a focused module test under `tests/`.

**New TUI Feature:**
- Component: `src/cli/ui/<Name>.tsx`, or `src/cli/ui/cards/`, `layout/`, or `primitives/` for those specific roles.
- State/event logic: `src/cli/ui/state/`; avoid storing model conversation truth in components.
- Hook/integration: `src/cli/ui/hooks/use<Name>.ts` and stream bridging in `src/cli/ui/hooks/handle-stream-events.ts` or `TurnTranslator` as appropriate.
- Tests: `tests/ui-<feature>.test.tsx` using `tests/helpers/ink-test.ts`.

**New ACP Behavior:**
- Protocol types: `src/acp/protocol.ts`.
- Wire server behavior: `src/acp/server.ts`; kernel-to-ACP mapping: `src/acp/dispatch.ts`; permissions: `src/acp/gates.ts`.
- Composition/session behavior: `src/cli/commands/acp.ts`.
- Tests: `tests/acp-<feature>.test.ts`.

**New Messaging Provider Behavior:**
- Provider-neutral turn or permission behavior: `src/cli/headless/`.
- Provider-specific transport/access behavior: the matching `src/qq/`, `src/telegram/`, or `src/weixin/` directory.
- Standalone command assembly: `src/cli/commands/<provider>.ts`.
- Optional TUI channel hook: `src/<provider>/use-<provider>-channel.ts`.
- Tests: `tests/<provider>-<feature>.test.ts`.

**New Persistence Adapter or Boundary:**
- Interface: `src/ports/<boundary>.ts`.
- Concrete adapter: `src/adapters/<technology>-<boundary>.ts`.
- Durable domain logic: keep session/memory behavior in `src/memory/` and transcript behavior in `src/transcript/`.
- Tests: `tests/<adapter>.test.ts` with temporary filesystem isolation.

**Shared Helpers:**
- Root-only helper: Place beside the owning feature under `src/`.
- Pure helper shared across current bundle/surfaces: `packages/core-utils/src/<helper>.ts`, exported from `packages/core-utils/src/index.ts`, with tests in `packages/core-utils/tests/`.
- Terminal-renderer behavior: `packages/ink/src/`; do not place application-specific TUI state in the Ink workspace.

## Special Directories

**`packages/`:**
- Purpose: npm workspace root for exactly `packages/core-utils/` and `packages/ink/` under the `packages/*` declaration in `package.json`.
- Generated: No.
- Committed: Yes.

**`data/`:**
- Purpose: Store `data/deepseek-tokenizer.json.gz`, a packaged runtime asset included by `package.json`.
- Generated: Prepared by `scripts/prepare-tokenizer.ts`, then treated as a committed/package artifact.
- Committed: Yes.

**`docs/archive/`:**
- Purpose: Preserve upstream/historical documentation and site snapshots without defining live runtime structure.
- Generated: No.
- Committed: Yes.

**`benchmarks/`:**
- Purpose: Hold behavior, compression, cache, MCP, TDD, and tau-bench evaluation harnesses plus reference results.
- Generated: Mixed; harness sources and selected reference outputs are committed, including allowlisted JSONL under `benchmarks/tau-bench/transcripts/` per `.gitignore`.
- Committed: Yes, selectively.

**`.github/workflows/`:**
- Purpose: Define CI, CodeQL, npm publish, issue automation, and scheduled health checks.
- Generated: No.
- Committed: Yes.

**`dist/` and `coverage/`:**
- Purpose: Build and test output created from `tsup.config.ts` and `vitest.config.ts`.
- Generated: Yes.
- Committed: No, excluded by `.gitignore`.

---

*Structure analysis: 2026-07-22*
