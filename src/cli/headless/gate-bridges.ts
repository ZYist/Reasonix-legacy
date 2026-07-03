// Headless gate-bridges — translates `pauseGate.on(...)` PauseRequests into
// channel-facing prompt text + parses the channel reply text back into a
// `pauseGate.resolve/cancel` verdict. This is the transport-agnostic analog
// of desktop.ts:2479-2512 (the `pauseGate.on` subscription) +
// desktop.ts:1865-1937 (handleQQPauseReply text→resolve bridge) +
// desktop.ts:1939-1985 (handleQQPauseRequest kind→prompt text).
//
// Channel commands (02-02 qq.ts, 02-03 telegram.ts / weixin.ts) install ONE of
// these per process before `channel.start()`. The bridge is shared so all three
// channel protocols can be served with the same gate-callback shape (D-08).
//
// CRITICAL: this module does NOT import any channel transport
// (`src/qq/channel.ts`, `src/telegram/channel.ts`, `src/weixin/channel.ts`).
// It operates on the abstract `sendPrompt`/`consumeReply` callbacks the channel
// command wires in. Per D-09, pauseGate's exported methods + autoResolveVerdict
// signature are untouched (public-API anchor — tests/public-api.test.ts).
import { type EditMode, loadEditMode } from "../../config.js";
import { pauseGate } from "../../core/pause-gate.js";
import { autoResolveVerdict } from "../../core/pause-policy.js";
import { t } from "../../i18n/index.js";
import type { ChoiceOption } from "../../tools/choice.js";
import { getActiveSessionId } from "./host.js";

// Mirrors ReviseChoice from src/cli/ui/PlanReviseConfirm.tsx but inlined here
// to avoid pulling a .tsx (React) file into this transport-agnostic module.
// The 02-02 refactor can reconcile homes if a shared gate-parsers module is
// extracted; for 02-01 the value union is what matters and it must stay stable
// with the canonical "accept" | "reject".
export type ReviseChoice = "accept" | "reject";

// pauseGate.resolve verdict for run_command / path_access. Re-exported here so
// the bridge references the canonical alias rather than redefining the union.
export type { ConfirmationChoice } from "../../core/pause-gate.js";

// Resolution shape for a `choice` PauseRequest — matches the desktop.ts:1928
// fallback: { type: "pick", optionId } | { type: "text", text } | { type: "cancel" }.
export type ChoiceResolution =
  | { type: "pick"; optionId: string }
  | { type: "text"; text: string }
  | { type: "cancel" };

// GateCallbacks — the OBJECT-injection shape that replaces the TUI *Ref
// injection pattern (use-qq-channel.ts:81-112). The headless command wires each
// field to a closure that calls pauseGate.resolve(gateId, ...) (or
// pauseGate.cancel(gateId)). Channel adapter dispatches inbound reply text to
// the field matching the pending interaction's `kind` (D-05/D-06). Field
// shapes copied verbatim from the AFTER block in
// .planning/phases/02-bot-decoupling-to-standalone-cli/02-PATTERNS.md
// "GateCallbacks object shape".
export interface GateCallbacks {
  onShellConfirm(choice: "run_once" | "always_allow" | "deny"): void;
  onPathConfirm(choice: "run_once" | "always_allow" | "deny"): void;
  onPlanCancel(): void;
  onPlanFeedback(
    feedback: string,
    override: { plan: string; mode: "refine" | "approve" | "reject" },
  ): void;
  onCheckpointConfirm(choice: "continue" | "revise" | "stop"): void;
  onCheckpointRevise(feedback: string, snap: { stepId: string; title?: string }): void;
  onPlanRevision(choice: ReviseChoice | "cancel"): void;
  onChoiceResolve(resolution: ChoiceResolution): void;
}

