# CLI reference

<!-- source-of-truth: dist/cli/index.js --help; src/cli/index.ts; src/cli/ui/slash/commands.ts -->

Build before comparing help output:

```bash
npm run build
node dist/cli/index.js --help
```

The installed executable is `reasonix-legacy`. Run `reasonix-legacy <command> --help` for the authoritative option
list.

## Global behavior

- Bare `reasonix-legacy` runs first-time setup when needed, otherwise opens code mode in
  the current directory.
- `--continue` resumes the most recently used chat session without a picker.
- `--no-mouse` disables SGR mouse tracking for the current run.
- `--no-proxy` ignores proxy environment variables for the current run.

## Top-level commands

| Command | Purpose |
|---|---|
| `reasonix-legacy setup` | Re-run the API-key and MCP setup wizard. |
| `reasonix-legacy code [dir]` | Coding TUI with filesystem, shell, planning, memory, search, and MCP tools rooted at `dir`. |
| `reasonix-legacy chat` | Interactive TUI without the code workspace tool surface. |
| `reasonix-legacy run <task>` | Execute one task non-interactively and stream output. |
| `reasonix-legacy acp` | Serve an Agent Client Protocol agent on stdio NDJSON JSON-RPC. |
| `reasonix-legacy desktop` | Retired compatibility stub; exits non-zero and directs users to headless channels. |
| `reasonix-legacy qq` | Start the standalone QQ channel on HeadlessHost. |
| `reasonix-legacy telegram` | Start the standalone Telegram channel on HeadlessHost. |
| `reasonix-legacy weixin` | Start the standalone Weixin channel, running QR login if credentials are missing. |
| `reasonix-legacy stats [transcript]` | Print terminal usage/cache statistics; this is not a desktop dashboard. |
| `reasonix-legacy doctor` | Check Node, endpoint/API configuration, MCP, and optional cache health. |
| `reasonix-legacy doctor-cache` | Run only cache-stability health checks. |
| `reasonix-legacy commit` | Draft a commit message from the staged diff. |
| `reasonix-legacy sessions [name]` | List saved sessions or inspect one session. |
| `reasonix-legacy prune-sessions` | Preview or delete old saved sessions. |
| `reasonix-legacy events <name>` | Read a session's typed event-log sidecar. |
| `reasonix-legacy replay <transcript>` | Browse a JSONL transcript in an Ink TUI. |
| `reasonix-legacy diff <a> <b>` | Compare two transcripts in a split-pane TUI or report. |
| `reasonix-legacy mcp` | Discover, install, browse, and inspect MCP servers. |
| `reasonix-legacy version` | Print the display version. |
| `reasonix-legacy update` | Check the configured release source for an update; `--dry-run` avoids installation. |
| `reasonix-legacy index` | Build or refresh the local semantic index. |

### MCP subcommands

`reasonix-legacy mcp list`, `reasonix-legacy mcp search <query>`, `reasonix-legacy mcp install <name>`,
`reasonix-legacy mcp browse`, and `reasonix-legacy mcp inspect <spec>` are registered beneath
the top-level `mcp` command.

## TUI slash commands

The live registry is `src/cli/ui/slash/commands.ts`. `/help` is the complete
in-product reference; aliases resolve to the canonical names below.

| Group | Commands |
|---|---|
| chat/session | `/help`, `/new`, `/retry`, `/compact`, `/stop`, `/btw`, `/sessions`, `/session-persist`, `/title` |
| model/display | `/model`, `/effort`, `/max-tokens`, `/language`, `/theme` |
| observability | `/status`, `/cost`, `/context`, `/stats`, `/cache-miss-report`, `/doctor`, `/keys`, `/feedback`, `/about` |
| extensions/channels | `/mcp`, `/resource`, `/prompt`, `/memory`, `/skill`, `/qq`, `/telegram`, `/weixin` |
| code workflow | `/init`, `/apply`, `/discard`, `/walk`, `/undo`, `/history`, `/show`, `/commit`, `/mode`, `/diff`, `/plan`, `/checkpoint`, `/restore`, `/cwd`, `/jobs`, `/kill`, `/logs` |
| advanced | `/budget`, `/search-engine`, `/hooks`, `/permissions`, `/loop`, `/plans`, `/replay`, `/update`, `/exit` |

Channel slash commands use `connect`, `status`, and `disconnect`; for example
`/telegram connect`. `/weixin connect` may launch QR login, while
`/weixin connect manual TOKEN ACCOUNT_ID [BASE_URL]` is an explicit manual path.

`reasonix-legacy stats` is a shell report and `/stats` is an in-TUI status card. Neither
restores the removed Web or desktop dashboard.
