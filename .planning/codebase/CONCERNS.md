# Codebase Concerns

**Analysis Date:** 2026-07-02

> Scope: full repo (`src/`, `tests/`, `packages/`, `desktop/`, `dashboard/`, `tools/`, `scripts/`, CI under `.github/`).
> Note: `reasonix-legacy` is the TypeScript line kept alive as a community fork. README.md and REASONIX.md explicitly mark this codebase as legacy — upstream has moved to a Go rewrite (`main-v2`). Most concerns below should be read with that framing: tech-debt here will not be paid down upstream.

## Tech Debt

### Project marked legacy; maintenance is fork-only
- Issue: This is the abandoned TypeScript line. The active upstream rewrite is in Go (`main-v2`). Any work here is divergence from upstream unless the fork becomes the canonical line.
- Files: `README.md`, `REASONIX.md`, `CHANGELOG.md` (`[0.55.0] — 2026-07-02` first fork release)
- Impact: Bug fixes and improvements here will not flow forward; future security/CVE response comes from the fork maintainer only (`SECURITY.md` routes reports to a personal QQ inbox).
- Fix approach: Treat as containment-only unless explicitly extending the fork. Document any divergence from upstream `v1` in `CHANGELOG.md`.

### CI only triggers on `main`; default branch is `v1`, work happens on `dev`
- Issue: `.github/workflows/ci.yml` filters `branches: [main]` for both push and PR. The repo's stated main branch is `v1` and the working branch here is `dev`. Lint / typecheck / build / coverage / `τ-bench --dry` never run automatically against active work.
- Files: `.github/workflows/ci.yml` (lines 4-9)
- Impact: Regressions on `dev` and `v1` slip in silently; the `pre-push` simple-git-hooks gate (package.json) only fires locally for developers who have hooks installed.
- Fix approach: Add `v1` and `dev` to the `branches:` filters (or drop the filter and rely on PR targeting). Confirm whether the fork's release workflow (`release.yml`, `publish-npm.yml`) is bound to the right branch.

### God modules — multiple files over 1000 LOC with mixed responsibilities
- Issue: A handful of source files concentrate unrelated logic, making them fragile to edit and hard to test in isolation.
- Files:
  - `src/cli/commands/desktop.ts` — 3555 lines (Tauri desktop shell, arg parsing, prompt assembly, balances, MCP wiring, all in one file)
  - `src/config.ts` — 1870 lines (every config shape, validator, loader, normalizer, sanitizer)
  - `src/tools/web.ts` — 1328 lines (SSRF guard, DNS/DoH fallback, every search-engine client, HTML-to-text)
  - `src/loop.ts` — 1272 lines (cache-first loop, mid-turn steer, escalation, summarization)
  - `src/tools/filesystem.ts` — 1069 lines (all FS tools + sandbox + outline + glob)
  - `src/memory/session.ts` — 988 lines (JSONL append, sidecar files, git-branch sniff, archive, rewrite)
- Impact: High blast radius for any change; review is hard; the test-to-LOC ratio for these specific files is low.
- Fix approach: Carve out cohesive submodules — e.g. split `web.ts` into `web/ssrf.ts`, `web/dns.ts`, `web/engines/<vendor>.ts`; split `config.ts` by domain (mcp, qq, telegram, weixin, embedding, hooks); lift desktop-shell wiring out of `desktop.ts` into `src/desktop/`.

### Massive parallel i18n dictionaries — easy drift
- Issue: Five hand-maintained locale dictionaries (`src/i18n/EN.ts` 2138, `JA.ts` 2202, `de.ts` 2103, `zh-CN.ts` 2020, `ru.ts` 618) plus a 1032-line `types.ts` defining the key set. Adding a string requires editing all of them; nothing enforces parity at compile time beyond the type on the default export.
- Files: `src/i18n/EN.ts`, `src/i18n/JA.ts`, `src/i18n/de.ts`, `src/i18n/zh-CN.ts`, `src/i18n/ru.ts`, `src/i18n/types.ts`
- Impact: Partial translations silently fall back; locale files have already drifted (`ru.ts` is ~30% the size of the others).
- Fix approach: Add a test (alongside `tests/comment-policy.test.ts`) that diff-checks keys against `EN.ts` and fails on missing entries. Consider extracting to JSON + a codegen step.

