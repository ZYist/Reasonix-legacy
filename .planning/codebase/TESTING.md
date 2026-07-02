# Testing Patterns

**Analysis Date:** 2026-07-02

## Test Framework

**Runner:**
- Vitest (ESM-native, matches the build).
- Config: `vitest.config.ts` at repo root.

**Assertion Library:**
- Vitest built-ins (`expect`, `vi`, `describe`, `it`, `test`, `beforeEach`, `afterEach`) imported per-file from `"vitest"`.
- `globals: false` — every test file must import its helpers explicitly. Do not rely on global `describe`/`it`.

**Mutation testing:**
- Stryker (`stryker.config.mjs`) with the `@stryker-mutator/vitest-runner` plugin. Targets load-bearing modules only (`src/loop.ts`, `src/context-manager.ts`, `src/core/**`, `src/tools/shell.ts`, `src/repair/**`). Thresholds: high 80 / low 60 / break 50. Run via `npm run test:mutation`.

**Run Commands:**
```bash
npm test                 # vitest run — full suite
npm run test:watch       # vitest (watch mode)
npm run test:coverage    # vitest run --coverage (v8 provider)
npm run test:mutation    # stryker (slow; targeted)
npm run verify           # lint + typecheck + build + tests — pre-push gate
```

## Pool & Isolation

Configured in `vitest.config.ts`:

