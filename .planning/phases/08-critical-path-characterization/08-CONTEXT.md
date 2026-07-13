---
phase: 08-critical-path-characterization
status: discussed
mode: auto
---
# Phase 8 Context

## Locked decisions
- Characterization tests observe current behavior; production refactors are out of scope unless a minimal seam is required for deterministic testing.
- All automated tests run offline with mocked transports, model clients, credentials, process exits, and TTY boundaries.
- TUI coverage prioritizes composer state transitions, live output, scroll/follow behavior, interrupt, and user-visible errors.
- CLI coverage targets `run`, `commit`, and MCP argument wiring plus success/error/exit semantics.
- Channel coverage targets Telegram and Weixin startup, forwarding, recoverable/fatal errors, shutdown, and interrupt cleanup.
- Any behavior requiring real credentials, network access, or a human terminal is listed as live UAT and is not claimed as automated coverage.
