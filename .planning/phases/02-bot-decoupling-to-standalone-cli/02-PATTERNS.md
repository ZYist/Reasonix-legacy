# Phase 2: Bot Decoupling to Standalone CLI - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 8 (5 new + 3 modified; 02-02 yields QQ+host, 02-03 adds telegram/weixin)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `src/cli/headless/host.ts` | service (loop construction + driver) | request-response (turn) | `src/cli/commands/acp.ts` `buildSession` + `acpCommand` turn-driver | exact (non-TUI surface driving loop) |
| `src/cli/headless/turn-driver.ts` | service (step iteration) | streaming (async generator) | `src/cli/commands/acp.ts:295-316`; `src/cli/commands/desktop.ts:2252-2323` | exact |
| `src/cli/headless/gate-bridges.ts` | service (gate→channel callbacks) | event-driven (pauseGate.on → channel) | `src/cli/commands/desktop.ts:2479-2700` pauseGate.on + `use-qq-channel.ts:621-707` consumePauseReply | role-match (split between two sources) |
| `src/cli/commands/qq.ts` | controller (Commander subcommand) | request-response | `src/cli/commands/code.tsx` + `src/cli/index.ts:350-370` desktop subcommand block | exact |
| `src/cli/commands/telegram.ts` | controller (Commander subcommand) | request-response | `src/cli/commands/qq.ts` (post 02-02) | exact (post-precedent); Constructor divergence: TelegramChannel accepts only `{onSubmitMessage, onError?}` — drop `onInfo` vs qq/weixin (qq.ts/weixin.ts template diverges here) |
| `src/cli/commands/weixin.ts` | controller (Commander subcommand) | request-response | `src/cli/commands/qq.ts` (post 02-02) | exact (post-precedent) |
| `src/qq/use-qq-channel.ts` (modified) | hook → service (decouple Ref → object) | event-driven (gate callbacks) | itself (current `*Ref` shape) + `desktop.ts:1865-1937` bridge | exact (refactor-in-place) |
| `src/telegram/use-telegram-channel.ts` (modified) | hook → service (decouple Ref → object) | event-driven | itself + `use-qq-channel.ts` (post 02-02) | exact |
| `src/weixin/use-weixin-channel.ts` (modified) | hook → service (decouple Ref → object) | event-driven | itself + `use-qq-channel.ts` (post 02-02) | exact |
| `src/cli/index.ts` (modified) | config (Commander registration) | request-response | itself (`program.command(...) .option(...) .action(...)` blocks) | exact |
| `src/i18n/{EN,zh-CN,JA,de,ru}.ts` (modified) | config (i18n keys) | static | itself; `t("...")` usage | exact |

**Preserved no-regression anchors (replicate signature, do NOT rewrite):**
- `src/qq/channel.ts:64` `QQChannel` public methods (`start/sendResponse/stop/refreshAccessConfig/describeAccess`)
- `src/telegram/channel.ts:237` `TelegramChannel`, `src/weixin/channel.ts:123` `WeixinChannel` (parallel signatures)
- `src/core/pause-gate.ts` `pauseGate.resolve/cancel/ask`, `src/core/pause-policy.ts` `autoResolveVerdict`

---

## Pattern Assignments

### `src/cli/headless/host.ts` (service, loop construction)

**Analog:** `src/cli/commands/acp.ts` `buildSession` (lines 157-206) — closest non-TUI loop-construction recipe. Aligns with D-02 also pointing at `desktop.ts:1376-1400`.

**Imports pattern** (`src/cli/commands/acp.ts:1-53`):
```typescript
import { AsyncLocalStorage } from "node:async_hooks";
import { type WriteStream, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { buildCodeToolset } from "../../code/setup.js";
import {
  DEFAULT_MODEL,
  bridgeEndpointEnv,
  loadApiKey,
  loadEditMode,
  loadEndpoint,
  loadMaxIterPerTurn,
  loadModel,
  loadReasoningEffort,
} from "../../config.js";
import { Eventizer } from "../../core/eventize.js";
import { pauseGate } from "../../core/pause-gate.js";
import { autoResolveVerdict } from "../../core/pause-policy.js";
import { loadDotenv } from "../../env.js";
import { t } from "../../i18n/index.js";
import { CacheFirstLoop, DeepSeekClient, ImmutablePrefix } from "../../index.js";
```
Notes for the new module:
- Path alias `@/*` → `src/*` is configured, but existing `src/cli/commands/*` files use relative imports (`../../code/setup.js`). Match the relative style of neighbors; do not mix in `@/` aliases here.
- `kebab-case.ts` module + `HeadlessHostOptions` Option bag (CLAUDE.md: "Option bags typed as `XOptions`, split past ~5 flags"). Split to `host.ts` + `turn-driver.ts` + `gate-bridges.ts` when the bag grows past 5.