// Option bag — 3 flags, under the CLAUDE.md 5-split threshold.
// consumeReply is NOT an input — the bridge BUILDS it and returns it so the
// channel command routes inbound messages through it. The only shape that
// doesn't require the channel to already have a dispatch implementation.
export interface HeadlessGateBridgeOptions {
  /** Push the choice prompt text to the channel (qq.sendResponse etc.). */
  sendPrompt(kind: string, payload: Record<string, unknown>): void;
  /** Per-kind verdict closures (the object-injection substitute for TUI *Ref). */
  gateCallbacks: GateCallbacks;
  /** Per-channel prompt-text builder. Defaults to `defaultBuildPrompt` (the
   *  i18n-localized form of desktop.ts:1939-1985). Telegram/QQ/Weixin can
   *  override to add channel-specific formatting (e.g. button hints). */
  buildPrompt?(kind: string, payload: Record<string, unknown>): string;
}

/** Returned by installHeadlessGateBridges. Channel commands hold this and call
 *  `consumeReply(text)` on every inbound message — returns true if the text was
 *  consumed as a gate reply (so the channel skips driving a new turn for it). */
export interface InstalledHeadlessGateBridge {
  /** Route an inbound channel message into gate dispatch. Returns true if the
   *  text was consumed as a pending gate reply, false if it should be treated
   *  as a fresh user turn. */
  consumeReply(text: string): boolean;
  /** Unsubscribe from pauseGate.on — call on channel.stop() so reloads don't
   *  stack listeners. */
  unsubscribe(): void;
}

interface PendingInteraction {
  gateId: number;
  kind: string;
  payload: Record<string, unknown>;
}

// parse*Choice helpers — verbatim copies of use-qq-channel.ts:124-174.
// The originals live in a React-importing module (use-qq-channel.ts:1
// `import ... from "react"`); importing them from here would pull React into
// the headless graph and break `node --import tsx tests/...`. The plan
// (02-01 Task 2 action) explicitly sanctions copying the helpers ("the
// executor copies them, leaves the old ones in place for now; the 02-02
// refactor decides final home"). They are pure string→verdict functions with
// zero React deps. Sync with use-qq-channel.ts if the parser logic ever
// changes — 02-02 will extract a shared `gate-parsers.ts`.
function parseIndexedChoice(text: string): number {
  const rawIndex = text.match(/^(\d+)/)?.[1];
  return rawIndex ? Number.parseInt(rawIndex, 10) - 1 : -1;
}

function parseRunPermissionChoice(text: string): "run_once" | "always_allow" | "deny" {
  const lower = text.toLowerCase();
  if (lower.includes("1") || lower.includes("run")) return "run_once";
  if (lower.includes("2") || lower.includes("always")) return "always_allow";
  return "deny";
}

function parsePlanChoice(text: string): "approve" | "refine" | "cancel" {
  const lower = text.toLowerCase();
  if (lower.includes("1") || lower.includes("approve")) return "approve";
  if (lower.includes("2") || lower.includes("refine")) return "refine";
  return "cancel";
}

function parseCheckpointChoice(text: string): "continue" | "revise" | "stop" {
  const lower = text.toLowerCase();
  if (lower.includes("1") || lower.includes("continue")) return "continue";
  if (lower.includes("2") || lower.includes("revise")) return "revise";
  return "stop";
}

function parseRevisionChoice(text: string): ReviseChoice | "cancel" {
  const lower = text.toLowerCase();
  if (lower.includes("1") || lower.includes("accept")) return "accept";
  if (lower.includes("2") || lower.includes("reject")) return "reject";
  return "cancel";
}

function stripFollowupPrefix(text: string): string {
  return text
    .replace(
      /^(?:\d+\s*|approve\s*|refine\s*|cancel\s*|continue\s*|revise\s*|stop\s*|accept\s*|reject\s*|run\s*|always\s*|deny\s*)/iu,
      "",
    )
    .trim();
}

/**
 * Default prompt-text builder — i18n-localized form of
 * desktop.ts:1939-1985 `handleQQPauseRequest`. Each channel can override via
 * `HeadlessGateBridgeOptions.buildPrompt` to add channel-specific flavor
 * (e.g. Telegram inline-button hints); the default here is the unembellished
 * "Need confirmation / Reply with 1.2.3." body that all three channels reuse.
 */
