# reasonix-legacy documentation

<!-- source-of-truth: package.json; src/cli/index.ts; src/cli/ui/slash/commands.ts; src/config.ts; .env.example -->

This is the documentation hub for the maintained `dev` branch of
[`ZYist/reasonix-legacy`](https://github.com/ZYist/reasonix-legacy). The current
product is a Pure CLI coding agent with ACP and optional headless QQ, Telegram,
and Weixin channels. The Web dashboard and Tauri desktop application are not
maintained surfaces.

## User guides

- [Getting started](getting-started.md) — install from the current GitHub source,
  build/link, configure, and run the first task.
- [CLI reference](cli-reference.md) — every top-level shell command plus the TUI
  slash-command groups.
- [Configuration](configuration.md) — `~/.reasonix/config.json`, environment
  overrides, MCP, search, permissions, proxy, indexing, and channels.
- [Architecture](architecture.md) — Pure CLI surfaces, the shared cache-first
  loop, HeadlessHost, ACP, and persistence boundaries.

## Remote channels

| Channel | English | 简体中文 |
|---|---|---|
| QQ | [QQ connection](qq-connect.md) | [QQ 连接](qq-connect.zh-CN.md) |
| Telegram | [Telegram connection](telegram-connect.md) | [Telegram 连接](telegram-connect.zh-CN.md) |
| Weixin | [Weixin connection](weixin-connect.md) | [微信连接](weixin-connect.zh-CN.md) |

All three channels reuse the same core loop and permission gates. Treat bot
credentials as secrets and configure owner/allowlist controls before exposing a
bot to other users.

## Maintenance and governance

- [Channel lifecycle testing](channel-lifecycle-testing.md)
- [Governance decisions](governance.md)
- [CI and branch protection](ci-branch-protection.md)
- [Contributing](../CONTRIBUTING.md)
- [Security policy](../SECURITY.md)
- [Repository README](../README.md)

## Historical upstream snapshot

The inherited upstream product documentation is preserved under
[the 2026-07-15 read-only archive](archive/upstream-reasonix/ARCHIVE.md). It may
mention removed dashboards, desktop binaries, upstream releases, and obsolete
setup links. It is provenance, not current guidance.

## Maintenance map

| Claim | Live source to verify |
|---|---|
| package name, version, Node requirement, scripts | `package.json` |
| shell commands and options | built `reasonix-legacy --help` and `src/cli/index.ts` |
| TUI slash commands | `src/cli/ui/slash/commands.ts` and handlers |
| user configuration and precedence | `src/config.ts`, `src/index/config.ts`, `.env.example` |
| headless channel lifecycle | `src/cli/headless/host.ts`, `src/cli/commands/{qq,telegram,weixin}.ts` |
| ACP transport | `src/cli/commands/acp.ts` and `src/acp/` |

Run `npm run build && node scripts/check-docs.mjs` before merging documentation
or CLI-entrypoint changes. The checker has no additional dependencies.
