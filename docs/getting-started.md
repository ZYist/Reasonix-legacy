# Getting started

<!-- source-of-truth: package.json; .env.example; src/cli/index.ts; src/cli/commands/setup.ts -->

## Requirements

- Node.js **22 or newer**
- npm
- Git
- A DeepSeek API key, or credentials for a compatible endpoint

`reasonix-legacy` is currently installed from the maintained GitHub repository.
Do not assume that the `reasonix-legacy` package is published on npm.

## Install from source

```bash
git clone https://github.com/ZYist/reasonix-legacy.git
cd reasonix-legacy
npm install
npm run build
npm link
```

`npm link` exposes the sole executable from `package.json`: `reasonix-legacy`.

## Configure

Run the interactive setup wizard:

```bash
reasonix-legacy setup
```

The wizard writes user configuration to `~/.reasonix/config.json`. You can also
create a local `.env` file from `.env.example`:

```dotenv
DEEPSEEK_API_KEY=sk-replace-with-your-own-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

Never commit `.env`, bot tokens, API keys, or copied user config. See the
[configuration reference](configuration.md) for precedence and channel access
controls.

## First runs

Start the coding TUI in the current directory:

```bash
reasonix-legacy code
```

A bare `reasonix-legacy` invocation also enters code mode after first-run setup. To use
a different workspace:

```bash
reasonix-legacy code path/to/project
```

Use chat mode when filesystem and shell tools are not wanted:

```bash
reasonix-legacy chat
```

Run one non-interactive task and stream the answer to stdout:

```bash
reasonix-legacy run "Summarize the repository structure"
```

Useful checks:

```bash
reasonix-legacy doctor
reasonix-legacy --help
reasonix-legacy code --help
```

## Optional surfaces

- ACP over stdio: `reasonix-legacy acp`
- QQ: `reasonix-legacy qq`
- Telegram: `reasonix-legacy telegram`
- Weixin: `reasonix-legacy weixin`

The retired `reasonix-legacy desktop` command is only a compatibility error stub. The
Web dashboard and desktop GUI are not part of the maintained branch. Continue
with the [CLI reference](cli-reference.md) or the channel guides in the
[documentation hub](README.md).
