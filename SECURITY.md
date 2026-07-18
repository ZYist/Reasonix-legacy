# Security Policy

<!-- source-of-truth: package.json; src/cli/index.ts; src/cli/commands/acp.ts; src/cli/headless/host.ts; src/cli/commands/qq.ts; src/cli/commands/telegram.ts; src/cli/commands/weixin.ts -->

If you find a security issue in `reasonix-legacy`, please report it privately
rather than opening a public issue or discussion thread.

## How to report

Email <359807859@qq.com> with:

- a clear description of the issue
- steps that reproduce it (a minimal repro is fine)
- the version (`reasonix-legacy --version`) and platform you observed it on

You'll get an acknowledgement within a few days, and a fix or mitigation as
soon as the maintainer can land it. If you'd like attribution in the release
notes when the fix ships, say so in your report — the default is a quiet patch.

## Supported versions

Only the latest published minor of `reasonix-legacy` on npm is actively
maintained. If you're on something older, please reproduce on the latest before
reporting.

## Scope

**In scope:**

- The published `reasonix-legacy` npm package and its CLI / TUI entrypoints.
- The maintained ACP command, embedded ACP server, and MCP bridge/client code
  shipped from this repository.
- Optional headless QQ, Telegram, and Weixin channel commands together with
  their permission, credential, and redaction boundaries.
- Shell-command execution, edit gates, session/config persistence, and other
  maintained code in `src/` that ships in the current package.

**Out of scope:**

- Third-party MCP servers or external chat services beyond the credential and
  request boundaries controlled by `reasonix-legacy`.
- Misconfiguration of the user's own DeepSeek API key, chat-channel
  credentials, environment, or shell profile.
- Vulnerabilities in upstream Node.js, npm, DeepSeek, Telegram, QQ, Weixin, or
  other third-party services.
- Denial-of-service via deliberately oversized prompts or tool inputs
  (Reasonix is a single-user CLI; there's no multi-tenant boundary to defend).

## Hardening notes

A few practical reminders for users running `reasonix-legacy`:

- API keys live in `~/.reasonix/config.json`; chat-channel credentials live in
  the same config/account stores. Treat those files like any other credential
  store.
- Channel error paths are expected to redact secrets before writing to stderr or
  returning a user-visible failure. If you can reproduce a plaintext credential
  leak, report it as a security bug.
- `run_command` and the `!` shell shortcut respect a permission allowlist; the
  safe default is `ask` on anything not pre-approved. Don't set `editMode: yolo`
  on machines that hold secrets you'd regret leaking.
- Hooks (`PreToolUse`, etc.) execute arbitrary shell scripts the user has
  configured. Audit `.reasonix/settings.json` before running Reasonix in a
  directory you didn't author.
