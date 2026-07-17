---
quick: 260717-bvq
phase: quick-260717-bvq
plan: "01"
status: complete
assessed_at: "2026-07-17T09:02:51.501+08:00"
completed_at: "2026-07-17T09:33:32.933+08:00"
assessed_commit: 94079ba81fa7a1bd0149e79e41eccb5fe187da1c
branch: dev
assessment_scope: release-readiness-only
---

# Quick 260717-bvq: Stable Release Readiness Assessment

**Fresh local build/package checks are green, but the assessed commit is not a releasable stable build because production dependencies, version authority, publication wiring, CI/CodeQL evidence, and security policy are materially inconsistent.**

## Verdict

`NOT READY`

The assessed commit fails multiple hard release gates. A stable release must not be tagged or published from this state. Passing local build and test results do not override the two high-severity production dependency findings, broken `dsnix` package path, version/lock/document drift, absent current-commit CI and CodeQL evidence, or the inaccurate security support scope.

## Assessment identity

| Field | Value |
|---|---|
| assessed commit | `94079ba81fa7a1bd0149e79e41eccb5fe187da1c` |
| Assessed branch | `dev` |
| Initial assessment time | `2026-07-17T09:02:51.501+08:00` (Asia/Shanghai) |
| Report completed | `2026-07-17T09:33:32.933+08:00` (Asia/Shanghai) |
| Assessment duration | 30 minutes 41.432 seconds |
| OS | Microsoft Windows `10.0.28000`, x64 |
| Node / npm | Node `v24.15.0`; npm `11.16.0` |
| Git / GitHub CLI | Git `2.54.0.windows.1`; GitHub CLI installed and authenticated; no credentials retained in this report |
| Product boundary | DeepSeek-first, single-model CLI/TUI plus standalone QQ/Telegram/Weixin channels; no multi-model adaptation assessed or recommended |

### Git and release identity snapshot

- `git status --short --branch`: `dev...origin/dev [ahead 1]` plus untracked `.planning/quick/260717-bvq-assess-stable-release/`.
- `git rev-parse HEAD`: `94079ba81fa7a1bd0149e79e41eccb5fe187da1c`.
- `git branch --show-current`: `dev`.
- `git remote -v`: `origin` is the maintained `ZYist/reasonix-legacy` fork; `upstream` is `esengine/DeepSeek-Reasonix`.
- `git describe --tags --always --dirty`: `legacy-1.2-12-g94079ba8`. Untracked files are not represented by the `--dirty` suffix.
- `git tag --points-at HEAD`: no tag.
- Remote `dev` is `b540a507c1ffb4835846fc256e6df206a5c6d040`; the assessed commit is local-only and one commit ahead.
- Latest GitHub release `legacy-1.2`, published `2026-07-15T07:32:40Z`, points through an annotated unsigned tag to commit `4fb560e3a5d6c81f87bddbb08aa86e610480fffe`, not the assessed commit; it has zero release assets.

## Evidence matrix

`PASS` means the command completed successfully and supports only the stated claim. `FAIL` preserves a non-zero exit or a substantive failed gate. `UNKNOWN` means the remote state could not be established; it is not treated as a pass.

