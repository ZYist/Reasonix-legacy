# Codebase Concerns

**Analysis Date:** 2026-07-22

## Scope Boundary

- This map describes the live `reasonix-legacy@1.3.1` package and its sole public executable, `reasonix-legacy`, as declared in `package.json`.
- Archived material under `docs/archive/`, changelog history in `CHANGELOG.md`, generated output under `dist/`, and planning artifacts under `.planning/` are not evidence for active product behavior.
- A skipped scenario for the retired `change_workspace` tool remains in `tests/loop.test.ts`; it is stale test code, not an active command or product bug.
- Current validation baseline: `npm run lint` and `npm run typecheck` pass; `npm test -- --reporter=dot` passes 281 test files and 3,800 tests with 15 skipped tests. These checks exercise source behavior but do not remove the gaps documented below.

## Tech Debt

**TUI orchestration is concentrated in one component:**
- Issue: `src/cli/ui/App.tsx` is 4,045 lines and `AppInner` owns session hydration, workspace switching, model/theme selection, three bot-channel hooks, slash routing, confirmation modals, edit history, lifecycle state, and final rendering. The file contains many effects and callback closures whose dependency and modal-state interactions are difficult to reason about locally.
- Files: `src/cli/ui/App.tsx`, `tests/tui-composer-characterization.test.tsx`, `tests/tui-live-output-characterization.test.tsx`, `tests/ui-edit-history-undo-context.test.tsx`
- Impact: Changes to one interaction path can alter unrelated prompt, modal, channel, or session behavior; focused unit tests cannot isolate most of the component's state machine.
- Fix approach: Extract controller hooks/state machines by responsibility, beginning with submit routing, confirmation orchestration, and session/workspace transitions. Keep `AppInner` as composition and render wiring, and preserve existing characterization tests during extraction.

**Configuration is a broad, weakly bounded module:**
- Issue: `src/config.ts` is 1,678 lines and owns API endpoints, secrets, MCP definitions, shell/path permissions, themes, session behavior, indexing, semantic embeddings, and bot configuration. `readConfig` validates selected string-array fields but otherwise casts the parsed object to `ReasonixConfig`; validation is distributed across many individual loaders.
- Files: `src/config.ts`, `tests/config.test.ts`, `tests/config-sanitize-string-arrays.test.ts`, `tests/mcp-normalize-config.test.ts`
- Impact: New fields require coordinated edits across types, load/save functions, normalization, redaction, and tests. A hand-edited malformed nested field can reach a loader that lacks equivalent validation.
- Fix approach: Split domain schemas/loaders into config submodules and validate the complete persisted object with a versioned Zod schema. Retain the current atomic-write and redaction helpers from `src/core/atomic-write.ts` and `src/core/event-redaction.ts`.

**Channel controller logic is triplicated:**
- Issue: `src/telegram/use-telegram-channel.ts` (891 lines), `src/weixin/use-weixin-channel.ts` (878 lines), and `src/qq/use-qq-channel.ts` (850 lines) repeat channel start/stop, queued submission, confirmation bridging, checkpoint handling, lifecycle event formatting, and slash-command routing.
- Files: `src/telegram/use-telegram-channel.ts`, `src/weixin/use-weixin-channel.ts`, `src/qq/use-qq-channel.ts`
- Impact: Approval or lifecycle fixes must be ported three times and can diverge subtly across transports, especially for `path_access`, tool confirmation, and checkpoint choices.
- Fix approach: Extract a transport-neutral remote-channel controller with typed adapter callbacks. Keep provider-specific parsing and presentation in each provider directory, and run `tests/qq-channel-gate-callbacks.test.ts`, `tests/telegram-lifecycle.test.ts`, `tests/weixin-lifecycle.test.ts`, and `tests/qq-channel.test.ts` after each migration slice.

**Workspace packages are outside the lint command:**
- Issue: `npm run lint` runs `biome check src tests`, while `packages/ink/` is also explicitly ignored in `biome.json`; neither `packages/ink/src/` nor `packages/core-utils/src/` is linted by the standard local/CI command.
- Files: `package.json`, `biome.json`, `packages/ink/src/`, `packages/core-utils/src/`, `.github/workflows/ci.yml`
- Impact: The 117 TypeScript/TSX files in `packages/ink/src/` and seven source files in `packages/core-utils/src/` can accumulate convention and lint-rule violations despite a green CI lint step.
- Fix approach: Add workspace source/test paths to the lint script, remove the broad Ink ignore, and use narrow per-rule exceptions where the vendored renderer intentionally differs.

## Known Bugs

