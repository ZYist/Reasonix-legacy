# Contributing to Reasonix

Thanks for showing up. reasonix-legacy is a small, opinionated codebase
maintained in [ZYist/reasonix-legacy](https://github.com/ZYist/reasonix-legacy);
PRs are welcome, but read this first so the round-trip is short.

## Setup

```sh
git clone https://github.com/ZYist/reasonix-legacy.git
cd reasonix-legacy
npm install
npm run dev          # tsx src/cli/index.ts — live source
```

Node ≥ 22. No global install needed during development. The maintained release baseline, however, is Windows + Node.js `24.15.0` + npm `11.16.0` + PowerShell; release-blocking checks are judged against that environment.

For project working knowledge, see [`REASONIX.md`](./REASONIX.md). For the maintained documentation map and architecture, see [`docs/README.md`](./docs/README.md) and [`docs/architecture.md`](./docs/architecture.md).

## Proposing changes

- **Bug fixes** — go ahead and open a PR. Include a reproduction.
- **New features / behavior changes** — open an issue first to align
  on scope and approach. Reasonix tries to stay small; "we could add
  X" PRs that arrive cold are usually rejected or scoped down.
- **External MCP servers, plugins, presets** — a thin wrapper is
  fine; a sprawling integration is better hosted as a separate
  package that depends on `reasonix-legacy`.

## Code rules

These are enforced by review and (where possible) by
`tests/comment-policy.test.ts` — which runs under `npm run verify`
and gates pre-push.

### Comments — default is none

Write a comment ONLY when **why** is non-obvious and removing the
comment would confuse a future reader. Justified examples:

- a hidden constraint (`// Yoga miscounts wrap → must clamp to width-1`)
- a workaround for a specific bug
- a subtle invariant the type system can't express

Don't write:

- **What the code does.** Names already say it. No `// when x is positive`
  above `if (x > 0)`.
- **Module-level essays.** Multi-paragraph docstrings at the top of a
  file are dead weight. Two short lines max.
- **Conversation history.** No "user reported X", "screenshot showed
  Y", "v0.13.2 introduced Z". That belongs in commits / PR text.
- **Section banners.** `// ─── helpers ───` is noise; group by export.
- **Restated parameter docs.** If `function pad(f, top, right, bottom,
  left)`, no `@param top - top padding`.

If a comment is justified, **one line is almost always enough**.
Comments needing 4+ lines usually mean the code itself needs to be
clearer (rename, extract, simplify) before any comment is added.

### TypeScript

- Strict mode. No `any` without a `// biome-ignore` and a reason.
- Prefer narrow types over option bags; if a function takes 5+
  optional flags, split the responsibilities.
- Don't re-export types just so two files can share them — move the
  type to the file that owns the concept.

### Libraries over hand-rolled

If a problem has a well-maintained npm library, use it. Specific
landmines this project has hit:

- Visual width / unicode width → `string-width`
- Grapheme segmentation → `Intl.Segmenter`
- ANSI strip → use what `string-width` ships with
- Color → use `theme.ts` constants, not raw hex in component code

If a lib is missing a case, file the issue upstream and add a thin
wrapper — don't fork a local table.

### Files

- One responsibility per file. New code goes in new files when an
  existing one is already large.
- File header comment: zero or one line.
- No `index.ts` re-exports unless they meaningfully shrink the
  public surface.
- Don't create new `*.md` documentation files unless explicitly
  asked.

### Errors / fallbacks

- Don't add try/catch for "internal" errors. Trust your own code.
- Don't validate things the type system already proves.
- Boundary code (user input, network, FS) does validate; everything
  else trusts.
- No "graceful fallback" silently masking bugs. Log + crash >
  silent wrong output.

### Tests

- Test what's hard to verify by reading the code: invariants, edge
  cases, regressions.
- Don't test type signatures or that `function returns X` (the type
  system does that).
- Don't write tests just to bump coverage.

### Git / commits

- Imperative mood, scope tag, why-not-what. See recent `git log`
  for the pattern (`feat(ui): …`, `fix(loop): …`, `chore(release):
  …`).
- One logical change per commit; refactors land separately from
  features.
- No `Co-Authored-By: Claude` trailer.

## PR expectations

- Branch off `dev`. One logical change per PR; `v1` is the protected/default release branch.
- `npm run verify` should pass locally, and release-hardening work should also run `node scripts/check-docs.mjs`. The maintained CI baseline is Windows + Node.js `24.15.0` + npm `11.16.0` + PowerShell.
- Don't touch `CHANGELOG.md` — release notes are written by the
  maintainer at release time, drawn from commit history. PR
  descriptions are the authoritative record while the work is in
  flight.

## Code review

Reasonix prefers blunt, fast review. Expect:

- Line-level pushback on comments that explain *what* instead of *why*.
- Pushback on new abstractions / flags introduced before there are
  two real call sites.
- Pushback on hand-rolled implementations of problems a maintained
  npm library already solves.

None of this is personal — it's how the codebase stays small.

## Releasing (maintainers)

1. Bump `package.json` version.
2. Add `## [X.Y.Z] — <date>` to `CHANGELOG.md` with a hand-written
   summary drawn from `git log` since the prior tag.
3. `chore(release): X.Y.Z — <one-line summary>` commit.
4. `git tag -a vX.Y.Z -m "..."`, push commit + tag. The current stable-release example is `v1.3.1`.
5. Wait for the Windows CI + CodeQL checks on `v1`/`dev` to go green, then trigger the root npm publish workflow. The maintained release artifact is the `reasonix-legacy` npm package only.

## Reporting security issues

See [`SECURITY.md`](./SECURITY.md). Short version: don't open a public issue, email the maintainer privately.
