# 连接 QQ

<!-- source-of-truth: src/config.ts; src/cli/commands/qq.ts; src/qq/channel.ts; src/cli/ui/slash/handlers/qq.ts -->

QQ 可以作为独立无头进程运行，也可以从 code/chat TUI 挂载。两种入口都复用
HeadlessHost、核心 loop 和权限确认。

## 配置

在 `~/.reasonix/config.json` 中填写明显的本地值：

```json
{
  "qq": {
    "appId": "替换为-qq-app-id",
    "appSecret": "替换为-qq-app-secret",
    "sandbox": false,
    "ownerOpenId": "替换为-owner-openid",
    "allowlist": []
  }
}
```

环境变量覆盖项为 `QQ_APPID`、`QQ_SECRET`、`QQ_SANDBOX=0|1`、
`QQ_OWNER_OPENID` 和逗号/空格分隔的 `QQ_ALLOWLIST`。

配置 owner 与 allowlist 后，其他发送者会被拒绝。如果两者都为空，当前进程会把
第一个发送者绑定为运行时 owner；在公开网络使用前应显式配置 `ownerOpenId`。

## 独立命令

```bash
reasonix-legacy qq --workspace path/to/project
```

可选参数包括 `--model`、`--effort`、`--budget`。Ctrl-C 会触发清理并释放 PID 锁。

## TUI 内连接

```text
/qq connect
/qq status
/qq disconnect
```

缺少凭据时 TUI 可以引导配置。不要把 secret 粘贴到共享 transcript 或 issue。

另见[配置参考](configuration.md)和[英文指南](qq-connect.md)。