### Type-safety escape hatches
- Issue: Several hot paths bypass the type system with `as unknown as` casts, defeating `strict` + `noUncheckedIndexedAccess` exactly where the runtime shape is least certain.
- Files:
  - `src/net/proxy.ts:151,266` — casts the custom dispatcher to Undici's `Dispatcher`
  - `src/index/semantic/store.ts:219-221` — reaches into private fields (`dim`, `entries`, `byPath`) of the store
  - `src/memory/runtime.ts:85` — casts frozen tools cache to `ToolSpec[]`
  - `src/mcp/reconnect.ts:144` and `src/cli/ui/mcp-append.ts:24` — casts `inputSchema` to `JSONSchema`
  - `src/transcript/log.ts:152` — casts parsed records to `TranscriptRecord`
  - `src/cli/ui/state/reducer.ts:126` — `event.lang as any`
- Impact: Schema drift between layers becomes a runtime crash instead of a compile error.
- Fix approach: Add narrow runtime validators (zod schemas are already a dependency via `src/config.ts:7`) at these boundaries; replace the casts with parsed-and-validated values.

### Deprecated synthetic cost fields still carried
- Issue: `SessionStats` keeps two `@deprecated` fields (`claudeEquivalentUsd`, `savingsVsClaudePct`) described as "synthetic ratio, not a real measurement" but still serialized in session meta.
- Files: `src/telemetry/stats.ts:133-136`
- Impact: Dashboard / replay consumers may display misleading numbers; the fields can never be removed without a meta migration.
- Fix approach: Gate behind a `--legacy-cost-fields` flag, emit a deprecation warning on read, schedule a meta-version bump in `src/memory/session.ts` to drop them.

## Known Bugs

### `git-diffs.ts` includes user's pre-Reasonix changes
- Symptoms: Dashboard diff view attributes uncommitted user edits to Reasonix.
- Files: `src/server/api/git-diffs.ts:4` (open `TODO(#618)`)
- Trigger: Any workspace where the user has staged/unstaged changes before invoking Reasonix.
- Workaround: None in UI; "restore working tree to HEAD" features must route through `CheckpointStore` (per the TODO comment) to avoid clobbering user changes. The fix is unstarted — issue #618 still referenced as open.

## Security Considerations

### User-configured hooks execute arbitrary shell with no sandboxing
- Risk: `PreToolUse` / `PostToolUse` / `UserPromptSubmit` / `Stop` hooks run whatever command the user (or anyone who can write `.reasonix/settings.json`) places there, with the user's full privileges.
- Files: `src/hooks.ts` (`spawn` at line 3, `runHooks`, `DEFAULT_TIMEOUTS_MS`)
- Current mitigation: `SECURITY.md` "Hardening notes" tells users to audit `.reasonix/settings.json` before running in a directory they didn't author; hooks run with a per-event timeout (5 s for blocking, 30 s for others); `projectHooksTrusted` gate exists in `src/config.ts`.
- Recommendations: Surface the resolved hook chain to the user at session start (not just via `/hooks`); refuse project-scope hooks in `editMode: yolo`; cap combined stdout+stderr byte budget (the truncation cap is there but expose it to the user).

### MCP stdio transport spawns through a shell on Windows by default
- Risk: `StdioTransport` sets `shell: true` whenever `process.platform === "win32"` so `.cmd`/`.bat` shims resolve. The implementation builds a command line by quoting args itself, but any future caller passing an attacker-influenced arg (e.g. an MCP spec pulled from a remote registry or a `--mcp` flag in a shared script) opens a shell-injection vector.
- Files: `src/mcp/stdio.ts:42-66`, `quoteArg` helper
- Current mitigation: Manual quoting of each arg, command kept bare so PATH/PATHEXT lookup still works.
- Recommendations: Document the trust assumption in `src/mcp/spec.ts` next to `parseMcpSpec`; never accept MCP server specs from prompt content (only from config + `--mcp` CLI); add a test that exercises args containing shell metacharacters against `quoteArg`.

