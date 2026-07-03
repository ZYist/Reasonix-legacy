---
phase: 02
slug: bot-decoupling-to-standalone-cli
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-03
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
>
> Phase 02 decouples QQ / Telegram / Weixin bots from the desktop sidecar into standalone
> CLI commands that mount a transport-agnostic `HeadlessHost`. Verification method: L1
> grep-depth (ASVS L1, `security_block_on: high`) — short-circuited per `secure-phase`
> Step 3 because `threats_open(≥high) == 0` and the register was authored at plan time.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| inbound chat-network message → host.runTurn | Unauthenticated QQ/Telegram/Weixin text enters the agent loop and drives full-fs/shell tools. Authenticator is the channel allowlist (qq `decideQQAccess` in src/qq/access.ts; tg/weixin parallels) — the host defers identity to the channel (D-07). | Arbitrary user-controlled text → tool execution |
| gate-reply text → pauseGate.resolve | A channel reply string is parsed by `parse*Choice` into a verdict. Spoofed/ambiguous text is a Tampering vector; mitigated by default-else deny/cancel. | User-controlled reply → gate verdict |
| host → DeepSeek API key | Key loaded once via `loadEndpoint()`, consumed only by `DeepSeekClient` ctor. Leakage into logs is Information Disclosure. | DeepSeek API key (secret) |
| command → channel credentials | QQ `appSecret` / Telegram `botToken` / Weixin session loaded into channel modules; leakage into stderr is Information Disclosure. | Channel auth secrets |
| QQ account → PID lock | `QQ_LOCK_FILE` (channel.ts) prevents the same account being driven by sidecar + `reasonix qq` simultaneously (D-10 coexistence). | Process lock file |
| Weixin QR scan login | First-time login prints a QR to terminal; operator scans with WeChat. Physical shoulder-surfing is out of scope for a CLI. | Session credentials via QR |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Spoofing | inbound-message → host.runTurn | high | accept | Channel allowlist (`decideQQAccess`) is the authenticator; host trusts channel-vetted text. D-07 keeps access control in-channel. See Accepted Risks. | closed |
| T-02-02 | Tampering | gate-bridge consumeReply → pauseGate.resolve | medium | mitigate | `parse*Choice` falls through to deny/cancel on unmatched text — never auto-approves. Pinned by `tests/headless-gate-bridges.test.ts` (T-02-02 deny-default, 6/6 pass). | closed |
| T-02-03 | Information Disclosure | host startup logs / error path | medium | mitigate | `errorMeta` surfaces classification text only. grep `src/cli/headless/`: `apiKey` appears solely in `DeepSeekClient({apiKey: ep.apiKey})` ctor (host.ts:99); `turn-driver.ts` has no `apiKey` reference. | closed |
| T-02-04 | Denial of Service | inbound flood → host.runTurn queue | low | accept | Channel owns `processedMsgIds` dedup + PID lock; host runs one turn at a time (single aborter); command layer owns busy/queue. See Accepted Risks. | closed |
| T-02-05 | Spoofing | inbound QQ message identity | high | accept | Identity stays in `QQChannel` + `decideQQAccess`. D-07 defers auth to channel module. See Accepted Risks. | closed |
| T-02-06 | Tampering | gate consumeReply → pauseGate.resolve (QQ) | high | mitigate | Default-else deny/cancel (carries from T-02-02) + object-injection `GateCallbacks` can only resolve verdicts the dispatcher chooses. Pinned by `tests/qq-channel-gate-callbacks.test.ts` (9/9, incl T-02-06 deny). | closed |
| T-02-07 | Repudiation | concurrent inbound from QQ | medium | accept | Channel dedup + busy/queue explicit drop logged via `onInfo` (explicit-drop > silent-rejection). See Accepted Risks. | closed |
| T-02-08 | Information Disclosure | qq.ts error/log path | medium | mitigate | grep `src/cli/commands/qq.ts` stderr: all `t("commands.qq.*",{msg})` interpolate `err.message`; `apiKey`/`appSecret` never interpolated. **Residual gap WR-05**: raw `err.message` not redacted before stderr — deferred (medium, below high threshold). See Accepted Risks + Deferred Follow-ups. | closed (partial — see WR-05) |
| T-02-09 | Denial of Service | signal handler not installed (QQ) | low | mitigate | SIGINT/SIGTERM cleanup installed before `channel.start()`. VERIFICATION confirms qq.ts SIGINT line 143 < channel.start line 149. | closed |
| T-02-10 | Spoofing | inbound Telegram/Weixin identity | high | accept | Access control stays in-channel (tg/weixin allowlist). D-07 rationale. See Accepted Risks. | closed |
| T-02-11 | Tampering | gate consumeReply → pauseGate.resolve (tg/weixin) | high | mitigate | Default-else deny/cancel (same as T-02-02/T-02-06). Pinned by `tests/telegram-command.test.ts` + `tests/weixin-command.test.ts` (5/5 each). | closed |
| T-02-12 | Spoofing | Weixin QR scan hijack (shoulder-surfing) | medium | accept | QR printed to operator's terminal; physical-screen shoulder-surfing out of scope for a CLI. See Accepted Risks. | closed |
| T-02-13 | Information Disclosure | Telegram bot token / Weixin session in logs | medium | mitigate | grep `src/cli/commands/{telegram,weixin}.ts` stderr: `t("commands.*",{msg})` interpolate `err.message`; `botToken`/`token` never interpolated. **Residual gap WR-05** (same as T-02-08): raw `err.message` not redacted — deferred (medium, non-blocking). | closed (partial — see WR-05) |
| T-02-14 | Denial of Service | missing SIGINT handler (tg/weixin) | low | mitigate | SIGINT/SIGTERM before `channel.start()`. VERIFICATION confirms telegram 143<149, weixin 172<179. | closed |
| T-02-15 | Tampering | channel-protocol defect during Weixin QR state machine | low | accept | `runWeixinQrLogin` reused unmodified (BOT-02 "迁移不重写协议"); QR state-machine risk owned by channel module. See Accepted Risks. | closed |
| T-02-SC | Tampering | npm installs (3 plans) | high | mitigate | No new npm install this phase — pure TS additions under `src/`. slopcheck gate not triggered. | closed |