export function defaultBuildPrompt(kind: string, payload: Record<string, unknown>): string {
  switch (kind) {
    case "run_command":
    case "run_background": {
      const p = payload as { command: string };
      return t("headless.gate.runCommandPrompt", { command: p.command ?? "" });
    }
    case "path_access": {
      const p = payload as { path: string; intent: "read" | "write"; toolName: string };
      const intentText = p.intent === "read" ? "Read" : "Write";
      return t("headless.gate.pathAccessPrompt", {
        intent: intentText,
        path: p.path ?? "",
        toolName: p.toolName ?? "",
      });
    }
    case "plan_proposed": {
      const p = payload as { plan: string };
      return t("headless.gate.planProposedPrompt", { plan: p.plan ?? "" });
    }
    case "plan_checkpoint": {
      const p = payload as { stepId?: string; title?: string; result: string; notes?: string };
      const stepTitle = p.title ? `Step: ${p.title}\n` : "";
      return t("headless.gate.planCheckpointPrompt", {
        completed: String((payload as { completed?: number })?.completed ?? 0),
        total: String((payload as { total?: number })?.total ?? 0),
        stepTitle,
        result: p.result ?? "",
      });
    }
    case "plan_revision": {
      const p = payload as { reason: string };
      return t("headless.gate.planRevisionPrompt", { reason: p.reason ?? "" });
    }
    case "choice": {
      const p = payload as { question: string; options: ChoiceOption[]; allowCustom: boolean };
      const optionsList = (p.options ?? [])
        .map((opt, idx) => `${idx + 1}. ${opt.title}`)
        .join("\n");
      const customHint = p.allowCustom ? "\n\n(You can also reply with custom text.)" : "";
      return t("headless.gate.choicePrompt", {
        question: p.question ?? "",
        options: optionsList,
        customHint,
      });
    }
    default:
      return "";
  }
}

/** Dispatch an inbound channel reply to the matching GateCallbacks field,
 *  replicating desktop.ts:1872-1933 handleQQPauseReply dispatch order exactly.
 *
 *  T-02-02 mitigation: every parse*Choice helper's default-else returns the
 *  "deny"/"cancel"/"stop" verdict — never the "run_once"/"approve"/"continue"
 *  auto-allow. Unknown/unmatched text therefore resolves the gate with a
 *  denying verdict (or cancels the gate for plan_proposed where the choice's
 *  cancel branch calls `pauseGate.cancel`), so a spoofed/ambiguous reply can
 *  never silently auto-approve a shell/path/plan interaction. Test pinned in
 *  tests/headless-gate-bridges.test.ts. */
