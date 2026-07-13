# Telegram and Weixin lifecycle verification

This document defines the maintenance contract for channel lifecycle verification. It separates the behavior covered by the default offline test suite from live user-acceptance testing (UAT) that requires real services, credentials, or a human terminal.

## Offline automated contract

The default Vitest suite must run without Telegram or Weixin credentials, network access, a model service, or an interactive TTY. Channel tests replace the external bot clients, persisted configuration, PID-lock filesystem, headless host, and `process.exit` boundary with deterministic fakes.

Run the focused contract with:

```bash
npx vitest run tests/telegram-lifecycle.test.ts tests/weixin-lifecycle.test.ts tests/telegram-command.test.ts tests/weixin-command.test.ts
```

The offline suite pins these observable behaviors for both channels:

| Lifecycle behavior | Automated assertion |
| --- | --- |
| Startup | A configured channel constructs and starts its bot transport. Telegram also registers its command menu before polling. |
| Event forwarding | An authorized inbound transport message is trimmed and forwarded once with the channel marker (`[TG]` or `[WX]`). |
| Recoverable runtime error | A transport `bot_error` reaches the channel error callback without stopping the adapter; a later message is still forwarded. |
| Fatal startup error | A rejected transport startup rejects `channel.start()` and releases the channel PID lock. |
| Explicit shutdown | `channel.stop()` stops the fake transport and releases the PID lock. |
| Interrupt cleanup | Simulated `SIGINT`/`SIGTERM` unsubscribes gate bridges, attempts channel shutdown once, shuts down the headless host, and exits once. Cleanup remains idempotent and best-effort when transport stop rejects. |

These are characterization assertions for the current adapter and command contracts. They do not claim that a real Telegram or Weixin service accepted credentials or delivered traffic.

## Offline isolation rules

Channel lifecycle tests must keep all of the following boundaries fake or in-memory:

- Telegram Grammy bot and Weixin iLink bot transports
- bot tokens, account ids, owner ids, and allowlists
- PID-lock and Weixin state files
- model/headless-host turns and gate subscriptions
- process signals and `process.exit`

A test that needs a real bot token, QR scan, remote endpoint, actual operating-system signal, or human-visible terminal is live UAT and must not enter the default suite. Do not skip such a test conditionally and then report the behavior as automated coverage.

## Live UAT prerequisites

Live UAT is manual and opt-in. Use a disposable workspace, dedicated test bots/accounts, the smallest practical model budget, and an allowlist containing only the operator. Never save credentials, QR screenshots, access tokens, user ids, or message contents in repository artifacts.

Before starting:

1. Build the exact commit under test with `npm run build`.
2. Confirm no other process is using the same bot or channel account.
3. Record the commit, OS, Node version, start/end timestamps, and pass/fail result in an external test record.
4. Prepare to revoke or rotate any disposable credential after the run.

## Telegram live UAT

Run the built `reasonix telegram` command with a real BotFather token and an explicit owner/allowlist, then verify:

1. **Startup:** the command reaches the online state and the bot command menu is visible.
2. **Authorized forwarding:** an authorized Telegram text reaches the local session and receives the expected response.
3. **Access boundary:** a non-allowlisted account cannot drive the session; avoid recording either account's raw numeric id.
4. **Interactive callback:** a current confirmation button is accepted and a stale button from an older confirmation is ignored.
5. **Recoverable network interruption:** briefly remove network access, restore it, and confirm a visible polling error is followed by successful later message forwarding without restarting the command.
6. **Conflict/error reporting:** start a second poller only with a disposable bot, confirm the 409 conflict guidance is visible and token-redacted, then stop the duplicate.
7. **Interrupt cleanup:** send Ctrl-C while online; optionally send an OS `SIGTERM` from a process manager. Confirm the process exits and an immediate restart does not report a stale PID lock.

A rejected/expired token, Telegram API availability, real Markdown rendering, command-menu propagation, and end-to-end button delivery remain live-service facts even though their local formatting and error mapping have separate unit coverage.

## Weixin live UAT

Run the built `reasonix weixin` command with a disposable Weixin bot account, then verify:

1. **QR startup:** with no saved credentials, the QR is readable in a human terminal and scanning it completes before channel startup.
2. **Configured startup:** a subsequent run reuses the persisted account and reaches the online state without another QR scan while the session remains valid.
3. **Authorized forwarding:** an allowlisted Weixin message reaches the local session and receives the expected response.
4. **Access boundary:** a non-allowlisted account cannot drive the session; do not record raw account or user ids.
5. **Recoverable network interruption:** briefly remove network access during long polling, restore it, and confirm a visible polling error is followed by successful later forwarding.
6. **Session expiry:** using a disposable session, confirm expiry is reported as a reconnect requirement and no token appears in terminal output.
7. **Interrupt cleanup:** press Ctrl-C both during the QR window and after the channel is online. Confirm the host exits and an immediate restart does not report a stale PID lock.
8. **Outbound context behavior:** after receiving an inbound message, verify a reply reaches the same user; if the server invalidates a context token, verify the context-free retry behavior with non-sensitive traffic.

QR scanning, remote iLink compatibility, long-poll timing, server rate limits, persisted server context, and actual message delivery are intentionally live-only.

## Reporting

Report offline and live evidence separately:

- **Offline:** focused command, test-file count, test count, and pass/fail result.
- **Live:** commit, environment, checklist item, sanitized observation, and pass/fail result.

If live UAT was not run, state **not run**. Never infer a live pass from green fake-transport tests.
