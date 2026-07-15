# reasonix-legacy working knowledge

<!-- source-of-truth: package.json; docs/README.md; src/cli/index.ts; src/loop.ts; src/config.ts -->

This file is the project-memory entrypoint loaded by reasonix code mode. Keep it
short, current, and useful to coding agents; detailed user guidance belongs in
[`docs/README.md`](docs/README.md).

## Product facts

- Package: `reasonix-legacy`; executables: `reasonix` and compatibility alias
  `dsnix`; Node.js `>=22`.
- Maintained branch direction: Pure CLI. Web dashboard and Tauri desktop are
  removed. `reasonix desktop` is a retired error stub.
- Maintained surfaces: Ink code/chat TUI, non-interactive CLI commands, ACP over
  stdio, and standalone QQ/Telegram/Weixin channels.
- Repository and issue authority: `https://github.com/ZYist/reasonix-legacy`.
- Historical upstream product documentation is read-only under
  [`docs/archive/upstream-reasonix/`](docs/archive/upstream-reasonix/ARCHIVE.md).

## Architectural invariants

- All surfaces reuse `CacheFirstLoop`; do not create a channel-specific agent
  loop or tool registry.
- Preserve cache-stable system/tool prefixes and deterministic tool ordering.
- Tool-call repair and context folding are core reliability behavior.
- Remote channels assemble `HeadlessHost` and permission gate bridges; transport
  modules stay under `src/qq`, `src/telegram`, and `src/weixin`.
- Config authority is `src/config.ts`; user config is
  `~/.reasonix/config.json`; environment overrides must not leak credentials
  across endpoint tuples.
- Sessions and event sidecars live under `~/.reasonix/sessions`.

## Change discipline

1. Verify command claims against `package.json`, built `reasonix --help`, and
   `src/cli/index.ts`.
2. Verify slash claims against `src/cli/ui/slash/commands.ts` and handlers.
3. Verify config/channel claims against `src/config.ts`, `src/index/config.ts`,
   `.env.example`, and channel command/config code.
4. Preserve benchmark reports, governance/security/contributor history,
   package-local docs, planning artifacts, and the upstream archive.
5. Never place real API keys, bot tokens, account credentials, private paths, or
   transcripts in docs/tests.

## Verification

```bash
npm run build
node scripts/check-docs.mjs
npm run lint
npm run typecheck
npm test
```

Focused documentation and architecture references are indexed in the
[current documentation hub](docs/README.md).
