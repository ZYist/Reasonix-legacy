---
quick: 260718-nva
status: planned
date: 2026-07-18
---

# Quick Task 260718-nva Plan

## Goal

After refreshing remote refs, compare local `dev` with its tracking branch `origin/dev` and write a Chinese report that explains the purpose and impact of every commit present only locally.

## Safety Constraints

- Treat all pre-existing tracked/untracked working-tree changes as user-owned.
- Do not reset, checkout, stash, clean, amend, or rewrite history.
- Do not stage or commit any file outside `.planning/quick/260718-nva-compare-remote-local-commits/`.
- Because `.planning/STATE.md` is already modified before this task, do not edit or stage it; record this safety deviation in the summary.
- Analyze committed history with `origin/dev..HEAD`; discuss uncommitted work only as a separate caveat.

## Tasks

1. Confirm comparison baseline after `git fetch --all --prune`:
   - branch and tracking ref;
   - local and remote SHAs;
   - merge-base and ahead/behind counts;
   - aggregate diff statistics.
2. Inspect the 20 local-only commits in chronological order using commit metadata, per-commit stats, relevant patches, and existing phase/quick summaries.
3. Group commits by intent and explain both individual commit purposes and the overall development narrative.
4. Write `260718-nva-REPORT.md` with:
   - executive conclusion;
   - exact baseline and scope;
   - grouped change analysis;
   - per-commit table;
   - impact/risk assessment;
   - explicit separation between committed local-only history and the dirty working tree;
   - recommended next actions.
5. Write `260718-nva-SUMMARY.md` documenting produced files, verification, and the skipped STATE update.

## Verification

- `git rev-list --left-right --count origin/dev...HEAD` returns `0 20`.
- `git rev-list --count origin/dev..HEAD` returns `20`.
- `git merge-base origin/dev HEAD` equals `git rev-parse origin/dev`.
- Every hash from `git log --reverse --format=%h origin/dev..HEAD` appears in the report.
- Report numbers match `git diff --shortstat origin/dev..HEAD`.
- `git diff --name-only -- . ':!.planning/quick/260718-nva-compare-remote-local-commits/**'` is not altered by this task.
