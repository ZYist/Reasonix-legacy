---
phase: 04-build-chain-cleanup-full-regression
reviewed: 2026-07-05T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/version.ts
  - tests/cli-bundle-version-marker.test.ts
  - tests/headless-gate-bridges.test.ts
  - tests/headless-host.test.ts
  - .claude/CLAUDE.md
  - .github/workflows/ci.yml
  - package.json
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-07-05
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 04 is a deletion-heavy infra cleanup centered on three substantive logic
changes: (1) `src/version.ts` `readPackageVersion` widening to accept both
`reasonix` and `reasonix-legacy` package names, (2) a rewrite of
`tests/cli-bundle-version-marker.test.ts` to spawn the live
`write-cli-package-marker.mjs`, and (3) vitest registration wrappers + dead-export
removal in the two headless test files. Config/doc trims (CLAUDE.md, ci.yml,
package.json) round out the phase.

The substantive change to `readPackageVersion` is correct and a real improvement
(it was previously locked to `reasonix` while package.json reads
`reasonix-legacy`, leaving VERSION stuck at `0.0.0-dev`). **However**, the rename
propagation across the rest of `src/version.ts` is incomplete. Two sibling
functions in the SAME file still only know the upstream name, and one of them
(`detectNpmInstallPrefix`) is part of the `reasonix update` flow that would
silently replace the user's `reasonix-legacy` install with the upstream package.
These are real defects that the phase's stated "fork-rename name guard" scope
should have closed.

The test rewrites also have two cases where the `it(...)` / case-array title
directly contradicts the assertion — a false-confidence pattern that masks the
underlying behavior. The CLAUDE.md trim missed three stale dashboard references.
Findings below.

## Critical Issues

### CR-01: `detectNpmInstallPrefix` regex does not match `reasonix-legacy` install paths — breaks `reasonix update --prefix` pinning

**File:** `src/version.ts:164-173`
**Issue:**

The phase widened `readPackageVersion`'s name guard to accept both `reasonix`
and `reasonix-legacy` (line 20: `OWN_PACKAGE_NAMES = new Set(["reasonix",
"reasonix-legacy"])`). But the two sibling functions in the same file were NOT
given the same treatment. `detectNpmInstallPrefix` uses:

```ts
const posix = norm.match(/^(.+?)\/lib\/node_modules\/reasonix(?:\/|$)/i);
if (posix) return posix[1] ?? null;
const win = norm.match(/^(.+?)\/node_modules\/reasonix(?:\/|$)/i);
if (win) return win[1] ?? null;
return null;
```

The `(?:\/|$)` after `reasonix` requires a `/` or end-of-string. The actual
install path for this package is `node_modules/reasonix-legacy/...` (per
package.json `"name": "reasonix-legacy"`), so the next char after `reasonix` is
`-`, and BOTH regexes fail. The function returns `null`.

Empirically verified by running the regex against three real install paths
(`/usr/local/lib/node_modules/reasonix-legacy/...`, nvm-style, and Windows
`%APPDATA%/npm`):

```
detectNpmInstallPrefix posix match: null (BROKEN)
detectNpmInstallPrefix win   match: null (BROKEN)
```

This feeds `src/cli/commands/update.ts:137 / buildUpdateCommand` (out of strict
scope but downstream of this in-scope file). With `npmPrefix === null` and
`installSource === "npm"` (which still resolves correctly via the word-boundary
branch in `detectInstallSource:154`), `buildUpdateCommand` falls back to:

```ts
["npm", "install", "-g", "reasonix@latest"]
```

Two problems compound:
1. **Drops the `--prefix` pin** — the exact nvm-use redirect the prefix was
   designed to prevent (CLAUDE.md Architectural Constraints).
2. **Installs the upstream `reasonix` package, not `reasonix-legacy`** — running
   `reasonix update` from a `reasonix-legacy` install silently replaces the fork
   with upstream. Data-loss-class risk for a fork's userbase.

The existing test coverage in `tests/version.test.ts:147-177` gives false
confidence here — see WR-04 below for the test-side finding.

**Fix:**

Update the regex to anchor on the package directory boundary, accepting either
name explicitly (avoids future drift if more renames happen):

```ts
export function detectNpmInstallPrefix(bin?: string): string | null {
  const raw = bin ?? process.argv[1] ?? "";
  if (!raw) return null;
  const norm = raw.replace(/\\/g, "/");
  const posix = norm.match(/^(.+?)\/lib\/node_modules\/reasonix(?:-legacy)?(?:\/|$)/i);
  if (posix) return posix[1] ?? null;
  const win = norm.match(/^(.+?)\/node_modules\/reasonix(?:-legacy)?(?:\/|$)/i);
  if (win) return win[1] ?? null;
  return null;
}
```

