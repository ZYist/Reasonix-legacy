# Current Delta Record: snapshot branch vs dev

> Generated on 2026-07-20 08:32:45 +08:00 before the snapshot commit. This file records the repository state that existed on local dev at capture time; the GSD quick-task artifacts created for this operation are intentionally not counted as pre-existing changes.

## 1. Capture and branch metadata

| Item | Value |
|---|---|
| Source branch at capture | dev |
| New snapshot branch | backup/dev-snapshot-20260720 |
| Capture HEAD / local dev base | 98972c881427895c872a0105e514aa2b9b6d3361 |
| Refreshed origin/dev | b540a507c1ffb4835846fc256e6df206a5c6d040 |
| Merge base | b540a507c1ffb4835846fc256e6df206a5c6d040 |
| Local dev commits ahead of origin/dev | 24 |
| Local dev commits behind origin/dev | 0 |
| Pre-change backup branch | backup/dev-pre-legacy-20260720 |
| Pre-change filesystem backup | D:\workspace\reasonix_legacy-backup-20260720-082833 |
| Backup bundle SHA-256 | 089048FC9218B5AA5BBCD8920A1E2E51F26315BF0FEB803262B56FCE774A4488 |

The working tree was backed up before branch creation. The external backup contains repository.bundle, working-tree-from-head.patch, staged.patch, unstaged.patch, status/branch/remote/log manifests, and a copied untracked/ tree. The backup ref points exactly to the pre-change HEAD; the patch and copied untracked tree preserve changes not represented by that ref.

## 2. What differs from local dev HEAD

At capture time, the existing working-tree delta was **8 tracked files: 196 insertions and 405 deletions**, plus **42 untracked paths**. These were planning/release evidence changes only; no application source file was modified in this uncommitted delta.

### Tracked files

| Added | Deleted | Path |
|---:|---:|---|
| 0 | 73 | .planning/.continue-here.md |
| 0 | 72 | .planning/HANDOFF.json |
| 21 | 2 | .planning/MILESTONES.md |
| 41 | 40 | .planning/PROJECT.md |
| 0 | 92 | .planning/REQUIREMENTS.md |
| 66 | 17 | .planning/RETROSPECTIVE.md |
| 29 | 74 | .planning/ROADMAP.md |
| 39 | 35 | .planning/STATE.md |

### Semantic summary of tracked edits

- .planning/MILESTONES.md: records v1.3 Stable Release Hardening as shipped on 2026-07-18, its 21/21 requirement closeout, accomplishments, and known external/manual gaps.
- .planning/PROJECT.md: moves the project from active v1.3 execution to “Awaiting next milestone definition,” while preserving the v1.3 stable-release baseline and its locked direction.
- .planning/RETROSPECTIVE.md: incorporates the v1.3 hardening lessons, evidence-based release constraints, and updated pending/deferred concerns.
- .planning/ROADMAP.md: closes/archives the v1.3 roadmap state and points the project toward defining the next milestone.
- .planning/STATE.md: updates current state, session continuity, deferred items, operator next steps, and quick-task history to reflect v1.3 closeout.
- .planning/.continue-here.md, .planning/HANDOFF.json, .planning/REQUIREMENTS.md: removed as stale handoff/requirement artifacts after closeout.

### Untracked paths preserved in the snapshot