**Status-row currency rendering has a known test race:**
- Symptoms: The test renderer intermittently produces a dash row instead of the turn-cost segment, so five currency assertions are disabled as one skipped suite.
- Files: `tests/ui-status-row-balance.test.tsx`, `src/cli/ui/layout/StatusRow.tsx`, `packages/ink/src/screen.ts`, `packages/ink/src/render-to-screen.ts`
- Trigger: Render `StatusRow` through the Ink test harness and wait for the state flush; fixed sleeps from 50-250 ms are documented as unreliable in `tests/ui-status-row-balance.test.tsx`.
- Workaround: The affected `describe.skip` block leaves USD, CNY, default-currency, zero-cost, and cache-percentage rendering without active assertions. Replace sleeps with a deterministic render/flush signal, then re-enable the suite.

## Security Considerations

**MCP transports accept unbounded inbound data:**
- Risk: A local or remote MCP server can grow process memory by emitting a very long stdio line, flooding notifications faster than consumption, returning a large JSON/error body, or holding multiple SSE streams. The stdio buffer and all transport queues have no cap; SSE POST drains the full body with `arrayBuffer()`, and Streamable HTTP uses unbounded `text()`/`json()` reads.
- Files: `src/mcp/stdio.ts`, `src/mcp/sse.ts`, `src/mcp/streamable-http.ts`, `src/mcp/client.ts`
- Current mitigation: `src/mcp/client.ts` applies a 60-second logical request timeout, and `src/mcp/registry.ts` truncates results before model exposure. Those controls do not cap transport bytes or queued notifications. `src/tools/web.ts` already demonstrates DNS, redirect, timeout, and byte-cap guards for untrusted HTTP content.
- Recommendations: Add per-frame/body byte limits, maximum queue depth, backpressure/drop policy for notifications, abortable transport deadlines, and tests for oversized no-newline stdio, SSE events, JSON bodies, and error bodies.

**QQ can be claimed by the first sender when unconfigured:**
- Risk: With no persistent owner or allowlist, `decideQQAccess` accepts the first sender and binds only for the process lifetime. On a reachable bot, an attacker who messages first after startup can become the runtime owner.
- Files: `src/qq/access.ts`, `src/qq/channel.ts`, `docs/qq-connect.md`, `tests/qq-access.test.ts`
- Current mitigation: Subsequent senders are rejected for that process, and explicit `ownerOpenId`/allowlist configuration is enforced when present. Telegram and Weixin fail closed when unconfigured in `src/telegram/access.ts` and `src/weixin/access.ts`.
- Recommendations: Match the fail-closed Telegram/Weixin policy by requiring an owner or allowlist before QQ starts. If first-sender binding remains, require an explicit opt-in and a local confirmation code, then persist the binding atomically.

**Sensitive local files rely on best-effort permissions:**
- Risk: API keys, bot credentials, MCP environment/header values, prompts, tool results, and session events are stored locally. Permission hardening uses `chmod(0o600)` but deliberately swallows unsupported-platform failures; on Windows this provides no explicit ACL guarantee.
- Files: `src/config.ts`, `src/core/atomic-write.ts`, `src/memory/session.ts`, `src/adapters/event-sink-jsonl.ts`, `src/tools/truncated-result-saver.ts`, `src/core/event-redaction.ts`
- Current mitigation: Atomic config writes default to mode `0o600`, session/event/result writers attempt the same mode, and event output redacts secret-named fields and known secret values. Coverage exists in `tests/atomic-write.test.ts` and `tests/event-redaction.test.ts`.
- Recommendations: Use an OS credential store for long-lived secrets, verify/restrict Windows ACLs on the Reasonix data directory, and expose a `doctor` warning when local secret/session paths are broadly readable.

**Yolo mode intentionally removes approval boundaries:**
- Risk: `editMode: "yolo"` skips edit, shell, filesystem-path, and checkpoint confirmation gates, so prompt injection or a compromised remote channel can cause direct local mutations and command execution.
- Files: `src/config.ts`, `src/tools/shell.ts`, `src/tools/filesystem.ts`, `src/cli/commands/acp.ts`, `tests/acp-yolo.test.ts`, `tests/permissions-slash.test.ts`
- Current mitigation: Unknown config values fall back to `review`; non-yolo modes retain shell and path gates; headless gate tests fail closed on malformed replies in `tests/headless-gate-bridges.test.ts`.
- Recommendations: Keep yolo visibly session-scoped, require explicit startup consent for remote channels, and do not allow a bot-originated message or project file to enable it.

## Performance Bottlenecks

