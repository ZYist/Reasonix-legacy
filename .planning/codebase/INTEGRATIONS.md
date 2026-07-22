# External Integrations

**Analysis Date:** 2026-07-22

## APIs & External Services

**Model API:**
- DeepSeek is the default OpenAI-compatible chat provider at `https://api.deepseek.com`; `DeepSeekClient` calls `/chat/completions`, `/models`, and `/user/balance` using bearer authentication (`src/client.ts`).
  - SDK/Client: native Node fetch plus `eventsource-parser` for streaming SSE (`src/client.ts`, `package.json`).
  - Auth: `DEEPSEEK_API_KEY`, paired with `DEEPSEEK_BASE_URL` or `DEEPSEEK_API_BASE_URL`; user-config `apiKey`/`baseUrl` is the fallback (`src/config.ts`).
  - Boundary: keep endpoint and key from the same source; `loadEndpoint` intentionally prevents an environment key from leaking to a custom config endpoint (`src/config.ts`).
  - Compatibility: a custom base URL may expose an OpenAI-compatible service; Azure-like hosts suppress DeepSeek-specific `extra_body.thinking` while retaining `reasoning_effort` (`src/client.ts`).

**Web Search:**
- Bing CN and Bing International are keyless HTML-search backends (`src/tools/web.ts`).
- Self-hosted SearXNG is supported over HTTP(S), defaulting to `http://localhost:8080` (`src/tools/web.ts`, `src/config.ts`).
- Metaso uses `METASO_API_KEY`; Baidu AI Search uses `BAIDU_API_KEY` or `QIANFAN_API_KEY` (`src/tools/web.ts`, `src/config.ts`).
- Tavily uses `TAVILY_API_KEY`; Perplexity uses `PERPLEXITY_API_KEY`; Exa uses `EXA_API_KEY` (`src/tools/web.ts`, `src/config.ts`).
- Brave Search uses `BRAVE_SEARCH_API_KEY` or `BRAVE_API_KEY`; Ollama cloud search/fetch uses `OLLAMA_API_KEY` (`src/tools/web.ts`, `src/config.ts`).
- Provider keys resolve from environment before `~/.reasonix/config.json`; do not embed provider credentials in source or committed project files (`src/config.ts`, `docs/configuration.md`).

**Arbitrary Web Fetch:**
- The `web_fetch` tool retrieves public HTTP(S) URLs and converts HTML to visible text (`src/tools/web.ts`).
- Direct fetch rejects internal/reserved addresses, revalidates redirects, limits redirects and response size, and may use Cloudflare `1.1.1.1` DNS-over-HTTPS when local DNS returns proxy fake-IP results (`src/tools/web.ts`).
- When the selected engine is Ollama, fetch delegates to Ollama cloud rather than directly retrieving the target URL (`src/tools/web.ts`).

**Semantic Embeddings:**
- Local Ollama is the default embedding provider at `http://localhost:11434`, using `/api/tags` for readiness and `/api/embeddings` for vectors; override with `OLLAMA_URL` and `REASONIX_EMBED_MODEL` (`src/index/semantic/embedding.ts`).
- An arbitrary OpenAI-compatible embedding endpoint is supported with a configured base URL, model, bearer API key, optional extra request body, timeout, and batch size (`src/config.ts`, `src/index/semantic/embedding.ts`).
- Embedding vectors remain in the project-local semantic index rather than being sent to a repository-owned storage service (`src/index/semantic/builder.ts`, `src/index/semantic/store.ts`).

**Package and Discovery Services:**
- The CLI checks the npm registry endpoint for the latest `reasonix-legacy` version and caches the result locally (`src/version.ts`).
- MCP marketplace discovery queries the official MCP Registry first, falls back to Smithery, and finally uses the bundled catalog (`src/mcp/registry-fetch.ts`, `src/mcp/catalog.ts`).
- Runtime feedback links open a prefilled issue in the maintained GitHub repository (`src/cli/ui/feedback.ts`).

## MCP

**Protocol Client:**
- `McpClient` implements JSON-RPC initialization, tools, resources, prompts, progress notifications, roots, timeouts, and server requests for MCP protocol version `2024-11-05` (`src/mcp/client.ts`, `src/mcp/types.ts`).
- MCP tools are bridged into the agent tool registry and their results are flattened/truncated before entering model context (`src/mcp/registry.ts`, `src/index.ts`).

