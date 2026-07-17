# 连接微信

<!-- source-of-truth: src/config.ts; src/cli/commands/weixin.ts; src/weixin/account.ts; src/weixin/channel.ts; src/cli/ui/slash/handlers/weixin.ts -->

独立微信命令在缺少已保存的 token/accountId 时，会先执行二维码登录；如果尚未配置
owner，扫码返回的用户会成为 owner。

## 二维码生命周期

```bash
reasonix-legacy weixin --workspace path/to/project
```

1. 命令先启动 HeadlessHost，并提前安装信号清理。
2. 缺少 `token` 或 `accountId` 时，二维码文本输出到 stderr。
3. 用微信扫码并确认。
4. token 保存到 `~/.reasonix/weixin/accounts/<accountId>.json`；主配置只保存
   accountId、baseUrl、owner 和 allowlist。
5. 通道获取 PID 锁后开始轮询；Ctrl-C 会清理退出。

可用 `REASONIX_WEIXIN_ACCOUNTS_DIR` 修改凭据目录。不要提交该目录。

## 手动配置

环境变量覆盖项为 `WEIXIN_TOKEN`、`WEIXIN_ACCOUNT_ID`、`WEIXIN_BASE_URL`、
`WEIXIN_OWNER_USER_ID` 和逗号/空格分隔的 `WEIXIN_ALLOWLIST`。不把 token 写入
主配置的示例：

```json
{
  "weixin": {
    "accountId": "替换为-account-id",
    "baseUrl": "https://replace-with-service-base-url.example",
    "ownerUserId": "替换为-owner-user-id",
    "allowlist": []
  }
}
```

没有 owner 或 allowlist 时通道拒绝启动。二维码登录通常自动写入扫码用户；手动凭据
路径应显式配置 `ownerUserId`。

## TUI 内连接

```text
/weixin connect
/weixin status
/weixin disconnect
```

`/wx` 是 `/weixin` 的别名。显式手动形式为：

```text
/weixin connect manual TOKEN ACCOUNT_ID [BASE_URL]
```

优先使用二维码或本地环境注入，避免 token 留在命令历史。另见
[配置参考](configuration.md)和[英文指南](weixin-connect.md)。