**Session discovery and hydration scale with complete log size:**
- Problem: Full session loads call `readFileSync(..., "utf8")` and split/parse the entire JSONL. Session listing counts lines by reading each full file into a buffer, and the TUI invokes workspace session listing from multiple picker/workspace paths.
- Files: `src/memory/session.ts`, `src/loop.ts`, `src/cli/commands/chat.tsx`, `src/cli/ui/App.tsx`
- Cause: JSONL is the source of both message content and list metadata; message counts are recomputed from full files. The 90-day prune implementation exists but runs through the explicit `src/cli/commands/prune-sessions.ts` command rather than automatic retention.
- Improvement path: Persist/update message count and summary metadata alongside appends, use the existing backward chunk scanner for previews, load full histories asynchronously, and offer retention/size warnings before logs become multi-megabyte.

**MCP buffering can bypass normal result-size controls:**
- Problem: Transport buffers grow before `src/mcp/registry.ts` can truncate a tool result.
- Files: `src/mcp/stdio.ts`, `src/mcp/sse.ts`, `src/mcp/streamable-http.ts`, `src/mcp/registry.ts`
- Cause: Queue and body limits exist only at the registry/model boundary, not at the network/process boundary.
- Improvement path: Enforce caps while streaming and parsing, cancel over-limit responses, and expose dropped/aborted-message counters through existing MCP diagnostics.

## Fragile Areas

**Slash `/commit` stages the entire worktree:**
- Files: `src/cli/ui/slash/helpers.ts`, `src/cli/ui/slash/handlers/edits.ts`, `src/cli/ui/slash/commands.ts`, `tests/slash.test.ts`
- Why fragile: `runGitCommit` executes `git add -A` before committing. Unrelated edits, deletions, generated files, or secrets not covered by ignore rules become staged, and a failed commit leaves that staging mutation in place.
- Safe modification: Show the exact staged-file preview and require confirmation, or commit only already-staged/agent-owned paths. Preserve argv-based `git commit -m` execution.
- Test coverage: Current slash tests verify usage and failure handling but do not create a repository with unrelated files and assert the final staged/committed set.

**Synchronous and asynchronous session implementations can drift:**
- Files: `src/memory/session.ts`, `tests/session.test.ts`
- Why fragile: The module contains parallel sync and async implementations for load, tail-read, append, rename, delete, rewrite, list, prune, and archive. Repository search finds no callers or tests for the async exports, while the sync functions have broad tests.
- Safe modification: Extract pure parsing/naming/selection logic shared by both I/O adapters, or remove unused async variants until a real non-blocking caller exists.
- Test coverage: `tests/session.test.ts` exercises sync APIs; no test references `loadSessionMessagesAsync`, `listSessionsAsync`, or the other async variants.

**Platform behavior is validated primarily on Windows:**
- Files: `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`, `tests/shell-redirects.test.ts`, `tests/skills.test.ts`, `src/mcp/stdio.ts`, `src/tools/shell/exec.ts`
- Why fragile: CI and CodeQL use only `windows-latest` with Node 24.15.0, while `package.json` supports Node `>=22` and runtime code has significant Windows/POSIX branches. Several shell and symlink tests are skipped conditionally on Windows.
- Safe modification: Add Linux plus minimum-supported Node 22 to the CI matrix; retain Windows for cmd/PowerShell behavior and add macOS only for terminal-specific regressions that cannot be covered on Linux.
- Test coverage: The current local Windows run reports 15 skipped tests, including POSIX shell/symlink cases and the disabled status-row suite.

## Scaling Limits

**File-backed session catalog:**
- Current capacity: No hard file-size or session-count limit is defined in `src/memory/session.ts`; each session is append-only JSONL plus sidecars.
- Limit: Listing cost grows with total bytes across every session because each file is read to count messages; opening a session allocates its full decoded content and parsed message array.
- Scaling path: Maintain an indexed catalog, store bounded previews/counts in metadata, compact or archive by configurable size, and benchmark picker latency with hundreds of multi-megabyte sessions.

**Remote tool event ingestion:**
- Current capacity: No maximum stdio line, SSE event, HTTP body, queue length, or concurrent stream count is defined in `src/mcp/stdio.ts`, `src/mcp/sse.ts`, or `src/mcp/streamable-http.ts`.
- Limit: Capacity is bounded only by process memory and upstream behavior.
- Scaling path: Add explicit configurable ceilings with conservative defaults and terminate/reconnect servers that exceed them.

## Dependencies at Risk

