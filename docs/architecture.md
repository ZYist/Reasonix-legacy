# Current architecture

<!-- source-of-truth: src/cli/index.ts; src/loop.ts; src/cli/headless/host.ts; src/cli/commands/acp.ts; src/memory/session.ts -->

## Product boundary

`reasonix-legacy` is a Pure CLI application. Its maintained surfaces are:

1. the Ink code/chat TUI and non-interactive shell commands;
2. ACP over stdio for editor/IDE clients;
3. standalone QQ, Telegram, and Weixin channel processes.

The old Web dashboard, server adapter, Tauri application, and desktop sidecar are
not runtime dependencies. `reasonix desktop` remains only as an explicit retired
command that exits non-zero.

## Dependency direction

```text
src/cli/index.ts
  ├─ code/chat/run commands ─┐
  ├─ ACP command ────────────┼─> shared CacheFirstLoop + ToolRegistry
  └─ qq/telegram/weixin ─────┘
          via HeadlessHost
```

Surfaces assemble the core; the core does not import a UI or channel transport.
`src/cli/headless/host.ts` creates the model client, context manager, cache-first
loop, tools, pause gate, and session state needed by remote channels. Each thin
channel command owns process signals, transport lifecycle, and reply routing.

## Shared agent loop

`src/loop.ts` contains the cache-first agentic loop. Stable system/tool prefixes,
deterministic tool ordering, context folding, and usage accounting are shared by
all surfaces. Tool-call repair normalizes malformed or truncated model tool JSON
before dispatch so one bad model response does not terminate the session.

The same permission gates protect local TUI and remote-channel tool calls.
Headless gate bridges turn confirmation prompts into channel messages and route
the reply back to the pause gate. Only one turn is accepted at a time per
headless channel process.

## Surfaces

### CLI/TUI

`src/cli/index.ts` registers the shell command tree. `src/cli/ui/` contains the Ink
application, slash registry, handlers, status cards, and terminal integration.
`code` enables workspace tools; `chat` omits the code workspace surface; `run`
executes one task without Ink.

### ACP

`src/cli/commands/acp.ts` serves NDJSON JSON-RPC on stdin/stdout. It adapts ACP
sessions and permission requests to the same loop and tool registry rather than
implementing a second agent.

### Headless channels

`src/cli/commands/{qq,telegram,weixin}.ts` boot a `HeadlessHost`, install remote
permission bridges, instantiate the protocol channel, and clean up on
`SIGINT`/`SIGTERM`. Protocol code lives in `src/qq/`, `src/telegram/`, and
`src/weixin/`. PID locks prevent duplicate local processes from driving one
channel instance.

## Persistence boundaries

- User configuration: `~/.reasonix/config.json`
- Sessions: `~/.reasonix/sessions/<name>.jsonl`
- Typed event sidecars: `~/.reasonix/sessions/<name>.events.jsonl`
- Pending edits and plan/checkpoint artifacts: session-scoped files under
  `~/.reasonix/sessions/`
- Weixin account credentials: `~/.reasonix/weixin/accounts/<accountId>.json`
  unless `REASONIX_WEIXIN_ACCOUNTS_DIR` overrides the directory
- Optional explicit transcripts: paths supplied by `--transcript`

These files may contain prompts, paths, code, identifiers, or secrets. Keep them
local and review before sharing.

## Source directory map

| Path | Responsibility |
|---|---|
| `src/cli/` | command registration, TUI, ACP/headless assembly |
| `src/loop.ts`, `src/context.ts` | agent loop and context budget behavior |
| `src/tools/` | built-in tools and dispatch contracts |
| `src/mcp/` | MCP discovery, normalization, and bridge |
| `src/memory/`, `src/transcript/`, `src/adapters/` | sessions, transcripts, event persistence |
| `src/qq/`, `src/telegram/`, `src/weixin/` | channel transports and access policy |
| `src/index/` | semantic-index configuration and indexing |

See the [CLI reference](cli-reference.md) and
[configuration reference](configuration.md) for user-facing contracts.