| Bytes | Path |
|---:|---|
| 6514 | .planning/milestones/v1.3-REQUIREMENTS.md |
| 6228 | .planning/milestones/v1.3-ROADMAP.md |
| 5656 | .planning/phases/11-supply-chain-and-security-contract/11-VERIFICATION.md |
| 4688 | .planning/phases/12-windows-release-automation/12-01-PLAN.md |
| 2108 | .planning/phases/12-windows-release-automation/12-01-SUMMARY.md |
| 4613 | .planning/phases/12-windows-release-automation/12-02-PLAN.md |
| 2057 | .planning/phases/12-windows-release-automation/12-02-SUMMARY.md |
| 9557 | .planning/phases/12-windows-release-automation/12-CONTEXT.md |
| 4601 | .planning/phases/12-windows-release-automation/12-DISCUSSION-LOG.md |
| 5513 | .planning/phases/12-windows-release-automation/12-VERIFICATION.md |
| 3421 | .planning/phases/13-candidate-packaging-and-stable-reassessment/13-01-PLAN.md |
| 3546 | .planning/phases/13-candidate-packaging-and-stable-reassessment/13-02-PLAN.md |
| 7068 | .planning/phases/13-candidate-packaging-and-stable-reassessment/13-CONTEXT.md |
| 3803 | .planning/phases/13-candidate-packaging-and-stable-reassessment/13-DISCUSSION-LOG.md |
| 25 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/audit-prod.stdout.txt |
| 42 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/candidate-sha.txt |
| 28 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/check-docs.stdout.txt |
| 1799 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/ci.stdout.txt |
| 3886 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/install-smoke.stdout.txt |
| 1357 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/install-smoke.summary.json |
| 106 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/lint.stdout.txt |
| 10 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/node-version.txt |
| 9 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/npm-version.txt |
| 838 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/pack-analysis.json |
| 18925 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/pack-dry-run.json |
| 18925 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/pack-dry-run.stdout.txt |
| 18925 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/pack.json |
| 18925 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/pack.stdout.txt |
| 8804962 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/reasonix-legacy-1.3.0.tgz |
| 67359 | .planning/phases/13-candidate-packaging-and-stable-reassessment/evidence/verify.stdout.txt |
| 3 | .planning/tmp-milestone-closeout-evidence/audit-prod.exit.txt |
| 0 | .planning/tmp-milestone-closeout-evidence/audit-prod.stderr.txt |
| 24 | .planning/tmp-milestone-closeout-evidence/audit-prod.stdout.txt |
| 3 | .planning/tmp-milestone-closeout-evidence/check-docs.exit.txt |
| 0 | .planning/tmp-milestone-closeout-evidence/check-docs.stderr.txt |
| 27 | .planning/tmp-milestone-closeout-evidence/check-docs.stdout.txt |
| 42 | .planning/tmp-milestone-closeout-evidence/git-head.txt |
| 10 | .planning/tmp-milestone-closeout-evidence/node-version.txt |
| 9 | .planning/tmp-milestone-closeout-evidence/npm-version.txt |
| 3 | .planning/tmp-milestone-closeout-evidence/verify.exit.txt |
| 2631 | .planning/tmp-milestone-closeout-evidence/verify.stderr.txt |
| 64491 | .planning/tmp-milestone-closeout-evidence/verify.stdout.txt |

The untracked set consists of: v1.3 milestone requirements/roadmap files; Phase 11 verification; Phase 12 plans, summaries, context, discussion log, and verification; Phase 13 plans/context/discussion log; Phase 13 audit, CI, packaging, install-smoke, version, and candidate evidence; the 1.3.0 candidate tarball; and temporary milestone-closeout command evidence.

Candidate tarball SHA-256: DFFA7F44C59DA2438D66118EE73729EDD42CF43E525CBD5B0F83D640F2DACFA3.

## 3. What differs from refreshed origin/dev

Local dev is a linear **24-commit / 154-file** descendant of origin/dev with **4,820 insertions and 1,054 deletions**. The current snapshot therefore preserves both the 24 committed local-dev commits and the working-tree delta above.

### Commits present on local dev but not on origin/dev

| Commit | Date | Author | Subject |
|---|---|---|---|
| 94079ba8 | 2026-07-16 | ZYist | docs(quick-260716-qbx): evaluate API provider switching |
| 3f045e1c | 2026-07-17 | ZYist | docs(quick-260717-bvq): assess stable release readiness |
| 9557d46d | 2026-07-17 | ZYist | chore: archive v1.1 milestone files |
| c6121c6b | 2026-07-17 | ZYist | chore: remove v1.1 milestone source files |
| 65ece447 | 2026-07-17 | ZYist | docs: start milestone v1.3 Stable Release Hardening |
| 4921682f | 2026-07-17 | ZYist | docs: define milestone v1.3 requirements |
| 60ef9ac9 | 2026-07-17 | ZYist | docs: create milestone v1.3 roadmap (4 phases) |
| c32bc151 | 2026-07-17 | ZYist | docs(10): capture phase context |
| 2223d7f6 | 2026-07-17 | ZYist | docs(state): record phase 10 context session |
| 2c85de17 | 2026-07-17 | ZYist | docs(10): create phase plan |
| d54ccc6b | 2026-07-17 | ZYist | feat(10-01): unify package and bin identity |
| ee795559 | 2026-07-17 | ZYist | feat(10-01): expose reasonix-legacy version identity |
| 3f7a4555 | 2026-07-17 | ZYist | docs(10-01): complete package identity plan |
| 1dae14d5 | 2026-07-17 | ZYist | docs(10-02): align maintained command identity |
| 5fc9ddf8 | 2026-07-17 | ZYist | test(10-02): guard package identity drift |
| 14624bdf | 2026-07-17 | ZYist | fix(10-02): remove old command identity from runtime surfaces |
| 000d8484 | 2026-07-17 | ZYist | test(10-02): cover runtime identity surfaces |
| e9d03366 | 2026-07-17 | ZYist | docs(10-02): complete identity documentation plan |
| 3ba7c81b | 2026-07-17 | ZYist | docs(phase-10): complete package identity unification |
| d595d30b | 2026-07-18 | ZYist | wip: phase-12-transition paused at 3/4 |
| 55be2172 | 2026-07-18 | ZYist | docs(quick-260718-nva): compare remote and local commits |
| cc8bbad1 | 2026-07-19 | ZYist | fix(release): harden Windows gated npm publication |
| 107bf9b4 | 2026-07-19 | ZYist | docs(audit): close v1.3 candidate reproducibility gap |
| 98972c88 | 2026-07-19 | ZYist | docs(quick-260719-o2f): assess ahead commit readability |

