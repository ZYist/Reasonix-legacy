# 连接 Telegram

<!-- source-of-truth: src/config.ts; src/cli/commands/telegram.ts; src/telegram/channel.ts; src/cli/ui/slash/handlers/telegram.ts -->

先通过 Telegram BotFather 创建 bot token，再同时配置凭据和访问边界。没有 owner
或 allowlist 时，Telegram 通道会拒绝启动。

## 配置

```json
{
  "telegram": {
    "botToken": "123456:替换为-bot-token",
    "ownerUserId": "替换为-owner-user-id",
    "allowlist": []
  }
}
```

对应环境变量为 `TELEGRAM_BOT_TOKEN`、`TELEGRAM_OWNER_USER_ID` 和逗号/空格
分隔的 `TELEGRAM_ALLOWLIST`；环境变量优先于配置文件同名字段。

## 独立命令

```bash
reasonix-legacy telegram --workspace path/to/project
```

命令把 Telegram 挂载到 HeadlessHost，转发远程权限确认；同一时刻只处理一个 turn，
SIGINT/SIGTERM 会清理连接和 PID 锁。

## TUI 内连接

```text
/telegram connect
/telegram status
/telegram disconnect
```

`/tg` 是 `/telegram` 的别名。TUI 可提示输入缺失 token，但启动前仍必须有 owner
或 allowlist。

不要把 token 写入 Git、日志、transcript 或截图。另见[配置参考](configuration.md)
和[英文指南](telegram-connect.md)。
