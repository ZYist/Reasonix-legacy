# External Integrations

**Analysis Date:** 2026-07-02

## APIs & External Services

**LLM Provider (primary):**
- DeepSeek API — chat completions (streaming + non-streaming), model list, user balance.
  - SDK/Client: custom `DeepSeekClient` (`src/client.ts`); raw `fetch` via `undici`, SSE parsed with `eventsource-parser`.
  - Endpoints: `POST {baseUrl}/chat/completions`, `GET {baseUrl}/models`, `GET {baseUrl}/user/balance`.
  - Default base URL: `https://api.deepseek.com` (override via `DEEPSEEK_BASE_URL` or config `baseUrl`).
  - Auth: `Authorization: Bearer ${DEEPSEEK_API_KEY}` (`src/client.ts`).
  - Models: `deepseek-v4-flash` (default), `deepseek-v4-pro` (`SUPPORTED_OFFICIAL_MODELS` in `src/config.ts`); `reasoning_effort` and `extra_body.thinking.type` toggles (thinking skipped on `*.azure.com` hosts).
  - Azure OpenAI-compatible endpoints supported (`DeepSeekClient._isAzureEndpoint()`).
  - Rate limit / retry: client-side RPM pacing (`waitForChatRateLimit`) and `fetchWithRetry` (`src/retry.ts`); 11-min timeout to outlast DeepSeek's 10-min queue.

**MCP (Model Context Protocol):**
- Custom MCP client (`src/mcp/`) speaking JSON-RPC 2.0 (spec `2024-11-05`, `MCP_PROTOCOL_VERSION`).
  - Transports: stdio (`src/mcp/stdio.ts`), SSE (`src/mcp/sse.ts`), streamable-http (`src/mcp/streamable-http.ts`).
  - Server config: `mcp`, `mcpDisabled`, `mcpEnv`, `mcpServers` in `~/.reasonix/config.json` (`src/config.ts`); CLI `--mcp` specs parsed by `src/mcp/spec.ts`.
  - Registry / marketplace: `src/mcp/registry.ts`, `src/mcp/registry-fetch.ts`, `src/mcp/marketplace-overlay/`.
  - Reconnect / drift / preflight / latency tracking: `src/mcp/{reconnect,drift,preflight,latency}.ts`.

**ACP (Agent Client Protocol) — JSON-RPC 2.0 over NDJSON:**
- `src/acp/server.ts` (`AcpServer`), `src/acp/{protocol,dispatch,gates}.ts`. Reads stdin / writes stdout; one JSON object per line.

**Web Search (pluggable engine):**
- `src/tools/web.ts` — `webSearch` + `webFetch`. Engine chosen via config `webSearchEngine` (default `bing`).
  - `bing` (scrapes `cn.bing.com`), `bing-intl` (`www.bing.com`) — no key.
  - `searxng` — self-hosted; base URL from config `webSearchEndpoint` (default `http://localhost:8080`).
  - `metaso` — `METASO_API_KEY` / config `metasoApiKey`.
  - `baidu` — `BAIDU_API_KEY` / `QIANFAN_API_KEY` / config `baiduApiKey`.
  - `tavily` — `TAVILY_API_KEY` / config `tavilyApiKey`.
  - `perplexity` — `PERPLEXITY_API_KEY` / config `perplexityApiKey`.
  - `exa` — `EXA_API_KEY` / config `exaApiKey`.
  - `brave` — `BRAVE_SEARCH_API_KEY` / config `braveApiKey`.
  - `ollama` — `OLLAMA_API_KEY` / config `ollamaApiKey` (Ollama cloud web_search/web_fetch).
  - `webFetch` sniffs HTML → text via `node-html-parser`; 32k char cap, 15s timeout, 10 MiB body cap.

**Semantic Search / Embeddings:**
- `src/index/semantic/embedding.ts` — two providers:
  - `ollama` (default `http://localhost:11434`, model `nomic-embed-text`).
  - `openai-compat` (config `semantic.openaiCompat.{baseUrl,apiKey,model,extraBody,batchSize}`).
- Builder/chunker/store: `src/index/semantic/{builder,chunker,store,tool,preflight}.ts`; launcher `src/index/semantic/ollama-launcher.ts`.

