---
phase: 03-desktop-gui-removal
reviewed: 2026-07-04
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/cli/index.ts
  - src/i18n/types.ts
  - src/i18n/EN.ts
  - src/i18n/JA.ts
  - src/i18n/de.ts
  - src/i18n/zh-CN.ts
  - src/i18n/ru.ts
  - src/cli/commands/events.ts
  - tests/theme-tokens.test.ts
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-07-04
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 03's scope was narrow and surgical: retire the `reasonix desktop` subcommand to a thin i18n-backed stub, add the `commands.desktop.retired` migration key across 5 locales + the `TranslationSchema` contract, remove the dead `app.sidecarHint` string and its LIVE call site, and prune the theme-tokens test down to CLI-only. The implementation is largely clean: the stub has no residual dynamic import / `desktopCommand` reference / leftover `.option()` registrations, the dead string is fully purged (verified — zero source matches for `sidecarHint` outside planning docs), `commands.desktop.retired` is present and coherent in all 5 locales, the `t` import in `events.ts` is correctly retained (still used by `noEventsFor`/`lookedAtFile`), the empty-events branch still exits non-zero, and the test refactor left no dead imports.

No BLOCKERs found. Three lower-severity findings follow — one localization-convention deviation introduced this phase, plus two collateral quality notes from the phase's file deletions.

## Critical Issues

None.

## Warnings

### WR-01: `desktop` stub description is hardcoded English, deviating from the project's `t()` convention

**File:** `src/cli/index.ts:351`
**Issue:** The new stub registers:
```ts
program
  .command("desktop")
  .description("removed — use `reasonix qq | telegram | weixin` instead")
```
CLAUDE.md mandates "User-visible strings go through `t("key", { vars })` from `src/i18n/index.ts`." Every neighboring primary command obeys this (`cli.description`, `cli.code`, `cli.chat`, `commands.qq.help`, `commands.telegram.help`, `commands.weixin.help`, etc. all use `t(...)`). The retired *action* message is correctly localized (`t("commands.desktop.retired")`), but the `.description()` — shown next to `desktop` in `reasonix --help` — is raw English, so zh-CN/JA/de/ru users see an unlocalized line in an otherwise-translated help listing. This is also a minor regression versus localizing the description (and the wording is inconsistent: description says "removed" while the retired key says "retired").
**Fix:** Add a short localized description key, or reuse the retired message. Simplest is a dedicated key:
```ts
// types.ts — commands.desktop
desktop: { retired: string; description: string };
// each locale, e.g. EN.ts
desktop: {
  description: "removed — use `reasonix qq | telegram | weixin` instead",
  retired: "`reasonix desktop` has been retired. …",
},
// cli/index.ts
.description(t("commands.desktop.description"))
```
(Falling back to `t("commands.desktop.retired")` directly also works but makes `--help` verbose.)

## Info

### IN-01: Dangling comment reference to the deleted `src/cli/commands/desktop.ts` (collateral from this phase's deletions)

**File:** `src/cli/headless/host.ts:3` (out of the strict 9-file scope, but broken by this phase)
**Issue:** The comment `// Replicates the buildRuntimeFor recipe from src/cli/commands/desktop.ts:1374-1397` now points at a file physically deleted in Phase 03. CLAUDE.md's comment policy bans stale/misleading comments; this one actively misdirects future readers to a non-existent path. Two test files gained the same kind of stale pointer this phase (e.g. `tests/mention-parent-entry.test.ts:5` cites `desktop/src/ui/composer.tsx`). Flagged as Info because the affected files are outside the 9 edited files — but the deletion caused it.
**Fix:** Rephrase to describe the recipe inline, or drop the file:line citation, e.g. `// Replicates the runtime-build recipe formerly used by the desktop sidecar.`

### IN-02: No coverage for the retired-stub behavior

**File:** `src/cli/index.ts:349-355`
**Issue:** The 23 retired-desktop tests were deleted this phase, and nothing replaces them for the new stub. The stub is trivial (3 lines), so this is low-risk, but its contract — prints `commands.desktop.retired` to stderr AND exits non-zero — is now unasserted. A regression that, say, swapped `process.exit(1)` for `process.exit(0)` or dropped the `t()` call would not be caught.
**Fix:** Optional one-liner smoke test asserting `reasonix desktop` exits 1 and emits the retired message; skip if the CLI smoke harness doesn't easily exercise this.

---

## Verification notes (no action required)

- `commands.desktop.retired` confirmed present and translation-coherent in `types.ts:1060-1062` and all 5 locales (`EN.ts:2145`, `JA.ts:2206`, `de.ts:2107`, `zh-CN.ts:2027`, `ru.ts:646`). All `commands` blocks are complete (qq/telegram/weixin/desktop) — and since each locale is typed `TranslationSchema`, tsc would reject any key drift.
- `app.sidecarHint` fully purged: zero source matches (only planning docs reference it now).
- `src/cli/commands/events.ts`: `t` import retained and still used (`app.noEventsFor` line 21, `app.lookedAtFile` line 22); empty-events branch exits 1 (line 23). No leftover `sidecarHint` call.
- `src/cli/index.ts:349-355`: no `import("./commands/desktop.js")`, no `desktopCommand`, no `.option()` on the retired command.
- `tests/theme-tokens.test.ts`: all 11 imported symbols (`COLOR`, `GRADIENT`, `DEFAULT_THEME_NAME`, `FG`, `THEMES`, `listThemeNames`, `resolveThemeName`, `setActiveTheme`, `themeTokens`, + 5 locales via `CLI_LOCALES`) are used; no dashboard/desktop theme paths remain; surviving tests are internally coherent.
