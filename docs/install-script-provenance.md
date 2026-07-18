# Install-script provenance

<!-- source-of-truth: package.json; package-lock.json; scripts/check-docs.mjs -->

This document records every maintained install-time script that exists in the
current repository dependency graph. It is the audit trail for Phase 11's
supply-chain contract.

## Current contract

- Validation baseline: Windows + Node `24.15.0` + npm `11.16.0` + PowerShell.
- Root lifecycle script: `prepare = simple-git-hooks || true`.
- No current production dependency is allowed to require an install script.
- Every `package-lock.json` entry with `hasInstallScript: true` must remain
  listed in the reviewed set below. Any drift must update this document and the
  associated automated checks.

## Why these scripts exist

All current install-script entries are development-only tooling, or optional
platform packages recorded in the lockfile for completeness. None of them are
part of the published runtime contract for the `reasonix-legacy` npm package.

| Lockfile path | Version | Flags | Why it is acceptable |
|---|---:|---|---|
| `node_modules/@biomejs/biome` | `1.9.4` | dev | Selects the platform-specific Biome binary used by repo lint/format workflows. |
| `node_modules/esbuild` | `0.21.5` | dev | Installs the direct build-time esbuild binary used by local bundling workflows. |
| `node_modules/fsevents` | `2.3.3` | dev, optional | macOS-only file watching helper preserved in the lockfile; it is optional and not installed on the Windows maintenance baseline. |
| `node_modules/simple-git-hooks` | `2.13.1` | dev | Implements the root `prepare` hook that installs local Git hooks for maintainers. |
| `node_modules/tree-sitter-go` | `0.25.0` | dev | Provides the Go grammar artifact used by development build/copy workflows. |
| `node_modules/tree-sitter-java` | `0.23.5` | dev | Provides the Java grammar artifact used by development build/copy workflows. |
| `node_modules/tree-sitter-javascript` | `0.25.0` | dev | Provides the JavaScript grammar artifact used by development build/copy workflows. |
| `node_modules/tree-sitter-python` | `0.25.0` | dev | Provides the Python grammar artifact used by development build/copy workflows. |
| `node_modules/tree-sitter-rust` | `0.24.0` | dev | Provides the Rust grammar artifact used by development build/copy workflows. |
| `node_modules/tree-sitter-typescript` | `0.23.2` | dev | Provides the TypeScript grammar package used by development build/copy workflows. |
| `node_modules/tree-sitter-typescript/node_modules/tree-sitter-javascript` | `0.23.1` | dev | Nested grammar dependency required by `tree-sitter-typescript`. |
| `node_modules/tsup/node_modules/esbuild` | `0.27.7` | dev | Nested esbuild binary selected by `tsup`, the maintained package bundler. |
| `node_modules/tsx/node_modules/esbuild` | `0.27.7` | dev | Nested esbuild binary selected by `tsx`, used for TypeScript dev/test execution. |

## Machine-checked reviewed set

The block below is parsed by `scripts/check-docs.mjs` and
`tests/install-script-provenance.test.ts`.

```install-script-review
{
  "reviewedOn": "2026-07-18",
  "baseline": "Windows / Node 24.15.0 / npm 11.16.0 / PowerShell",
  "rootPrepareScript": "simple-git-hooks || true",
  "productionInstallScriptsAllowed": false,
  "entries": [
    {
      "path": "node_modules/@biomejs/biome",
      "version": "1.9.4",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/esbuild",
      "version": "0.21.5",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/fsevents",
      "version": "2.3.3",
      "dev": true,
      "optional": true
    },
    {
      "path": "node_modules/simple-git-hooks",
      "version": "2.13.1",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/tree-sitter-go",
      "version": "0.25.0",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/tree-sitter-java",
      "version": "0.23.5",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/tree-sitter-javascript",
      "version": "0.25.0",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/tree-sitter-python",
      "version": "0.25.0",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/tree-sitter-rust",
      "version": "0.24.0",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/tree-sitter-typescript",
      "version": "0.23.2",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/tree-sitter-typescript/node_modules/tree-sitter-javascript",
      "version": "0.23.1",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/tsup/node_modules/esbuild",
      "version": "0.27.7",
      "dev": true,
      "optional": false
    },
    {
      "path": "node_modules/tsx/node_modules/esbuild",
      "version": "0.27.7",
      "dev": true,
      "optional": false
    }
  ]
}
```