### Dashboard server can bind to LAN with token-only auth
- Risk: `startDashboardServer({ host: "0.0.0.0" })` exposes the dashboard — and every mutating endpoint (`/api/submit`, `/api/abort`, `/api/edit-mode`, checkpoint create/restore, file read/write via `/api/files`, `/api/file-read`, etc.) — to anyone on the network. The only barrier is the per-boot 32-byte token, sent as `?token=…` on the URL printed to the TUI.
- Files: `src/server/index.ts` (`StartDashboardOptions.host`, `mintToken`, `checkAuth`, `dispatch`); all handlers under `src/server/api/`
- Current mitigation: Defaults to `127.0.0.1`; mutations require `X-Reasonix-Token` header (CSRF defense, lines 60-72); constant-time comparison (`constantTimeEquals`); SPA shell + assets are token-gated; body cap 256 KiB (`MAX_BODY_BYTES`).
- Recommendations: When `host !== 127.0.0.1` the server should refuse query-token reads (force header-only) and log a loud warning. The token also appears in TUI scrollback and shell history — consider a one-time, in-stdout URL that the user must copy immediately.

### SSRF / DNS-rebinding window in `web_fetch`
- Risk: `web.ts` correctly blocks RFC-1918 / loopback / link-local / ULA addresses, but resolution and fetch are separate operations. A DNS server can answer with a public IP for the check and a private IP at fetch time (rebinding). DoH fallback (`dohResolve` at line 188) goes to `1.1.1.1`, which doesn't close the gap.
- Files: `src/tools/web.ts:108-200` (`isPrivateIpv4`, `isPrivateIpv6`, `isInternalAddress`, `dohResolve`)
- Current mitigation: Private-range blocklist for both IPv4 and IPv6, IPv4-mapped IPv6 normalization, DoH fallback for Fake-IP TUN proxies, `FETCH_MAX_REDIRECTS = 5`.
- Recommendations: Pin the resolved IP for the actual fetch (override `lookup` on the request, or rewrite the URL to `http://<ip>` with `Host` header); re-check the address family after fetch completes.

### Shell-chain parser is a custom mini-shell
- Risk: `run_command` never invokes a real shell; instead `shell-chain.ts` parses `|`, `||`, `&&`, `;`, redirects (`>`, `>>`, `<`, `2>`, `2>&1`, `&>`) and quotes itself. Any parser bug = command the user didn't intend, possibly with permission-gated mutating effects.
- Files: `src/tools/shell-chain.ts` (577 lines), `src/tools/shell.ts`
- Current mitigation: Quote-aware splitter, explicit `UnsupportedSyntaxError` for unrecognized constructs, allowlist gate upstream in `shell-tools`.
- Recommendations: Fuzz the parser (it has unit tests but no property/fuzz harness); document the supported grammar in the tool's user-facing description so the model doesn't emit unsupported syntax and then truncate.

## Performance Bottlenecks

### Synchronous filesystem APIs on the hot session path
- Problem: `appendFileSync`, `readFileSync`, `writeFileSync`, `copyFileSync`, `statSync`, `execFileSync` are used in the session log and config loader — blocking the event loop on every turn write and every config read.
- Files: `src/memory/session.ts` (top of file imports a long list of sync FS APIs; `detectGitBranch` uses `execFileSync` with an 800 ms timeout per call), `src/config.ts` (`readFileSync` in `readConfig`), `src/code/auto-git-rollback.ts` (`execFileSync`), `src/server/api/git-diffs.ts` (`execSync`), `src/server/api/checkpoint-create.ts:35` (`execSync`)
- Cause: Append-only JSONL log favors simple sync writes; the dashboard API handlers reuse sync helpers.
- Improvement path: Keep the JSONL writer sync for ordering safety, but move the dashboard API handlers and `detectGitBranch` to async equivalents (`fs/promises`, `execFile` from `child_process`); the async versions already coexist in `session.ts` — finish the migration.

