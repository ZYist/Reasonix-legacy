# Phase 13: Candidate Packaging and Stable Reassessment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 13-candidate-packaging-and-stable-reassessment
**Areas discussed:** clean verification baseline, tarball inventory method, isolated install strategy, final reassessment scope

---

## Clean verification baseline

| Option | Description | Selected |
|--------|-------------|----------|
| Best-effort warm-workspace verification | Reuse existing node_modules/build state without reinstalling dependencies. | |
| Fresh `npm ci` + full `npm run verify` on the maintained Windows baseline | Reinstall dependencies cleanly, then run the full local release verification suite. | ✓ |
| Partial smoke checks only | Skip the full suite and rely on earlier phase verification. | |

**User's choice:** `[auto] recommended default` → Fresh `npm ci` + full `npm run verify` on the maintained Windows baseline.
**Notes:** PKG-01 explicitly requires clean dependency-state evidence.

---

## Tarball inventory method

| Option | Description | Selected |
|--------|-------------|----------|
| Inspect files manually from the workspace | Infer packaged contents without using npm's pack inventory. | |
| Use `npm pack --dry-run --json` as the packaging inventory | Capture the exact candidate tarball file list, sizes, and inclusion/exclusion evidence. | ✓ |
| Delay pack validation until publish time | Leave tarball evidence to the maintainer's release run. | |

**User's choice:** `[auto] recommended default` → Use `npm pack --dry-run --json` as the packaging inventory.
**Notes:** This provides deterministic evidence without performing publication.

---

## Isolated install strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse the dev checkout and existing bin links | Validate commands from the current workspace only. | |
| Install the packed tarball into a fresh temporary directory | Prove the published artifact works independently of the dev checkout. | ✓ |
| Skip install validation | Assume the tarball would install correctly if packing succeeds. | |

**User's choice:** `[auto] recommended default` → Install the packed tarball into a fresh temporary directory.
**Notes:** PKG-03 requires isolated-install evidence and explicit absence of `reasonix` / `dsnix` bins.

---

## Final reassessment scope

| Option | Description | Selected |
|--------|-------------|----------|
| Local PASS report only | Summarize successful local checks without mentioning manual gaps. | |
| Candidate report with local evidence plus explicit manual/not-run disclosures | Bind the report to the SHA and distinguish executed checks from operator actions and live UAT not run. | ✓ |
| Hold the report until after manual publish | Delay reassessment until after remote actions occur. | |

**User's choice:** `[auto] recommended default` → Candidate report with local evidence plus explicit manual/not-run disclosures.
**Notes:** REL-02 requires the report to be honest about manual/external steps and live UAT gaps.

---

## the agent's Discretion

- Decide whether Phase 13 needs code changes or remains evidence-only based on the observed pack/install output.
- Choose the exact evidence formatting for the candidate report as long as commands, dates, SHA, and outcomes stay explicit.
- Capture only the minimum packaging evidence needed to support a stable-release decision.

## Deferred Ideas

- Remote publish/tag/branch-protection actions remain maintainer-operated.
- If a candidate passes locally, the next human step is deciding whether to perform those manual release actions.
