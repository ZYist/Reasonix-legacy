# Connect Telegram

<!-- source-of-truth: src/config.ts; src/cli/commands/telegram.ts; src/telegram/channel.ts; src/cli/ui/slash/handlers/telegram.ts -->

Create a bot token with Telegram's BotFather, then configure both credentials and
an access boundary. Telegram refuses to start without an owner or allowlist.

## Configure

```json
{
  "telegram": {
    "botToken": "123456:replace-with-bot-token",
    "ownerUserId": "replace-with-owner-user-id",
    "allowlist": []
  }
}
```

Equivalent environment overrides are `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_OWNER_USER_ID`, and comma/space-separated `TELEGRAM_ALLOWLIST`.
Environment values override the corresponding config values.

## Standalone command

```bash
reasonix-legacy telegram --workspace path/to/project
```

The command mounts Telegram on HeadlessHost, forwards remote permission choices,
drops concurrent turns with a busy response, and shuts down on SIGINT/SIGTERM.

## From the TUI

```text
/telegram connect
/telegram status
/telegram disconnect
```

The alias `/tg` resolves to `/telegram`. The TUI can prompt for a missing token,
but an owner or allowlist is still required before the transport starts.

Keep the token out of Git, logs, transcripts, and screenshots. See
[configuration](configuration.md) and the
[Chinese guide](telegram-connect.zh-CN.md).