**Core loop-construction recipe** (`src/cli/commands/acp.ts:157-206`):
```typescript
async function buildSession(opts: {
  rootDir: string;
  modelOverride?: string;
  budgetUsd?: number;
  mcpSpecs?: string[];
  mcpPrefix?: string;
  systemAppend?: string;
}): Promise<Session> {
  const model = opts.modelOverride || loadModel() || DEFAULT_MODEL;
  const toolset = await buildCodeToolset({ rootDir: opts.rootDir });
  // Bridge MCP tools BEFORE building the prefix so their specs make it into the cache key.
  const mcpClients = await loadMcpServers(
    toolset.tools,
    opts.mcpSpecs ?? [],
    opts.mcpPrefix,
    opts.rootDir,
  );
  const system = codeSystemPrompt(opts.rootDir, {
    hasSemanticSearch: toolset.semantic.enabled,
    modelId: model,
    systemAppend: opts.systemAppend,
  });
  const ep = loadEndpoint();
  const client = new DeepSeekClient({ apiKey: ep.apiKey, baseUrl: ep.baseUrl });
  const prefix = new ImmutablePrefix({ system, toolSpecs: toolset.tools.specs() });
  const loop = new CacheFirstLoop({
    client,
    prefix,
    tools: toolset.tools,
    model,
    budgetUsd: opts.budgetUsd,
    maxIterPerTurn: loadMaxIterPerTurn(),
    session: `acp-${timestampSuffix()}`,
  });
  return { /* …loop, eventizer: new Eventizer(), ctx:{model, prefixHash: prefix.fingerprint, reasoningEffort}, aborter: null */ };
}
```

The desktop-side `buildRuntimeFor` (`src/cli/commands/desktop.ts:1374-1397`) is the same recipe with `applyPlanMode(toolset.tools, loadEditMode())` + `reasoningEffort` + `hooks`+`hookCwd` threaded in — D-02 explicitly names this as the construct to replicate:
```typescript
function buildRuntimeFor(tab: Tab): RuntimeState {
  const toolset = tab.toolset;
  applyPlanMode(toolset.tools, loadEditMode());          // ← plan-mode gate
  const ep = loadEndpoint();
  const client = new DeepSeekClient({ apiKey: ep.apiKey, baseUrl: ep.baseUrl });
  const prefix = new ImmutablePrefix({ system: tab.system, toolSpecs: toolset.tools.specs() });
  const reasoningEffort = loadReasoningEffort();
  const loop = new CacheFirstLoop({
    client, prefix, tools: toolset.tools,
    model: tab.currentModel, budgetUsd: tab.budgetUsd,
    session: tab.currentSession, reasoningEffort,
    maxIterPerTurn: loadMaxIterPerTurn(),
    hooks: tab.hooks, hookCwd: tab.rootDir,            // ← hooks + hookCwd
  });
  const eventizer = new Eventizer();
  const ctx = { model: tab.currentModel, prefixHash: prefix.fingerprint, reasoningEffort };
  return { loop, eventizer, ctx };
}
```
**Outer wrap (workspace resolve + crash, no silent fallback)** — pattern from `src/cli/commands/acp.ts:148-155`:
```typescript
function resolveDir(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const abs = resolve(raw);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    throw new Error(`workspace directory not found: ${abs}`);  // ← log+crash > silent wrong output
  }
  return abs;
}
```
Per CONTEXT "Claude's Discretion": workspace = `--workspace` flag > cwd > throw (do not silent-fallback).

---

### `src/cli/headless/turn-driver.ts` (service, streaming turn driver)

**Analog:** `src/cli/commands/acp.ts:295-316` (compact non-TUI) and `src/cli/commands/desktop.ts:2252-2323` (full with QQ sendResponse). Prefer the ACP form for the headless skeleton, then add channel.sendResponse like desktop's finally block.