| ID | Command | Started (Asia/Shanghai) | Exit | Duration | Result | Key evidence |
|---|---|---:|---:|---:|---|---|
| E-GIT-01 | `git status --short --branch` | 09:02:52 | 0 | 0.106s | FAIL | Branch is ahead of origin by one commit and the quick-task directory is untracked; release tree is not clean. |
| E-GIT-02 | `git rev-parse HEAD` | 09:02:52 | 0 | 0.072s | PASS | Fixed SHA `94079ba81fa7a1bd0149e79e41eccb5fe187da1c`. |
| E-GIT-03 | `git branch --show-current` | 09:02:52 | 0 | 0.070s | PASS | Branch `dev`. |
| E-GIT-04 | `git remote -v` | 09:02:52 | 0 | 0.067s | PASS | Maintained fork is `origin`; upstream is distinct. |
| E-GIT-05 | `git describe --tags --always --dirty` | 09:02:52 | 0 | 0.118s | FAIL | Twelve commits after `legacy-1.2`; no release tag at HEAD. |
| E-GIT-06 | `git tag --points-at HEAD` | 09:02:52 | 0 | 0.073s | FAIL | Empty output. |
| E-LOC-01 | `npm ci --dry-run` | 09:04:55 | 0 | 3.667s | PASS | Dependency graph accepted; npm warned that 12 install scripts are not covered by `allowScripts`. |
| E-LOC-02 | `npm ci` | 09:11:05 | 0 | 49.642s | PASS | Added 480 packages and audited 484; install completed. npm also reported 12 total vulnerabilities across production and development dependencies. |
| E-LOC-03 | `npm run build` | 09:11:55 | 0 | 6.511s | PASS | tsup ESM/DTS build succeeded; all eight tree-sitter/runtime WASM files copied. |
| E-LOC-04 | `node scripts/check-docs.mjs` | 09:12:02 | 0 | 0.312s | PASS | Structural/link/CLI-command documentation checker passed. It does not validate current version text or removed security surfaces. |
| E-LOC-05 | `npm run lint` | 09:12:02 | 0 | 1.291s | PASS | Biome checked 682 files; no fixes. |
| E-LOC-06 | `npm run typecheck` | 09:12:03 | 0 | 7.713s | PASS | `tsc --noEmit` succeeded. |
| E-LOC-07 | `npm test --silent` | 09:12:11 | 0 | 36.807s | PASS | 279 test files; 3,789 passed, 15 skipped, 0 failed. Logged network/MCP errors are expected fake-boundary test output. |
| E-CLI-01 | `node dist/cli/index.js --version` | 09:13:12 | 0 | 0.148s | PASS | Output `legacy-1.2.0`. |
| E-CLI-02 | `node dist/cli/index.js --help` | 09:13:12 | 0 | 0.141s | PASS | CLI help rendered; removed desktop command is an explicit error stub and QQ/Telegram/Weixin commands are present. |
| E-PKG-01 | `npm pack --dry-run --json` | 09:13:12 | 0 | 3.794s | PASS | `reasonix-legacy@1.2.0`; 170 files; 8,785,927 bytes packed; 36,008,621 bytes unpacked. |
| E-SEC-01 | `npm audit --omit=dev --json` | 09:13:16 | 1 | 4.056s | FAIL | 2 high production vulnerabilities: direct `undici@8.2.0` and direct `ws@8.20.1`; fixes reported available. |
| E-REG-01 | `npm view reasonix-legacy version dist-tags --json` | 09:17:29 | 1 | 6.619s | FAIL | npm registry returned `E404`; no public `reasonix-legacy` package state could be found. |
| E-REG-02 | `npm view dsnix version dependencies --json` | 09:17:36 | 0 | 3.131s | PASS | Registry latest is `dsnix@0.53.1`, depending on `reasonix@0.53.1`; it does not match local `dsnix@1.2.0`. |
| E-REG-03 | `npm view reasonix version dist-tags --json` | 09:17:39 | 0 | 6.170s | PASS | Registry `reasonix` latest is upstream `1.17.14`; this name is not the maintained fork package. |
| E-GH-01 | `gh run list --repo ZYist/reasonix-legacy --workflow ci.yml --limit 20 --json ...` | 09:18:21 | 0 | 1.195s | FAIL | Valid query returned `[]`; no CI run exists, including none for the assessed SHA. |
| E-GH-02 | corresponding `gh run list` for `codeql.yml` | 09:18:22 | 0 | 1.687s | FAIL | Valid query returned `[]`; no CodeQL run exists. |
| E-GH-03 | `gh release list --repo ZYist/reasonix-legacy --limit 20` | 09:18:51 | 0 | 1.352s | PASS | Four GitHub releases exist; latest is `legacy-1.2` from July 15, 2026. |
| E-GH-04 | `gh api .../branches/main/protection` | 09:18:24 | 1 | 0.808s | FAIL | `main` branch does not exist remotely. |
| E-GH-05 | `gh api .../branches/dev/protection` | 09:18:25 | 1 | 0.832s | FAIL | `dev` exists but is not protected. |
| E-GH-06 | `gh api .../branches/v1/protection` | 09:28:25 | 1 | 1.235s | FAIL | Actual default branch `v1` is not protected. |
| E-GH-07 | `gh api .../code-scanning/alerts?state=open...` | 09:18:26 | 1 | 0.726s | UNKNOWN | Endpoint returned 404; open code-scanning alert state cannot be established. |
| E-GH-08 | `gh api .../dependabot/alerts?state=open...` | 09:18:26 | 1 | 0.642s | UNKNOWN | Endpoint returned 404; open Dependabot alert state cannot be established. Repository metadata reports Dependabot security updates disabled. |
| E-GH-09 | `gh run list` for publish-npm, publish-dsnix, and release-mirror workflows | 09:24:01–09:24:04 | 0 | 1.139–1.666s | FAIL | Every valid query returned `[]`; no publication or mirror run history exists. |
| E-PKG-02 | `cd packages/dsnix && npm pack --dry-run --json` | 09:25:15 | 0 | 0.941s | PASS | `dsnix@1.2.0`; 3 files; 1,073 bytes packed. |
| E-PKG-03 | `node packages/dsnix/bin.cjs --version` | 09:27:48 | 1 | 0.078s | FAIL | `MODULE_NOT_FOUND`: shim requires `reasonix/dist/cli/index.js`, while its declared dependency is `reasonix-legacy`. |

