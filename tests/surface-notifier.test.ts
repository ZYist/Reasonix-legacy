// SurfaceNotifier unit test — live immediate-emit vs fold accumulate-and-summarize.
// setup-lang.ts pins EN so t() resolves the notice strings deterministically.
import { describe, expect, it } from "vitest";
import { SurfaceNotifier } from "../src/cli/headless/surface-notifier.js";
import type { Event } from "../src/core/events.js";

// Minimal Event-shaped stubs — the notifier only reads `type` (+ `name` for tool.intent).
function kev(type: Event["type"], name?: string): Event {
  return { type, name } as unknown as Event;
}

describe("surface-notifier", () => {
  it("live: emits the thinking notice exactly once across model events", () => {
    const emits: string[] = [];
    const n = new SurfaceNotifier({ mode: "live", emit: (m) => emits.push(m) });
    n.note(kev("model.turn.started"));
    n.note(kev("model.delta"));
    n.note(kev("model.delta"));
    expect(emits).toEqual(["💭 thinking…"]);
  });

  it("live: emits one immediate notice per tool.intent, in order", () => {
    const emits: string[] = [];
    const n = new SurfaceNotifier({ mode: "live", emit: (m) => emits.push(m) });
    n.note(kev("model.turn.started"));
    n.note(kev("tool.intent", "read_file"));
    n.note(kev("tool.intent", "grep"));
    // Three separate emit calls, each fired at its event — no batching, no coalescing.
    expect(emits).toEqual(["💭 thinking…", "🔧 read_file", "🔧 grep"]);
  });

  it("fold: accumulates without emitting; summary is thinking-first", () => {
    const emits: string[] = [];
    const n = new SurfaceNotifier({ mode: "fold", emit: (m) => emits.push(m) });
    n.note(kev("model.turn.started"));
    n.note(kev("tool.intent", "read_file"));
    n.note(kev("tool.intent", "grep"));
    expect(emits).toEqual([]);
    expect(n.summary()).toBe("💭 thinking…\n🔧 read_file\n🔧 grep");
  });

  it("fold: summary is empty when no model/tool events occurred", () => {
    const n = new SurfaceNotifier({ mode: "fold", emit: () => undefined });
    expect(n.summary()).toBe("");
  });

  it("ignores non-model / non-tool.intent events (no emit, empty fold summary)", () => {
    const emits: string[] = [];
    const live = new SurfaceNotifier({ mode: "live", emit: (m) => emits.push(m) });
    const fold = new SurfaceNotifier({ mode: "fold", emit: () => undefined });
    const ignored = [
      "tool.preparing",
      "tool.dispatched",
      "tool.result",
      "model.final",
      "error",
      "status",
    ] as const;
    for (const evType of ignored) {
      live.note(kev(evType));
      fold.note(kev(evType));
    }
    expect(emits).toEqual([]);
    expect(fold.summary()).toBe("");
  });

  it("fold reply-composition: answer always present; no stray separator when summary empty", () => {
    const n = new SurfaceNotifier({ mode: "fold", emit: () => undefined });
    n.note(kev("model.turn.started"));
    n.note(kev("tool.intent", "read_file"));
    const summary = n.summary();
    const answer = "the answer";
    const reply = summary && answer ? `${summary}\n\n${answer}` : answer;
    expect(reply).toContain("the answer");
    expect(reply.startsWith(summary)).toBe(true);

    const empty = new SurfaceNotifier({ mode: "fold", emit: () => undefined });
    const emptySummary = empty.summary();
    const emptyReply = emptySummary && answer ? `${emptySummary}\n\n${answer}` : answer;
    expect(emptyReply).toBe("the answer");
  });
});