### Committed file-level delta

The complete machine-readable name-status and numstat output is in DEV-DELTA-MANIFEST.txt. The committed delta spans planning/milestone closeout, CI/workflow and release automation, package/CLI identity, docs/examples, benchmarks, source/tooling, and tests. It is not equivalent to the uncommitted planning-only delta in section 2.

| Added lines | Deleted lines | Path |
|---:|---:|---|
| 5 | 5 | .claude/CLAUDE.md |
| 2 | 2 | .github/ISSUE_TEMPLATE/bug_report.md |
| 2 | 2 | .github/ISSUE_TEMPLATE/display_issue.md |
| 31 | 23 | .github/workflows/ci.yml |
| 28 | 12 | .github/workflows/codeql.yml |
| 0 | 63 | .github/workflows/publish-dsnix.yml |
| 58 | 33 | .github/workflows/publish-npm.yml |
| 0 | 103 | .github/workflows/release-mirror.yml |
| 1 | 1 | .gitignore |
| 73 | 0 | .planning/.continue-here.md |
| 72 | 0 | .planning/HANDOFF.json |
| 22 | 0 | .planning/MILESTONES.md |
| 34 | 23 | .planning/PROJECT.md |
| 63 | 70 | .planning/REQUIREMENTS.md |
| 47 | 0 | .planning/RETROSPECTIVE.md |
| 61 | 110 | .planning/ROADMAP.md |
| 52 | 48 | .planning/STATE.md |
| 0 | 0 | .planning/{ => milestones}/v1.1-MILESTONE-AUDIT.md |
| 109 | 0 | .planning/milestones/v1.1-REQUIREMENTS.md |
| 147 | 0 | .planning/milestones/v1.1-ROADMAP.md |
| 71 | 0 | .planning/milestones/v1.3-MILESTONE-AUDIT.md |
| 81 | 0 | .planning/phases/10-package-identity-unification/10-01-PLAN.md |
| 35 | 0 | .planning/phases/10-package-identity-unification/10-01-SUMMARY.md |
| 98 | 0 | .planning/phases/10-package-identity-unification/10-02-PLAN.md |
| 47 | 0 | .planning/phases/10-package-identity-unification/10-02-SUMMARY.md |
| 117 | 0 | .planning/phases/10-package-identity-unification/10-CONTEXT.md |
| 86 | 0 | .planning/phases/10-package-identity-unification/10-DISCUSSION-LOG.md |
| 102 | 0 | .planning/phases/10-package-identity-unification/10-VERIFICATION.md |
| 73 | 0 | .planning/phases/11-supply-chain-and-security-contract/11-01-PLAN.md |
| 34 | 0 | .planning/phases/11-supply-chain-and-security-contract/11-01-SUMMARY.md |
| 82 | 0 | .planning/phases/11-supply-chain-and-security-contract/11-02-PLAN.md |
| 35 | 0 | .planning/phases/11-supply-chain-and-security-contract/11-02-SUMMARY.md |
| 129 | 0 | .planning/phases/11-supply-chain-and-security-contract/11-CONTEXT.md |
| 73 | 0 | .planning/phases/11-supply-chain-and-security-contract/11-DISCUSSION-LOG.md |
| 40 | 0 | .planning/phases/13-candidate-packaging-and-stable-reassessment/13-01-SUMMARY.md |
| 34 | 0 | .planning/phases/13-candidate-packaging-and-stable-reassessment/13-02-SUMMARY.md |
| 45 | 0 | .planning/phases/13-candidate-packaging-and-stable-reassessment/13-VERIFICATION.md |
| 67 | 0 | .planning/quick/260716-qbx-api-provider-switch-command/260716-qbx-PLAN.md |
| 329 | 0 | .planning/quick/260716-qbx-api-provider-switch-command/260716-qbx-SUMMARY.md |
| 192 | 0 | .planning/quick/260717-bvq-assess-stable-release/260717-bvq-PLAN.md |
| 250 | 0 | .planning/quick/260717-bvq-assess-stable-release/260717-bvq-SUMMARY.md |
| 47 | 0 | .planning/quick/260718-nva-compare-remote-local-commits/260718-nva-PLAN.md |
| 259 | 0 | .planning/quick/260718-nva-compare-remote-local-commits/260718-nva-REPORT.md |
| 39 | 0 | .planning/quick/260718-nva-compare-remote-local-commits/260718-nva-SUMMARY.md |
| 24 | 0 | .planning/quick/260719-o2f-assess-ahead-commit-readability/260719-o2f-PLAN.md |
| 223 | 0 | .planning/quick/260719-o2f-assess-ahead-commit-readability/260719-o2f-SUMMARY.md |
| 76 | 0 | .planning/v1.3-MILESTONE-AUDIT.md |
| 9 | 1 | CHANGELOG.md |
| 6 | 8 | CONTRIBUTING.md |
| 16 | 16 | README.md |
| 4 | 5 | REASONIX.md |
| 39 | 15 | SECURITY.md |
| 3 | 3 | benchmarks/README.md |
| 1 | 1 | benchmarks/compression-eval/driver.ts |
| 1 | 1 | benchmarks/spike-tdd-kernel/test-id-spec.md |
| 1 | 1 | benchmarks/spike-tdd-kernel/work-estimate.md |
| 4 | 4 | benchmarks/tau-bench/transcripts/README.md |
| 2 | 1 | docs/README.md |
| 1 | 1 | docs/architecture.md |
| 2 | 2 | docs/channel-lifecycle-testing.md |
| 3 | 3 | docs/ci-branch-protection.md |
| 27 | 28 | docs/cli-reference.md |
| 15 | 16 | docs/getting-started.md |
| 8 | 4 | docs/governance.md |
| 132 | 0 | docs/install-script-provenance.md |
| 1 | 1 | docs/qq-connect.md |
| 1 | 1 | docs/qq-connect.zh-CN.md |
| 1 | 1 | docs/telegram-connect.md |
| 1 | 1 | docs/telegram-connect.zh-CN.md |
| 1 | 1 | docs/weixin-connect.md |
| 1 | 1 | docs/weixin-connect.zh-CN.md |
| 1 | 1 | examples/mcp-server-demo.ts |
| 2 | 2 | examples/replay-and-diff.ts |
| 12 | 31 | package-lock.json |
| 5 | 6 | package.json |
| 0 | 24 | packages/dsnix/README.md |
| 0 | 15 | packages/dsnix/bin.cjs |
| 0 | 36 | packages/dsnix/package.json |
| 299 | 7 | scripts/check-docs.mjs |
| 1 | 1 | scripts/probe-fanout.mts |
| 2 | 2 | src/cli/commands/acp.ts |
| 4 | 4 | src/cli/commands/chat.tsx |
| 2 | 2 | src/cli/commands/code.tsx |
| 15 | 11 | src/cli/commands/commit.ts |
| 7 | 7 | src/cli/commands/doctor.ts |
| 1 | 1 | src/cli/commands/index.ts |
| 1 | 1 | src/cli/commands/mcp-browse.tsx |
| 1 | 1 | src/cli/commands/mcp.ts |
| 1 | 1 | src/cli/commands/qq.ts |
| 6 | 6 | src/cli/commands/run.ts |
| 1 | 1 | src/cli/commands/setup.tsx |
| 1 | 1 | src/cli/commands/stats.ts |
| 2 | 2 | src/cli/commands/telegram.ts |
| 8 | 8 | src/cli/commands/update.ts |
| 2 | 2 | src/cli/commands/version.ts |
| 2 | 2 | src/cli/commands/weixin.ts |
| 8 | 6 | src/cli/index.ts |
| 1 | 1 | src/cli/node-version.ts |
| 5 | 5 | src/cli/ssh-remote.ts |
| 5 | 5 | src/cli/ui/App.tsx |
| 1 | 1 | src/cli/ui/DiffApp.tsx |
| 8 | 4 | src/cli/ui/McpMarketplace.tsx |
| 1 | 1 | src/cli/ui/ReplayApp.tsx |
| 2 | 2 | src/cli/ui/StatsPanel.tsx |
| 1 | 1 | src/cli/ui/WelcomeBanner.tsx |
| 2 | 2 | src/cli/ui/Wizard.tsx |
| 1 | 1 | src/cli/ui/slash/commands.ts |
| 1 | 1 | src/cli/ui/slash/handlers/sessions.ts |
| 1 | 1 | src/code/prompt.ts |
| 2 | 2 | src/code/setup.ts |
| 5 | 3 | src/config.ts |
| 63 | 56 | src/i18n/EN.ts |
| 61 | 55 | src/i18n/zh-CN.ts |
| 2 | 2 | src/index/semantic/i18n.ts |
| 2 | 2 | src/index/semantic/store.ts |
| 1 | 1 | src/index/semantic/tool.ts |
| 1 | 1 | src/loop.ts |
| 1 | 1 | src/loop/types.ts |
| 6 | 6 | src/mcp/README.md |
| 1 | 1 | src/mcp/catalog.ts |
| 1 | 1 | src/mcp/client.ts |
| 1 | 1 | src/net/proxy.ts |
| 2 | 2 | src/skills.ts |
| 1 | 1 | src/slash-usage.ts |
| 1 | 1 | src/telemetry/usage.ts |
| 6 | 2 | src/tokenizer.ts |
| 2 | 2 | src/tools/memory.ts |
| 3 | 3 | src/tools/skills.ts |
| 1 | 1 | src/tools/subagent.ts |
| 1 | 1 | src/transcript/log.ts |
| 11 | 11 | src/version.ts |
| 4 | 4 | tests/acp-transcript.test.ts |
| 2 | 2 | tests/chat-mcp-startup-summary.test.ts |
| 2 | 2 | tests/cli-bare-routing.test.ts |
| 4 | 4 | tests/cli-bundle-version-marker.test.ts |
| 2 | 2 | tests/commit-command-characterization.test.ts |
| 1 | 1 | tests/doctor-json.test.ts |
| 1 | 1 | tests/events-command.test.ts |
| 4 | 4 | tests/feedback.test.ts |
| 72 | 0 | tests/install-script-provenance.test.ts |
| 2 | 2 | tests/loop-error.test.ts |
| 1 | 1 | tests/mcp-command-characterization.test.ts |
| 1 | 1 | tests/mcp-shell-split.test.ts |
| 155 | 0 | tests/package-identity.test.ts |
| 4 | 4 | tests/permissions-slash.test.ts |
| 46 | 3 | tests/qq-command.test.ts |
| 2 | 2 | tests/semantic-bootstrap.test.ts |
| 9 | 9 | tests/slash.test.ts |
| 2 | 2 | tests/ssh-remote.test.ts |
| 5 | 3 | tests/startup-banner-i18n.test.ts |
| 42 | 2 | tests/telegram-command.test.ts |
| 1 | 1 | tests/update-command.test.ts |
| 47 | 29 | tests/version.test.ts |
| 48 | 2 | tests/weixin-command.test.ts |

## 4. Reproducibility commands

The following commands reproduce the two comparisons:

`powershell
# Existing uncommitted work relative to local dev HEAD
git diff --name-status HEAD
git diff --numstat HEAD
git ls-files --others --exclude-standard

# Existing local dev commits/content relative to refreshed origin/dev
git log --reverse --oneline origin/dev..HEAD
git diff --stat origin/dev..HEAD
git diff --name-status origin/dev..HEAD
git diff --numstat origin/dev..HEAD
`

## 5. Snapshot intent

This branch is a preservation/snapshot branch, not a feature branch. It intentionally carries the pre-existing local dev history plus all captured planning/release evidence and this audit record. No application behavior was changed as part of the snapshot operation. The branch is intended to be pushed to origin and verified by comparing its remote tip with the local tip.
