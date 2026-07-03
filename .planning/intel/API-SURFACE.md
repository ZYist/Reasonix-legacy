# API Surface

> Generated from `.planning/intel/api-map.json`. Do not edit by hand.

> **Warning:** api-map.json is stale (>24 hours old). Data below may be out of date.

## `GET /api/overview`

- **method:** GET
- **path:** /api/overview
- **file:** src/server/api/overview.ts
- **description:** Dashboard overview snapshot (session, model, budget).

## `GET /api/usage`

- **method:** GET
- **path:** /api/usage
- **file:** src/server/api/usage.ts
- **description:** Usage/cost aggregate + cache buckets.

## `GET /api/tools`

- **method:** GET
- **path:** /api/tools
- **file:** src/server/api/tools.ts
- **description:** List registered tools.

## `POST /api/permissions`

- **method:** POST
- **path:** /api/permissions
- **file:** src/server/api/permissions.ts
- **description:** Grant/deny tool permission decisions.

## `GET /api/messages`

- **method:** GET
- **path:** /api/messages
- **file:** src/server/api/messages.ts
- **description:** Stream/list session messages.

## `POST /api/submit`

- **method:** POST
- **path:** /api/submit
- **file:** src/server/api/submit.ts
- **description:** Submit a new user prompt/turn.

## `POST /api/abort`

- **method:** POST
- **path:** /api/abort
- **file:** src/server/api/abort.ts
- **description:** Abort the in-flight loop turn.

## `GET /api/health`

- **method:** GET
- **path:** /api/health
- **file:** src/server/api/health.ts
- **description:** Server health probe.

## `GET /api/sessions`

- **method:** GET
- **path:** /api/sessions
- **file:** src/server/api/sessions.ts
- **description:** List sessions.

## `GET|POST /api/plans`

- **method:** GET|POST
- **path:** /api/plans
- **file:** src/server/api/plans.ts
- **description:** Read/advance plan steps.

## `POST /api/modal`

- **method:** POST
- **path:** /api/modal
- **file:** src/server/api/modal.ts
- **description:** Resolve a pending modal prompt.

## `POST /api/edit-mode`

- **method:** POST
- **path:** /api/edit-mode
- **file:** src/server/api/edit-mode.ts
- **description:** Toggle/select edit-mode setting.

## `GET|PUT /api/settings`

- **method:** GET|PUT
- **path:** /api/settings
- **file:** src/server/api/settings.ts
- **description:** Read/write reasonix config.

## `GET|POST /api/hooks`

- **method:** GET|POST
- **path:** /api/hooks
- **file:** src/server/api/hooks.ts
- **description:** List/run hooks.

## `GET /api/memory`

- **method:** GET
- **path:** /api/memory
- **file:** src/server/api/memory.ts
- **description:** Read project/user memory.

## `GET /api/skills`

- **method:** GET
- **path:** /api/skills
- **file:** src/server/api/skills.ts
- **description:** List available skills.

## `GET /api/mcp`

- **method:** GET
- **path:** /api/mcp
- **file:** src/server/api/mcp.ts
- **description:** List MCP servers / status.

## `GET|POST /api/semantic`

- **method:** GET|POST
- **path:** /api/semantic
- **file:** src/server/api/semantic.ts
- **description:** Semantic search + index status.

## `GET|PUT /api/index-config`

- **method:** GET|PUT
- **path:** /api/index-config
- **file:** src/server/api/index-config.ts
- **description:** Semantic index config.

## `GET /api/slash`

- **method:** GET
- **path:** /api/slash
- **file:** src/server/api/slash.ts
- **description:** List slash commands.

## `GET /api/files`

- **method:** GET
- **path:** /api/files
- **file:** src/server/api/files.ts
- **description:** Read workspace file.

## `GET /api/browse`

- **method:** GET
- **path:** /api/browse
- **file:** src/server/api/browse.ts
- **description:** Directory browser.

## `GET /api/project-tree`

- **method:** GET
- **path:** /api/project-tree
- **file:** src/server/api/project-tree.ts
- **description:** Workspace file tree.

## `GET /api/git-diffs`

- **method:** GET
- **path:** /api/git-diffs
- **file:** src/server/api/git-diffs.ts
- **description:** Uncommitted git diff.

## `GET /api/checkpoints`

- **method:** GET
- **path:** /api/checkpoints
- **file:** src/server/api/checkpoints.ts
- **description:** List edit checkpoints.

## `GET /api/checkpoint-diffs`

- **method:** GET
- **path:** /api/checkpoint-diffs
- **file:** src/server/api/checkpoint-diffs.ts
- **description:** Diff for a checkpoint.

## `POST /api/checkpoint-restore`

- **method:** POST
- **path:** /api/checkpoint-restore
- **file:** src/server/api/checkpoint-restore.ts
- **description:** Restore a checkpoint.

## `POST /api/checkpoint-create`

- **method:** POST
- **path:** /api/checkpoint-create
- **file:** src/server/api/checkpoint-create.ts
- **description:** Create a checkpoint.

## `POST /api/checkpoint-delete`

- **method:** POST
- **path:** /api/checkpoint-delete
- **file:** src/server/api/checkpoint-delete.ts
- **description:** Delete a checkpoint.

