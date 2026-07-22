---
gsd_state_version: 1.0
milestone: v1.3.1
milestone_name: LTS Release
current_phase: 17
current_phase_name: External Release Validation and LTS Promotion
status: shipped
stopped_at: v1.3.1 LTS published and registry-verified
last_updated: "2026-07-22T06:30:00.000Z"
last_activity: 2026-07-22
last_activity_desc: v1.3.1 published to npm + registry smoke passed; GitHub tag/release pushed
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 6
  completed_plans: 6
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-22)

**Core value:** 在终端里跑一个低成本、不中断的 DeepSeek 编程 agent——缓存优先压低 token 成本，工具调用 JSON 自修复保证 loop 不被坏输出打断。
**Current focus:** v1.3.1 LTS released — `reasonix-legacy@1.3.1` published on npm and verified from the registry.

## Current Position

Phase: 17 — External Release Validation and LTS Promotion (delivered)
Plan: —
Status: v1.3.1 LTS shipped (npm published + registry smoke passed; GitHub tag/release pushed)
Last activity: 2026-07-22 — Completed quick task 260722-lq3: 先重新 map codebase，然后刷新情报库

## Performance Metrics

**Velocity:**

- v1.3.1 plans completed: 6 across Phases 14-17
- v1.3.1 phases completed: 4 of 4 (14-17)

**By Phase (v1.3.1):**

| Phase | Plans | Status |
|-------|-------|--------|
| 14. 1.3.1 Identity and LTS Contract | 2/2 | Complete |
| 15. Migration and Release Runbook | 2/2 | Complete |
| 16. Immutable Candidate and Publish Gates | 1/1 | Complete |
| 17. External Release Validation and LTS Promotion | 1/1 | Delivered (live UAT deferred) |

**Release facts:**

- npm: `reasonix-legacy@1.3.1` published (owner `shouffin`); registry `dist.shasum` `20972322b2bf84a8508ad2b6a0bb28bdb1885312`.
- Tag: `v1.3.1` on `319e7cd69e14374e15ef4a5db776a7021f760947` (plain `vX.Y.Z`, matches package.json).
- Candidate verification: clean verify 281 files / 3800 passed / 0 failed; audit 0 vulnerabilities; isolated install + registry install both confirm `reasonix-legacy 1.3.1`, sole bin, no `workspace:` deps.

## Accumulated Context

### Decisions

- v1.3.1 is the first public release and the first cut of the 1.3.x LTS line; 1.2 is historical only.
- LTS support contract (docs/lts-policy.md): ≥6 months or 90 days after the next stable release, whichever is later.
- npm auth used a granular publish token (bypass 2FA) in user-global `~/.npmrc`; no secret entered the repo.
- The bogus local `v1.3.0` tag (pointed at upstream `5b336c89`) was deleted; v1.3.0 was never publicly released.

### Pending Todos

- OPS-05 live UAT (interactive TTY / Telegram / Weixin / QQ with real credentials) — operator follow-up; record PASS / NOT-VERIFIED / BEST-EFFORT per docs/release-runbook.md.
- Optional: GitHub branch-protection confirmation (external setting).

### Blockers/Concerns

- None for the published artifact. Live UAT and branch-protection confirmation remain explicit operator actions (not blocking).

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260722-byv | 评估当前的1.2正式版和1.3预览版是否能作为用户侧的LTS版本使用 | 2026-07-22 | 81d077c3 | [260722-byv-1-2-1-3-lts](./quick/260722-byv-1-2-1-3-lts/) |
| 260720-bsc | 备份并记录 dev 差异后推送新快照分支 | 2026-07-20 | 74ce8e44 | [260720-bsc-backup-push-dev-delta](./quick/260720-bsc-backup-push-dev-delta/) |
| 260722-l5j | 修复 CI Docs gate 顺序：移到 Build 之后（方案 A） | 2026-07-22 | 80e2c9d1 | [260722-l5j-a-ci](./quick/260722-l5j-a-ci/) |
| 260722-lq3 | 先重新 map codebase，然后刷新情报库 | 2026-07-22 | 9572d861 | [260722-lq3-map-codebase](./quick/260722-lq3-map-codebase/) |
| 260722-act | 升级 actions/checkout/setup-node @v4→v5（node24 运行时，消除 Node 20 deprecation warning） | 2026-07-22 | 46d0ecf4 | — |

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Live UAT | Credential/TTY-dependent Telegram, Weixin, QQ, interactive checks | Operator follow-up; not faked as automated | v1.3.1 release |
| Operator action | GitHub branch-protection confirmation | External setting; observe, don't assert | v1.3.1 release |
| Protected refactor | REF-01..04: App/config/loop/tools decomposition | Dedicated post-v1.3 milestone with characterization protection | v1.3 closeout |
| Channel streaming | HeadlessHost reasoning/tool-event rendering limitation | Deferred future improvement | v1.0 accepted gap |

## Session Continuity

Last session: 2026-07-22T06:30:00.000Z
Stopped at: v1.3.1 LTS released (npm + GitHub)
Resume file: None

## Operator Next Steps

- Run live UAT (OPS-05) with real credentials and record results.
- Start the next milestone with `$gsd-new-milestone` when ready.