*Status: closed · closed (partial — residual below-threshold gap documented) · no open threats at or above `high` remain.*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (high) count toward `threats_open`.*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party).*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-02-01 / T-02-05 / T-02-10 | Headless host + command controllers defer all identity/auth to the channel module's allowlist (`decideQQAccess` and tg/weixin parallels). Re-adding auth at the host/command layer would duplicate channel logic and violate design decision D-07. | developer (via PLAN dispositions) | 2026-07-03 |
| AR-02 | T-02-04 | Inbound-flood queueing is owned by the channel (`processedMsgIds` dedup + PID lock) and the command layer (busy/queue). The host alone has no queue by design. | developer (via PLAN dispositions) | 2026-07-03 |
| AR-03 | T-02-07 | Concurrent QQ inbound drops are explicit and logged via `onInfo`, not silent — consistent with CLAUDE.md "log + crash > silent wrong output". | developer (via PLAN dispositions) | 2026-07-03 |
| AR-04 | T-02-12 | Weixin QR is printed to the operator's own terminal; physical shoulder-surfing is out of scope for a CLI tool (operator controls their terminal). | developer (via PLAN dispositions) | 2026-07-03 |
| AR-05 | T-02-15 | `runWeixinQrLogin` is an existing in-channel helper reused unmodified (BOT-02); migrating the channel does not introduce new QR-state-machine attack surface. | developer (via PLAN dispositions) | 2026-07-03 |
| AR-06 | T-02-08 / T-02-13 (WR-05) | The core secret-isolation mitigation holds (apiKey/botToken/appSecret are never interpolated into stderr — verified by grep). Residual: raw `(err as Error).message` flows unfiltered to stderr in all 3 command controllers; if an upstream HTTP/auth failure embeds a secret in the message it would be written verbatim. Accepted as a **deferred, medium, below-`high`-threshold** follow-up — does not block phase advancement. | developer (VERIFICATION.md `security_review_items`) | 2026-07-03 |

*Accepted risks do not resurface in future audit runs.*

---

## Deferred Follow-ups (non-blocking)

| ID | Item | Severity | Disposition |
|----|------|----------|-------------|
| WR-05 | Route stderr-bound error text through `src/core/event-redaction.ts` `redactEventValue` before writing in `qq.ts` / `telegram.ts` / `weixin.ts` error handlers. | medium | Scheduled for separate fix cycle (tracked in `02-VERIFICATION.md` `followups_deferred`). Non-goal-blocker per developer decision. |

Other deferred code-review follow-ups (WR-01/03/04/06 + IN-01..06) are quality items with no independent security impact — see `02-VERIFICATION.md`.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open (≥high) | Run By |
|------------|---------------|--------|--------------|--------|
| 2026-07-03 | 16 | 16 | 0 | Claude (gsd-secure-phase, ASVS L1 grep-depth, short-circuit) |

Method: L1 grep-depth verification of mitigations against the plan-authored STRIDE register. `security_asvs_level: 1`, `security_block_on: high`. Short-circuited the auditor (Step 5) per `secure-phase` Step 3 rule because `threats_open(≥high) == 0` and `register_authored_at_plan_time == true`.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed (no open threats at or above `high`)
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-03
