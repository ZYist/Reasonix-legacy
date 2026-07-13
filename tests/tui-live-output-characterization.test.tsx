import React from "react";
import { describe, expect, it } from "vitest";
import { CardRenderer } from "../src/cli/ui/cards/CardRenderer.js";
import type { Card } from "../src/cli/ui/state/cards.js";
import type { SessionInfo } from "../src/cli/ui/state/state.js";
import { createStore } from "../src/cli/ui/state/store.js";
import { setLanguageRuntime } from "../src/i18n/index.js";
import { render } from "./helpers/ink-test.js";

const SESSION: SessionInfo = {
  id: "offline-tui",
  branch: "dev",
  workspace: "/offline/workspace",
  model: "mock-model",
};

function cardById(cards: ReadonlyArray<Card>, id: string): Card {
  const card = cards.find((candidate) => candidate.id === id);
  if (!card) throw new Error(`missing card ${id}`);
  return card;
}

function renderCard(card: Card): string {
  const instance = render(<CardRenderer card={card} />);
  const frame = instance.lastFrame();
  instance.unmount();
  return frame;
}

describe("TUI live output characterization", () => {
  it("renders deterministic model chunks live and preserves the full reply when settled", () => {
    setLanguageRuntime("en");
    const store = createStore(SESSION);

    store.dispatch({ type: "streaming.start", id: "reply-1", model: "mock-model" });
    store.dispatch({ type: "streaming.chunk", id: "reply-1", text: "offline partial" });

    const partial = renderCard(cardById(store.getState().cards, "reply-1"));
    expect(partial).toContain("writing");
    expect(partial).toContain("offline partial");
    expect(partial).toContain("mock");

    store.dispatch({ type: "streaming.chunk", id: "reply-1", text: " response" });
    store.dispatch({ type: "streaming.end", id: "reply-1" });

    const settled = renderCard(cardById(store.getState().cards, "reply-1"));
    expect(settled).toContain("reply");
    expect(settled).toContain("offline partial response");
    expect(settled).not.toContain("truncated by esc");
  });

  it("marks interrupted output as aborted and exposes the composer abort transition", () => {
    setLanguageRuntime("en");
    const store = createStore(SESSION);

    store.dispatch({ type: "turn.start", turnId: "turn-1" });
    store.dispatch({ type: "streaming.start", id: "reply-2" });
    store.dispatch({ type: "streaming.chunk", id: "reply-2", text: "useful partial answer" });
    store.dispatch({ type: "streaming.end", id: "reply-2", aborted: true });
    store.dispatch({ type: "turn.abort" });

    const state = store.getState();
    const interrupted = renderCard(cardById(state.cards, "reply-2"));
    expect(interrupted).toContain("aborted");
    expect(interrupted).toContain("useful partial answer");
    expect(interrupted).toContain("truncated by esc");
    expect(state.turnInProgress).toBe(false);
    expect(state.composer.abortedHint).toBe(true);
  });

  it("surfaces offline error feedback with both summary and detail", () => {
    setLanguageRuntime("en");
    const store = createStore(SESSION);

    store.dispatch({
      type: "live.show",
      id: "error-1",
      ts: 1,
      variant: "aborted",
      tone: "err",
      text: "Model request failed",
      meta: "mock timeout",
    });

    const feedback = renderCard(cardById(store.getState().cards, "error-1"));
    expect(feedback).toContain("Model request failed");
    expect(feedback).toContain("mock timeout");
  });
});