## `GET /api/review-diffs`

- **method:** GET
- **path:** /api/review-diffs
- **file:** src/server/api/review-diffs.ts
- **description:** Review-mode diffs.

## `GET /api/file`

- **method:** GET
- **path:** /api/file
- **file:** src/server/api/file-read.ts
- **description:** Read file contents.

## `GET /api/file-read`

- **method:** GET
- **path:** /api/file-read
- **file:** src/server/api/file-read.ts
- **description:** Read file with preview metadata.

## `GET|POST /api/loop`

- **method:** GET|POST
- **path:** /api/loop
- **file:** src/server/api/loop.ts
- **description:** Inspect/control loop state.

## `GET /api/models`

- **method:** GET
- **path:** /api/models
- **file:** src/server/api/models.ts
- **description:** List available DeepSeek models.

## `GET /api/events`

- **method:** GET
- **path:** /api/events
- **file:** src/server/api/events.ts
- **description:** SSE stream of live loop events (cockpit/hooks events).

## `CLI reasonix [chat]`

- **method:** -
- **path:** bin: reasonix
- **file:** src/cli/commands/chat.tsx
- **description:** Default: interactive chat TUI with dashboard.

## `CLI reasonix run <task>`

- **method:** -
- **path:** bin: reasonix run
- **file:** src/cli/commands/run.ts
- **description:** Non-interactive single-task run.

## `CLI reasonix acp`

- **method:** -
- **path:** bin: reasonix acp
- **file:** src/cli/commands/acp.ts
- **description:** ACP stdio JSON-RPC agent server.

## `CLI reasonix desktop`

- **method:** -
- **path:** bin: reasonix desktop
- **file:** src/cli/commands/desktop.ts
- **description:** Headless JSON-RPC chat for desktop client.

## `CLI reasonix commit`

- **method:** -
- **path:** bin: reasonix commit
- **file:** src/cli/commands/commit.ts
- **description:** AI-assisted git commit.

## `CLI reasonix code`

- **method:** -
- **path:** bin: reasonix code
- **file:** src/cli/commands/code.tsx
- **description:** Code-mode TUI.

## `CLI reasonix stats`

- **method:** -
- **path:** bin: reasonix stats
- **file:** src/cli/commands/stats.ts
- **description:** Print session stats.

## `CLI reasonix doctor`

- **method:** -
- **path:** bin: reasonix doctor
- **file:** src/cli/commands/doctor.ts
- **description:** Health diagnostics.

## `CLI reasonix diff`

- **method:** -
- **path:** bin: reasonix diff
- **file:** src/cli/commands/diff.ts
- **description:** Diff two transcripts.

## `CLI reasonix replay`

- **method:** -
- **path:** bin: reasonix replay
- **file:** src/cli/commands/replay.ts
- **description:** Replay a transcript.

## `CLI reasonix sessions`

- **method:** -
- **path:** bin: reasonix sessions
- **file:** src/cli/commands/sessions.ts
- **description:** Manage sessions.

## `CLI reasonix setup`

- **method:** -
- **path:** bin: reasonix setup
- **file:** src/cli/commands/setup.tsx
- **description:** Interactive setup wizard.

## `CLI reasonix update`

- **method:** -
- **path:** bin: reasonix update
- **file:** src/cli/commands/update.ts
- **description:** Self-update.

## `CLI reasonix version`

- **method:** -
- **path:** bin: reasonix version
- **file:** src/cli/commands/version.ts
- **description:** Print version.

## `CLI reasonix events`

- **method:** -
- **path:** bin: reasonix events
- **file:** src/cli/commands/events.ts
- **description:** Stream live loop events to stdout.

## `CLI reasonix index`

- **method:** -
- **path:** bin: reasonix index
- **file:** src/cli/commands/index.ts
- **description:** Build semantic index.

## `CLI reasonix mcp`

- **method:** -
- **path:** bin: reasonix mcp
- **file:** src/cli/commands/mcp.ts
- **description:** MCP subcommands.

## `CLI reasonix mcp-inspect`

- **method:** -
- **path:** bin: reasonix mcp-inspect
- **file:** src/cli/commands/mcp-inspect.ts
- **description:** Inspect MCP server.

## `CLI reasonix mcp-browse`

- **method:** -
- **path:** bin: reasonix mcp-browse
- **file:** src/cli/commands/mcp-browse.tsx
- **description:** Browse MCP marketplace (TUI).

## `Library export DeepSeekClient`

- **method:** -
- **path:** src/index.ts
- **file:** src/client.ts
- **description:** DeepSeek API client (chat completions, streaming, usage).

## `Library export CacheFirstLoop`

- **method:** -
- **path:** src/index.ts
- **file:** src/loop.ts
- **description:** Main cache-first agent loop.

## `Library export ToolRegistry`

- **method:** -
- **path:** src/index.ts
- **file:** src/tools.ts
- **description:** Tool registry + interceptors.

## `Library export McpClient`

- **method:** -
- **path:** src/index.ts
- **file:** src/mcp/client.ts
- **description:** MCP protocol client.

## `Library export ToolCallRepair`

- **method:** -
- **path:** src/index.ts
- **file:** src/repair/index.ts
- **description:** Tool-call repair pipeline.