An exploratory `gh release list --json ...url` invocation at 09:18:24 exited 1 because this GitHub CLI version does not support the `url` field for that subcommand. The exact required plain release-list command was rerun successfully as E-GH-03; this command-shape error is not a product finding.

## Build and package gates

### Fresh local gate result

- Clean installation, build, docs check, lint, typecheck, complete offline test suite, root CLI version/help, and both package dry-runs completed successfully.
- The authoritative post-`npm ci` test run passed 3,789 tests in 279 files with 15 skips.
- These checks ran on Node 24, not the workflow minimum/matrix version Node 22. With no CI history, minimum-runtime and Windows/Linux matrix evidence remains absent.

### Root tarball inspection

| Property | Evidence | Assessment |
|---|---|---|
| Package identity | `reasonix-legacy@1.2.0` | Matches root `package.json` and CLI display core version. |
| Packed size | 8,785,927 bytes | Similar to the historical 9.2 MB baseline; not independently anomalous. |
| Unpacked size / count | 36,008,621 bytes / 170 files | Source maps dominate size; monitor but not a standalone blocker. |
| Required runtime files | CLI entry, `dist/index.d.ts`, tokenizer, README, LICENSE, eight grammar/runtime WASM files | All present. |
| Excluded sensitive/removed surfaces | No `.planning`, credential/secret/session/transcript paths, dashboard, Tauri, desktop bundle, or Web-panel artifact matched the inspected file list | Pass. |

## Package and version consistency

| Authority/surface | Observed value | Consistency |
|---|---|---|
| Root `package.json` | `reasonix-legacy@1.2.0` | Current package authority. |
| Root `package-lock.json` top/root record | `reasonix-legacy@0.55.0` | **Mismatch.** |
| `packages/dsnix/package.json` | `dsnix@1.2.0`; dependency `reasonix-legacy: file:../..` | Version matches root, but dependency is not registry-publishable as a stable consumer contract. |
| Lockfile `packages/dsnix` record | `0.55.0` | **Mismatch.** |
| Built CLI | `legacy-1.2.0` | Matches root version with documented display prefix. |
| README current version | `legacy-1.2.0` / npm semver `1.2.0` | Matches root and CLI. |
| CHANGELOG current policy | Says current fork package is `1.1.0`; newest fork entry is `0.55.0` | **Stale and contradictory; no 1.2.0 entry.** |
| `docs/governance.md` authority | Says current pair is package `1.1.0` and milestone `v1.1` | **Contradicts package 1.2.0.** |
| Planning state/milestone | Current milestone remains `v1.1` | **Contradicts the governance rule that package major/minor and milestone evolve together.** |
| HEAD tags | None | Current evidence is not bound to a release tag. |
| Latest GitHub release | `legacy-1.2` at commit `4fb560e3...`; body claims “npm 1.2.0” | Registry query returns E404, so the npm claim is unsupported. |
| npm registry fork package | `reasonix-legacy` not found | No published fork package/dist-tag evidence. |
| npm registry shim | `dsnix@0.53.1` → `reasonix@0.53.1` | Historical upstream identity, not local shim metadata. |

## CI, governance, and security

### CI and branch model