**Messaging Channels (bot ingress):**
- Telegram — `grammy` `Bot` (`src/telegram/bot.ts`); config `telegram.botToken`, `ownerUserId`, `allowlist` (`src/telegram/access.ts`, `src/telegram/channel.ts`).
- QQ Official Bot — WebSocket gateway `wss://api.sgroup.qq.com/websockets` (sandbox: `sandbox.api.sgroup.qq.com`), access token from `https://bots.qq.com/app/getAppAccessToken` (`src/qq/bot.ts`); config `qq.{appId,appSecret,sandbox,ownerOpenId,allowlist}`.
- WeChat (iLink) — long-poll against `https://ilinkai.weixin.qq.com`, QR login via `qrcode` (`src/weixin/bot.ts`); config `weixin.{token,accountId,baseUrl,ownerUserId,allowlist}`; account state persisted by `src/weixin/account.ts`.
- Each channel has a `use-*-channel.ts` hook wiring it into the agent loop (`src/{telegram,qq,weixin}/use-*-channel.ts`).

**Version / Update Metadata:**
- `src/version.ts` — `getLatestVersion()` fetches release info; `detectInstallSource`, `isNpxInstall`, `detectNpmInstallPrefix`.
- Desktop updater — Tauri `tauri-plugin-updater` polling Cloudflare R2 (`https://pub-147fb53b9c1e4bbf891a257968619ea7.r2.dev/latest/latest.json`) and GitHub Releases (`https://github.com/esengine/reasonix/releases/latest/download/latest.json`); pubkey pinned in `desktop/src-tauri/tauri.conf.json`.

**Discord (CI notifications only):**
- `curl` POST to `secrets.DISCORD_CI_WEBHOOK` on `main` CI failure (`.github/workflows/ci.yml`).

## Data Storage

**Databases:**
- SQLite (desktop only) — `rusqlite` 0.32 (bundled) in `desktop/src-tauri/src/cc_switch.rs` (CC switch / MCP state). No SQL DB on the CLI side.

**File Storage:**
- Local filesystem only.
- Sessions / memory / config under `~/.reasonix/` (config path resolved in `src/config.ts`; `~/.reasonix/config.json`, sessions dir via `src/memory/session.ts`).
- Project memory files: `PROJECT_MEMORY_FILES` from `src/memory/project.ts`.
- User memory: `~/.reasonix/` memory dir (`src/memory/user.ts`, `USER_MEMORY_DIR`).
- Runtime memory layers: `ImmutablePrefix`, `AppendOnlyLog`, `VolatileScratch` (`src/memory/runtime.ts`).
- Workspace checkpoints / file snapshots: `src/ports/checkpoint-store.ts`, `src/code/checkpoints.ts` (snapshot/restore under workspace `.reasonix` state).
- Event sinks: JSONL append (`src/adapters/event-sink-jsonl.ts`, `src/adapters/event-source-jsonl.ts`, `src/ports/event-sink.ts`).
- Usage / telemetry logs: `src/telemetry/usage.ts` (`defaultUsageLogPath`), transcript logs `src/transcript/log.ts`.
- Bundled read-only data: `data/deepseek-tokenizer.json.gz` (tokenizer, see `scripts/prepare-tokenizer.ts`).

**File Storage (cloud):**
- None for user data. Cloudflare R2 bucket only serves desktop updater manifests.

**Caching:**
- DeepSeek prompt cache (server-side, tracked via `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens` in `Usage` — `src/client.ts`).
- In-process LRU (`src/core/lru.ts`), inflight dedup (`src/core/inflight.ts`), cache diagnostics (`src/telemetry/cache-diagnostics.ts`).
- No external cache service (no Redis/Memcached).

## Authentication & Identity

**Auth Provider:**
- Custom / API-key only.
- DeepSeek API key (`DEEPSEEK_API_KEY`) gates LLM access; stored in `~/.reasonix/config.json`, validated by `isPlausibleKey` (`src/config.ts`).
- Bot channels use their own platform credentials (Telegram bot token, QQ app id/secret, WeChat token + iLink login).
- Dashboard HTTP server: per-boot random 32-byte hex token (`mintToken` in `src/server/index.ts`); mutations require `X-Reasonix-Token` header (CSRF), reads accept header or `?token=`; constant-time comparison. Pinnable via config `dashboard.{port,host,token}`.
- Bot allowlists: Telegram / QQ / WeChat each gate inbound users by id/openid (`src/{telegram,qq,weixin}/access.ts`).

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry / Rollbar detected). Errors surface via the TUI/dashboard and JSONL event sinks.

