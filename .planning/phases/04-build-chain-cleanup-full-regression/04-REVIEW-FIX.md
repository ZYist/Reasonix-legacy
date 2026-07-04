---
phase: 04-build-chain-cleanup-full-regression
fixed_at: 2026-07-05T01:40:00Z
review_path: .planning/phases/04-build-chain-cleanup-full-regression/04-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 04: Code Review Fix Report

**Fixed at:** 2026-07-05T01:40:00Z
**Source review:** `.planning/phases/04-build-chain-cleanup-full-regression/04-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope (critical + warning): 6
- Fixed: 6
- Skipped: 0
- Bonus INFO findings fixed (trivially cheap, paired with their CR/WR counterparts): 2 (IN-01, IN-02)
- INFO findings not attempted: 1 (IN-03 — `origHome` refactor in `headless-gate-bridges.test.ts`; not trivially cheap, out of requested scope)

## Verification

Run in an isolated worktree (node_modules junctioned from main repo so the
`simple-git-hooks` pre-commit lint gate ran live), then fast-forwarded onto `dev`:

- `npm run build` (tsup + cli-package-marker + tree-sitter grammars): **green**
- `npm run lint` (`biome check src tests`): **green** (1 pre-existing warning in an unrelated test fixture, not touched by these fixes)
- `npm run typecheck` (`tsc --noEmit`): **green**
- `npm run test` (`vitest run`): **3 failed files / 7 failed tests** — every one of them is an acknowledged-deferred bucket-3 red:
  - `tests/ssh-remote.test.ts`
  - `tests/ui-mcp-marketplace-snapshot.test.ts`
  - `tests/ui-slash-suggestions.test.tsx`
- **No NEW reds introduced by these fixes.** (A first verify pass surfaced 10 new reds in `tests/update-command.test.ts` + `tests/slash.test.ts` caused by CR-01's package-name change; those were fixed in a follow-up commit before the final verify.)

## Fixed Issues

### CR-01: `detectNpmInstallPrefix` regex does not match `reasonix-legacy` install paths

**Files modified:** `src/version.ts`, `src/cli/commands/update.ts`, `tests/update-command.test.ts`, `tests/slash.test.ts`
**Commits:** `c802d97c`, `8371fe77`
**Applied fix:**
- `detectNpmInstallPrefix`: widened both posix (`lib/node_modules`) and win (`node_modules`) regexes from `/reasonix(?:\/|$)/` to `/reasonix(?:-legacy)?(?:\/|$)/` so the fork's real package directory is recognized. Empirically verified non-null return for all three real install-path shapes (posix `/usr/local/lib/...`, nvm `/.nvm/versions/...`, Windows `%APPDATA%/npm/...`); still handles upstream `reasonix` and correctly rejects siblings like `reasonix-pro`.
- `update.ts` `MANUAL_UPDATE_COMMANDS` + `buildUpdateCommand`: swapped `reasonix`/`reasonix@latest` → `reasonix-legacy`/`reasonix-legacy@latest` across npm/bun/pnpm/yarn so `reasonix update` targets the fork (Core Value: the fork must not silently become upstream). Preserves the `--prefix` nvm/fnm pin.
- Downstream tests (`update-command.test.ts`, `slash.test.ts`) that asserted the old package name in the install commands were updated to expect `reasonix-legacy`.

### CR-02: `REGISTRY_URL` hardcoded to upstream `reasonix/latest`

**Files modified:** `src/version.ts`
**Commit:** `640d6938`
**Applied fix:** `REGISTRY_URL` now `https://registry.npmjs.org/reasonix-legacy/latest` so the freshness check queries the fork's published version, not upstream's.

### WR-01: Test title contradicts assertion — `cli-bundle-version-marker.test.ts:50`

**Files modified:** `scripts/write-cli-package-marker.mjs`, `tests/cli-bundle-version-marker.test.ts`
**Commit:** `b6ddd834`
**Applied fix:** The test title said "falls back to reasonix-legacy" but the assertion expected `"reasonix"` (and the script fell back to upstream `"reasonix"`). Aligned both to the fork's published identity: script `?? "reasonix"` → `?? "reasonix-legacy"`, assertion → `toBe("reasonix-legacy")`. The title was the correct side; the script + assertion were wrong.

### WR-02: Test title contradicts assertion — `headless-host.test.ts:174`

**Files modified:** `tests/headless-host.test.ts`
**Commit:** `c1681d54`
**Applied fix:** Case title said abort "still surfaces prior assistant text" but the assertion verifies `captured === null` and the body comment confirms a pre-aborted turn surfaces NO assistant text. Corrected the title to "does NOT surface prior assistant text" — the title was the wrong side; the assertion + comment document the real behavior.

### WR-03: CLAUDE.md trim left three stale dashboard references

**Files modified:** `.claude/CLAUDE.md`
**Commit:** `473e4bf6`
**Applied fix:** Removed all three stale `dashboard` references that contradicted the rest of the file (the `dashboard/` directory is deleted):
- Code Style > Ignored paths: dropped `dashboard/codemirror.js` (matches the already-corrected biome.json line).
- Code Style > verify commands: dropped `(and \`tsc --noEmit -p dashboard\`)` (the dashboard tsconfig is gone; the command would fail).
- Key Abstractions > event types: "UI/dashboard" → "the TUI" (matches the Pattern Overview's "CLI/TUI and ACP").

A grep for `dashboard` across `.claude/CLAUDE.md` now returns zero matches.

### WR-04: `tests/version.test.ts` gives false confidence on `detectNpmInstallPrefix`

**Files modified:** `tests/version.test.ts`
**Commit:** `b0fa5ee8`
**Applied fix:** Added posix + Windows `reasonix-legacy` cases to the `detectNpmInstallPrefix` describe block — the regression test that should have caught CR-01. Both new cases pass against the fixed regex (and would fail against the pre-CR-01 regex, confirming they actually guard the rename).

## Bonus INFO fixes (trivially cheap, paired)

### IN-01: `detectInstallSource` regex matched `reasonix-legacy` accidentally

**Files modified:** `src/version.ts`
**Commit:** `c802d97c` (bundled with CR-01 — same file, same rename-propagation theme)
**Applied fix:** Replaced the accidental word-boundary match `/\/node_modules\/reasonix(\b|\/)/` with the explicit `/\/node_modules\/reasonix(?:-legacy)?(?:\/|$)/` so a hypothetical future sibling like `reasonix-pro` no longer claims `"npm"`, and the rename is visibly load-bearing.

### IN-02: `tests/cli-bundle-version-marker.test.ts` didn't exercise the `reasonix-legacy` name

**Files modified:** `tests/cli-bundle-version-marker.test.ts`
**Commit:** `b6ddd834` (bundled with WR-01)
**Applied fix:** Added a happy-path case priming `name: "reasonix-legacy"` and asserting the marker carries it through unchanged — closes the coverage gap left by WR-01.

## Skipped Issues

None in scope. IN-03 (module-level mutable `origHome` in `headless-gate-bridges.test.ts`) was not attempted — it is a non-trivial helper refactor, outside the requested critical+warning scope, and the sequential-await pattern is safe today.

---

_Fixed: 2026-07-05T01:40:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
