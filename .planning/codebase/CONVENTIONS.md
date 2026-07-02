# Coding Conventions

**Analysis Date:** 2026-07-02

## Project Context

Reasonix-legacy is a DeepSeek-native coding agent CLI/TUI written in TypeScript (strict mode, ESM, Node ≥ 22). The codebase is "small and opinionated" — conventions are enforced by Biome, `tsc`, a pre-push `verify` hook, and a custom **comment-policy test** (`tests/comment-policy.test.ts`) that mechanically rejects noise. The rules below are not aspirational; they are gates.

Primary authority: `CONTRIBUTING.md` (the "Code rules" section). Read it before adding code.

## Naming Patterns

**Files:**
- `kebab-case.ts` for modules: `context-manager.ts`, `pause-gate.ts`, `at-mentions.ts`, `tool-call-ready.ts`.
- One responsibility per file; when a file grows large, split into a same-named directory of submodules (see `src/loop/`, `src/tools/shell/`, `src/mcp/`).
- Test files mirror the subject with a `.test.ts` suffix and live in `tests/` (flat), e.g. `tests/loop.test.ts` ↔ `src/loop.ts`, `tests/repair/flatten.test.ts` ↔ `src/repair/flatten.ts`.

**Functions:**
- `camelCase` for functions and variables: `fetchWithRetry`, `truncateForModel`, `formatLoopError`.
- `PascalCase` for classes and class factories: `CacheFirstLoop`, `ToolRegistry`, `DeepSeekClient`, `ImmutablePrefix`.
- `UPPER_SNAKE_CASE` for module-level constants, often exported: `DEFAULT_RETRYABLE_STATUSES`, `HISTORY_FOLD_THRESHOLD`, `DEEPSEEK_CONTEXT_TOKENS`.

**Types / Interfaces:**
- `PascalCase`: `ChatMessage`, `ToolSpec`, `LoopEvent`, `RetryOptions`.
- Prefer `interface` for object shapes; `type` for unions and aliases.
- Option bags are typed as `XOptions` (e.g. `LoopOptions`, `RetryOptions`, `McpClientOptions`) and passed by name — split responsibilities rather than growing an option bag past ~5 flags.
- Don't re-export a type across files just to share it; move it to the file that owns the concept.

**Enums / unions:**
- String-literal unions preferred over runtime enums: `export type Role = "system" | "user" | "assistant" | "tool"` (`src/types.ts`).
- Discriminated unions for events with a literal `type` field (`src/core/pause-gate.ts`, `src/core/events.ts`).

## Code Style

**Formatting (Biome — `biome.json`):**
- 2-space indent, 100-char line width.
- Double quotes, always-semicolons, trailing commas everywhere.
- `organizeImports` enabled — let Biome sort imports; do not hand-order.
- Run `npm run lint:fix` / `npm run format` to auto-apply.

**Linting (Biome recommended rules + overrides):**
- `style.noNonNullAssertion`: off (allowed).
- `style.useImportType`: warn — use `import type` for type-only imports.
- `suspicious.noExplicitAny`: off, BUT per CONTRIBUTING "No `any` without a `// biome-ignore` and a reason." In practice `any` appears in test fixtures and JSON parsing; production code prefers narrow types and adds an ignore comment with justification.
- Ignored paths: `dist`, `node_modules`, `coverage`, `*.d.ts`, `dashboard/codemirror.js`, `packages/ink/**`.

**TypeScript (`tsconfig.json`):**
- `strict: true`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- Target `ES2022`, `module: ESNext`, `moduleResolution: Bundler`.
- Path aliases: `@/*` → `src/*`, `ink` → `packages/ink/src/index.ts`.
- `isolatedModules: true` — every file must be independently transpilable (matters for tsup/esbuild builds).

**Lints/gates run by `npm run verify`:**
- `biome check src tests`
- `tsc --noEmit` (and `tsc --noEmit -p dashboard`)
- `tsup` build
- `vitest run` (incl. `tests/comment-policy.test.ts`)
- Wired into git hooks via `simple-git-hooks`: `pre-commit` = lint, `pre-push` = full `verify`.

## Import Organization

Biome's `organizeImports` sorts imports; the observed grouping (after Biome runs) is:

1. Node built-ins (`node:fs`, `node:path`, `node:os`).
2. External packages (`vitest`, `ink`, `eventsource-parser`).
3. Internal absolute/aliased imports (`@/...`, `@reasonix/core-utils`).
4. Relative imports (`./client.js`, `../src/loop.js`).

**Path aliases:**
- `@/*` → `src/*` (configured in both `tsconfig.json` and `vitest.config.ts`).
- `ink` → local `packages/ink/src/index.ts` (the vendored Ink fork).

