# Coding Conventions

**Analysis Date:** 2026-07-22

## Naming Patterns

**Files:**
- Use lowercase kebab-case for ordinary TypeScript modules, such as `src/context-manager.ts`, `src/core/atomic-write.ts`, and `src/tools/shell-chain.ts`.
- Use PascalCase filenames for React components, such as `src/cli/ui/Wizard.tsx`, `src/cli/ui/cards/ErrorCard.tsx`, and `src/cli/ui/primitives/Card.tsx`.
- Prefix React hook filenames with `use`: root UI hooks use camelCase names such as `src/cli/ui/hooks/useActivityPhase.ts`, while the vendored Ink subtree preserves kebab-case names such as `packages/ink/src/hooks/use-terminal-viewport.ts`.
- Name tests `<subject>.test.ts` or `<subject>.test.tsx` and keep them in `tests/`, a feature subdirectory such as `tests/repair/`, or the owning private package such as `packages/core-utils/tests/` (`vitest.config.ts`).
- Reserve `index.ts` for deliberate public or subsystem surfaces. The root library barrel is `src/index.ts`, the core utility barrel is `packages/core-utils/src/index.ts`, and the contribution rule discourages new barrels that do not materially shrink a public surface (`CONTRIBUTING.md`).

**Functions:**
- Use camelCase verbs for functions and methods: `atomicWrite`, `formatLoopError`, `probeDeepSeekReachable`, and `deriveActivityLabel` in `src/core/atomic-write.ts`, `src/loop/errors.ts`, and `src/cli/ui/hooks/useActivityPhase.ts`.
- Prefix React hooks with `use`, as in `useActivityLabel` in `src/cli/ui/hooks/useActivityPhase.ts` and the hook exports in `packages/ink/src/index.ts`.
- Name boolean predicates with `is`, `has`, or `can` semantics, as in `is5xxError`, `isDeepSeekHost`, and `Usage.hasApiUsage` in `src/loop/errors.ts` and `src/client.ts`.
- Use `load*`, `save*`, `read*`, `write*`, and `resolve*` consistently for configuration and filesystem boundaries in `src/config.ts` and `src/index.ts`.

**Variables:**
- Use camelCase for locals, parameters, object fields, and class members (`promptTokens`, `waitMs`, `nextChatRequestAt`) in `src/client.ts`.
- Use `UPPER_SNAKE_CASE` for module constants, including `COMPACTION_SUMMARY_MARKER` in `packages/core-utils/src/compaction.ts`, `STACK_TAIL` in `src/cli/ui/cards/ErrorCard.tsx`, and `CURSOR_FORWARD` in `tests/helpers/ink-test.ts`.
- Use a leading underscore only for narrowly scoped internal instance fields where the code already follows that convention, such as `_fetch` in `src/client.ts` and `_turnAbort` in `src/loop.ts`; do not introduce it for ordinary locals.

**Types:**
- Use PascalCase for interfaces, type aliases, classes, and error classes: `AtomicWriteFs`, `Event`, `ModelClient`, and `PlanProposedError` in `src/core/atomic-write.ts`, `src/core/events.ts`, `src/ports/model-client.ts`, and `src/tools/plan-errors.ts`.
- Use discriminated string-literal unions for domain states and events. `Event` is discriminated by `type` in `src/core/events.ts`; plan verdicts and tool states follow the same pattern in `src/core/pause-gate.ts` and `src/tools/plan-types.ts`.
- Put a concept's type beside its owner instead of creating a re-export-only type module; this is the explicit rule in `CONTRIBUTING.md`, with ports kept separate only when they are architectural contracts such as `src/ports/model-client.ts`.

## Code Style

**Formatting:**
- Run Biome 1.9.4 through `npm run format`; `package.json` limits formatting to `src` and `tests`, and `biome.json` configures two-space indentation, 100-column lines, double quotes, semicolons, and trailing commas.
- Run `npm run lint` before submitting changes; it executes `biome check src tests` from `package.json`.
- Preserve the embedded Ink package's existing local style when editing `packages/ink/**`. `biome.json` excludes that subtree, and files such as `packages/ink/src/index.ts` and `packages/ink/src/components/Box.tsx` use single quotes and default exports.
- Treat `.mjs` scripts as ESM and match their existing double-quote/semicolon style, as shown by `scripts/ci-test-with-retry.mjs` and `scripts/coverage-summary.mjs`; they are not included in the root Biome scripts in `package.json`.

**Linting:**
- Keep Biome's recommended rules enabled (`biome.json`). The explicit project overrides disable `noNonNullAssertion`, warn on `useImportType`, and disable `noExplicitAny`.
- Despite `noExplicitAny` being disabled in `biome.json`, the review contract says not to add `any` without a reason (`CONTRIBUTING.md`). Prefer `unknown`, narrowing, generics, or a boundary cast, as demonstrated by `errorMeta` in `src/loop/errors.ts` and transport parsing in `src/mcp/types.ts`.
- Use a narrowly targeted `// biome-ignore <rule>: <reason>` only when the runtime constraint is real. Examples include classic JSX requiring a value import in `src/cli/ui/cards/ErrorCard.tsx`, environment deletion semantics in `tests/config.test.ts`, and control-byte regexes in `tests/helpers/ink-test.ts`.