- **`pool: "forks"`** — per-file process isolation. Required because tree-sitter wasms, the BPE tokenizer, and native SQLite handles accumulate in the worker heap; the default threads pool OOMs on a 16-core box (15 workers × ~300 MB blows Node's 4 GB heap).
- `maxForks: 8`, `minForks: 1`.
- `retry: 1` — absorbs Windows scheduler hiccups in `jobs.test.ts`, `loop.test.ts`, `bundle-smoke`. A real failure still re-fails on the single retry.
- `environment: "node"` (not jsdom). Ink/TUI tests render via the custom harness in `tests/helpers/ink-test.ts`.

## Test File Organization

**Location:**
- **Separate, flat** `tests/` directory at repo root (not co-located with `src/`).
- Subdirectories only where a cluster warrants it: `tests/repair/`, `tests/helpers/`, `tests/fixtures/`, `tests/support/`, `tests/mocks/`.
- Exception: `packages/core-utils/tests/**` and `desktop/src/**/*.test.ts(x)` are co-located (included via Vitest `include` globs).

**Naming:**
- `<subject>.test.ts` — e.g. `tests/loop.test.ts`, `tests/mcp-drift.test.ts`, `tests/context-manager-fold-economics.test.ts`.
- `.test.tsx` for tests rendering JSX (Ink/React components): `tests/wizard.test.tsx`, `tests/ui-model-picker.test.tsx`.
- 250+ test files; naming is descriptive and often scenario-flavored (`loop-r1-reasoning.test.ts`, `mcp-stdio-stderr-leak.test.ts`).

**Structure:**
```
tests/
├── *.test.ts(x)          # flat suite, one file per subject/scenario
├── repair/               # cluster for src/repair/*
├── helpers/              # ink-test.ts, ink-stdio.ts — shared harnesses
├── fixtures/             # NDJSON, .mjs stub binaries, code-query samples
├── support/              # lifecycle-harness.ts — multi-step integration setups
└── mocks/                # tauri-api-*.ts, tauri-plugin-*.ts, lucide-react.ts
```

## Test Structure

**Suite Organization — the canonical pattern:**

```typescript
/** One-line module header naming the subject (optional). */
import { describe, expect, it } from "vitest";
import { analyzeSchema, flattenSchema, nestArguments } from "../../src/repair/flatten.js";

describe("analyzeSchema", () => {
  it("does not flatten flat shallow schemas", () => {
    const d = analyzeSchema({ type: "object", properties: { a: { type: "string" } } });
    expect(d.shouldFlatten).toBe(false);
  });

  it("flags deep schemas", () => {
    // ...
    expect(d.shouldFlatten).toBe(true);
  });
});
```

(From `tests/repair/flatten.test.ts`.) Tests are small, behavior-focused, one assertion intent per `it`.

**Patterns:**
- **`describe` per public function / per concept**; nested describes for sub-features.
- **No shared mutable setup across files** — each file is a forked process.
- **`beforeEach`/`afterEach` for per-test fixtures** (temp dirs via `mkdtempSync`, `rmSync` in afterEach). See `tests/shell-tools.test.ts`.
- **Cleanup of global singletons** — e.g. `tests/loop.test.ts` deletes `DEEPSEEK_CONTEXT_TOKENS[FOLD_TEST_MODEL]` in `afterEach` to avoid cross-test leakage through module state.
- **Behavioral naming** — `"evicts the least-recently-used key past the limit"`, not `"test_lru_3"`.

## Mocking

**Framework:** `vi` from Vitest (fn, spies, mocks). Plus module-alias stubs.

**Patterns:**

*Injectable dependencies via constructor options — preferred over module mocking:*
```typescript
function fakeFetch(responses: FakeResponseShape[]): typeof fetch {
  let i = 0;
  return vi.fn(async (_url: any, init: any) => {
    const body = init?.body ? JSON.parse(init.body) : {};
    const resp = responses[i++] ?? responses[responses.length - 1]!;
    return new Response(JSON.stringify({ /* echo + canned response */ }),
      { status: 200, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
}

const client = new DeepSeekClient({ apiKey: "sk-test", fetch: fakeFetch([...]) });
```
(From `tests/loop.test.ts` — fake-fetch + `DeepSeekClient` injection.)

*Subclass stubs for gates/policy:*
```typescript
class SpyGate extends PauseGate {
  lastCall: Parameters<PauseGate["ask"]>[0] | null = null;
  override ask = ((opts) => { this.lastCall = opts; return Promise.resolve({ type: "deny" }); }) as PauseGate["ask"];
}
```
(From `tests/shell-tools.test.ts`.)

*Module-level alias stubs (configured in `vitest.config.ts` `resolve.alias`):*
- `lucide-react` → `tests/mocks/lucide-react.ts`
- `@tauri-apps/api/{core,event,window,webview}` → `tests/mocks/tauri-api-*.ts`
- `@tauri-apps/plugin-{dialog,notification,process,updater,opener}` → `tests/mocks/tauri-plugin-*.ts`
- `react` / `react-dom` pinned to the real installed copies (avoids duplicate-React in Ink tests).

**What to Mock:**
- Network — always. Inject `fetch` into `DeepSeekClient`; never hit the real API.
- The Tauri runtime in `desktop/` tests (use the alias mocks).
- Time / scheduler where flakiness would otherwise leak in.

**What NOT to Mock:**
- The unit under test itself. Import the real module from `../src/...js`.
- The filesystem for logic tests — use real temp dirs (`mkdtempSync`) rather than mocking `node:fs`. The shell tests actually spawn real processes (`tests/shell-tools.test.ts`, `tests/jobs.test.ts`); that's intentional and is why `pool: "forks"` + `retry: 1` exist.

## Fixtures and Factories

**Test Data:**
- Built inline in the test for small cases (schemas, messages).
- Helper factory functions per file for repeated shapes: `toolSpec(name)`, `makeClient(responses)`, `fakeFetch(responses)` (see `tests/loop.test.ts`).
- No central factories directory — keep factories next to the tests that use them.

**Fixtures location:** `tests/fixtures/`
- `acp-driver.ndjson` — canned NDJSON stream for ACP tests.
- `code-query/` — sample source trees for code-query tests.
- `input-emit-stub.mjs`, `scene-echo-stub.mjs` — tiny standalone `.mjs` binaries spawned by child-process tests (read stdin, append to a file pointed at by an env var). Used to test the shell tooling without depending on platform-specific binaries.

**Support harnesses:** `tests/support/lifecycle-harness.ts` — shared multi-step integration setup for lifecycle tests. `tests/helpers/ink-test.ts` — Ink renderer harness with a fake `TestStdout`/`TestStdin` for asserting TUI output (strips ANSI, widens cursor-forward escapes).

## Coverage

**Requirements:** No hard threshold is enforced in CI config, but coverage is generated every CI run (`npm run test:coverage`, v8 provider, reporters: text/html/json-summary, includes `src/**`, excludes `*.test.ts`). A coverage job summary is emitted by `scripts/coverage-summary.mjs`.

**View Coverage:**
```bash
npm run test:coverage      # writes html/ + json-summary
```

Coverage is treated as a signal, not a target — CONTRIBUTING explicitly bans "tests just to bump coverage" and tests that restate type signatures. Mutation testing (Stryker) is the stronger quality signal; it targets the load-bearing core.

## Test Types

**Unit Tests:**
- The bulk of `tests/`. Pure-logic modules: `tests/lru.test.ts`, `tests/repair/flatten.test.ts`, `tests/tokenizer.test.ts`, `tests/retry.test.ts`. Fast, no I/O.

**Integration Tests:**
- Multi-module flows through real seams. `tests/loop.test.ts` exercises `CacheFirstLoop` end-to-end with a fake-fetch client. `tests/shell-tools.test.ts` spawns real processes against temp dirs. `tests/mcp-integration.test.ts`, `tests/lifecycle.test.ts`, `tests/lifecycle-e2e.test.ts` exercise bridges and the full agent loop.

**Snapshot / API-snapshot Tests:**
- `tests/public-api.test.ts` — snapshots the exported names of `src/index.ts`; fails on unintended public-surface changes. Maintain by updating the snapshot when the public API intentionally changes.
- Ink renderer tests (`*.test.tsx`) assert against normalized ANSI-stripped output via `tests/helpers/ink-test.ts`.

**E2E / Bench:**
- `tests/bundle-smoke.test.ts` — real spawn + tokenizer cold load.
- `benchmarks/` (τ-bench runner) — exercised in CI as a `--dry` smoke test (no API key required).

## Meta / Policy Tests

The suite enforces project conventions mechanically — these are first-class tests under `npm run verify`:

- **`tests/comment-policy.test.ts`** — see CONVENTIONS.md. Scans all `.ts` in `src/`, `tests/`, `benchmarks/`, `scripts/`, `dashboard/src/` and fails on comment noise (banned FIXME, bare TODO, version refs, "Phase N" narrative, multi-line block comments > 3, etc.).
- **`tests/architecture-invariants.test.ts`** — pillar invariants promoted from spikes (e.g. `ImmutablePrefix.fingerprint` determinism).
- **`tests/public-api.test.ts`** — public export surface snapshot.
- **`tests/node-version.test.ts`**, **`tests/bundle-smoke.test.ts`** — runtime/infra guardrails.

When adding a new invariant worth defending, prefer a meta-test in `tests/` over a note in docs.

## Common Patterns

**Async Testing:**
```typescript
it("completes a single-turn plain chat", async () => {
  const client = makeClient([{ content: "hi there" }]);
  const loop = new CacheFirstLoop({ client, /* ... */ });
  // ... drive the loop ...
  expect(result).toEqual(/* ... */);
});
```
Standard `async`/`await` inside `it`. No custom async helpers.

**Error Testing:**
```typescript
await expect(fnThatThrows()).rejects.toThrow(/pattern/);
```
Or assert on returned error text for the loop's user-facing errors via `formatLoopError(...)` and match the i18n string.

**Spawning real subprocesses** (shell tests): use `mkdtempSync(tmpdir())` for an isolated CWD, write inputs with `writeFileSync`, clean up in `afterEach` with `rmSync(temp, { recursive: true, force: true })`. The forks pool keeps each spawning test in its own process so a hang in one file doesn't poison others.

---

*Testing analysis: 2026-07-02*
