# Testing Patterns

**Analysis Date:** 2026-07-22

## Test Framework

**Runner:**
- Vitest 2.1.9 is the installed unit/integration runner (`package-lock.json`), within the `^2.1.5` range declared by `package.json`.
- Configuration: `vitest.config.ts`.
- Tests run in a Node environment with globals disabled, so import `describe`, `it`/`test`, `expect`, lifecycle hooks, and `vi` explicitly from `vitest` (`vitest.config.ts`, `tests/lru.test.ts`, `tests/comment-policy.test.ts`).
- Vitest uses the `forks` pool with one to eight forks for per-file process isolation; the rationale in `vitest.config.ts` is to prevent tokenizer, tree-sitter, and native-handle accumulation from exhausting a shared heap.
- The configured per-test retry is one, while CI deliberately overrides the first full run to zero retries for visibility (`vitest.config.ts`, `scripts/ci-test-with-retry.mjs`).

**Assertion Library:**
- Use Vitest's built-in `expect` API (`tests/lru.test.ts`, `tests/retry.test.ts`).
- Prefer semantic matchers such as `toEqual`, `toMatchObject`, `toContain`, `toBeCloseTo`, `resolves`, and `rejects`; examples appear in `tests/repair/pipeline.test.ts`, `tests/ui-reducer.test.ts`, and `tests/client-stream-timeout.test.ts`.
- Snapshot assertions are not an established pattern: no `toMatchSnapshot` or `toMatchInlineSnapshot` calls are present in the live `tests/` or `packages/core-utils/tests/` suites.

**Run Commands:**
```bash
npm test                 # Run the full configured Vitest suite once
npm run test:watch       # Run Vitest in watch mode
npm run test:coverage    # Run the suite with V8 coverage
npm run test:mutation    # Run targeted Stryker mutation testing
npm run verify           # Build, lint, typecheck, then run Vitest
```
All commands are defined in `package.json`; `npm run verify` is also the pre-push hook configured there.

## Test File Organization

**Location:**
- Root behavior tests are separate from source under `tests/**/*.test.ts` and `tests/**/*.test.tsx` (`vitest.config.ts`).
- Repair pipeline tests use the feature subdirectory `tests/repair/`, mirroring `src/repair/`; examples are `tests/repair/pipeline.test.ts` and `tests/repair/truncation.test.ts`.
- Shared root test helpers live in `tests/helpers/`, reusable domain harnesses in `tests/support/`, static inputs and subprocess programs in `tests/fixtures/`, and global setup in `tests/setup-lang.ts`.
- The private core utility package keeps tests beside the package at `packages/core-utils/tests/**/*.test.ts` (`vitest.config.ts`).
- The live suite contains 281 files: 251 `.test.ts`, 30 `.test.tsx`, with 276 under `tests/` and five under `packages/core-utils/tests/`.

**Naming:**
- Name files after the unit or behavior under test, such as `tests/retry.test.ts`, `tests/config.test.ts`, and `tests/wizard.test.tsx`.
- Use behavior qualifiers when one module has multiple contracts, such as `tests/client-stream-timeout.test.ts`, `tests/mcp-reconnect-prefix-invariant.test.ts`, and `tests/context-manager-cache-aligned-fold.test.ts`.
- Use `.test.tsx` whenever the test renders JSX, as in `tests/wizard.test.tsx` and `tests/cardstream-architecture.test.tsx`.

**Structure:**
```text
tests/
├── *.test.ts                 # Unit, integration, CLI, and regression tests
├── *.test.tsx                # TUI/component behavior tests
├── helpers/                  # Ink render and fake stdio helpers
├── support/                  # Reusable domain harnesses
├── fixtures/                 # Static and subprocess test inputs
├── repair/                   # Repair-pipeline feature tests
└── setup-lang.ts             # Global deterministic language setup

packages/core-utils/tests/
└── *.test.ts                 # Private utility package tests
```
This layout is selected explicitly by `vitest.config.ts`.

