# Concerns — Current

- Large live hotspots (`src/loop.ts`, `src/config.ts`, Ink app/tool modules) require characterization before refactoring.
- TUI, command wiring, and channel lifecycle have higher behavioral risk than global line coverage conveys.
- Retry can conceal first-run flakes; Phase 9 must expose retry status.
- Credential/TTY-dependent channel checks cannot be represented as offline automation.
- Compatibility config names containing “desktop” may remain live persisted-data behavior; do not confuse them with removed Tauri modules.

Removed dashboard/Tauri risks belong to archived history, not the current concern register.