### Dashboard API uses module-scoped `Map`s as job state
- Problem: `JOBS` and `PULLS` in `src/server/api/semantic.ts:54,62` are unbounded module-scoped maps keyed by project root. Long-lived dashboards accumulating build/pull history leak memory; there's no eviction or TTL.
- Files: `src/server/api/semantic.ts:36-62`
- Cause: Single-process dashboard assumed short-lived.
- Improvement path: Cap entries per key (LRU with a few slots) and clear finished jobs on `DashboardServerHandle.close()`.

## Fragile Areas

### SEARCH/REPLACE edit gate
- Files: `src/code/edit-blocks.ts`, `src/code/edit-blocks-gate.ts`, `src/tools/fs/edit.ts`
- Why fragile: The gate requires byte-for-byte match between SEARCH and existing file content. Trailing whitespace, BOM, CRLF vs LF, or a single off indent = mismatch and the whole edit is rejected. REASONIX.md "Watch out for" calls this out explicitly.
- Safe modification: Always go through `applyEdit` / `applyMultiEdit`; never hand-write edit blocks; add a golden test for CRLF and UTF-8-with-BOM inputs.
- Test coverage: `tests/edit-blocks*.test.ts` exists but the failure mode is data-dependent; coverage for Windows line endings is partial.

### Cache-first loop (`src/loop.ts`)
- Files: `src/loop.ts` (1272 lines) plus `src/loop/*.ts` (dispatch, streaming, healing, shrink, thinking, force-summary, reasoning-retention, hook-events)
- Why fragile: The cache-prefix is the entire cost model. Any change to message ordering, tool-result truncation, or reasoning-content stripping invalidates the prefix and silently inflates cost. Healing (`healLoadedMessages`, `fixToolCallPairing`) mutates loaded history at runtime.
- Safe modification: Run `scripts/probe-cache-shape.mts`, `scripts/probe-loop-cache.mjs`, and `benchmarks/tau-bench` before and after; never edit the message array in place — use the builders in `src/loop/messages.ts`.
- Test coverage: `tests/cache-shape.test.ts`, `tests/architecture-invariants.test.ts`, and the cache-diagnostics suite exist; mutation testing via Stryker (`stryker.config.mjs`) is configured but not enforced in CI.

### Repair pipeline (`src/repair/`)
- Files: `src/repair/index.ts`, `scavenge.ts`, `truncation.ts`, `storm.ts`, `flatten.ts`
- Why fragile: This pipeline reconstructs malformed tool calls the model emits — schema flatten, JSON scavenging, truncation repair, repeat-loop "storm breaking". Behavior is highly model-dependent; a DeepSeek model update can shift failure modes overnight.
- Safe modification: Keep pass order (`scavenge → truncation → storm`); each pass has its own test file; do not add a new pass without a regression fixture from a real production failure.
- Test coverage: Decent per-pass, but no end-to-end "real broken turn" replay harness — only synthetic inputs.

## Scaling Limits

### Single-process, single-user architecture
- Current capacity: One CLI process per session, one dashboard server bound to a user-owned port, one event log per session.
- Limit: No multi-user / multi-tenant boundary (explicitly out of scope per `SECURITY.md`). Concurrent writes to the same session JSONL from two processes rely on append atomicity only.
- Scaling path: None intended. Do not attempt to host this as a service.

