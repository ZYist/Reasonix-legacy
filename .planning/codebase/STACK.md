# Technology Stack

**Analysis Date:** 2026-07-02

## Languages

**Primary:**
- TypeScript (ES2022 / ESNext modules, `strict` + `noUncheckedIndexedAccess`) — all CLI, agent loop, MCP, tools, dashboard, and desktop frontend logic. Source under `src/`, `dashboard/src/`, `desktop/src/`, `packages/*/src/`.
- Rust (edition 2021) — Tauri desktop shell native layer (`desktop/src-tauri/src/`: `main.rs`, `rpc.rs`, `cc_switch.rs`). Uses `tauri`, `rusqlite`, `serde`, `parking_lot`, `anyhow`.

**Secondary:**
- CSS — vendor styles (`dashboard/app.css`, copied via `scripts/copy-dashboard-vendor-css.mjs`) and desktop UI (`desktop/src/styles.css`).
- HTML — entry shells (`dashboard/index.html`, `desktop/index.html`).

## Runtime

**Environment:**
- Node.js `>=22` (enforced via `engines` in `package.json` and `src/cli/node-version-guard.ts`; CLI re-execs with a larger V8 heap via `src/cli/heap-limit-launch.ts`).
- Tauri 2 webview runtime for the desktop bundle.
- Browser (any modern) for the standalone dashboard.

**Package Manager:**
- npm (lockfile `package-lock.json` present and committed).
- npm workspaces — root `workspaces: ["packages/*"]` plus `desktop/` and `dashboard/` as nested npm projects (each with its own `package-lock.json`).

## Frameworks

**Core:**
- Custom agent loop — `CacheFirstLoop` in `src/loop.ts` (+ `src/loop/`): DeepSeek-native, cache-first, tool-call repair (`src/repair/`), reasoning retention (`src/loop/reasoning-retention.ts`).
- React 19 + custom Ink fork (`packages/ink/`, aliased to `ink` in `tsconfig.json`/`vitest.config.ts`) — TUI rendering. `react-reconciler` + `yoga-layout` drive the terminal renderer.
- React 19 + Vite 5 — dashboard (`dashboard/`) and desktop (`desktop/`) web frontends.
- Tauri 2 — desktop shell (`desktop/src-tauri/`).
- commander 12 — CLI parsing (`src/cli/index.ts`).

**Testing:**
- Vitest 2 (`vitest.config.ts`) — `pool: "forks"` for per-file process isolation (tokenizer BPE / tree-sitter wasms / native handles). Coverage via `@vitest/coverage-v8`.
- Stryker 9 (`stryker.config.mjs`) — mutation testing (`npm run test:mutation`).
- `@testing-library/react`, `react-test-renderer`, `ink-testing-library` — component tests.
- jsdom 29 — DOM environment for select tests.

**Build/Dev:**
- tsup 8 (`tsup.config.ts`) — bundles `src/index.ts` (library, with DTS) and `src/cli/index.ts` (CLI, noExternal `[/.*/]`, node banner) to `dist/`. Target `node22`, ESM only.
- esbuild 0.21 — bundler backend for tsup.
- Vite 5 — dashboard + desktop frontend builds (`npm run build:dashboard`).
- tsx 4 — `dev` / `chat` script runner.
- TypeScript 5.6 (`tsconfig.json`) — `target: ES2022`, `moduleResolution: Bundler`, path aliases `@/* → src/*` and `ink → packages/ink/src/index.ts`.
- Biome 1.9 (`biome.json`) — lint + format (double quotes, semicolons, 100-col, 2-space).
- simple-git-hooks — `pre-commit: npm run lint`, `pre-push: npm run verify`.

## Key Dependencies

**Critical (LLM agent core):**
- `eventsource-parser` 3 — SSE parsing for `DeepSeekClient.stream` (`src/client.ts`).
- `undici` 8 — fetch + global proxy dispatcher (`src/net/proxy.ts` installs `ProxyAgent`).
- `zod` 4 — config + tool schema validation (`src/config.ts`, repair schema analysis).
- `web-tree-sitter` 0.26 + language grammars (`tree-sitter-{go,java,javascript,python,rust,typescript}`) — code query / symbol extraction (`src/code-query/parser.ts`, `scripts/copy-tree-sitter-grammars.mjs`).
- `commander` 12 — CLI.
- `chalk`, `cli-highlight`, `slice-ansi`, `wrap-ansi`, `string-width`, `cli-boxes`, `indent-string`, `strip-ansi`, `qrcode`, `iconv-lite`, `node-html-parser`, `picomatch`, `ignore`, `semver`, `ws`, `signal-exit`, `auto-bind`, `lodash-es`, `get-east-asian-width`, `emoji-regex`, `bidi-js`, `@alcalzone/ansi-tokenize`, `code-excerpt`, `stack-utils`, `usehooks-ts`, `supports-hyperlinks` — TUI / terminal / parsing utilities.