**Transports:**
- stdio transport spawns local child processes and exchanges newline-delimited JSON-RPC; server-specific environment values overlay the parent process environment (`src/mcp/stdio.ts`, `src/mcp/transport-from-spec.ts`).
- HTTP+SSE transport opens an SSE GET, consumes the announced POST endpoint, and sends custom headers on both directions (`src/mcp/sse.ts`).
- Streamable HTTP transport POSTs JSON-RPC, supports JSON or SSE responses, and round-trips `Mcp-Session-Id` (`src/mcp/streamable-http.ts`).
- Plain HTTP(S) specs retain SSE compatibility; `streamable+https://...` opts into Streamable HTTP (`src/mcp/spec.ts`).

**Configuration and Auth:**
- Canonical server configuration is `mcpServers` in `~/.reasonix/config.json`; legacy `mcp`, `mcpEnv`, and `mcpDisabled` fields normalize into the same live spec model (`src/config.ts`).
- Project-level Claude-compatible `.mcp.json` files contribute an `mcpServers` block (`src/mcp/dot-mcp-json.ts`).
- stdio secrets/config enter through per-server `env`; HTTP secrets enter through `headers`, whose values support environment expansion such as `${VAR}` (`src/config.ts`, `src/mcp/spec.ts`).
- Treat committed `.mcp.json` as non-secret configuration: reference secret-bearing environment variables in headers instead of committing resolved values (`src/mcp/dot-mcp-json.ts`, `src/config.ts`).
- Registry responses are cached for 24 hours at `~/.reasonix/mcp-registry-cache.json` (`src/mcp/registry-fetch.ts`).

## Bot Channels

**QQ:**
- QQ uses an app ID and app secret to acquire an access token, discovers a gateway over REST, receives events over WebSocket, and sends replies over QQ REST endpoints (`src/qq/bot.ts`).
  - Client: `ws` plus native fetch (`src/qq/bot.ts`, `package.json`).
  - Auth/config: `QQ_APPID`, `QQ_SECRET`, `QQ_SANDBOX`, `QQ_OWNER_OPENID`, and `QQ_ALLOWLIST`, with `qq` config fallback (`src/config.ts`).
  - Access: owner/allowlist rules are enforced when configured; otherwise the first accepted sender is bound for the current runtime (`src/qq/access.ts`, `src/qq/channel.ts`).
  - Process coordination: a local PID lock prevents competing channel instances (`src/qq/channel.ts`).

