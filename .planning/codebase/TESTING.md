# Testing — Current

`npm test` / Vitest discovers `tests/**/*.test.ts(x)` and `packages/core-utils/tests/**/*.test.ts`. Configuration is `vitest.config.ts`; setup is `tests/setup-lang.ts`. Removed desktop globs and Tauri aliases/mocks are not part of resolution.

Validation commands: `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, or `npm run verify`. Coverage uses V8 and includes `src/**`. Credential/network/TTY live checks remain explicit manual UAT.