**Core step-iteration pattern** (`src/cli/commands/acp.ts:292-341`):
```typescript
session.aborter = new AbortController();
let stopReason: StopReason = "end_turn";
try {
  await sessionContext.run(session.id, async () => {     // ← AsyncLocalStorage scopes gate lookups (see gate-bridges)
    for await (const ev of session.loop.step(text)) {     // ← loop.step is an AsyncGenerator<LoopEvent>
      if (session.aborter?.signal.aborted) { stopReason = "cancelled"; break; }
      // transcript needs raw LoopEvent (usage/cost/stats); kernel events lose those fields
      if (transcriptStream) {
        writeRecord(transcriptStream, recordFromLoopEvent(ev, { model: session.ctx.model, prefixHash: session.ctx.prefixHash }));
      }
      for (const kev of session.eventizer.consume(ev, session.ctx)) {  // ← Eventizer.consume projects LoopEvent → KernelEvent[]
        dispatchKernelEvent(server, session.id, kev);                  // ← surface-specific dispatch (swap for channel.sendResponse)
        if (kev.type === "error") stopReason = "error";
      }
    }
  });
} catch (err) {
  const cause = err instanceof Error ? err : new Error(String(err));
  // ← errorMeta(cause) yields {code, phase} for user-facing text; surface via channel.sendResponse
  stopReason = "error";
} finally {
  session.aborter = null;
}
```

**Channel.sendResponse tail** (`src/cli/commands/desktop.ts:2281-2294` finish the turn with QQ reply):
```typescript
} finally {
  tab.aborter = null;
  if (!tab.switching) {
    if (fromQQ && lastAssistantText && qqRuntime.channel && shouldRouteQQForTab(qqRuntime.routing, tab.id)) {
      await qqRuntime.channel.sendResponse(lastAssistantText).catch((err) => {
        emit({ type: "$error", message: `qq send failed: ${(err as Error).message}` }, tab.id);
      });
    }
    // … $turn_complete, plan_cleared
  }
  if (fromQQ) markQQTurnFinished(qqRuntime.routing, tab.id);
}
```
For the headless host, drop the `emit(...)` UI pseudo-events; the surface IS the channel — `eventizer.consume(...)` is still called (telemetry/cache-diagnostics rely on it) but its kernel events are consumed by `gate-bridges.ts` rather than dispatched to a UI. Capture `lastAssistantText` from `ev.role === "assistant_final" && ev.content` (`desktop.ts:2260-2262`).

**Error handling** — use `errorMeta` from `src/loop/errors.ts` (imported in `acp.ts:44`) to classify and produce user-facing text; send classification via `channel.sendResponse`. Do NOT swallow — log+crash per CLAUDE.md Error Handling section unless surfacing to the channel.

---

### `src/cli/headless/gate-bridges.ts` (service, pauseGate.on bridge)

**Analog:** `src/cli/commands/desktop.ts:2479-2700` (the `pauseGate.on(...)` subscription that translates requests to QQ messages + auto-resolves via `autoResolveVerdict`) PLUS `src/qq/use-qq-channel.ts:621-707` `consumePauseReply` (text→verdict parser that already exists in the adapter).

**Gate subscription skeleton** (`src/cli/commands/desktop.ts:2479-2512`):
```typescript
pauseGate.on((req) => {
  const tab = activeRunningTab();
  const tabId = tab?.id;
  if (tab) tab.pendingGateIds.add(req.id);
  // Shared auto-resolve policy (e.g. plan_checkpoint in auto/yolo) — must
  // still run BEFORE we emit any UI event, otherwise the surface flickers.
  const auto = autoResolveVerdict(req, loadEditMode());
  if (auto !== null) {
    if (req.kind === "plan_checkpoint") {
      const p = req.payload as { stepId: string; title?: string; result: string; notes?: string };
      if (tab) tab.completedStepIds.add(p.stepId);
    }
    if (tab) tab.pendingGateIds.delete(req.id);
    pauseGate.resolve(req.id, auto);
    return;
  }
  // … kind-specific: setQQPendingInteraction + handleQQPauseRequest (send the choice text to channel)
});
```

