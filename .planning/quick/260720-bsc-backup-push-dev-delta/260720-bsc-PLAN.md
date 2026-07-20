# Quick Task Plan: preserve and push current dev delta

## Goal

Create a safe, auditable snapshot of the current workspace, preserve all existing local `dev` history and working-tree changes, record the differences from both local `dev` HEAD and refreshed `origin/dev`, then push the result to a new remote branch.

## Scope

- No application behavior changes.
- Include all pre-existing tracked modifications and untracked files in the snapshot.
- Keep the external backup and pre-change backup ref separate from the pushed snapshot branch.
- Add a human-readable delta report and a machine-readable manifest.

## Tasks

1. Verify the pre-change backup exists and verify the refreshed `origin/dev` reference.
2. Create `backup/dev-snapshot-20260720` from the current local `dev` tip while preserving the working tree.
3. Generate `DEV-DELTA-REPORT.md` and `DEV-DELTA-MANIFEST.txt`, covering:
   - local working-tree delta versus local `dev` HEAD;
   - the 24 local commits and file-level delta versus refreshed `origin/dev`;
   - backup paths, refs, hashes, and reproducibility commands.
4. Stage and commit all captured existing changes plus the audit artifacts.
5. Push the new branch to `origin` and set its upstream.
6. Verify local/remote SHA equality, branch status, and that the report is present in the pushed commit.
7. Write the GSD quick-task summary and update `.planning/STATE.md`.

## Verification

- `git status --short --branch` is clean after the GSD metadata commit.
- `git rev-parse HEAD` equals `git rev-parse origin/backup/dev-snapshot-20260720`.
- `git diff --exit-code origin/dev..HEAD` is allowed to be non-empty and is documented; it must not omit captured files.
- Backup bundle, patch files, copied untracked tree, and backup ref remain available outside/alongside the repository.