## Test Structure

**Suite Organization:**
```typescript
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("atomicWriteSync", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "atomic-write-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("rethrows non-EXDEV rename errors and cleans up tmp", () => {
    // Arrange dependency seam, act, then assert behavior and cleanup.
  });
});
```
The lifecycle and naming pattern comes from `tests/atomic-write.test.ts`.

**Patterns:**
- Group tests by exported class, function, subsystem, or invariant with `describe`; use full behavioral sentences for `it`/`test` names (`tests/lru.test.ts`, `tests/architecture-invariants.test.ts`).
- Keep arrange/act/assert visible through code shape rather than section comments; the comment restrictions are enforced by `tests/comment-policy.test.ts` and documented in `CONTRIBUTING.md`.
- Test observable outputs, typed state, emitted events, cleanup, and boundary behavior instead of implementation-private details (`tests/retry.test.ts`, `tests/ui-reducer.test.ts`).
- Use `it.each` for a compact behavior matrix when inputs share the same contract, as in `tests/auto-git-rollback.test.ts`.
- Add explicit timeouts only to real subprocess or intentionally long asynchronous cases, as the 30–60 second bounds in `tests/mcp-integration.test.ts` demonstrate.
- Use `it.skip` conditionally when a prerequisite artifact is absent. `tests/bundle-smoke.test.ts` runs its post-build checks only when `dist/index.js` or `dist/cli/index.js` exists.

## Mocking

**Framework:** Vitest `vi`

**Patterns:**
```typescript
const mocks = vi.hoisted(() => ({
  initializeMock: vi.fn(async () => undefined),
}));

vi.mock("../src/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/config.js")>();
  return { ...actual, readConfig: mocks.readConfigMock };
});
```
Use the hoisted-module pattern for ESM module mocks and partial imports, following `tests/acp-mcp.test.ts`.

**What to Mock:**
- Inject `fetch` functions for network behavior and failure timing instead of contacting external APIs; see `tests/retry.test.ts`, `tests/client-models.test.ts`, and `tests/client-stream-timeout.test.ts`.
- Mock CLI command modules, process exits, stdout, and stderr when testing routing in-process (`tests/cli-critical-commands.test.ts`).
- Mock module boundaries with `vi.hoisted`, `vi.mock`, `vi.resetModules`, and dynamic import when ESM initialization order matters (`tests/acp-mcp.test.ts`, `tests/chat-mcp-startup-summary.test.ts`).
- Use `vi.useFakeTimers()` for deterministic TTL, scheduler, and timeout behavior, and restore real timers in teardown (`tests/lru.test.ts`, `tests/context-manager-fold-timeout.test.ts`).
- Prefer explicit dependency seams over module mocks where the implementation supports them: `AtomicWriteFs` in `tests/atomic-write.test.ts`, injected `fetch` in `tests/retry.test.ts`, and `ToolRegistry` fixtures in `tests/support/lifecycle-harness.ts`.

**What NOT to Mock:**
- Do not mock pure reducers, parsers, repair logic, or small deterministic utilities; exercise them directly as in `tests/ui-reducer.test.ts`, `tests/repair/pipeline.test.ts`, and `packages/core-utils/tests/compaction.test.ts`.
- Do not mock the subprocess boundary when the contract is specifically process interoperability. `tests/mcp-integration.test.ts` starts `examples/mcp-server-demo.ts`, and `tests/bundle-smoke.test.ts` invokes built JavaScript with Node.
- Do not contact production API endpoints or require live credentials in the default suite. Network paths use fakes or loopback endpoints in `tests/client-models.test.ts` and `tests/bundle-smoke.test.ts`.

## Fixtures and Factories

