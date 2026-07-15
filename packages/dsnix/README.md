# dsnix

`dsnix` is the short command alias for the `reasonix-legacy` CLI in this repository. The root package exposes both `reasonix` and `dsnix`; this workspace package is retained as a package-local compatibility shim.

## Current status

This fork does not currently claim a public npm release for either `reasonix-legacy` or this shim. Install the repository from source instead:

```bash
git clone https://github.com/ZYist/reasonix-legacy.git
cd reasonix-legacy
npm install
npm run build
npm link
```

After linking, both commands start the same built CLI:

```bash
reasonix code my-project
dsnix code my-project
```

The canonical package is `reasonix-legacy` version `1.2.0`; the displayed CLI version uses the `legacy-` prefix. See the [current documentation hub](https://github.com/ZYist/reasonix-legacy/blob/dev/docs/README.md) for setup, configuration, commands, and channel guides.
