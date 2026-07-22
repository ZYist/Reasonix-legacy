# reasonix-legacy 1.3.1 Release Runbook

<!-- source-of-truth: package.json; .github/workflows/publish-npm.yml; .github/workflows/ci.yml; docs/lts-policy.md; docs/governance.md -->

This is the authoritative, ordered runbook for cutting and publishing a
`reasonix-legacy@1.3.1` LTS release. Every step lists what to do, what evidence
to record, and where an explicit operator authorization is required.

Repository automation (CI, the publish workflow, docs checks) can verify
preconditions and record results. **It does not perform or fabricate tag/push,
npm publish, GitHub Release creation, branch-protection changes, or live
credential UAT.** Those are operator actions (see §Operator authorization
boundary — OPS-06).

The candidate verification (clean verify, real `npm pack`, isolated install,
checksums) is defined in Phase 16 and must be completed on an immutable
candidate before this runbook is executed. This runbook assumes Phase 16
evidence is in hand.

## 0. Preconditions (operator gate)

Before Step 1, confirm each item and record who confirmed it:

- [ ] Phase 16 immutable candidate exists, bound to a source SHA / tree SHA,
      with checksums recorded.
- [ ] No product/dependency/workflow/doc drift between the audited candidate
      and the release commit (Phase 16 VER-04).
- [ ] Operator has explicit authorization to: create the `v1.3.1` tag, push to
      `v1`, publish to npm, create the GitHub Release, and (optionally) run
      live credential UAT.
- [ ] The maintained baseline (Windows + Node.js 24.15.0 + npm 11.16.0 +
      PowerShell) is available to the operator.

If any precondition is unmet, **stop**. Do not mark steps complete based on
intent.

## 1. Freeze the candidate

- [ ] Confirm `package.json` version is `1.3.1`, lockfile root is `1.3.1`, and
      `reasonix-legacy --version` reports `reasonix-legacy 1.3.1`.
- [ ] Record the release commit SHA and the tree SHA (`git rev-parse HEAD` and
      `git rev-parse HEAD^{tree}`).
- [ ] Confirm `node scripts/check-docs.mjs` exits 0 on a clean checkout.

**Evidence:** commit SHA, tree SHA, check-docs exit code.

## 2. Pre-tag checks

- [ ] On a clean checkout: `npm ci`, `npm run verify`, `npm run build`.
- [ ] `npm audit --omit=dev` has no high/critical findings (Phase 11 contract).
- [ ] `npm pack --dry-run` inventory is clean (CLI runtime, tree-sitter
      grammars, required docs; no secrets/planning/removed surfaces/`dsnix`).
- [ ] Tag name is the plain `v1.3.1` (matches `^v\d+\.\d+\.\d+$`).

**Evidence:** verify summary (files / passed / failed), audit result, pack
inventory, intended tag string.

## 3. Create and push the plain v1.3.1 tag (operator action)

> **Operator authorization required.** Planning/CI code does not create or
> push tags.

- [ ] `git tag -a v1.3.1 -m "reasonix-legacy 1.3.1 LTS"` on the release commit.
- [ ] Push commit and tag to `ZYist/reasonix-legacy` (`v1`).

**Evidence:** tag SHA, push confirmation, operator name.

## 4. Windows CI + CodeQL green (operator observation)

- [ ] Wait for the Windows CI workflow on `v1`/`dev` to go green at the
      release commit (Windows-latest, Node 24.15.0, npm 11.16.0, PowerShell;
      docs/lint/typecheck/build/tests/τ-bench harness dry-run).
- [ ] Wait for the CodeQL workflow to go green.

**Evidence:** CI run URL + status, CodeQL run URL + status.

> **Branch protection** is an external GitHub setting. If it is configured,
> record what was observed. Do **not** claim protection rules exist based on
> workflow code alone (OPS-04 / OPS-06).

## 5. npm publish (operator action)

> **Operator authorization required.** Dispatched manually via
> `workflow_dispatch` with the `v1.3.1` tag. The workflow re-runs all release
> gates and refuses to publish unless every gate passes (OPS-02, enforced in
> Phase 16 verification of the workflow).