**The reply→resolve parsers** (`src/qq/use-qq-channel.ts:139-174`) — already channel-only, no React/Ink dependency; move into the `GateCallbacks` object verbatim:
```typescript
function parseRunPermissionChoice(text: string): "run_once" | "always_allow" | "deny" {
  const lower = text.toLowerCase();
  if (lower.includes("1") || lower.includes("run")) return "run_once";
  if (lower.includes("2") || lower.includes("always")) return "always_allow";
  return "deny";
}
function parsePlanChoice(text: string): "approve" | "refine" | "cancel" { /* … */ }
function parseCheckpointChoice(text: string): "continue" | "revise" | "stop" { /* … */ }
function parseRevisionChoice(text: string): ReviseChoice | "cancel" { /* … */ }
function parseIndexedChoice(text: string): number { /* matches /^(\d+)/ */ }
function stripFollowupPrefix(text: string): string { /* trims leading command word */ }
```
(D-05/D-07: "已有实现…原样搬过来,只把 ref 注入点换成对象注入点。")

**Reply handler** (`src/cli/commands/desktop.ts:1865-1937` `handleQQPauseReply` — the canonical text→pauseGate.resolve/cancel bridge):
```typescript
function handleQQPauseReply(tab: Tab, text: string): boolean {
  const pending = takeQQPendingInteraction(qqRuntime.routing, tab.id);
  if (!pending) return false;
  const followup = stripFollowupPrefix(text);
  const gateId = pending.gateId;
  switch (pending.kind) {
    case "run_command":
    case "run_background":
    case "path_access":
      pauseGate.resolve(gateId, parseRunPermissionChoice(text));   // ← ConfirmationChoice
      return true;
    case "plan_proposed": {
      const payload = (pending.payload as { plan?: string }) ?? {};
      const choice = parsePlanChoice(text);
      if (choice === "cancel") pauseGate.cancel(gateId);
      else pauseGate.resolve(gateId, {
        type: choice === "approve" ? "approve" : "refine",
        feedback: followup,
        override: { plan: payload.plan ?? "", mode: choice === "approve" ? "approve" : "refine" },
      });
      return true;
    }
    case "plan_checkpoint": { /* resolve with {type: "revise", feedback, checkpoint} | {type: choice} */ }
    case "plan_revision":    pauseGate.resolve(gateId, parseRevisionChoice(text)); return true;
    case "choice": {
      const payload = (pending.payload as { options?: ChoiceOption[]; allowCustom?: boolean }) ?? {};
      const options = payload.options ?? [];
      const pickedIndex = parseIndexedChoice(text);
      if (pickedIndex >= 0 && pickedIndex < options.length) {
        const selected = options[pickedIndex];
        if (selected) pauseGate.resolve(gateId, { type: "pick", optionId: selected.id });
        return true;
      }
      for (const option of options) {
        if (text.toLowerCase().includes(option.title.toLowerCase())) {
          pauseGate.resolve(gateId, { type: "pick", optionId: option.id });
          return true;
        }
      }
      pauseGate.resolve(gateId, payload.allowCustom ? { type: "text", text } : { type: "cancel" });
      return true;
    }
  }
}
```

**The prompt-text builder (kind → channel message)** (`src/cli/commands/desktop.ts:1939-1985` `handleQQPauseRequest`):
```typescript
function handleQQPauseRequest(tab: Tab, kind: string, payload: Record<string, unknown>): void {
  // …
  switch (kind) {
    case "run_command":
    case "run_background":
      qqMessage = `Need confirmation\n\nCommand: \`${p.command}\`\n\nReply with:\n1. Run once\n2. Always allow\n3. Deny`;
      break;
    case "path_access":
      qqMessage = `Need file access confirmation\n\nAction: ${intentText}\nPath: ${p.path}\nTool: ${p.toolName}\n\nReply with:\n1. Run once\n2. Always allow\n3. Deny`;
      break;
    case "plan_proposed":  qqMessage = `Plan confirmation\n\n${p.plan}\n\nReply with:\n1. Approve\n2. Refine\n3. Cancel`; break;
    case "plan_checkpoint": /* step complete (n/m) */ break;
    case "plan_revision":  qqMessage = `Plan revision proposed\n\n${p.reason}\n\nReply with:\n1. Accept\n2. Reject\n3. Cancel`; break;
    case "choice":         qqMessage = `Please choose\n\n${p.question}\n\nOptions:\n${optionsList}${p.allowCustom ? "…" : ""}`; break;
  }
  if (qqMessage) void qqRuntime.channel.sendResponse(qqMessage).catch(/* log */);
}
```

**`GateCallbacks` object shape (the substitute for TUI `*Ref`)** — D-05/D-06. The current `UseQQChannelArgs` field set (`src/qq/use-qq-channel.ts:65-113`) is the template; the executor swaps each `{ current: (...) => void }` ref for a plain `(…) => void` callback:
```typescript
// BEFORE (TUI ref, use-qq-channel.ts:81-112):
onShellConfirmRef: { current: (choice: "run_once" | "always_allow" | "deny") => void };
onPathConfirmRef:  { current: (choice: "run_once" | "always_allow" | "deny") => void };
onPlanCancelRef:   { current: () => void | Promise<void> };
onPlanFeedbackRef: { current: (feedback: string, override: { plan: string; mode: "refine"|"approve"|"reject" }) => void | Promise<void> };
onCheckpointConfirmRef: { current: (choice: "continue"|"revise"|"stop") => void };
onCheckpointReviseRef:  { current: (feedback: string, snap: { stepId: string; title?: string }) => void };
onPlanRevisionRef: { current: (choice: ReviseChoice | "cancel") => void };
onChoiceResolveRef: { current: (resolution: {type:"pick";optionId:string} | {type:"text";text:string} | {type:"cancel"}) => void };

