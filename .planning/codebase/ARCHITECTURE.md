# Architecture — Current Pure CLI Repository

reasonix-legacy is a DeepSeek-native TypeScript CLI/TUI and library. `src/cli/main.ts` dispatches CLI commands; the Ink TUI and headless channel commands share the cache-first loop in `src/loop.ts`. There is no current Web dashboard, Tauri desktop, or browser server.

## Surfaces
- Interactive CLI/TUI: `src/cli/`, `src/ui/`
- One-shot and utility commands: `src/cli/commands/`
- Standalone channels: `src/cli/commands/qq.ts`, `telegram.ts`, `weixin.ts`, using `src/cli/headless/host.ts`
- ACP: `src/acp/`
- Library exports: `src/index.ts`
- Terminal usage report: `src/usage.ts` (`reasonix stats`), not a Web dashboard

## Core flow
CLI input → loop/model streaming → JSON repair/tool dispatch → append-only events/session persistence → terminal or channel output.
