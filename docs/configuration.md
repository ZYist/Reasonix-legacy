# Configuration

<!-- source-of-truth: src/config.ts; src/index/config.ts; .env.example; src/proxy.ts -->

## Files and precedence

The user config is `~/.reasonix/config.json`. Writes are atomic and malformed or
missing JSON is read as an empty config. A project can also load `.env` without
overwriting variables already present in the process environment.

Endpoint resolution is intentionally paired:

1. `DEEPSEEK_BASE_URL` (or `DEEPSEEK_API_BASE_URL`) selects the endpoint and uses
   `DEEPSEEK_API_KEY` from the environment.
2. Otherwise config `baseUrl` selects the endpoint and uses config `apiKey`.
3. Otherwise the API key is `DEEPSEEK_API_KEY` first, then config `apiKey`.

This prevents a key for one endpoint from silently leaking to another endpoint.
Command-line options such as `--model`, `--effort`, `--budget`, `--no-session`,
`--no-mouse`, and `--no-proxy` apply to the current process and take precedence
for that run.

## Minimal example

Use obvious placeholders only; do not commit a real copy of this file.

```json
{
  "apiKey": "sk-replace-with-your-own-key",
  "baseUrl": "https://api.deepseek.com",
  "model": "deepseek-v4-flash",
  "reasoningEffort": "medium",
  "autoResumeSession": true,
  "mcpServers": {},
  "proxy": { "disabled": false },
  "projects": {}
}
```

## Main configuration areas

| Area | Representative fields and behavior |
|---|---|
| API/model | `apiKey`, `baseUrl`, `model`, `reasoningEffort`, `maxOutputTokens`, `contextTokens`, `pricingOverride` |
| sessions/UI | `session`, `autoResumeSession`, `lang`, `theme`, `banner`, `mouseTracking`, `historyScrollMode`, `diffDisplay`, `statusBar` |
| MCP | canonical `mcpServers`; legacy `mcp`, `mcpEnv`, and `mcpDisabled` are normalized for compatibility |
| search | `search`, `webSearchEngine`, provider endpoint/key fields; provider keys also have environment fallbacks |
| proxy | `proxy.url`, `proxy.disabled`, `proxy.noProxy`, `proxy.bypassDeepSeekDirect`; standard `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, and `NO_PROXY` are also honored |
| permissions | per-project `projects[absoluteRoot].shellAllowed`, `pathAllowed`, `hooksTrusted`; global `shellAllowedGlobal`; `sensitivePaths` always routes matching commands back through confirmation |
| indexing | `index` filters from `src/index/config.ts`; `semantic` embedding provider settings; `skills.paths` |
| safety/cost | `maxIterPerTurn`, `rateLimit`, `toolRateLimit`, `engineeringLifecycle`, `filesystem.outlineThresholdBytes` |

Residual fields explicitly marked desktop-only in `ReasonixConfig` are migration
compatibility data, not a supported UI. Do not document `workspaceDir`,
`recentWorkspaces`, `desktopOpenTabs`, `desktopCloseBehavior`, or `editor` as a
current interface.

## Environment variables

`.env.example` documents the minimal endpoint variables. Common optional
overrides include:

- `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_BASE_URL`
- `REASONIX_LANG`, `REASONIX_THEME`, `REASONIX_MAX_ITER`, `REASONIX_SEARCH`
- search keys such as `METASO_API_KEY`, `BAIDU_API_KEY`, `TAVILY_API_KEY`,
  `PERPLEXITY_API_KEY`, `EXA_API_KEY`, `BRAVE_SEARCH_API_KEY`, `OLLAMA_API_KEY`
- channel variables listed below

## Channel configuration

| Channel | Config object | Environment overrides |
|---|---|---|
| QQ | `qq.appId`, `appSecret`, `sandbox`, `ownerOpenId`, `allowlist` | `QQ_APPID`, `QQ_SECRET`, `QQ_SANDBOX`, `QQ_OWNER_OPENID`, `QQ_ALLOWLIST` |
| Telegram | `telegram.botToken`, `ownerUserId`, `allowlist` | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_USER_ID`, `TELEGRAM_ALLOWLIST` |
| Weixin | `weixin.accountId`, `baseUrl`, `ownerUserId`, `allowlist`; token is stored in the account credential file after QR login | `WEIXIN_TOKEN`, `WEIXIN_ACCOUNT_ID`, `WEIXIN_BASE_URL`, `WEIXIN_OWNER_USER_ID`, `WEIXIN_ALLOWLIST` |

Comma- or whitespace-separated environment allowlists are normalized. Telegram
and Weixin refuse to start without an owner or allowlist; the Weixin QR flow sets
the scanned user as owner when no owner is already configured. QQ can bind the
first sender for the current runtime if no access rule is configured, so set
`ownerOpenId` or an allowlist before exposing it on an untrusted network.

See [QQ](qq-connect.md), [Telegram](telegram-connect.md), and
[Weixin](weixin-connect.md) for lifecycle instructions.

## Secret handling

- Never commit `.env`, `~/.reasonix/config.json`, bot tokens, account credential
  files, or captured transcripts.
- Prefer environment injection or local user config with restrictive filesystem
  permissions.
- Use placeholder values in documentation and bug reports.
- Runtime error paths redact known DeepSeek and bot credential values, but users
  must still review logs before sharing them.
