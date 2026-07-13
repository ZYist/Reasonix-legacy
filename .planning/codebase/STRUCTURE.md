# Structure — Live Paths

- `src/cli/`: CLI entry, TUI, commands, headless channel host
- `src/core/`: shared event and runtime primitives
- `src/tools/`: model-callable tools
- `src/acp/`: ACP transport
- `src/qq/`, `src/telegram/`, `src/weixin/`: channel adapters
- `src/ui/`: Ink terminal components
- `packages/ink/`, `packages/core-utils/`: in-tree packages
- `tests/`: active repository tests and minimal live mocks
- `docs/`: current operator documentation

Removed Web/Tauri directories are historical and are not current integration points. Build output is `dist/`; coverage output is `coverage/`.
