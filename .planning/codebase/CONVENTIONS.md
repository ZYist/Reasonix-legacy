# Conventions — Current

TypeScript ESM uses explicit `.js` import suffixes, strict checking, named exports, and Biome formatting/linting. Tests live under `tests/` except package-local core-utils tests. Use focused tests plus `npm run verify`; do not add dependencies on removed Web/Tauri modules. Preserve historical CHANGELOG and milestone archives while keeping current docs tied to live paths.