- `.github/workflows/ci.yml` declares Ubuntu and Windows Node 22 jobs for pushes and pull requests targeting `main` and `dev`, with install, lint, typecheck, build, tests/coverage, and retry visibility.
- GitHub Actions is enabled and workflows are active, but all workflow run queries returned empty arrays. No remote run proves the assessed commit.
- Remote repository default branch is `v1`; branches are `v1` and `dev`; `main` does not exist. `ci.yml`, `codeql.yml`, `CONTRIBUTING.md`, governance text, and branch-protection documentation therefore do not describe one coherent branch model.
- `codeql.yml` triggers pushes and pull requests only for `main`, plus a Monday schedule. As of Friday, July 17, 2026, it has no runs; the nonexistent `main` trigger cannot validate current development pushes.
- `dev` and default `v1` are unprotected. Governance explicitly classifies protection as an external operator action, but the default-branch mismatch must be corrected before choosing enforceable checks.

### Publication workflows

- `publish-npm.yml` triggers only plain `v*` tags and publishes the root package. The latest release uses `legacy-1.2`, so it did not trigger the workflow; there are no publish runs.
- `publish-dsnix.yml` reads `packages/dsnix/package.json` key `dependencies.reasonix`, but that key is absent (`undefined`). The actual dependency key is `reasonix-legacy` with value `file:../..`.
- `packages/dsnix/bin.cjs` still resolves `reasonix/dist/cli/index.js`; its fresh smoke test fails. Therefore the local shim metadata, runtime, and workflow cannot produce a working stable package.
- `release-mirror.yml` still contains desktop/Tauri updater commentary and rewrite logic, although it no-ops without `latest.json`. Latest release has no assets and no mirror run. This is stale release-chain surface, but not the primary CLI package blocker.

### Security posture

- Fresh production audit found two direct high-severity vulnerable packages with fixes available: `undici@8.2.0` and `ws@8.20.1`.
- `SECURITY.md` says the actively maintained npm package is `reasonix` and places a dashboard SPA/local HTTP server in scope. The current product package is `reasonix-legacy`, the registry package is absent, and the dashboard/Web server were removed. The stable security support promise is therefore materially inaccurate.
- Code-scanning and Dependabot alert APIs returned 404. Repository metadata shows secret scanning and push protection enabled, but Dependabot security updates disabled; open alert state remains unknown.

## UAT and open risks

| Risk / validation | Current evidence | Classification | Required handling |
|---|---|---|---|
| Telegram and Weixin credential/network/TTY live UAT | **NOT RUN** in this assessment by explicit safety constraint. `docs/channel-lifecycle-testing.md` forbids inferring live success from fake transports. | Non-blocking evidence condition after hard blockers are cleared | Run the documented disposable-account checklist, keep the sanitized record outside the repository, and bind it to the final release SHA. |
| Offline channel/TUI/CLI behavior | Fresh complete suite passed; Phase 8 verification dated July 13, 2026 also recorded fake-boundary coverage. | Positive evidence | Retain; do not relabel as live UAT. |
| Accepted channel rendering gap | `PROJECT.md` records that HeadlessHost channels omit reasoning/tool events because `runTurn` does not subscribe to `onEvent`. | Non-blocking accepted/deferred product limitation unless release claims full streamed event parity | Disclose in release notes or resolve in a separately scoped future channel-streaming change. |
| Historical medium error-disclosure concern | `PROJECT.md` records raw `Error.message` output in three command controllers. This assessment did not re-characterize it. | Non-blocking evidence gap, security-relevant | Confirm current source behavior before release notes; route a fix separately if still present. |
| Phase/milestone historical passes | July 13 milestone audit and Phase 5–9 verification were green. | Historical only | They support regression context but do not replace the July 17 fresh checks or remote SHA-matched evidence. |

## Blocking findings

