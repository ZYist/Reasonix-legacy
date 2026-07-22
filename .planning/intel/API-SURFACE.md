# API Surface

> Generated from `.planning/intel/api-map.json`. Do not edit by hand.

## `CLI reasonix-legacy`

- **method:** CLI
- **path:** reasonix-legacy
- **params:** --continue, --no-mouse, --no-proxy
- **file:** src/cli/index.ts
- **description:** Runs setup when unconfigured, otherwise opens code mode in the current workspace.

## `CLI reasonix-legacy setup`

- **method:** CLI
- **path:** reasonix-legacy setup
- **params:** 
- **file:** src/cli/index.ts
- **description:** Runs the interactive setup command.

## `CLI reasonix-legacy code`

- **method:** CLI
- **path:** reasonix-legacy code [dir]
- **params:** model, effort, resume, new, budget, profile
- **file:** src/cli/index.ts
- **description:** Starts the workspace-aware coding TUI.

## `CLI reasonix-legacy chat`

- **method:** CLI
- **path:** reasonix-legacy chat
- **params:** model, system, session, mcp, budget
- **file:** src/cli/index.ts
- **description:** Starts the filesystem-independent chat TUI.

## `CLI reasonix-legacy run`

- **method:** CLI
- **path:** reasonix-legacy run <task>
- **params:** model, system, mcp, budget, transcript
- **file:** src/cli/index.ts
- **description:** Runs one non-interactive agent task.

## `CLI reasonix-legacy acp`

- **method:** CLI
- **path:** reasonix-legacy acp
- **params:** model, dir, budget, mcp, yolo
- **file:** src/cli/index.ts
- **description:** Serves ACP newline-delimited JSON-RPC over stdin/stdout.

## `CLI reasonix-legacy qq`

- **method:** CLI
- **path:** reasonix-legacy qq
- **params:** model, workspace, budget
- **file:** src/cli/index.ts
- **description:** Runs the QQ headless channel.

## `CLI reasonix-legacy telegram`

- **method:** CLI
- **path:** reasonix-legacy telegram
- **params:** model, workspace, budget
- **file:** src/cli/index.ts
- **description:** Runs the Telegram headless channel.

## `CLI reasonix-legacy weixin`

- **method:** CLI
- **path:** reasonix-legacy weixin
- **params:** model, workspace, budget
- **file:** src/cli/index.ts
- **description:** Runs the Weixin headless channel.

## `CLI reasonix-legacy stats`

- **method:** CLI
- **path:** reasonix-legacy stats [transcript]
- **params:** transcript
- **file:** src/cli/index.ts
- **description:** Prints transcript or session usage statistics.

## `CLI reasonix-legacy doctor`

- **method:** CLI
- **path:** reasonix-legacy doctor
- **params:** json, cache
- **file:** src/cli/index.ts
- **description:** Runs environment and cache diagnostics.

## `CLI reasonix-legacy doctor-cache`

- **method:** CLI
- **path:** reasonix-legacy doctor-cache
- **params:** json
- **file:** src/cli/index.ts
- **description:** Runs cache-stability diagnostics.

## `CLI reasonix-legacy commit`

- **method:** CLI
- **path:** reasonix-legacy commit
- **params:** model, yes
- **file:** src/cli/index.ts
- **description:** Creates an AI-assisted Git commit.

## `CLI reasonix-legacy sessions`

- **method:** CLI
- **path:** reasonix-legacy sessions [name]
- **params:** name, verbose
- **file:** src/cli/index.ts
- **description:** Lists or inspects saved sessions.

## `CLI reasonix-legacy prune-sessions`

- **method:** CLI
- **path:** reasonix-legacy prune-sessions
- **params:** days, dry-run
- **file:** src/cli/index.ts
- **description:** Prunes old sessions.

## `CLI reasonix-legacy events`

- **method:** CLI
- **path:** reasonix-legacy events <name>
- **params:** type, since, tail, json, projection
- **file:** src/cli/index.ts
- **description:** Streams or projects persisted loop events.

## `CLI reasonix-legacy replay`

- **method:** CLI
- **path:** reasonix-legacy replay <transcript>
- **params:** print, head, tail
- **file:** src/cli/index.ts
- **description:** Replays a transcript.

## `CLI reasonix-legacy diff`

- **method:** CLI
- **path:** reasonix-legacy diff <a> <b>
- **params:** md, print, tui, label-a, label-b
- **file:** src/cli/index.ts
- **description:** Compares two transcripts.

## `CLI reasonix-legacy mcp list`

- **method:** CLI
- **path:** reasonix-legacy mcp list
- **params:** json, local, refresh, limit, pages, all
- **file:** src/cli/index.ts
- **description:** Lists configured or discoverable MCP servers.

## `CLI reasonix-legacy mcp search`

- **method:** CLI
- **path:** reasonix-legacy mcp search <query>
- **params:** json, refresh, limit, max-pages
- **file:** src/cli/index.ts
- **description:** Searches MCP registries.

## `CLI reasonix-legacy mcp install`

- **method:** CLI
- **path:** reasonix-legacy mcp install <name>
- **params:** refresh, max-pages
- **file:** src/cli/index.ts
- **description:** Installs an MCP server configuration.

## `CLI reasonix-legacy mcp browse`

- **method:** CLI
- **path:** reasonix-legacy mcp browse
- **params:** 
- **file:** src/cli/index.ts
- **description:** Opens the MCP marketplace TUI.

## `CLI reasonix-legacy mcp inspect`

- **method:** CLI
- **path:** reasonix-legacy mcp inspect <spec>
- **params:** json
- **file:** src/cli/index.ts
- **description:** Inspects an MCP server.

## `CLI reasonix-legacy version`

- **method:** CLI
- **path:** reasonix-legacy version
- **params:** 
- **file:** src/cli/index.ts
- **description:** Prints package version and install source.

## `CLI reasonix-legacy update`

- **method:** CLI
- **path:** reasonix-legacy update
- **params:** dry-run
- **file:** src/cli/index.ts
- **description:** Checks or performs self-update.

## `CLI reasonix-legacy index`

- **method:** CLI
- **path:** reasonix-legacy index
- **params:** rebuild, model, dir, ollama-url, yes
- **file:** src/cli/index.ts
- **description:** Builds the project-local semantic index.

## `Library CacheFirstLoop`

- **method:** ESM export
- **path:** reasonix-legacy
- **params:** CacheFirstLoopOptions
- **file:** src/loop.ts
- **description:** Shared cache-first model/tool orchestration state machine.

## `Library DeepSeekClient`

- **method:** ESM export
- **path:** reasonix-legacy
- **params:** DeepSeekClientOptions
- **file:** src/client.ts
- **description:** DeepSeek-compatible chat, streaming, model, and balance client.

## `Library ToolRegistry`

- **method:** ESM export
- **path:** reasonix-legacy
- **params:** ToolDefinition
- **file:** src/tools.ts
- **description:** Model-callable capability registration and dispatch boundary.

## `Library McpClient`

- **method:** ESM export
- **path:** reasonix-legacy
- **params:** McpClientOptions
- **file:** src/mcp/client.ts
- **description:** MCP JSON-RPC client over configured transports.