### Session JSONL growth
- Current capacity: Append-only JSONL under `~/.reasonix/sessions/`; one file per session with sidecars (`.events.jsonl`, `.meta.json`, `.pending.json`, `.plan.json`, `.jsonl.bak`).
- Limit: Long sessions (hundreds of turns with tool results) bloat the file; full reload on resume re-parses everything. `rewriteSession` exists to compact, but it's called only on explicit archive.
- Scaling path: Bound retained tool-result size at write time (the `DEFAULT_MAX_RESULT_CHARS` / `DEFAULT_MAX_RESULT_TOKENS` truncators in `src/mcp/registry.ts`); add a periodic auto-compaction pass.

## Dependencies at Risk

### DeepSeek API surface — only two supported official models
- Risk: `SUPPORTED_OFFICIAL_MODELS` in `src/config.ts:35` is hard-coded to `deepseek-v4-flash` and `deepseek-v4-pro`. The comment notes the v3-era names already 400. Any future rename or deprecation breaks the CLI at first request.
- Impact: All chat / commit / run / desktop commands fail with a 400 until the constant is updated.
- Migration plan: Read supported model names from a runtime-configurable list (config file or remote manifest); fall back to a "best-known" default with a clear error pointing to `reasonix setup`.

### Undici / global fetch assumptions
- Risk: `src/net/proxy.ts` casts to Undici's `Dispatcher` and calls `setGlobalDispatcher`. Node's bundled Undici version changes between Node majors; the proxy dispatcher and SSRF lookup hooks assume Undici internals.
- Impact: A Node upgrade (currently pinned to ≥22) can break the proxy layer silently.
- Migration plan: Pin Undici explicitly as a dependency and import the type from the package rather than casting to `unknown`.

## Missing Critical Features

### No enforced test coverage gate
- Problem: `npm run test:coverage` runs in CI but there is no stated threshold; `vitest.config.ts` does not enforce `lines`/`functions` minimums.
- Blocks: Confidence in refactors of the god modules above.
- Fix: Add `coverage.thresholds` to `vitest.config.ts` starting at the current baseline and ratchet upward.

### No fuzzing on the input-parsing surfaces
- Problem: `shell-chain.ts`, `edit-blocks.ts`, `mcp/spec.ts`, `transcript/log.ts`, `event-source-jsonl.ts` all parse untrusted or semi-trusted text. Only unit tests with fixed inputs cover them.
- Blocks: Confidence that malformed model output, malformed MCP line framing, or tampered transcripts fail safely.
- Fix: Add property-based tests (fast-check is not currently a dependency) for these parsers.

## Test Coverage Gaps

### God modules have low per-file test density
- What's not tested: `src/cli/commands/desktop.ts` (3555 lines) is exercised only end-to-end via ACP/desktop command tests; individual exported helpers (workspace listing, prompt assembly, balance picker) are not unit-tested in isolation.
- Files: `src/cli/commands/desktop.ts`
- Risk: Refactors regress desktop-shell behavior with no unit signal.
- Priority: Medium (the command path is integration-tested, but those tests are slow).

### Concurrent session write safety is asserted, not stressed
- What's not tested: `src/memory/session.ts` claims "concurrent-write safe" but no test spawns two writers; the claim rests on `O_APPEND` atomicity for small writes.
- Files: `src/memory/session.ts`
- Risk: A large multi-KB append that crosses the pipe buffer boundary on Windows could interleave under contention.
- Priority: Medium.

### Locale-key parity
- What's not tested: No test asserts that `JA.ts`, `de.ts`, `zh-CN.ts`, `ru.ts` expose the same keys as `EN.ts`. Missing keys silently fall back.
- Files: `src/i18n/*.ts`
- Risk: A user on `ru` sees English strings for newly added keys with no signal to maintainers.
- Priority: Low (cosmetic), but trivially fixable with one diff test.

### SSRF rebinding
- What's not tested: The private-range blocklist is unit-tested against fixed IPs; nothing exercises a host whose second DNS answer differs from the first.
- Files: `src/tools/web.ts`
- Risk: Rebinding attack via `web_fetch` against an internal service.
- Priority: Medium (mitigated by single-user threat model, but worth a regression test).

---

*Concerns audit: 2026-07-02*