| ID | Severity | Finding and evidence | Release impact | Release condition | Suggested owner |
|---|---|---|---|---|---|
| BLK-01 | High | Assessed release identity is not publishable: local `dev` is ahead of origin, the quick-task directory is untracked, HEAD is untagged, and remote `dev` is a different SHA. | A tag or artifact cannot be proven to correspond to this assessment. | After all fixes, create/push one clean release commit, confirm zero unrelated changes, tag that exact SHA, and rerun the full matrix. | Maintainer / release owner |
| BLK-02 | High | `npm audit --omit=dev --json` exited 1 with direct high findings in `undici@8.2.0` and `ws@8.20.1`. | Stable users would receive known high-severity production vulnerabilities. | Apply reviewed dependency/lock corrections in a separate change, then rerun clean install, full tests, pack inspection, and production audit until no high/critical finding remains. | Dependency/security owner |
| BLK-03 | High | Version authority conflicts: package and CLI are 1.2.0, lockfile records are 0.55.0, CHANGELOG/governance say 1.1.0, milestone is v1.1, and HEAD has no tag. | Reproducibility, support policy, release notes, and tag semantics disagree. | Align root/workspace/lock records and all current authority documents to one semver/milestone/tag policy; add the current release entry; verify from a fresh checkout. | Maintainer / release owner |
| BLK-04 | Critical | Publication chain is broken: `reasonix-legacy` is absent from npm; `legacy-1.2` does not match the `v*` publish trigger; no publish run exists; the `dsnix` shim fails locally, declares a file dependency, and its workflow reads the wrong dependency key/name. | The main package is not proven publishable through the declared release path, and the shim would not execute for consumers. | Choose one documented tag namespace, correct package identities/dependencies/bin resolution/workflow checks, validate both packed packages in isolated installs, and obtain successful dry-run/CI evidence before any publish. | Package/release owner |
| BLK-05 | High | No CI or CodeQL run exists for any SHA; assessed SHA is not remote. Default branch is `v1`, `main` is absent, while workflows/docs target `main`/`dev`; local checks used Node 24 rather than the Node 22 matrix. | Required cross-platform/minimum-runtime and static-analysis evidence for the release commit is absent. | Align branch triggers with the real branch model, push the candidate, obtain successful Ubuntu/Windows Node 22 CI and CodeQL runs whose `headSha` equals the candidate SHA, and capture retry semantics. | Repository administrator / CI owner |
| BLK-06 | High | Current security contract is false and remote security evidence is incomplete: `SECURITY.md` names the wrong npm package and removed dashboard/server; code-scanning and Dependabot alert state are unavailable, with Dependabot security updates disabled. | Users cannot determine what stable surface is supported, and maintainers cannot prove no unresolved remote security blockers exist. | Correct the policy to the CLI-only `reasonix-legacy` surface, enable or otherwise verify required security scanning, triage open alerts, and record sanitized results for the candidate SHA. | Security owner / repository administrator |

## Non-blocking findings

| ID | Severity | Finding | Handling |
|---|---|---|---|
| NB-01 | Informational | All fresh local functional gates and root package-content checks passed after `npm ci`. | Preserve as positive evidence, but rerun after every blocker fix. |
| NB-02 | Medium | Telegram/Weixin live credential, service, network-interruption, QR, and TTY UAT was not run. | Complete against the final candidate SHA or explicitly scope/disclose any untested channel behavior. |
| NB-03 | Medium | Branch protection is absent on `dev` and `v1`; governance permits this as an external operator action. | After branch-model correction, configure and verify required checks before opening the stable release path. |
| NB-04 | Medium | Accepted/deferred HeadlessHost event-rendering limitation and historical raw-error concern remain recorded. | Confirm and disclose bounded limitations; do not claim full event-stream parity without evidence. |
| NB-05 | Low | Latest GitHub release has no assets and the mirror workflow has no runs; CLI-only releases may intentionally rely on npm rather than GitHub assets. | Decide and document whether stable releases require tarball/checksum assets; remove stale desktop assumptions later if not required. |
| NB-06 | Low | `npm ci` warns that 12 install scripts are not covered by npm `allowScripts`. | Review script provenance without auto-approving or changing dependencies during assessment. |

## Release recommendation

**Do not tag, publish, or announce the current assessed commit as stable.** Execute the following in order:

1. **Repair supply-chain blockers first:** update the vulnerable direct production dependencies and lockfile through a reviewed implementation task; require a clean production audit.
2. **Establish one version authority:** synchronize root/workspace/lock versions, CHANGELOG, governance, current milestone, README, CLI display, and tag convention. Do not reuse or move historical tags.
3. **Repair publication identity:** make the root package and `dsnix` shim internally consistent, replace the file-only consumer dependency with the intended published package contract, fix the shim resolver and workflow dependency check, and validate isolated installs from dry-run package contents.
4. **Correct current support/governance text:** update `SECURITY.md` to the CLI-only fork package and remove the deleted dashboard/server scope; align contribution and branch-protection guidance with the actual default branch.
5. **Align remote controls:** choose the real stable/default/development branch model, update CI and CodeQL triggers accordingly, enable/verify required security scanning and branch checks, and triage alerts.
6. **Create a fresh candidate:** start from a clean tracked tree, push the exact candidate SHA, then obtain green Ubuntu and Windows Node 22 CI plus CodeQL for that SHA. A retry-pass must be reported as retry evidence, not a clean first pass.
7. **Run bounded live UAT:** perform the documented Telegram/Weixin checks with disposable credentials and an external sanitized record bound to the candidate SHA. Do not run real model/bot traffic as part of automated repository tests.
8. **Rerun every command below:** inspect both package manifests/tarballs and registry state. Only after all blocking findings are closed should the maintainer create the chosen tag and execute the corrected publish path.

## Re-evaluation command set

Run from a fresh checkout of the final candidate. Preserve timestamps, exit codes, complete JSON outputs, and the final SHA. Do not add fix/write flags to install or audit commands.

```powershell
git status --short --branch
git rev-parse HEAD
git branch --show-current
git remote -v
git describe --tags --always --dirty
git tag --points-at HEAD
git log -5 --date=iso-strict --pretty=format:"%H%x09%ad%x09%s"

npm ci --dry-run
npm ci
npm run build
node scripts/check-docs.mjs
npm run lint
npm run typecheck
npm test --silent
node dist/cli/index.js --version
node dist/cli/index.js --help
node packages/dsnix/bin.cjs --version
npm pack --dry-run --json
Push-Location packages/dsnix; npm pack --dry-run --json; Pop-Location
npm audit --omit=dev --json

npm view reasonix-legacy version dist-tags --json
npm view dsnix version dependencies --json
npm view reasonix version dist-tags --json

gh run list --repo ZYist/reasonix-legacy --workflow ci.yml --limit 20 --json databaseId,headSha,headBranch,event,status,conclusion,createdAt,url
gh run list --repo ZYist/reasonix-legacy --workflow codeql.yml --limit 20 --json databaseId,headSha,headBranch,event,status,conclusion,createdAt,url
gh run list --repo ZYist/reasonix-legacy --workflow publish-npm.yml --limit 20 --json databaseId,headSha,headBranch,event,status,conclusion,createdAt,url
gh run list --repo ZYist/reasonix-legacy --workflow publish-dsnix.yml --limit 20 --json databaseId,headSha,headBranch,event,status,conclusion,createdAt,url
gh release list --repo ZYist/reasonix-legacy --limit 20
gh repo view ZYist/reasonix-legacy --json defaultBranchRef,nameWithOwner,visibility
gh api repos/ZYist/reasonix-legacy/branches
gh api repos/ZYist/reasonix-legacy/branches/<candidate-branch>/protection
gh api "repos/ZYist/reasonix-legacy/code-scanning/alerts?state=open&per_page=100"
gh api "repos/ZYist/reasonix-legacy/dependabot/alerts?state=open&per_page=100"
```

After the command set, verify that the successful CI and CodeQL `headSha` exactly equals `git rev-parse HEAD`, and record live UAT separately according to `docs/channel-lifecycle-testing.md`.

## Assessment limitations

- No product source, tests, package metadata, documentation, workflows, tags, releases, branch settings, or remotes were modified.
- No publish, push, tag creation, workflow dispatch, live bot/model UAT, credential use, dependency upgrade, audit fix, or security setting mutation was performed.
- Network-backed commands were read-only. Failed/404 remote queries are retained as failures or evidence gaps rather than inferred passes.
- The only repository write produced by this assessment is this summary. `.planning/STATE.md` and `.planning/ROADMAP.md` were not updated.

## Self-check: PASSED

- Required verdict and final sections are present.
- Every required local release gate has command, start time, exit code, duration, result, and key evidence.
- Blocking and non-blocking findings use stable IDs and include release handling.
- The report is bound to one concrete commit and contains no token, account secret, QR code, private message, or complete sensitive API response.
- Scope remains DeepSeek-first and single-model.