// AFTER (object injection — what the headless host provides):
interface GateCallbacks {
  onShellConfirm(choice: "run_once" | "always_allow" | "deny"): void;
  onPathConfirm(choice: "run_once" | "always_allow" | "deny"): void;
  onPlanCancel(): void;
  onPlanFeedback(feedback: string, override: { plan: string; mode: "refine" | "approve" | "reject" }): void;
  onCheckpointConfirm(choice: "continue" | "revise" | "stop"): void;
  onCheckpointRevise(feedback: string, snap: { stepId: string; title?: string }): void;
  onPlanRevision(choice: ReviseChoice | "cancel"): void;
  onChoiceResolve(resolution: { type: "pick"; optionId: string } | { type: "text"; text: string } | { type: "cancel" }): void;
}
```
The host's implementations of these callbacks inline `pauseGate.resolve(gateId, …)` / `pauseGate.cancel(gateId)`. The adapter's `consumePauseReply` then routes text → the right callback based on `interactionRef.current.kind` (`use-qq-channel.ts:629-694`) — same logic, just dispatching to `gateCallbacks.onShellConfirm(...)` instead of `onShellConfirmRef.current(...)`.

**Use `AsyncLocalStorage`** to bind the active channel/gate-id context per inbound message — mirror `acp.ts:214` `const sessionContext = new AsyncLocalStorage<string>();` + `sessionContext.run(id, async () => …)` so `pauseGate.on` knows which channel session emitted the request. The `tabContext` in `desktop.ts:1514` is the same pattern.

---

### `src/cli/commands/qq.ts` (controller, Commander subcommand)

**Analog:** `src/cli/commands/code.tsx` (full code-mode assembly) + `src/cli/index.ts:350-370` (desktop subcommand registration — minimal pen-down form). D-04: "命令是薄入口,只装配 + lifecycle,业务逻辑留在 adapter 与 host。"

**Subcommand registration pattern** (`src/cli/index.ts:350-370`):
```typescript
program
  .command("desktop")
  .description("headless JSON-RPC chat for the desktop client (internal)")
  .option("-m, --model <id>", t("ui.modelIdHint"))
  .option("--dir <path>", "root directory for filesystem tools (default: cwd)")
  .option("--effort <level>", t("ui.effortHintShort"))
  .option("--budget <usd>", t("ui.budgetHintShort"), (v) => Number.parseFloat(v))
  .action(async (opts) => {
    persistEffortFlag(opts.effort);                          // ← shared helper: src/cli/index.ts:31
    const defaults = resolveDefaults({ model: opts.model, mcp: [], effort: opts.effort, noConfig: false });
    const { desktopCommand } = await import("./commands/desktop.js");   // ← dynamic import keeps startup lean
    await desktopCommand({ model: defaults.model, budgetUsd: parseBudgetFlag(opts.budget), dir: opts.dir });
  });
```
For `qq.ts`, register `reasonix qq` with options `-m/--model`, `--workspace <path>`, `--effort`, `--budget`, then dynamically import the command.

**Command body skeleton** (combine `code.tsx:48-87` env-bridge discipline with `code.tsx` `buildCodeToolset` + the new `HeadlessHost`):
```typescript
// src/cli/commands/qq.ts
import { resolve } from "node:path";
import { buildCodeToolset } from "../../code/setup.js";
import { DEFAULT_MODEL, bridgeEndpointEnv, loadModel } from "../../config.js";
import { loadDotenv } from "../../env.js";
import { t } from "../../i18n/index.js";
import { QQChannel } from "../../qq/channel.js";
import { HeadlessHost } from "../headless/host.js";
import { installQQGateBridges } from "../headless/gate-bridges.js";  // adapter-side gate bridges