**TypeScript:**
- Keep strict compilation settings from `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `isolatedModules`, and casing enforcement are active.
- Account explicitly for possibly missing indexed values under `noUncheckedIndexedAccess`; existing code uses guards or justified non-null assertions, such as `infos[0]!` in `src/client.ts`.
- Use `override` on subclass methods where required, as `QueueGate.ask` does in `tests/support/lifecycle-harness.ts`.
- Use ESM throughout. `package.json` sets `type: module`, and source imports include `.js` extensions even when the authored file is `.ts`, for example `src/client.ts` and `src/core/events.ts`.

## Import Organization

**Order:**
1. Import Node built-ins first using `node:` specifiers, as in `src/core/atomic-write.ts` and `tests/atomic-write.test.ts`.
2. Import external packages next, as `eventsource-parser` precedes local modules in `src/client.ts` and `vitest` follows Node imports in `tests/atomic-write.test.ts`.
3. Import project modules last, using `.js` extensions for relative ESM paths; examples are `src/loop/errors.ts` and `tests/retry.test.ts`.
4. Allow Biome to sort and combine bindings within a source. Prefer inline `type` modifiers when values and types share a module (`src/client.ts`, `tests/support/lifecycle-harness.ts`), and `import type` for type-only modules (`src/ports/model-client.ts`).

**Path Aliases:**
- Use `@/*` for deep imports in the CLI slash-handler subtree, where it materially avoids long relative paths; examples are `src/cli/ui/slash/handlers/basic.ts` and `src/cli/ui/slash/handlers/observability.ts`. The alias is defined by `tsconfig.json` and mirrored by `vitest.config.ts`.
- Use the `ink` alias for the vendored private TUI runtime. It maps to `packages/ink/src/index.ts` in both `tsconfig.json` and `vitest.config.ts`, and is bundled through `tsup.config.ts`.
- Keep nearby feature imports relative, as in `src/cli/ui/cards/ErrorCard.tsx`; do not convert every local import to `@/`.

## Error Handling

**Patterns:**
- Validate and translate errors at network, filesystem, subprocess, user-input, and configuration boundaries; let internal invariant violations surface. This boundary rule is explicit in `CONTRIBUTING.md` and is visible in `src/client.ts`, `src/core/atomic-write.ts`, and `src/config.ts`.
- Accept `unknown` in error classifiers and narrow with `instanceof`, property checks, and typed casts, as `is5xxError` and `errorMeta` do in `src/loop/errors.ts`.
- Throw ordinary `Error` for unrecoverable failures and domain-specific subclasses when callers need structured control flow. `PlanProposedError` and `PlanRevisionProposedError` carry typed data and `toToolResult()` serialization in `src/tools/plan-errors.ts`.
- Use `try/finally` for owned timers and resources and rethrow unexpected failures after cleanup; `src/client.ts` clears request timers and `src/core/atomic-write.ts` removes temporary files before rethrowing.
- Catch and return `null` only for explicitly optional/degradable boundary features. `DeepSeekClient.getBalance()` and `listModels()` document this contract in `src/client.ts`; do not generalize silent fallback to core logic (`CONTRIBUTING.md`).
- Check platform error codes rather than message text when behavior depends on a system condition; the `EXDEV` fallback in `src/core/atomic-write.ts` uses `NodeJS.ErrnoException.code`.

## Logging

**Framework:** console and stream writes

**Patterns:**
- CLI commands write user-facing output with `console.log`, `console.error`, or `process.stdout`/`process.stderr`; `src/cli/commands/doctor.ts` and `src/cli/index.ts` are representative.
- Libraries generally return structured data or emit typed events instead of logging. `src/core/events.ts` defines the event contract and `src/ports/event-sink.ts` isolates event persistence.
- Log a boundary failure when continuing would otherwise hide it; do not add success chatter or silent recovery (`CONTRIBUTING.md`).
- Never log raw keys or tokens. Use redaction helpers such as `redactKey` and `redactSemanticEmbeddingConfig` from `src/config.ts` when configuration can contain credentials.

## Comments

**When to Comment:**
- Comment the non-obvious reason, hidden platform constraint, workaround, or invariant—not a restatement of the code (`CONTRIBUTING.md`). `src/core/atomic-write.ts` explains the Windows/OneDrive `EXDEV` constraint, and `vitest.config.ts` explains why fork isolation is required.
- Keep module headers to zero or one short line in normal code; the enforced maximum is two lines (`CONTRIBUTING.md`, `tests/comment-policy.test.ts`).
- Do not add phase/version narrative, incident history, translator notes, section-banner comments, or `FIXME`. `tests/comment-policy.test.ts` enforces each prohibition.
- Write debt markers as `TODO(#nnn): ...` or `HACK(#nnn): ...`; bare TODO/HACK markers fail `tests/comment-policy.test.ts`.
- Keep block comments at three lines or fewer; `tests/comment-policy.test.ts` enforces that cap across source, tests, benchmarks, and scripts.

**JSDoc/TSDoc:**
- Use short JSDoc for public contracts, surprising semantics, or typed properties, such as `src/ports/model-client.ts`, `src/core/events.ts`, and `src/client.ts`.
- Do not duplicate parameter names or obvious return types in prose; the contribution contract in `CONTRIBUTING.md` explicitly rejects restated parameter documentation.

## Function Design

**Size:**
- Keep pure transforms small and extract named helpers around boundary-heavy flows. `src/loop/errors.ts` separates status classification, message extraction, and formatting; `src/core/reducers.ts` separates event projections.
- Give each file one responsibility and add a new module rather than extending an already-large one (`CONTRIBUTING.md`).

**Parameters:**
- Prefer a typed options object for genuinely related optional boundary controls, especially `signal`, timeouts, injected clients, or paths; examples are `DeepSeekClientOptions` in `src/client.ts` and `GetLatestVersionOptions` exported from `src/index.ts`.
- Inject side-effecting dependencies when deterministic tests need control. `AtomicWriteFs` in `src/core/atomic-write.ts`, the `fetch` option in `src/client.ts`, and port interfaces in `src/ports/` are the established seams.
- Avoid expanding an options bag beyond one responsibility; `CONTRIBUTING.md` directs splitting responsibilities when five or more optional flags accumulate.

**Return Values:**
- Return explicit `Promise<T>` from exported async functions and `AsyncIterable<T>` for streams, as in `src/core/atomic-write.ts` and `src/ports/model-client.ts`.
- Use `null` or `undefined` only when absence is part of the declared contract, and narrow before use; `pickPrimaryBalance` and `getBalance` in `src/client.ts` are representative.
- Return structured objects for multi-value results rather than positional arrays, as in `errorMeta` in `src/loop/errors.ts` and tool registration results in `src/mcp/registry.ts`.

## Async and Configuration Conventions

**Async:**
- Thread `AbortSignal` through network, subprocess, indexing, and model operations. `src/client.ts`, `src/index/semantic/builder.ts`, `src/mcp/client.ts`, and `src/cli/headless/turn-driver.ts` establish this pattern.
- Combine caller cancellation with internal timeouts instead of choosing one; `DeepSeekClient.chat()` and `.stream()` use `AbortSignal.any` in `src/client.ts`.
- Use `Promise.all` for independent operations that should fail together (`src/cli/commands/doctor.ts`) and `Promise.allSettled` for cleanup or bounded parallel dispatch where every result must be observed (`src/net/proxy.ts`, `src/loop/dispatch.ts`).
- Always release timers, subprocesses, transports, and temporary artifacts in `finally` or teardown paths; examples are `src/client.ts`, `src/mcp/client.ts`, and `src/core/atomic-write.ts`.

**Configuration:**
- Centralize persisted and environment configuration in `src/config.ts`; feature modules should consume its `load*`, `save*`, and `resolve*` helpers instead of independently parsing the same settings.
- Preserve documented precedence as a complete endpoint tuple where applicable. `loadEndpoint` in `src/config.ts` keeps an API key paired with its base URL, and `tests/config.test.ts` locks down environment-versus-file behavior.
- Inject `NodeJS.ProcessEnv` into helpers that need deterministic parsing, as `detectEditor` in `src/cli/edit/external-editor.ts` and proxy detection in `src/net/proxy.ts` do.
- Write user configuration atomically and apply restrictive permissions where supported through `src/core/atomic-write.ts` and `src/config.ts`.

## Module Design

**Exports:**
- Prefer named exports for root application and library code. `src/index.ts`, `src/client.ts`, `src/core/events.ts`, and `packages/core-utils/src/index.ts` expose named values and separate type exports.
- Use default exports only where the local package already standardizes them, primarily the vendored Ink implementation under `packages/ink/src/`.
- Keep the public package identity singular: `package.json` defines `reasonix-legacy@1.3.1`, exports the root library entry, and exposes only the `reasonix-legacy` binary.

**Barrel Files:**
- Add public exports through `src/index.ts` only when they are intended for consumers of the root library (`package.json`).
- Use `packages/core-utils/src/index.ts` for the explicit package-local `@reasonix/core-utils` surface, whose subpath exports are declared in the private `packages/core-utils/package.json`.
- Avoid introducing convenience barrels inside feature folders; import the owning module directly, following `CONTRIBUTING.md` and existing imports in `src/loop/errors.ts` and `src/cli/ui/cards/ErrorCard.tsx`.

---

*Convention analysis: 2026-07-22*