**Chat bot channels:**
- `grammy` 1.43 — Telegram bot (`src/telegram/bot.ts`).
- `ws` 8 — QQ bot gateway WebSocket client (`src/qq/bot.ts`).
- `qrcode` — WeChat login QR (`src/weixin/bot.ts`).

**Infrastructure (frontend):**
- React 19, react-dom, react-reconciler, yoga-layout — TUI + dashboard + desktop UI.
- `@tauri-apps/api` 2 + plugins (`dialog`, `notification`, `opener`, `process`, `updater`) — desktop frontend.
- `react-markdown` 9 + `remark-gfm`, `remark-math`, `remark-breaks`, `rehype-katex`, `katex`, `prism-react-renderer`, `lucide-react`, `react-virtuoso`, `@fontsource/{geist,geist-mono,inter}` — markdown / math / code rendering in dashboard and desktop.
- `marked` 15, `highlight.js` 11, `preact` 10, `htm` 3, `uplot` 1.6 — dev/build helpers and charting.

## Configuration

**Environment:**
- `.env` loaded by `loadDotenv()` (`src/env.ts`) — minimal hand-rolled parser; does not override already-set vars.
- `.env.example` documents required keys (existence only; contents not loaded here).
- DeepSeek key resolution: `process.env.DEEPSEEK_API_KEY` ← CLI bridges from `~/.reasonix/config.json` (`src/config.ts`).
- Config file: `~/.reasonix/config.json` (read/written via `atomicWriteSync` in `src/core/atomic-write.ts`).
- Base URL override: `DEEPSEEK_BASE_URL` env or config `baseUrl` (default `https://api.deepseek.com`); Azure-compatible hosts detected in `DeepSeekClient._isAzureEndpoint()`.

**Build:**
- `tsconfig.json` (root, library/CLI), `dashboard/tsconfig.json`, `desktop/tsconfig.json` (frontends), `packages/*/tsconfig.json`.
- `tsup.config.ts` (two-entry bundle), `dashboard/vite.config.ts`, `desktop/vite.config.ts`.
- `biome.json` (lint/format; ignores `dist`, `node_modules`, `coverage`, `*.d.ts`, `dashboard/codemirror.js`, `packages/ink/**`).
- `vitest.config.ts` (aliases React/Ink/Tauri mocks; coverage `include: ["src/**"]`).
- `stryker.config.mjs` (mutation testing).
- `scripts/postinstall.mjs` (runs on `npm install`), `scripts/copy-tree-sitter-grammars.mjs`, `scripts/copy-dashboard-vendor-css.mjs`.

## Platform Requirements

**Development:**
- Node.js 22+ (CI matrix pins node `"22"` on ubuntu-latest + windows-latest in `.github/workflows/ci.yml`).
- Rust toolchain (stable, targets `x86_64-unknown-linux-gnu`, `x86_64-apple-darwin`, `aarch64-apple-darwin`, `x86_64-pc-windows-msvc`) for desktop builds.
- OS: Windows, macOS, or Linux. Tests tolerate Windows scheduler hiccups via `vitest` `retry: 1`.

**Production:**
- CLI: published to npm as `reasonix-legacy` (binaries `reasonix` / `dsnix` → `dist/cli/index.js`).
- Desktop: Tauri bundles (NSIS on Windows, DMG on macOS single-arch shards, deb/AppImage on Linux) built by `.github/workflows/release.yml` on `desktop-v*` tags. Auto-updater endpoints: Cloudflare R2 + GitHub Releases (`tauri.conf.json`).
- Dashboard: standalone static site or embedded HTTP server (`src/server/index.ts`, loopback by default, token-gated).

---

*Stack analysis: 2026-07-02*