export interface QqCommandOptions {
  model?: string;
  workspace?: string;
  effort?: string;
  budgetUsd?: number;
}

export async function qqCommand(opts: QqCommandOptions = {}): Promise<void> {
  loadDotenv();
  bridgeEndpointEnv();
  const rootDir = resolve(opts.workspace ?? process.cwd());   // ← crash-on-missing stays in HeadlessHost.resolveDir
  const model = opts.model?.trim() || loadModel() || DEFAULT_MODEL;

  const host = await HeadlessHost.create({ rootDir, model, budgetUsd: opts.budgetUsd });
  installQQGateBridges(host);                                   // ← pauseGate.on + autoResolveVerdict + channel bridges

  const channel = new QQChannel({
    onSubmitMessage: (text) => void host.runTurn(text),       // ← inbound → turn-driver.ts
    onError: (msg) => process.stderr.write(`QQ: ${msg}\n`),
    onInfo: (msg) => process.stderr.write(`${msg}\n`),
  });
  await channel.start();
  // … SIGTERM/SIGINT → channel.stop() + host.shutdown()
}
```

**Dynamic import discipline** (`src/cli/index.ts:364` `const { desktopCommand } = await import("./commands/desktop.js")`) — keep `qq.ts` out of the eager graph so the CLI still boots fast when `qq` isn't invoked; matches the lazy `import("./commands/...")` pattern every other subcommand uses.

**Pre-confirm ESM marker / bin wiring is unaffected** — `tsup.config.ts:15` `entry: ["src/cli/index.ts"]` already bundles everything reachable; dynamic imports still resolve. Per CONTEXT Integration Points, `bin` (`reasonix`/`dsnix` → `dist/cli/index.js`) + `write-cli-package-marker.mjs` (01-01 contract) must keep emitting the marker. The executor only adds a `.command("qq")` block to `src/cli/index.ts`; do not touch tsup.

---

### `src/cli/commands/telegram.ts` / `src/cli/commands/weixin.ts`

**Analog:** `src/cli/commands/qq.ts` (post 02-02). Per D-08: "三 channel 经同一宿主入口、同一 gate-callback 形状启动。"

The three channel PUBLIC method signatures are already parallel — copy this fact into the planner:
```
src/qq/channel.ts:64          QQChannel      { start, sendResponse, stop, refreshAccessConfig, describeAccess }   ctor {onSubmitMessage, onError?, onInfo?}
src/telegram/channel.ts:237   TelegramChannel { start, sendResponse(text, buttons?), stop, refreshAccessConfig, describeAccess }   ctor {onSubmitMessage, onError?} — NO onInfo (no QR login)
src/weixin/channel.ts:123     WeixinChannel   { start, sendResponse, stop, refreshAccessConfig, describeAccess }   ctor {onSubmitMessage, onError?, onInfo?}
```
**Constructor divergence is load-bearing (TS2741 risk on excess property):** telegram.ts builds its channel with ONLY `{onSubmitMessage, onError}` — passing `onInfo` would be a compile error. qq.ts/weixin.ts pass all three `{onSubmitMessage, onError, onInfo}`. Telegram has no QR-login flow; any startup info text in telegram.ts is written via `process.stderr.write(...)` directly inside `telegramCommand`, NOT through a channel callback.
(Telegram's `sendResponse` adds an optional `buttons` arg; the headless host should call it without buttons, or the executor decides per-channel send signature during 02-03 planning.)

---

### `src/qq/use-qq-channel.ts` (modified) and `src/telegram/use-telegram-channel.ts`, `src/weixin/use-weixin-channel.ts`

**Analog:** themselves (current `*Ref` shape) — D-05/D-06 explicitly: "只把 `*Ref` 注入点换成对象注入点,其余原样迁。"

**Current `UseQQChannelArgs`** (`src/qq/use-qq-channel.ts:65-113`):
- Reply dispatch is `consumePauseReply` (lines 621-707) which calls `onShellConfirmRef.current(...)`, `onPathConfirmRef.current(...)`, `onPlanCancelRef.current()`, `onPlanFeedbackRef.current(feedback, override)`, `onCheckpointConfirmRef.current(choice)`, `onCheckpointReviseRef.current(feedback, snap)`, `onPlanRevisionRef.current(parsed)`, `onChoiceResolveRef.current(resolution)`.
- Slash-handler dispatch is `consumeSlashReply` (lines 518-619) calling `onCreateSession`/`onSelectSession`/`onModelPick`/`onThemePick` — these are already plain callbacks (not refs).

**Refactor-in-place rule:**
1. Change each `onXxxRef: { current: (...) => void }` field to `onXxx: (...) => void` in the interface.
2. Replace every `onXxxRef.current(...)` call inside `consumePauseReply` with `onXxx(...)`.
3. Keep TUI callers wiring `onXxx={(choice) => ref.current(choice)}` (one-line adapter inside the TUI host); the **Ink UI** does not have to migrate — it can stay ref-based by wrapping. The headless host wires direct closures.
4. Mirror the same change across `src/telegram/use-telegram-channel.ts` (which is a near-exact parallel — `UseTelegramChannelArgs:65-113` has identical ref field names, just `Telegram` instead of `QQ`) and `src/weixin/use-weixin-channel.ts`.

The `pendingGateIdRef`, `completedStepIdsRef`, `planStepsRef`, `interactionRef`, `slashInteractionRef` are internal adapter state and STAY refs — only the *injected* `onXxxRef` fields flip to object form.

---

### `src/cli/index.ts` (modified) — subcommand registration

**Analog:** itself (`src/cli/index.ts:131-201` `code` block, `:350-370` `desktop` block).

Add a `program.command("qq")` block following the `desktop` block's minimal form: `.option("-m, --model <id>", …)`, `.option("--workspace <path>", …)`, `.option("--effort <level>", …)`, `.option("--budget <usd>", …, (v) => Number.parseFloat(v))`, then `persistEffortFlag(opts.effort)`, dynamic import `./commands/qq.js`, call `qqCommand({...})`. Repeat for `telegram` / `weixin` in 02-03.

---

## Shared Patterns

### PauseGate bridging (applies to all 3 channel hosts)
**Source:** `src/core/pause-gate.ts` (full file) + `src/core/pause-policy.ts` (full file) + `src/cli/commands/desktop.ts:2479-2700`.

The bridge is **one `pauseGate.on` subscription per process**, set up before the channel starts. It must (in order): (1) check `autoResolveVerdict(req, loadEditMode())` and short-circuit `pauseGate.resolve(req.id, auto)` if non-null; (2) otherwise stash `gateId` against the active channel, send the human-readable choice text via `channel.sendResponse`, and wait for the next inbound message to route through `consumePauseReply`-style parsing.

```typescript
// Shared auto-resolve gating (from desktop.ts:2486-2511):
const auto = autoResolveVerdict(req, loadEditMode());   // ← pause-policy.ts: null = surface to user
if (auto !== null) {
  // … bookkeeping for plan_checkpoint step-completion
  pauseGate.resolve(req.id, auto);
  return;
}
```
`pauseGate.resolve(id, data)` and `pauseGate.cancel(id)` are the only two APIs the host calls (`pause-gate.ts:118, 138`). `ask(...)` is invoked by tools — never by the host.

**Apply to:** `gate-bridges.ts` (provides the closure implementations); `qq.ts`/`telegram.ts`/`weixin.ts` install it once at startup. **Must NOT alter** `pauseGate`'s exported methods or `autoResolveVerdict`'s signature (public-API anchor).

### Workspace + env bootstrap (applies to all three commands)
**Source:** `src/cli/commands/code.tsx:48-87` + `src/cli/commands/acp.ts:208-213, 148-155`.
Sequence: `loadDotenv()` → `bridgeEndpointEnv()` → `resolveDir(workspace, cwd)` (crash if missing) → `buildCodeToolset({rootDir})` → build loop. `persistEffortFlag` runs in the `.action()` wrapper before the dynamic import (`src/cli/index.ts:31, 182, 233, 294, 357`).

**Apply to:** `qq.ts`, `telegram.ts`, `weixin.ts` `.action()` bodies and `HeadlessHost.create`.

### i18n 5-locale contract
**Source:** `src/i18n/index.ts:61` `setLanguageRuntime(lang)`; `tests/setup-lang.ts:3` pins `"EN"`; locales `EN, zh-CN, JA, de, ru`.
Every user-visible new string (command help text, QQ startup log, gate prompt text in `gate-bridges.ts` if you re-localize) MUST go through `t("key", {vars})` and the key must be added to all 5 locale files. The existing `src/qq/strings.ts` `QQSetupStep` formatter family is the convention.

**Apply to:** any new string in `host.ts` startup logs, `gate-bridges.ts` prompts (if not just reusing channel strings), `qq.ts` CLI `--help` description. Side car's existing QQ strings are reused — do not duplicate keys.

### Channel lifecycle
**Source:** `src/qq/channel.ts:64-293` (and the parallel telegram/weixin classes).
Inbound: `new QQChannel({ onSubmitMessage, onError, onInfo })` → `await channel.start()` → bot emits `message.private` internally → adapter's `onSubmitMessage(text)` is the inbound hook. Outbound: `await channel.sendResponse(text)` (split + markdown-normalized inside the channel). Teardown: `await channel.stop()` releases the PID lock (`QQ_LOCK_FILE`, `channel.ts:11`).

The headless host's `runTurn(text)` is the `onSubmitMessage` target; if a turn is mid-flight when a new inbound arrives, the existing `classifyDesktopQQIngress` decision (`desktop.ts:2006-2009`) is the precedent — the headless host must replicate it: handle pending-gate reply first, else queue/reject busy.

**Apply to:** `qq.ts` (and telegram/weixin in 02-03) assemble + wire `onSubmitMessage`, then exit cleanly on SIGINT/SIGTERM via `channel.stop()` + `host.shutdown()`.

### Function / module design constraints (CLAUDE.md)
- `kebab-case.ts` modules. Named exports only — no `default export` in `src/`.
- Option bag `XOptions` typed; split past ~5 flags into separate submodule files. Plan to split `headless/` into `{host,turn-driver,gate-bridges}.ts` from the start (D-01).
- `import type` for type-only imports (Biome `style.useImportType: warn`).
- `isolatedModules: true` — every new file must be independently transpilable (no cross-file `const enum`).
- Path alias `@/*` exists but neighbors under `src/cli/commands/*` use relative `../../...js` imports. Stay consistent within the directory you're adding to.

**Apply to:** every new file in `src/cli/headless/` and `src/cli/commands/{qq,telegram,weixin}.ts`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | Every file in this phase has a strong codebase analog (host.ts/turn-driver.ts ← acp.ts + desktop.ts; gate-bridges.ts ← desktop.ts pauseGate.on + use-qq-channel.ts; qq.ts ← code.tsx + cli/index.ts desktop block; modified adapters ← themselves). No pattern needs to come purely from RESEARCH.md. |

---

## Metadata

**Analog search scope:**
- `src/cli/commands/desktop.ts` (segments: 1-80 imports, 1310-1428 buildRuntimeFor + RuntimeState/Tab, 1490-1545 desktopCommand head, 1720-1768 model/effort/plan switch, 1865-1986 gate-prompt + reply bridge, 1988-2040 startDesktopQQ ingress dispatch, 2240-2323 turn driver, 2440-2700 pauseGate.on subscription)
- `src/cli/commands/acp.ts` (1-53 imports, 157-206 buildSession, 220-342 turn driver + gate bridge)
- `src/cli/commands/code.tsx` (1-100 code-mode bootstrap)
- `src/cli/commands/run.ts` (1-100 non-TUI predecessor)
- `src/cli/index.ts` (subcommand registration blocks, esp. 131-201 + 350-370)
- `tsup.config.ts` (CLI entry + bin banner)
- `src/core/pause-gate.ts` (full), `src/core/pause-policy.ts` (full)
- `src/qq/channel.ts` (1-293), `src/qq/use-qq-channel.ts` (1-130, 410-947)
- `src/telegram/channel.ts:230-310`, `src/telegram/use-telegram-channel.ts:1-110`
- `src/weixin/channel.ts:115-205`
- `src/i18n/index.ts`, `tests/setup-lang.ts`

**Files scanned:** 14 unique files (large ones via non-overlapping targeted reads).

**Pattern extraction date:** 2026-07-03

**Key invariant for the executor (D-09 no-regression contract):** The desktop sidecar (`desktopCommand` @ `desktop.ts:1499`, the `qqRuntime` state machine, `src/desktop/qq-{ingress,remote-commands,settings,turn-routing}.ts`) MUST stay intact and unmodified this phase. New `reasonix qq` reuses the same `src/qq/*` protocol modules (shared layer) but does NOT touch the sidecar host layer. QQ's `QQ_LOCK_FILE` PID lock (`channel.ts:11`) prevents the same account from running under both hosts simultaneously.