**`.js` extensions on relative imports are mandatory** because this is real ESM consumed by Node directly during `tsx` dev runs and tsup builds. Write `import { x } from "./client.js"` even for a `.ts` source file. Example: `src/loop.ts` imports `"./client.js"`, `"./context-manager.js"`, `"./memory/runtime.js"`.

**Type-only imports** use `import type { ... }` (enforced as a Biome warning). Example: `src/loop.ts` line 2 — `import type { ReasoningEffort } from "./config.js"`.

## Comments

**Default is no comment.** This is the most aggressively enforced convention. See `CONTRIBUTING.md` "Comments — default is none" and `tests/comment-policy.test.ts`.

The comment-policy test mechanically scans `src`, `tests`, `benchmarks`, `scripts`, `dashboard/src` for `.ts` files and fails the suite on:

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

**When a comment IS justified:**
- A hidden constraint ("Yoga miscounts wrap → must clamp to width-1").
- A workaround for a specific bug.
- A subtle invariant the type system can't express.

If a comment needs 4+ lines, refactor (rename/extract/simplify) before commenting. One-line JSDoc on exported config knobs is acceptable — see `src/retry.ts` for the pattern: short `/** ... */` on each option field.

## Error Handling

**Strategy: trust internal code, validate at boundaries.** From CONTRIBUTING:

- Don't wrap internal calls in try/catch "just in case" — trust your own code.
- Don't validate things the type system already proves.
- Boundary code (user input, network, filesystem, child-process spawn) DOES validate.
- No "graceful fallback" that silently masks bugs. **Log + crash > silent wrong output.**

**Concrete patterns:**

- **Network retry** — `src/retry.ts` `fetchWithRetry`. Classifies HTTP status (`DEFAULT_RETRYABLE_STATUSES = [408,429,500,502,503,504]`), exponential backoff with jitter, never retries aborts or mid-stream body errors (re-billing for desynced output is worse than failing). Configurable via `RetryOptions`.
- **Loop error formatting** — `src/loop/errors.ts` `formatLoopError`. Pattern-matches error message ("maximum context length", `DeepSeek (\d{3}):`) and produces localized user-facing text via the i18n runtime (`t("errors.contextOverflow", ...)`).
- **Confirmation gates (not exceptions)** — destructive/side-effecting tools go through `PauseGate.ask(...)` (`src/core/pause-gate.ts`) which returns a `ConfirmationChoice`. Test code injects a `SpyGate`/`AutoGate` subclass that overrides `ask` (see `tests/shell-tools.test.ts`).
- **Errors as control flow** for tool-driven UI modals: `PlanProposedError`, `ChoiceRequestedError`, `NeedsConfirmationError` (thrown by tools, caught by the loop to surface a modal). These are intentional, not debt.
- **Throw new Error("aborted")** on `AbortSignal` to short-circuit — see `src/retry.ts`.

## Logging

**Framework:** No pino/winston. Console + an i18n runtime (`src/i18n/index.ts`).

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

**Exports:**
- Named exports only. No default exports observed in `src/`.
- Separate `export { ... }` (values) from `export type { ... }` (types) — see `src/index.ts` for the canonical grouping pattern.
- **No barrel `index.ts` re-exports** unless they meaningfully shrink the public surface. `src/index.ts` is the legitimate library entry (and is snapshotted by `tests/public-api.test.ts`); subdirectory `index.ts` files exist only where they consolidate a real API (`src/i18n/index.ts`, `src/mcp/types.ts`).

**File headers:** zero or one line. A single `/** ... */` JSDoc line naming the module is the maximum — see `src/index.ts` line 1, `src/retry.ts` line 1.

**Library over hand-rolled:** Use maintained npm libs for solved problems. Documented landmines:
- Visual/unicode width → `string-width`.
- Grapheme segmentation → `Intl.Segmenter`.
- ANSI strip → ships with `string-width`.
- Colors in components → `src/theme.ts` constants, never raw hex.

## Git / Commit Conventions

- Imperative mood, scope tag, why-not-what: `feat(ui): ...`, `fix(loop): ...`, `chore(release): ...`.
- One logical change per commit; refactors land separately from features.
- **No `Co-Authored-By: Claude` trailer.**
- Don't edit `CHANGELOG.md` in PRs — maintainer-only at release time.

## Special: Desktop (Tauri) Subdir

`desktop/src/**` follows the same TS/Biome rules and is included in the comment-policy scan and in the Vitest `include` globs. Tauri APIs are aliased to test mocks in `vitest.config.ts` (`@tauri-apps/api/*` → `tests/mocks/tauri-*.ts`) — never import the real Tauri modules in tests.

---

*Convention analysis: 2026-07-02*