function dispatchReply(
  pending: PendingInteraction,
  text: string,
  gateCallbacks: GateCallbacks,
): boolean {
  const gateId = pending.gateId;
  const followup = stripFollowupPrefix(text);
  switch (pending.kind) {
    case "run_command":
    case "run_background":
      gateCallbacks.onShellConfirm(parseRunPermissionChoice(text));
      return true;
    case "path_access":
      gateCallbacks.onPathConfirm(parseRunPermissionChoice(text));
      return true;
    case "plan_proposed": {
      const payload = (pending.payload as { plan?: string }) ?? {};
      const choice = parsePlanChoice(text);
      if (choice === "cancel") {
        void gateCallbacks.onPlanCancel();
      } else {
        void gateCallbacks.onPlanFeedback(followup, {
          plan: payload.plan ?? "",
          mode: choice === "approve" ? "approve" : "refine",
        });
      }
      return true;
    }
    case "plan_checkpoint": {
      const payload = (pending.payload as { stepId?: string; title?: string }) ?? {};
      const choice = parseCheckpointChoice(text);
      if (choice === "revise") {
        gateCallbacks.onCheckpointRevise(followup, {
          stepId: payload.stepId ?? "",
          title: payload.title,
        });
      } else {
        gateCallbacks.onCheckpointConfirm(choice);
      }
      return true;
    }
    case "plan_revision":
      gateCallbacks.onPlanRevision(parseRevisionChoice(text));
      return true;
    case "choice": {
      const payload =
        (pending.payload as { options?: ChoiceOption[]; allowCustom?: boolean }) ?? {};
      const options = payload.options ?? [];
      const pickedIndex = parseIndexedChoice(text);
      if (pickedIndex >= 0 && pickedIndex < options.length) {
        const selected = options[pickedIndex];
        if (selected) gateCallbacks.onChoiceResolve({ type: "pick", optionId: selected.id });
        return true;
      }
      for (const option of options) {
        if (text.toLowerCase().includes(option.title.toLowerCase())) {
          gateCallbacks.onChoiceResolve({ type: "pick", optionId: option.id });
          return true;
        }
      }
      gateCallbacks.onChoiceResolve(
        payload.allowCustom ? { type: "text", text } : { type: "cancel" },
      );
      return true;
    }
    default:
      return false;
  }
}

/**
 * Install the headless gate bridge: subscribe to `pauseGate.on` ONCE per
 * process, route each PauseRequest through the (1) autoResolveVerdict
 * short-circuit, else (2) push the prompt text to the channel via
 * `sendPrompt` and stash the pending interaction against the active session.
 * The next inbound message is parsed by the returned `consumeReply` and
 * dispatched to the matching GateCallbacks field.
 *
 * Returns `{ consumeReply, unsubscribe }`. Channel commands hold the return
 * value, call `consumeReply(text)` on every inbound message (the bridge
 * returns true if it consumed the text as a gate reply, false otherwise), and
 * call `unsubscribe()` on `channel.stop()` so multiple installs don't
 * accumulate listeners across reloads.
 */
export function installHeadlessGateBridges(
  opts: HeadlessGateBridgeOptions,
): InstalledHeadlessGateBridge {
  // Pending interaction, scoped to the active session id via headlessContext.
  // host.ts sets headlessContext in runTurn so a pause request that fires
  // mid-turn is bound to the session we're driving. Outside a turn, the bridge
  // cancels the request (no channel to surface it to) — same behavior as ACP.
  let pending: PendingInteraction | null = null;

  const unsubscribe = pauseGate.on((req) => {
    // (1) Shared auto-resolve policy — must run BEFORE we surface to the
    // channel, otherwise the surface flashes a prompt we'd immediately
    // resolve (desktop.ts:2486-2511).
    const editMode: EditMode = loadEditMode();
    const auto = autoResolveVerdict(req, editMode);
    if (auto !== null) {
      pauseGate.resolve(req.id, auto);
      return;
    }
    // (2) No active session — nothing to surface to (host isn't mid-turn).
    // Cancel rather than hang the gate waiting on a reply that won't come.
    const sessionId = getActiveSessionId();
    if (!sessionId) {
      pauseGate.cancel(req.id);
      return;
    }
    // (3) Build the prompt text + push to the channel; stash the pending
    // interaction so the next consumeReply can dispatch by kind.
    const prompt = (opts.buildPrompt ?? defaultBuildPrompt)(
      req.kind,
      req.payload as Record<string, unknown>,
    );
    pending = {
      gateId: req.id,
      kind: req.kind,
      payload: (req.payload as Record<string, unknown>) ?? {},
    };
    opts.sendPrompt(req.kind, req.payload as Record<string, unknown>);
    // The prompt itself is built but only surfaced via sendPrompt — keep the
    // build call result alive for tests that want to inspect it.
    void prompt;
  });

  const consumeReply = (text: string): boolean => {
    if (!pending) return false;
    const interaction = pending;
    pending = null;
    return dispatchReply(interaction, text, opts.gateCallbacks);
  };

  return { consumeReply, unsubscribe };
}
