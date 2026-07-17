# Connect Weixin

<!-- source-of-truth: src/config.ts; src/cli/commands/weixin.ts; src/weixin/account.ts; src/weixin/channel.ts; src/cli/ui/slash/handlers/weixin.ts -->

The standalone Weixin command performs QR login before starting the channel when
no saved token/account ID is available. The scanned account becomes the owner if
no owner was already configured.

## QR lifecycle

```bash
reasonix-legacy weixin --workspace path/to/project
```

1. The command boots HeadlessHost and installs signal cleanup.
2. If `token` or `accountId` is missing, QR text is printed to stderr.
3. Scan and confirm in Weixin.
4. The returned token is saved under
   `~/.reasonix/weixin/accounts/<accountId>.json`; config keeps the account ID,
   base URL, owner, and allowlist.
5. The channel acquires its PID lock and begins polling. Ctrl-C stops it cleanly.

Set `REASONIX_WEIXIN_ACCOUNTS_DIR` to move the account credential directory.
Never commit that directory.

## Manual configuration

Environment overrides are `WEIXIN_TOKEN`, `WEIXIN_ACCOUNT_ID`,
`WEIXIN_BASE_URL`, `WEIXIN_OWNER_USER_ID`, and comma/space-separated
`WEIXIN_ALLOWLIST`. A config example without embedding the token is:

```json
{
  "weixin": {
    "accountId": "replace-with-account-id",
    "baseUrl": "https://replace-with-service-base-url.example",
    "ownerUserId": "replace-with-owner-user-id",
    "allowlist": []
  }
}
```

Weixin refuses to start without an owner or allowlist. QR login supplies the
scanned user as owner when possible; for manual credentials, configure
`ownerUserId` explicitly.

## From the TUI

```text
/weixin connect
/weixin status
/weixin disconnect
```

The alias `/wx` resolves to `/weixin`. The explicit manual form is:

```text
/weixin connect manual TOKEN ACCOUNT_ID [BASE_URL]
```

Prefer QR login or local environment injection over placing a token in command
history. See [configuration](configuration.md) and the
[Chinese guide](weixin-connect.zh-CN.md).