**Test Data:**
```typescript
function call(id: string, name: string, args: string): ToolCall {
  return { id, type: "function", function: { name, arguments: args } };
}

function buildSession(turns: number, toolsPerTurn: (turn: number) => number): LoopEvent[] {
  // Build only the domain shape needed by the invariant.
}
```
Small local builders are preferred for test-specific domain data (`tests/repair/pipeline.test.ts`, `tests/architecture-invariants.test.ts`).

**Location:**
- Keep a one-file factory inside its test, as `makeFetch` does in `tests/retry.test.ts` and `hangingStreamFetch` does in `tests/client-stream-timeout.test.ts`.
- Move reusable UI mechanics into `tests/helpers/ink-test.ts` or `tests/helpers/ink-stdio.ts`; these normalize ANSI output while retaining raw bytes for protocol-level assertions.
- Put reusable domain setup in `tests/support/`, such as `createStrictLifecycleHarness` in `tests/support/lifecycle-harness.ts`.
- Put executable or language-specific sample inputs in `tests/fixtures/`, including `tests/fixtures/scene-echo-stub.mjs` and `tests/fixtures/code-query/sample.rs`.
- Use OS temporary directories via `mkdtemp`/`mkdtempSync`, then remove them recursively in `afterEach`/`afterAll`; this pattern appears in `tests/atomic-write.test.ts`, `tests/config.test.ts`, and `tests/auto-git-rollback.test.ts`.

## Coverage

**Requirements:** No line, statement, branch, or function percentage threshold is enforced in `vitest.config.ts`. Coverage is reported, while Stryker enforces mutation-score thresholds separately in `stryker.config.mjs`.

**Provider and Scope:**
- V8 coverage is configured in `vitest.config.ts` with text, HTML, and JSON-summary reporters.
- Coverage includes `src/**` and excludes `src/**/*.test.ts` (`vitest.config.ts`).
- CI reads `coverage/coverage-summary.json` and appends statement, branch, function, and line percentages to the GitHub job summary (`scripts/coverage-summary.mjs`). A missing report does not independently fail the summary step.

**View Coverage:**
```bash
npm run test:coverage
```
Open `coverage/index.html` for the HTML report generated by `vitest.config.ts`.

**Mutation Testing:**
- Run `npm run test:mutation`; `stryker.config.mjs` uses `@stryker-mutator/vitest-runner`.
- Mutation targets are deliberately limited to `src/loop.ts`, `src/context-manager.ts`, `src/core/**/*.ts`, selected tool modules, and `src/repair/**/*.ts` (`stryker.config.mjs`).
- The mutation run selects focused tests from `tests/loop.test.ts`, `tests/shell-tools.test.ts`, `tests/plan.test.ts`, `tests/choice.test.ts`, and `tests/repair/*.test.ts` (`stryker.config.mjs`).
- Mutation thresholds are high 80, low 60, and build-breaking below 50, with progress, text, HTML, and JSON reporting to `reports/mutation/mutation.json` (`stryker.config.mjs`).

## Test Types

**Unit Tests:**
- Exercise pure functions, reducers, caches, parsers, and formatting directly. Representative files are `tests/lru.test.ts`, `tests/retry.test.ts`, `tests/ui-reducer.test.ts`, `tests/repair/pipeline.test.ts`, and `packages/core-utils/tests/compaction.test.ts`.
- Lock down edge cases and invariants rather than type signatures or trivial getters, following `CONTRIBUTING.md`.

**Integration Tests:**
- Exercise filesystem semantics in isolated temporary directories (`tests/atomic-write.test.ts`, `tests/config.test.ts`).
- Exercise actual Git repositories and commands where repository state is the contract (`tests/auto-git-rollback.test.ts`).
- Exercise MCP end-to-end against a real local subprocess, without external services (`tests/mcp-integration.test.ts`, `examples/mcp-server-demo.ts`).
- Exercise CLI routing in-process with mocked command boundaries (`tests/cli-critical-commands.test.ts`) and built bundle behavior in subprocesses (`tests/bundle-smoke.test.ts`).

