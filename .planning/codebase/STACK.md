# Technology Stack

**Analysis Date:** 2026-07-22

## Languages

**Primary:**
- TypeScript is the implementation language for the library, CLI, TUI, protocol clients, tools, and tests (`src/**/*.ts`, `src/**/*.tsx`, `tests/**/*.test.ts`, `tests/**/*.test.tsx`).
- TypeScript uses strict checking, `noUncheckedIndexedAccess`, `noImplicitOverride`, and bundler-style ESM resolution (`tsconfig.json`).
- TSX is used for the React terminal interface and React-based test helpers (`src/cli/ui/**/*.tsx`, `packages/ink/src/**/*.tsx`, `tests/**/*.test.tsx`).

**Secondary:**
- Modern JavaScript ESM (`.mjs`) is used for build helpers, CI utilities, probes, and benchmark scripts (`scripts/*.mjs`, `tools/*.mjs`, `benchmarks/spike-tdd-kernel/*.mjs`).
- YAML defines GitHub Actions automation (`.github/workflows/ci.yml`, `.github/workflows/codeql.yml`, `.github/workflows/publish-npm.yml`).
- JSON and JSONL are configuration, package metadata, local persistence, fixtures, and benchmark-result formats (`package.json`, `biome.json`, `data/deepseek-tokenizer.json.gz`, `tests/fixtures/acp-driver.ndjson`, `benchmarks/tau-bench/transcripts/*.jsonl`).
- Go, Java, Python, and Rust appear only as parser/query fixtures, not application runtimes (`tests/fixtures/code-query/sample.go`, `tests/fixtures/code-query/Sample.java`, `tests/fixtures/code-query/sample.py`, `tests/fixtures/code-query/sample.rs`).

## Runtime

**Environment:**
- Node.js `>=22` is the public runtime contract (`package.json`).
- Node.js `24.15.0`, npm `11.16.0`, Windows, and PowerShell are the maintained 1.3.x release baseline and CI gate (`docs/lts-policy.md`, `.github/workflows/ci.yml`, `.github/workflows/publish-npm.yml`).
- Builds target Node 22 and emit ESM bundles; TypeScript targets ES2022 with the ES2023 library (`tsup.config.ts`, `tsconfig.json`).
- macOS, Linux, and Windows remain documented supported user platforms while the maintained release gate runs on Windows (`README.md`, `.github/workflows/ci.yml`).

**Package Manager:**
- npm is the authoritative package manager; the maintained automation pins npm `11.16.0` (`package.json`, `.github/workflows/ci.yml`).
- Lockfile: present, npm lockfile version 3, for `reasonix-legacy@1.3.1` (`package-lock.json`).
- Use `npm ci` for reproducible CI/release installation and `npm install` for development dependency changes (`.github/workflows/ci.yml`, `.github/workflows/publish-npm.yml`, `CONTRIBUTING.md`).

## Package and Workspace Configuration

**Published root package:**
- `reasonix-legacy@1.3.1` is the sole public package identity and exposes the sole public binary `reasonix-legacy` at `dist/cli/index.js` (`package.json`).
- The package also exports an ESM library entry at `dist/index.js` with declarations at `dist/index.d.ts`; the source export surface is `src/index.ts` (`package.json`, `src/index.ts`).
- Published files are restricted to `dist`, tokenizer data, patches when present, `README.md`, and `LICENSE` (`package.json`).

**Live workspaces:**
- npm discovers current workspaces through `packages/*`; the live tree contains only `packages/core-utils` and `packages/ink` (`package.json`, `packages/core-utils/package.json`, `packages/ink/package.json`).
- `@reasonix/core-utils@0.1.0` is private and supplies shared compaction, permission, approval-prompt, path, and tool-kind utilities directly from TypeScript source (`packages/core-utils/package.json`, `packages/core-utils/src/index.ts`).
- `ink@1.0.0` is a private, repository-owned React/Yoga terminal runtime derived from Ink and is consumed through a TypeScript path alias (`packages/ink/package.json`, `tsconfig.json`).
- Do not introduce or document additional active workspace identities unless a corresponding live `packages/<name>/package.json` is added and remains matched by `packages/*` (`package.json`, `packages/`).

## Frameworks

**Core:**
- React `^19.2.6` provides the component model for the terminal UI (`package.json`, `src/cli/ui/App.tsx`).
- The private `ink` workspace combines React Reconciler `^0.32.0` with Yoga Layout `^3.2.1` for terminal layout and diff-based screen rendering (`packages/ink/package.json`, `packages/ink/src/renderer.ts`, `packages/ink/src/layout/yoga.ts`).
- Commander `^12.1.0` defines the CLI command surface (`package.json`, `src/cli/index.ts`, `src/cli/commands/index.ts`).
- Zod `^4.4.1` validates configuration-shaped inputs (`package.json`, `src/config.ts`).