**Telegram:**
- Telegram uses GrammY with Bot API long polling, command registration, callbacks, MarkdownV2 replies, and message chunking (`src/telegram/bot.ts`, `src/telegram/channel.ts`).
  - SDK/Client: `grammy` (`package.json`, `src/telegram/bot.ts`).
  - Auth/config: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_USER_ID`, and `TELEGRAM_ALLOWLIST`, with `telegram` config fallback (`src/config.ts`).
  - Access: the channel requires an owner or allowlist and rejects unauthorized senders (`src/telegram/access.ts`, `src/telegram/channel.ts`).
  - Process coordination: `~/.reasonix/telegram-channel.pid` prevents duplicate polling instances (`src/telegram/channel.ts`).

**Weixin:**
- Weixin integrates with the iLink bot service using QR login, validated HTTPS `*.weixin.qq.com` endpoints, long polling, and bearer bot tokens (`src/weixin/bot.ts`).
  - SDK/Client: native fetch and `qrcode` (`src/weixin/bot.ts`, `package.json`).
  - Auth/config: `WEIXIN_TOKEN`, `WEIXIN_ACCOUNT_ID`, `WEIXIN_BASE_URL`, `WEIXIN_OWNER_USER_ID`, and `WEIXIN_ALLOWLIST`, with `weixin` config fallback (`src/config.ts`).
  - Credential persistence: account material is stored outside the repository under `~/.reasonix/weixin/accounts/`; config persists the account reference rather than the token (`src/weixin/account.ts`, `src/config.ts`).
  - Channel state: per-account context tokens and sync cursor state live under `~/.reasonix/weixin/`, and a PID lock prevents competing instances (`src/weixin/channel.ts`).

## Agent Client Protocol

**ACP Surface:**
- ACP is an inbound newline-delimited JSON-RPC integration over process stdin/stdout rather than an HTTP listener (`src/acp/server.ts`, `src/acp/protocol.ts`).
- ACP dispatch bridges sessions, tool gates, permissions, MCP, and headless turn execution into external ACP-capable clients (`src/acp/dispatch.ts`, `src/acp/gates.ts`, `src/cli/commands/acp.ts`).
- No network port, webhook secret, or hosted ACP service is declared by the live ACP implementation (`src/acp/server.ts`, `src/cli/commands/acp.ts`).

## Data Storage

**Databases:**
- No external database, ORM, or database service is declared in the live package manifests (`package.json`, `packages/core-utils/package.json`, `packages/ink/package.json`).
- Semantic search uses an appendable JSONL vector store and metadata JSON under each project’s `.reasonix/semantic/` directory (`src/index/semantic/store.ts`, `src/index/semantic/builder.ts`).

**File Storage:**
- User configuration is JSON at `~/.reasonix/config.json`, read defensively and written atomically (`src/config.ts`, `src/core/atomic-write.ts`).
- Conversation sessions are append-only JSONL under `~/.reasonix/sessions/`, with JSON metadata and related event/cache sidecars (`src/memory/session.ts`, `src/adapters/event-sink-jsonl.ts`).
- Global/project memory is Markdown under `~/.reasonix/memory/` and project memory files selected from the workspace (`src/memory/user.ts`, `src/memory/project.ts`).
- Usage telemetry is a local JSONL log at `~/.reasonix/usage.jsonl`; transcripts are explicit local streams/files (`src/telemetry/usage.ts`, `src/transcript/log.ts`).
- No cloud object-storage SDK is declared (`package.json`).

**Caching:**
- No external cache service is used (`package.json`, `src/mcp/registry-fetch.ts`, `src/version.ts`).
- MCP registry and npm version checks use local JSON cache files under `~/.reasonix/` (`src/mcp/registry-fetch.ts`, `src/version.ts`).
- DeepSeek prompt-cache hit/miss counts are provider response metadata recorded by the client and telemetry, not a locally hosted cache (`src/client.ts`, `src/telemetry/cache-diagnostics.ts`).

## Authentication & Identity

**Auth Provider:**
- There is no application user-account auth provider; the product is a local CLI/TUI (`package.json`, `src/cli/index.ts`).
- External API integrations use provider-specific bearer/API credentials loaded from environment or local user config (`src/config.ts`, `src/client.ts`, `src/tools/web.ts`).
- Bot identity is constrained with owner/allowlist checks before messages enter the agent loop (`src/qq/access.ts`, `src/telegram/access.ts`, `src/weixin/access.ts`).
- MCP server authentication is transport-configured through HTTP headers or stdio environment overlays (`src/config.ts`, `src/mcp/transport-from-spec.ts`).

## Network & Proxy Boundary

**Outbound routing:**
- Node fetch traffic can be routed through an Undici global dispatcher because built-in fetch does not honor proxy variables by itself (`src/net/proxy.ts`).
- Proxy precedence is config `proxy.url`, then `HTTPS_PROXY`, `HTTP_PROXY`, and `ALL_PROXY`; curl-style `NO_PROXY` plus Reasonix-specific additions control bypass (`src/net/proxy.ts`, `src/config.ts`).
- Loopback is bypassed by default, and DeepSeek hosts are direct by default unless `REASONIX_PROXY_DEEPSEEK_DIRECT` or config overrides that policy (`src/net/proxy.ts`).
- `--no-proxy` and `proxy.disabled` disable proxy installation for the process (`src/net/proxy.ts`, `src/config.ts`, `src/cli/index.ts`).

## Monitoring & Observability

**Error Tracking:**
- No external runtime error-tracking SDK is declared (`package.json`).
- GitHub CodeQL performs scheduled and branch security analysis for JavaScript/TypeScript (`.github/workflows/codeql.yml`).

**Logs:**
- Runtime diagnostics go to terminal output and local JSONL session/event/usage/transcript files (`src/adapters/event-sink-jsonl.ts`, `src/telemetry/usage.ts`, `src/transcript/log.ts`).
- Known DeepSeek and bot credential values are collected for value-level redaction before events/logs are shared (`src/config.ts`, `src/core/event-redaction.ts`).
- CI failures on `v1` pushes can notify Discord through the `DISCORD_CI_WEBHOOK` GitHub secret (`.github/workflows/ci.yml`).

## CI/CD & Deployment

**Hosting:**
- The production delivery target is the public npm registry; no web-app hosting target is active (`package.json`, `.github/workflows/publish-npm.yml`).
- The maintained source, issues, and release automation are hosted in `ZYist/reasonix-legacy` on GitHub (`package.json`, `docs/governance.md`).

**CI Pipeline:**
- GitHub Actions runs Windows Node `24.15.0`/npm `11.16.0` lint, typecheck, build, docs checks, Vitest coverage, and a dry benchmark harness for `v1` and `dev` (`.github/workflows/ci.yml`).
- CodeQL runs on pushes, pull requests, and a weekly schedule (`.github/workflows/codeql.yml`).
- npm publication is a manual workflow dispatch gated by an exact matching tag/package version and uses `NPM_TOKEN` (`.github/workflows/publish-npm.yml`).
- GitHub issue automation uses issue-labeler, similarity analysis, and oosmetrics health-check actions (`.github/workflows/issue-labeler.yml`, `.github/workflows/issue-similarity.yml`, `.github/workflows/oosmetrics.yml`).

## Environment Configuration

**Required env vars:**
- Core model access: `DEEPSEEK_API_KEY`; endpoint overrides are `DEEPSEEK_BASE_URL` and `DEEPSEEK_API_BASE_URL` (`src/config.ts`, `src/client.ts`).
- Optional search access: `METASO_API_KEY`, `BAIDU_API_KEY`/`QIANFAN_API_KEY`, `TAVILY_API_KEY`, `PERPLEXITY_API_KEY`, `EXA_API_KEY`, `BRAVE_SEARCH_API_KEY`/`BRAVE_API_KEY`, and `OLLAMA_API_KEY` (`src/config.ts`, `src/tools/web.ts`).
- Optional local embeddings: `OLLAMA_URL` and `REASONIX_EMBED_MODEL` (`src/index/semantic/embedding.ts`).
- Optional bot access: QQ, Telegram, and Weixin variables listed under their channel sections (`src/config.ts`).
- Optional network routing: standard proxy variables plus `REASONIX_PROXY_DEEPSEEK_DIRECT` and `REASONIX_NO_PROXY` (`src/net/proxy.ts`).
- CI-only secrets: `NPM_TOKEN`, `DISCORD_CI_WEBHOOK`, and GitHub-provided `GITHUB_TOKEN` (`.github/workflows/publish-npm.yml`, `.github/workflows/ci.yml`, `.github/workflows/oosmetrics.yml`).

**Secrets location:**
- Process environment and the uncommitted local user configuration are the main runtime secret boundaries (`src/config.ts`, `docs/configuration.md`).
- `.env.example` exists only as a checked-in template; no environment-file contents are included in this audit (`.env.example`).
- Weixin account credentials are stored in per-user files outside the repository (`src/weixin/account.ts`).
- GitHub Actions secrets supply publication, CI notification, and GitHub API credentials (`.github/workflows/publish-npm.yml`, `.github/workflows/ci.yml`, `.github/workflows/oosmetrics.yml`).

## Webhooks & Callbacks

**Incoming:**
- No inbound HTTP webhook server is active; Telegram uses polling, QQ uses an outbound gateway WebSocket, and Weixin uses long polling (`src/telegram/bot.ts`, `src/qq/bot.ts`, `src/weixin/bot.ts`).
- MCP network transports and ACP stdin/stdout are client/protocol connections, not public webhook endpoints (`src/mcp/sse.ts`, `src/mcp/streamable-http.ts`, `src/acp/server.ts`).

**Outgoing:**
- The CI workflow can POST failure notifications to a configured Discord webhook (`.github/workflows/ci.yml`).
- Bot replies are sent to QQ, Telegram, and Weixin provider APIs (`src/qq/bot.ts`, `src/telegram/bot.ts`, `src/weixin/bot.ts`).
- Search, fetch, model, registry, version, and embedding calls are outbound only (`src/tools/web.ts`, `src/client.ts`, `src/mcp/registry-fetch.ts`, `src/version.ts`, `src/index/semantic/embedding.ts`).

---

*Integration audit: 2026-07-22*