- [ ] Dispatch `.github/workflows/publish-npm.yml` with tag `v1.3.1`.
- [ ] Confirm `reasonix-legacy@1.3.1` appears on the npm registry.

**Evidence:** publish workflow run URL + status, registry package URL.

## 6. Registry smoke (operator action — OPS-03)

> **Operator authorization required.** This installs the **public registry
> package**, not a local tarball.

- [ ] In a clean directory outside the repo: `npm install reasonix-legacy@1.3.1`.
- [ ] `npx reasonix-legacy --version` → `reasonix-legacy 1.3.1`.
- [ ] `npx reasonix-legacy --help` → command list.
- [ ] Confirm registry integrity matches the published SHA.
- [ ] Confirm no `reasonix` / `dsnix` bin is exposed; no production
      `workspace:` dependency leaks.

**Evidence:** install log, version/help output, integrity comparison, bin
inventory.

## 7. GitHub Release (operator action)

> **Operator authorization required.**

Create the GitHub Release for tag `v1.3.1` using the **Release content
contract** below (OPS-04). The release notes must state what was verified and
must **not** claim branch protection or live UAT that was not actually
performed.

### Release content contract (OPS-04)

The release body must include:

- **Source / tag SHA** — release commit SHA and tag SHA.
- **Checksums** — SHA-256 (and SHA-512 where recorded) of the published
  tarball, from Phase 16.
- **Support window** — the 1.3.x LTS support duration from
  [`lts-policy.md`](lts-policy.md) (≥6 months or 90 days after the next stable
  release, whichever is later).
- **Install / upgrade / rollback** — link to [`migrating-to-1.3.md`](migrating-to-1.3.md)
  and [`getting-started.md`](getting-started.md).
- **Known limitations** — HeadlessHost reasoning/tool-event rendering gap;
  single-model DeepSeek-first surface; Windows-only maintained baseline.
- **Human verification status** — the UAT table from Step 8, with honest
  PASS / NOT-VERIFIED / BEST-EFFORT labels.
- **Operator disclosure** — explicit statement of which steps were operator
  actions and who performed them; branch protection status stated as observed
  (not assumed).

## 8. Human UAT (OPS-05)

Run the UAT checklist. Record each item as **PASS**, **NOT-VERIFIED**, or
**BEST-EFFORT**. Items that need real credentials, network, or an interactive
TTY and cannot be run honestly must be marked **NOT-VERIFIED** or
**BEST-EFFORT** — never auto-PASS.

| Surface | Check | Requires | Result |
|---|---|---|---|
| Interactive TUI | `reasonix-legacy code` reaches the model and renders tool output | DeepSeek key + interactive TTY | _record_ |
| ACP | editor/IDE integration completes a turn over NDJSON | editor + key | _record_ |
| Telegram | bot reaches login and one echo turn | live bot token | _record_ |
| Weixin | QR login flow reaches the scan step | live Weixin session | _record_ |
| QQ | gateway WebSocket connects | live QQ credentials | _record_ |
| doctor | `reasonix-legacy doctor` exits clean on the baseline | local | _record_ |

**Evidence:** completed table with operator name and date for each row.

## 9. Post-release verification

- [ ] Re-install from the registry in a second clean directory and re-run the
      Step 6 smoke.
- [ ] Confirm the GitHub Release body matches the content contract.
- [ ] Record the final verdict: 1.3.1 LTS is promoted **only if** registry
      smoke, UAT status, and the support-window contract are all satisfied.

**Evidence:** second smoke log, release URL, promotion decision + signer.

## Operator authorization boundary (OPS-06)

All of the following require explicit operator authorization **before**
execution. Planning, CI, and docs commands never perform these and never mark
them complete on intent:

- `git tag` / `git push` (tag or branch).
- `npm publish` (registry write).
- GitHub Release creation or edit.
- GitHub branch-protection / repository settings changes.
- Live credential UAT (real bot tokens, real Weixin session, real TTY model
  traffic).

If authorization is missing or an external precondition is unmet, the runbook
stops at that checkpoint and records the blocker. It does not fabricate
completion.