**Logs:**
- JSONL event/transcript logs (`src/transcript/log.ts`, `src/adapters/event-sink-jsonl.ts`).
- Usage logs (`src/telemetry/usage.ts`).
- CPU profile capture (`src/cli/cpu-prof.ts`), startup profiling (`src/cli/startup-profile.ts`), `scripts/analyze-cpuprofile.mjs`.
- Telemetry: `src/telemetry/{stats,usage,cache-diagnostics,subagent-distillation}.ts` (local only).

## CI/CD & Deployment

**Hosting:**
- CLI: npm registry (`reasonix-legacy`).
- Desktop: GitHub Releases (auto-updated via R2 + GitHub latest.json).
- Dashboard: embedded HTTP server (loopback default) or static assets (`dashboard/index.html`, `dashboard/dist`).

**CI Pipeline:** GitHub Actions (`.github/workflows/`):
- `ci.yml` — lint (biome) → typecheck → build (tsup + dashboard) → test with coverage (vitest) → τ-bench dry-run. Matrix: ubuntu-latest + windows-latest, node 22. Discord webhook on main failure.
- `codeql.yml` — GitHub CodeQL security analysis.
- `publish-npm.yml` — npm publish on `v*` tags.
- `publish-dsnix.yml` — publishes `@reasonix/dsnix` (`packages/dsnix/`).
- `release.yml` — Tauri desktop bundle (linux/macos-x64/macos-arm64/windows) on `desktop-v*` tags; Apple + Windows code signing via secrets.
- `release-mirror.yml`, `issue-labeler.yml`, `issue-similarity.yml`, `oosmetrics.yml` — release mirror + issue triage automation.

## Environment Configuration

**Required env vars:**
- `DEEPSEEK_API_KEY` — required for LLM access (`src/client.ts` throws if unset).

**Optional env vars:**
- `DEEPSEEK_BASE_URL` — override API origin.
- `REASONIX_MAX_ITER` — per-turn tool-call iteration cap (default 50).
- `REASONIX_PROXY_DEEPSEEK_DIRECT` — toggle DeepSeek proxy bypass (`src/net/proxy.ts`).
- `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` / `NO_PROXY` — proxy config (curl-style precedence; installed as undici global dispatcher in `src/net/proxy.ts`).
- `METASO_API_KEY`, `BAIDU_API_KEY` / `QIANFAN_API_KEY`, `TAVILY_API_KEY`, `PERPLEXITY_API_KEY`, `EXA_API_KEY`, `BRAVE_SEARCH_API_KEY`, `OLLAMA_API_KEY` — web search provider keys.

**Secrets location:**
- `~/.reasonix/config.json` (API keys, bot tokens, account state).
- `.env` in CWD (loaded by `src/env.ts`; `.env.example` documents shape — contents never read by tooling).
- GitHub Actions secrets: `DISCORD_CI_WEBHOOK`, `APPLE_CERTIFICATE`, `WINDOWS_CERTIFICATE` (+ signing password secrets).

## Webhooks & Callbacks

**Incoming:**
- Dashboard HTTP API — `src/server/api/` exposes endpoints (sessions, checkpoints, files, plans, hooks, MCP, models, settings, submit, abort, browse, etc.) behind the URL token. Routed by `src/server/router.ts`, served by `node:http` (`src/server/index.ts`).
- Bot channel inbound: Telegram updates (grammy polling), QQ gateway WebSocket, WeChat iLink long-poll — all routed into the agent loop via the channel hooks in `src/{telegram,qq,weixin}/channel.ts`.
- ACP inbound — JSON-RPC over stdin (`src/acp/server.ts`).

**Outgoing:**
- DeepSeek chat / models / balance (above).
- MCP tool bridges — outbound JSON-RPC to configured MCP servers (`src/mcp/registry.ts` `bridgeMcpTools`).
- Web search / fetch (above).
- Embeddings — Ollama / OpenAI-compat HTTP (above).
- Desktop auto-updater — R2 + GitHub Releases HEAD/GET.
- Discord CI webhook (CI only).

---

*Integration audit: 2026-07-02*