**Testing:**
- Vitest `^2.1.5` is the test runner; the lock resolves `2.1.9` (`package.json`, `package-lock.json`, `vitest.config.ts`).
- V8 coverage via `@vitest/coverage-v8` produces text, HTML, and JSON summaries (`package.json`, `vitest.config.ts`, `scripts/coverage-summary.mjs`).
- Stryker `^9.6.1` with the Vitest runner performs targeted mutation testing with a 50% break threshold (`package.json`, `stryker.config.mjs`).
- React Testing Library, React Test Renderer, and `ink-testing-library` support component and TUI tests (`package.json`, `tests/helpers/ink-test.ts`).

**Build/Dev:**
- tsup `^8.3.5` produces the ESM library bundle and fully bundled CLI, source maps, and declarations; the lock resolves `8.5.1` (`package.json`, `package-lock.json`, `tsup.config.ts`).
- tsx `^4.19.2` runs source entry points, examples, probes, and benchmarks without a separate compile step (`package.json`, `scripts/prepare-tokenizer.ts`, `benchmarks/tau-bench/runner.ts`).
- TypeScript is declared as `^5.6.3` and currently locks to `5.9.3` (`package.json`, `package-lock.json`).
- Biome `1.9.4` handles formatting, import organization, and linting for `src` and `tests`; `packages/ink/**` is intentionally excluded from Biome (`package.json`, `package-lock.json`, `biome.json`).
- Simple Git Hooks runs lint before commit and the complete verification chain before push (`package.json`).

## Key Dependencies

**Critical:**
- `eventsource-parser` `^3.0.0` parses DeepSeek streaming responses and MCP SSE responses (`package.json`, `src/client.ts`, `src/mcp/sse.ts`, `src/mcp/streamable-http.ts`).
- `undici` `^8.7.0` supplies global proxy dispatching because Node fetch does not automatically honor proxy environment variables (`package.json`, `src/net/proxy.ts`).
- `web-tree-sitter` `^0.26.9` plus language grammar packages implement code parsing and symbol search; the build copies grammar artifacts into the distribution (`package.json`, `src/code-query/parser.ts`, `scripts/copy-tree-sitter-grammars.mjs`).
- `ws` `^8.21.1` implements the QQ gateway WebSocket client (`package.json`, `src/qq/bot.ts`).
- `grammy` `^1.43.0` implements the Telegram Bot API polling client (`package.json`, `src/telegram/bot.ts`).
- `node-html-parser` `^7.1.0` extracts search results and visible page text (`package.json`, `src/tools/web.ts`).
- `qrcode` `^1.5.4` renders Weixin QR login material (`package.json`, `src/weixin/bot.ts`).

**Infrastructure:**
- `ignore` `^7.0.5` and `picomatch` `^4.0.4` implement ignore/filter matching for project traversal and tools (`package.json`, `src/gitignore.ts`, `src/hooks.ts`).
- `iconv-lite` `^0.7.2` handles source-file encoding boundaries (`package.json`, `src/code/file-encoding.ts`).
- `data/deepseek-tokenizer.json.gz` is bundled tokenizer data prepared by `scripts/prepare-tokenizer.ts` and included in the npm artifact by `package.json`.
- ANSI, width, bidi, highlighting, and wrapping packages support terminal rendering through the root package and private Ink workspace (`package.json`, `packages/ink/package.json`).

## Configuration

**Environment:**
- Runtime configuration is layered from process environment, project `.env` loading, and the user JSON file `~/.reasonix/config.json`; endpoint/key pairing prevents a key from one endpoint being reused with another (`src/env.ts`, `src/config.ts`, `docs/configuration.md`).
- `.env.example` is present as an environment template; its contents are intentionally not part of this map (`.env.example`).
- Configuration writes are atomic and malformed or absent user JSON resolves to an empty configuration (`src/config.ts`, `src/core/atomic-write.ts`).

**Build:**
- TypeScript options and aliases: `tsconfig.json`.
- Bundle entry points and output policy: `tsup.config.ts`.
- Test discovery, aliases, process-pool limits, retry, and coverage: `vitest.config.ts`.
- Formatting and lint rules: `biome.json`.
- Mutation scope and thresholds: `stryker.config.mjs`.
- Package scripts, hooks, public exports, bin identity, and workspace discovery: `package.json`.

## Platform Requirements

**Development:**
- Install Node.js 22 or newer and npm; use the maintained Node `24.15.0`/npm `11.16.0` pair when reproducing release-gate behavior (`package.json`, `docs/lts-policy.md`).
- Run `npm run dev` for the CLI, `npm run build` for distribution output, and `npm run verify` for build/lint/typecheck/test verification (`package.json`).
- Semantic code search optionally requires a reachable Ollama installation or a configured OpenAI-compatible embedding endpoint (`src/index/semantic/embedding.ts`, `src/config.ts`).

**Production:**
- The supported artifact is the npm package and global CLI, not a hosted web or desktop deployment (`package.json`, `README.md`, `.github/workflows/publish-npm.yml`).
- Publishing is a manual GitHub Actions dispatch for a matching `vX.Y.Z` tag and publishes only `reasonix-legacy` to the public npm registry (`.github/workflows/publish-npm.yml`).
- Runtime state is written to user/project filesystem locations; no external database runtime is declared (`src/config.ts`, `src/memory/session.ts`, `src/index/semantic/store.ts`).

---

*Stack analysis: 2026-07-22*