**Vitest/Vite development toolchain:**
- Risk: `npm audit --json` reports 12 development-tree advisories: two critical, four high, five moderate, and one low. Direct `vitest` and `@vitest/coverage-v8` resolve in the affected pre-3.2.6 range; the audit recommends Vitest 4.1.10 as a semver-major fix. `vite` carries high-severity development-server/path-handling advisories, and direct `esbuild` also has a development-server advisory.
- Files: `package.json`, `package-lock.json`, `vitest.config.ts`
- Impact: The published production dependency audit (`npm audit --omit=dev --json`) reports zero vulnerabilities, but contributor/test environments remain exposed if affected UI/dev-server features process untrusted input or listen beyond localhost.
- Migration plan: Upgrade Vitest and coverage together, update Vite/esbuild transitively or directly, run the 3,800-test suite and coverage on Node 22/24, and retain a CI `npm audit --omit=dev` release gate plus a separately triaged full-tree audit.

**Production dependencies:**
- Risk: No known production advisory is detected by the current lockfile audit.
- Impact: No active production dependency vulnerability is evidenced as of the analysis date.
- Migration plan: Keep `package-lock.json` committed and continue regular production-only audits; do not treat the clean production result as resolving the development-toolchain advisories above.

## Missing Critical Features

**Enforced resource limits for MCP:**
- Problem: The tool bridge truncates model-facing results, but the transports do not enforce input/body/queue limits before allocation.
- Files: `src/mcp/stdio.ts`, `src/mcp/sse.ts`, `src/mcp/streamable-http.ts`, `src/mcp/registry.ts`
- Blocks: Safe use of untrusted or internet-hosted MCP servers under sustained notification volume or oversized responses.

**Cross-platform and minimum-runtime CI:**
- Problem: The supported Node/runtime and shell matrix is broader than the single Windows/Node 24 CI job.
- Files: `package.json`, `.github/workflows/ci.yml`, `tests/shell-redirects.test.ts`, `tests/skills.test.ts`
- Blocks: Confident releases for Node 22 and POSIX users, particularly around shell quoting, redirects, process termination, and symlinked skills.

## Test Coverage Gaps

**Coverage is reported but not enforced:**
- What's not tested: No minimum statement, branch, function, or line percentage is configured. `scripts/coverage-summary.mjs` explicitly exits successfully when coverage data is missing and only writes percentages to the GitHub summary.
- Files: `vitest.config.ts`, `scripts/coverage-summary.mjs`, `.github/workflows/ci.yml`
- Risk: Large untested areas or missing coverage artifacts do not fail CI.
- Priority: High. Add thresholds incrementally, beginning with security boundaries (`src/mcp/`, `src/tools/`, `src/core/`) and changed-file coverage.

**MCP resource exhaustion paths:**
- What's not tested: Oversized stdio lines, unbounded notification floods, oversized SSE events, large JSON/error response bodies, and concurrent-stream ceilings.
- Files: `src/mcp/stdio.ts`, `src/mcp/sse.ts`, `src/mcp/streamable-http.ts`, `tests/mcp-stdio-debug.test.ts`, `tests/mcp-sse.test.ts`, `tests/mcp-streamable-http.test.ts`
- Risk: Memory exhaustion and hangs can reach production despite broad functional MCP coverage.
- Priority: High.

**Disabled status-row assertions:**
- What's not tested: Turn-cost currency rendering for USD, CNY, default currency, zero cost, and cache percentage.
- Files: `tests/ui-status-row-balance.test.tsx`, `src/cli/ui/layout/StatusRow.tsx`
- Risk: A visible billing/cost regression can pass CI.
- Priority: Medium. Replace timing sleeps with deterministic renderer settling and remove `describe.skip`.

**Workspace lint and test type safety:**
- What's not tested: Biome rules do not run over either workspace package, and root `tsconfig.json` excludes `tests/`; Vitest transpilation does not provide a complete standalone typecheck for test code.
- Files: `package.json`, `biome.json`, `tsconfig.json`, `packages/ink/`, `packages/core-utils/`
- Risk: Workspace style defects and type-invalid test helpers can pass the standard lint/typecheck gates.
- Priority: Medium. Add workspace lint targets and a dedicated test TypeScript configuration.

**Async session APIs:**
- What's not tested: Every async session storage variant in `src/memory/session.ts` lacks a direct test reference.
- Files: `src/memory/session.ts`, `tests/session.test.ts`
- Risk: Sync/async behavior can diverge in recovery, backups, sidecar moves, permissions, and pruning without detection.
- Priority: Medium if retained; otherwise remove the unused variants.

---

*Concerns audit: 2026-07-22*