**E2E Tests:**
- No separate browser E2E framework is configured in `package.json` or `vitest.config.ts`.
- End-to-end behavior is covered by Vitest subprocess tests such as `tests/mcp-integration.test.ts`, `tests/lifecycle-e2e.test.ts`, and `tests/bundle-smoke.test.ts`.
- Standalone probes and evaluation drivers under `scripts/`, `tools/`, and `benchmarks/` are not part of Vitest's default include list (`vitest.config.ts`). CI separately runs the τ-bench harness in dry mode through `.github/workflows/ci.yml`.

**UI/TUI Tests:**
- Render React terminal components through the local `ink` alias using `tests/helpers/ink-test.ts` or `ink-testing-library`, as in `tests/wizard.test.tsx` and `tests/cardstream-architecture.test.tsx`.
- Assert normalized visible text for user behavior and raw terminal bytes only for protocol sequences; the helper contract is documented in `tests/helpers/ink-test.ts` and `tests/helpers/ink-stdio.ts`.
- Explicitly unmount or clean up rendered trees after assertions (`tests/wizard.test.tsx`, `tests/composer-hint.test.tsx`).

## Common Patterns

**Async Testing:**
```typescript
it("gives up after maxAttempts", async () => {
  await expect(fetchWithRetry(fetcher, url, {}, options)).rejects.toThrow(/dns lookup failed/);
});

afterEach(async () => {
  if (client) await client.close();
});
```
Assert promises directly and close owned resources in teardown, following `tests/retry.test.ts` and `tests/mcp-integration.test.ts`.

**Error Testing:**
```typescript
expect(() => atomicWriteSync(target, body, tmp, 0o600, fs)).toThrow(/EACCES/);
await expect(client.chat(request)).rejects.toThrow(/timed out/i);
expect(existsSync(tmp)).toBe(false);
```
Assert both the surfaced error and the cleanup or state invariant (`tests/atomic-write.test.ts`, `tests/client-stream-timeout.test.ts`).

**Environment Isolation:**
- Save original `process.env`, `process.argv`, current directory, and stream methods before mutation, then restore them in `afterEach`; see `tests/config.test.ts` and `tests/cli-critical-commands.test.ts`.
- Delete absent environment keys rather than assigning `undefined`; justified Biome suppressions in `tests/config.test.ts` document why.
- Set the default runtime language once in `tests/setup-lang.ts`, and locally restore it when a suite changes languages (`tests/wizard.test.tsx`).

## CI Practices

- The required Windows CI job installs with `npm ci`, then runs lint, typecheck, build, the docs gate, Vitest with coverage, and a τ-bench dry-run (`.github/workflows/ci.yml`).
- The maintained CI runtime is Windows with Node 24.15.0 and npm 11.16.0, while `package.json` declares Node `>=22` for consumers (`.github/workflows/ci.yml`, `package.json`).
- CI's first test attempt runs the full suite with coverage and `--retry=0`. Only after a failure does `scripts/ci-test-with-retry.mjs` rerun with `--retry=1`, recording the outcome in the GitHub step summary.
- Build precedes tests in CI, so conditional bundle checks in `tests/bundle-smoke.test.ts` execute there even though a local `npm test` without `dist/` may skip them (`.github/workflows/ci.yml`).
- CodeQL separately builds and analyzes JavaScript/TypeScript with the `security-extended` query suite on pushes, pull requests, and a weekly schedule (`.github/workflows/codeql.yml`).
- The manual npm publish workflow repeats lint, typecheck, build, docs, coverage tests, and the τ-bench dry-run before publishing `reasonix-legacy`; it verifies the requested `vX.Y.Z` tag matches `package.json` (`.github/workflows/publish-npm.yml`).
- Local Git hooks run lint on pre-commit and the full `npm run verify` pipeline on pre-push (`package.json`).

---

*Testing analysis: 2026-07-22*
