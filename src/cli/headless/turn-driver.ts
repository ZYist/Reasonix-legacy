// Headless turn-driver — iterates `loop.step(text)` once and surfaces the
// assistant's final text to the caller. This is the loop-iteration half of
// the headless host: it is transport-agnostic (no channel, no UI), runs the
// kernel's `eventizer.consume(...)` so telemetry / cache diagnostics stay
// populated, and wraps the loop body in `headlessContext.run(sessionId, ...)`
// so the gate-bridges module can recover the active session id when a
// PauseRequest fires mid-turn (`pauseGate.on` has no request-scoped binding).
import { AsyncLocalStorage } from "node:async_hooks";
import type { ReasoningEffort } from "../../config.js";
import type { Eventizer } from "../../core/eventize.js";
import type { CacheFirstLoop } from "../../loop.js";
import { errorMeta } from "../../loop/errors.js";
import type { LoopEvent } from "../../loop/types.js";

/** Per-turn session id binding — gate-bridges subscribe to `pauseGate.on` and
 *  read this context to know which session a pause request belongs to
 *  (mirror of acp.ts:214 `sessionContext`). */
export const headlessContext = new AsyncLocalStorage<string>();

/** Active session id for the currently-running turn, if any. Gate-bridges call
 *  this inside the `pauseGate.on` handler to scope a pending interaction
 *  against the right inbound reply queue. Undefined outside a turn. */
export function getActiveSessionId(): string | undefined {
  return headlessContext.getStore();
}

/** Loop + eventizer context the turn-driver threads into `eventizer.consume`.
 *  Matches `EventizeContext` from core/eventize.ts — reasoningEffort is always
 *  loaded from config (never undefined in production via `loadReasoningEffort()`). */
export interface HeadlessHostContext {
  model: string;
  prefixHash: string;
  reasoningEffort: ReasoningEffort;
}

export type TurnOutcome = "end_turn" | "aborted" | "error";

export interface RunHeadlessTurnOptions {
  loop: CacheFirstLoop;
  ctx: HeadlessHostContext;
  eventizer: Eventizer;
  signal: AbortSignal;
  text: string;
  // Optional session id — when provided the loop body runs inside
  // headlessContext.run(sessionId, ...) so gate-bridges can scope the pending
  // interaction. Omit when the host has no session concept yet (e.g. unit tests).
  sessionId?: string;
  /** Captured once when an `assistant_final` event arrives. Mirrors
   *  desktop.ts:2260-2262 `lastAssistantText = ev.content`. */
  onAssistantText?: (content: string) => void;
  /** Called for every kernel event projected from a raw LoopEvent. The bridge
   *  uses this to forward cache diagnostics / tool telemetry to the channel,
   *  if it cares; the host itself just needs telemetry to keep flowing. */
  onEvent?: (kev: { type: string }) => void;
  /** Classification error path — surfaces the thrown cause + errorMeta to the
   *  caller (the channel / command layer writes it back via sendResponse).
   *  Log+crash > silent wrong output per CLAUDE.md; we do NOT console.log+swallow. */
  onError?: (err: Error, meta: { code?: string; phase?: string }) => void;
}

// Drive one turn of loop.step(text) to completion. Returns a sentinel:
//   "end_turn" — generator exhausted without abort or throw;
//   "aborted"  — signal.aborted was true at some point during the turn;
//   "error"    — the loop threw; onError was invoked with the cause.
// The assistant_final LoopEvent's content is delivered to onAssistantText
// once when present — matches desktop.ts lastAssistantText back to the channel.
export async function runHeadlessTurn(opts: RunHeadlessTurnOptions): Promise<TurnOutcome> {
  const { loop, ctx, eventizer, signal, text, sessionId } = opts;
  let outcome: TurnOutcome = "end_turn";
  const body = async (): Promise<TurnOutcome> => {
    try {
      for await (const ev of loop.step(text)) {
        if (signal.aborted) {
          outcome = "aborted";
          break;
        }
        if (ev.role === "assistant_final" && ev.content) {
          opts.onAssistantText?.(ev.content);
        }
        for (const kev of eventizer.consume(ev, ctx)) {
          opts.onEvent?.(kev);
          if ((kev as { type?: string }).type === "error") outcome = "error";
        }
        if (signal.aborted) {
          outcome = "aborted";
          break;
        }
      }
    } catch (err) {
      const cause = err instanceof Error ? err : new Error(String(err));
      const meta = errorMeta(cause);
      opts.onError?.(cause, meta);
      outcome = "error";
    }
    return outcome;
  };
  if (sessionId !== undefined) {
    return headlessContext.run(sessionId, body);
  }
  return body();
}
