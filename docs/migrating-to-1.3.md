# Migrating to reasonix-legacy 1.3.x

<!-- source-of-truth: package.json; docs/governance.md; docs/lts-policy.md; CHANGELOG.md -->

This guide moves a user from the historical **1.2** line (the obsolete
`reasonix` / `dsnix` executables) to the maintained LTS line
**`reasonix-legacy 1.3.1`**. It covers install migration, verification, backup,
rollback, and how to tell the fork release apart from upstream history.

`1.2` is **not** an LTS line and is no longer maintained. There is no
compatibility shim and no dual-command transition period — the maintained
identity is the single `reasonix-legacy` executable. See
[`lts-policy.md`](lts-policy.md) for the support contract and
[`governance.md`](governance.md) for version authority.

## Before you migrate (MIG-02)

1. **Back up your configuration and sessions** so you can return to a known
   local state if the upgrade fails:

   ```bash
   # PowerShell
   Copy-Item -Recurse "$HOME/.reasonix" "$HOME/.reasonix.backup-1.2"
   ```

   This preserves `~/.reasonix/config.json`, session logs, and the version cache.

2. **Record your current version** so you know where you are rolling back to:

   ```bash
   reasonix --version    # or: dsnix --version
   ```

3. Confirm you are on the maintained runtime baseline
   (Windows + Node.js 24.15.0 + npm 11.16.0 + PowerShell) or a newer Node.js 22+.

## Uninstall the old executables (MIG-01)

The 1.2 line exposed `reasonix` and/or `dsnix` as global executables. Remove
them first so the shell resolves only `reasonix-legacy` afterward:

```powershell
# If installed via a global npm link/package on 1.2
npm uninstall -g reasonix
npm uninstall -g dsnix
```

If you installed from a cloned 1.2 source via `npm link`, remove the link
(`npm uninstall -g <name>` from inside that clone, or delete the stale shim
from your global `node_modules`).

`reasonix-legacy` does **not** provide a `reasonix` or `dsnix` alias. The
identity is intentionally singular.

## Install reasonix-legacy 1.3.1

`reasonix-legacy` is currently installed from the maintained GitHub repository
(the package is not assumed to be on npm until the Phase 17 operator-gated
release). Follow [`getting-started.md`](getting-started.md):

```bash
git clone https://github.com/ZYist/reasonix-legacy.git
cd reasonix-legacy
git checkout v1             # release branch
npm install
npm run build
npm link
```

`npm link` exposes the sole executable from `package.json`: `reasonix-legacy`.

## Verify the install (MIG-01)

```bash
reasonix-legacy --version
# expect: reasonix-legacy 1.3.1

reasonix-legacy --help
# expect: the command list (setup, code, chat, run, acp, ...)
```

The old commands must be gone:

```powershell
Get-Command reasonix -ErrorAction SilentlyContinue   # expect: nothing
Get-Command dsnix   -ErrorAction SilentlyContinue   # expect: nothing
```

## Post-upgrade smoke (MIG-02)

Run a minimal check that the agent starts and resolves configuration:

```bash
reasonix-legacy doctor
reasonix-legacy code --help
```

Then start one coding session in a scratch directory and send a trivial prompt
to confirm the cache-first loop reaches the model. If you use a channel, start
one channel lifecycle (`reasonix-legacy qq|telegram|weixin --help`) and confirm
it reaches the login/QR step without touching real credentials unless you have
explicitly authorized a live test.

## Rollback (MIG-02)

If 1.3.1 does not work in your environment, roll back to your **known local
1.2 environment** — not to a re-published 1.2 package:

1. Uninstall the link:
   ```powershell
   npm uninstall -g reasonix-legacy
   ```
2. Restore your backed-up configuration if 1.3.1 wrote anything you want to
   undo:
   ```powershell
   Remove-Item -Recurse "$HOME/.reasonix"
   Copy-Item -Recurse "$HOME/.reasonix.backup-1.2" "$HOME/.reasonix"
   ```
3. Reinstall your previous 1.2 source checkout and `npm link` it again.

Rolling back restores a local working state. It does **not** make 1.2 a
supported release — 1.2 remains historical only and receives no patches.

## Tell the fork release apart from upstream history (MIG-03)

The repository carries several families of tags. They are not interchangeable:

| Tag family | Meaning | Current fork release? |
|---|---|---|
| `v1.3.1` (plain `vX.Y.Z`) | The `reasonix-legacy` fork LTS release | **Yes** |
| `v1.3.0`, `v1.2.x` | Historical fork releases on this TypeScript line | No (history) |
| `1.17.x`, `npm-v1.17.x`, `desktop-v1.17.x` | Upstream lineage / upstream npm / desktop mirror tags | No (upstream provenance) |

Only plain `vX.Y.Z` tags on `ZYist/reasonix-legacy` are releases of the current
fork. The upstream `1.17.x` lineage records where the TypeScript line came
from; it must not be moved, deleted, or treated as a fork release. See
[`governance.md`](governance.md) §HG-01 for the tag convention.

## Operator-action boundary

Installing, linking, and running `reasonix-legacy` locally is a user action.
Publishing to npm, creating GitHub Releases, pushing tags, and changing branch
protection remain explicit maintainer/operator actions and are not performed by
this guide. See [`release-runbook.md`](release-runbook.md) for the release
procedure and authorization boundaries.
