# Connect QQ

<!-- source-of-truth: src/config.ts; src/cli/commands/qq.ts; src/qq/channel.ts; src/cli/ui/slash/handlers/qq.ts -->

QQ runs as either a standalone headless process or a connection mounted from the
code/chat TUI. It reuses the same HeadlessHost loop and permission prompts.

## Configure

Provide an app ID and app secret through `~/.reasonix/config.json`:

```json
{
  "qq": {
    "appId": "replace-with-qq-app-id",
    "appSecret": "replace-with-qq-app-secret",
    "sandbox": false,
    "ownerOpenId": "replace-with-owner-openid",
    "allowlist": []
  }
}
```

Environment overrides are `QQ_APPID`, `QQ_SECRET`, `QQ_SANDBOX=0|1`,
`QQ_OWNER_OPENID`, and comma/space-separated `QQ_ALLOWLIST`.

QQ accepts a configured owner and allowlist. If neither is configured, the first
sender is bound for that process lifetime; configure `ownerOpenId` before using a
publicly reachable bot.

## Standalone command

```bash
reasonix-legacy qq --workspace path/to/project
```

Optional flags include `--model`, `--effort`, and `--budget`. Stop with Ctrl-C;
the command handles SIGINT/SIGTERM and releases its PID lock.

## From the TUI

```text
/qq connect
/qq status
/qq disconnect
```

The TUI connection can guide credential setup when values are missing. Do not
paste a secret into a shared transcript or issue report.

See [configuration](configuration.md) and the
[Chinese guide](qq-connect.zh-CN.md).