And in `src/cli/commands/update.ts:34-38, 81-97`, swap `reasonix@latest` /
`reasonix` for `reasonix-legacy@latest` / `reasonix-legacy` in
`MANUAL_UPDATE_COMMANDS` and `buildUpdateCommand` so the upgrade command targets
the fork. (The latter is out of strict scope for this review but is the
load-bearing downstream fix; without it, the prefix fix above still installs the
wrong package.)

### CR-02: `REGISTRY_URL` hardcoded to upstream `reasonix/latest`, not `reasonix-legacy/latest`

**File:** `src/version.ts:9`
**Issue:**

```ts
const REGISTRY_URL = "https://registry.npmjs.org/reasonix/latest";
```

The package is published as `reasonix-legacy` (package.json `name`, npm
`homepage`/`repository` URLs all point at `Reasonix-legacy`). `getLatestVersion`
queries the upstream `reasonix` package's `latest` dist-tag, then
`compareVersions(VERSION, latest)` compares the local fork version against the
upstream version. The freshness check is against the wrong package.

Pre-existing (not introduced by this phase — confirmed via
`git show 53a64966:src/version.ts`), but exposed as part of the same incomplete
rename propagation that CR-01 belongs to. The phase explicitly widened
`readPackageVersion` for the rename; the registry URL needed the same treatment
in the same file.

**Fix:**

```ts
const REGISTRY_URL = "https://registry.npmjs.org/reasonix-legacy/latest";
```

(Or, more robustly, derive from the resolved package name to keep the two in
sync — but a literal swap matches the existing style.)

## Warnings

### WR-01: Test title contradicts assertion — `cli-bundle-version-marker.test.ts:50`

**File:** `tests/cli-bundle-version-marker.test.ts:50-65`
**Issue:**

The `it(...)` title says the script falls back to `reasonix-legacy`:

```ts
it("falls back to reasonix-legacy name + 0.0.0-dev version when fields are absent", () => {
```

But the assertion expects `"reasonix"`, and the script
(`scripts/write-cli-package-marker.mjs:9`) also falls back to `"reasonix"`:

```ts
expect(marker.name).toBe("reasonix");
```

```js
name: rootPackage.name ?? "reasonix",
```

Title and assertion disagree about the intended behavior. This is false-
confidence: a future maintainer reading the title would expect
`reasonix-legacy`, but the test passes with `reasonix`. Given the package rename,
the script's fallback should be `reasonix-legacy` (matching the published
identity); the test title is correct, the script + assertion are wrong.

**Fix:** Either align the script's fallback with the rename (preferred) and keep
the title, or correct the title. Preferred:

```js
// scripts/write-cli-package-marker.mjs
const cliPackage = {
  name: rootPackage.name ?? "reasonix-legacy",
  version: rootPackage.version ?? "0.0.0-dev",
  type: "module",
};
```

```ts
// tests/cli-bundle-version-marker.test.ts
expect(marker.name).toBe("reasonix-legacy");
```

### WR-02: Test title contradicts assertion — `headless-host.test.ts:174`

**File:** `tests/headless-host.test.ts:174`
**Issue:**

The case-array title says abort "still surfaces prior assistant text":

```ts
["abort renders the aborted sentinel and still surfaces prior assistant text", runAbortedCase],
```

But the assertion verifies the OPPOSITE — `captured === null`, no assistant text
delivered — and the body comment confirms this:

```ts
assert.equal(captured, null, "pre-aborted turn must not surface assistant text");
// Pre-aborted signal: turn-driver breaks before processing any event, so no
// assistant text is delivered ...
```

The title is wrong; the behavior under test is that pre-aborted turns surface NO
assistant text. A reader of the case list will be misled about what the test
guarantees.

**Fix:**

```ts
[
  "abort renders the aborted sentinel and does NOT surface prior assistant text",
  runAbortedCase,
],
```

### WR-03: CLAUDE.md trim left three stale dashboard references

**File:** `.claude/CLAUDE.md:117`, `:123`, `:276`
**Issue:**

The phase trimmed most dashboard/desktop content from CLAUDE.md (Languages,
Runtime, Frameworks, Configuration, Platform Requirements, Component
Responsibilities table, Layers, Entry Points — all updated correctly). Three
references survived and now contradict the rest of the file:

1. **Line 117** (Code Style > Ignored paths) still lists `dashboard/codemirror.js`:
   ```
   - Ignored paths: `dist`, `node_modules`, `coverage`, `*.d.ts`, `dashboard/codemirror.js`, `packages/ink/**`.
   ```
   This directly contradicts line 74 (Configuration > biome.json), which was
   correctly updated to drop `dashboard/codemirror.js`. The `dashboard/`
   directory does not exist (`ls dashboard` → No such file or directory).

2. **Line 123** (Code Style > verify commands) still references a dashboard
   tsconfig:
   ```
   - `tsc --noEmit` (and `tsc --noEmit -p dashboard`)
   ```
   `dashboard/tsconfig.json` is gone; this command would fail. Inconsistent with
   the Configuration section (line 72) which dropped the dashboard tsconfig
   reference.

3. **Line 276** (Key Abstractions > event types) still mentions dashboard:
   ```
   - Purpose: Discriminated-union event types emitted by `step()`; surfaces reduce them to UI/dashboard.
   ```
   The Pattern Overview (line 232) was correctly updated to "CLI/TUI and ACP";
   this line wasn't.

**Fix:**

- Line 117: drop `dashboard/codemirror.js` from ignored paths to match line 74.
- Line 123: drop `(and `tsc --noEmit -p dashboard`)`.
- Line 276: replace "UI/dashboard" with "UI" (or "TUI").

### WR-04: `tests/version.test.ts` gives false confidence on `detectNpmInstallPrefix` — only tests `reasonix` paths

**File:** `tests/version.test.ts:147-177`
**Issue:**

The `detectNpmInstallPrefix` describe block has five test cases. Every
non-null case uses a `node_modules/reasonix/...` path — none exercises
`reasonix-legacy`:

```ts
detectNpmInstallPrefix("/usr/local/lib/node_modules/reasonix/dist/cli/index.js")
detectNpmInstallPrefix("/Users/me/.nvm/versions/node/v22.11.0/lib/node_modules/reasonix/dist/cli/index.js")
detectNpmInstallPrefix("C:\\Users\\me\\AppData\\Roaming\\npm\\node_modules\\reasonix\\dist\\cli\\index.js")
```

The function is broken for `reasonix-legacy` paths (CR-01), but the test suite
would still pass because it only covers the upstream name. This is the textbook
false-confidence pattern: tests exist, the function name appears in coverage,
CI is green, but the actual production scenario (the renamed package) is
untested.

Not in the listed scope for this phase, but flagged because it's the reason
CR-01 wasn't caught earlier and it's a one-line fix to add a regression test.

**Fix:** Add at least one `reasonix-legacy` case to the describe block:

```ts
it("extracts the prefix from a reasonix-legacy install path", () => {
  expect(
    detectNpmInstallPrefix(
      "/usr/local/lib/node_modules/reasonix-legacy/dist/cli/index.js",
    ),
  ).toBe("/usr/local");
});
```

## Info

### IN-01: `detectInstallSource` regex matches `reasonix-legacy` accidentally via word boundary

**File:** `src/version.ts:154`
**Issue:**

```ts
if (/\/node_modules\/reasonix(\b|\/)/.test(norm)) return "npm";
```

This works for `reasonix-legacy` only because `\b` matches between `x` (word
char) and `-` (non-word). Functionally correct, but the regex would also match
hypothetical future siblings like `reasonix-pro` / `reasonix-anything`. A future
maintainer reading this won't know the word-boundary branch is load-bearing for
the rename. Pair this with the CR-01 fix to make the rename explicit here too.

**Fix:**

```ts
if (/\/node_modules\/reasonix(?:-legacy)?(?:\/|$)/.test(norm)) return "npm";
```

### IN-02: `tests/cli-bundle-version-marker.test.ts` doesn't exercise the `reasonix-legacy` name

**File:** `tests/cli-bundle-version-marker.test.ts:28-39`
**Issue:**

The "writes the dist/cli ESM package marker" case primes the temp package.json
with `name: "reasonix"` and asserts the marker echoes `reasonix`. Since the
package was renamed to `reasonix-legacy`, the marker writer's happy-path should
also be tested with the new name. Coverage gap — combined with WR-01, the
test file documents no behavior for the renamed package identity.

**Fix:** Add a second happy-path case (or parametrize) with
`name: "reasonix-legacy"` and assert the marker carries it through.

### IN-03: Module-level mutable `origHome` in `headless-gate-bridges.test.ts` — race-condition smell

**File:** `tests/headless-gate-bridges.test.ts:31`
**Issue:**

```ts
let origHome: string | undefined;

function withTempHome<T>(...): Promise<T> {
  origHome = process.env.HOME;
  ...
  return fn().finally(() => {
    process.env.HOME = origHome ?? "";
    ...
  });
}
```

`origHome` is a module-level mutable. The six cases inside `run()` are awaited
sequentially, so within a single file invocation no overlap occurs and the
pattern is safe today. But if vitest ever runs cases concurrently inside one file
(or the file is imported by another test that also calls `withTempHome`), the
second call's `origHome = process.env.HOME` would capture the TEMP home set by
the first call, and restoration would be wrong. The fix is to make `origHome` a
local inside `withTempHome`.

**Fix:**

```ts
function withTempHome<T>(
  editMode: "review" | "auto" | "yolo" | "plan",
  fn: () => Promise<T>,
): Promise<T> {
  const origHome = process.env.HOME;   // local, not module-level
  const origProfile = process.env.USERPROFILE;
  ...
}
```

---

_Reviewed: 2026-07-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
