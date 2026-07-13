import { render } from "ink";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PromptInput } from "../src/cli/ui/PromptInput.js";
import {
  type KeystrokeHandler,
  KeystrokeProvider,
  type KeystrokeReader,
  makeKeyEvent,
} from "../src/cli/ui/keystroke-context.js";
import type { KeyEvent } from "../src/cli/ui/stdin-reader.js";
import { makeFakeStdin, makeFakeStdout } from "./helpers/ink-stdio.js";

class FakeReader implements KeystrokeReader {
  private readonly handlers = new Set<KeystrokeHandler>();

  start(): void {
    // No real stdin: tests feed normalized key events directly.
  }

  subscribe(handler: KeystrokeHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  feed(event: Partial<KeyEvent>): void {
    const normalized = makeKeyEvent(event);
    for (const handler of [...this.handlers]) handler(normalized);
  }
}

interface HarnessProps {
  disabled?: boolean;
  steerBusy?: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

function ComposerHarness({ disabled, steerBusy, onChange, onSubmit }: HarnessProps) {
  const [value, setValue] = React.useState("");
  return (
    <PromptInput
      value={value}
      disabled={disabled}
      steerBusy={steerBusy}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      onSubmit={onSubmit}
    />
  );
}

function renderComposer(props: HarnessProps) {
  const reader = new FakeReader();
  const stdout = makeFakeStdout();
  const instance = render(
    <KeystrokeProvider reader={reader}>
      <ComposerHarness {...props} />
    </KeystrokeProvider>,
    {
      stdout: stdout as never,
      stdin: makeFakeStdin() as never,
      incrementalRendering: true,
    },
  );
  return { reader, stdout, ...instance };
}

async function settle(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe("TUI composer characterization", () => {
  it("accepts ordinary input and submits the current draft on Enter", async () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const { reader, stdout, unmount } = renderComposer({ onChange, onSubmit });
    await settle();

    for (const char of "hello") reader.feed({ input: char });
    await settle();

    expect(onChange).toHaveBeenLastCalledWith("hello");
    expect(stdout.text()).toContain("hello");

    reader.feed({ return: true });
    await settle();

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith("hello");
    unmount();
  });

  it("cancels the current draft with Ctrl+U without submitting it", async () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const { reader, unmount } = renderComposer({ onChange, onSubmit });
    await settle();

    for (const char of "discard me") reader.feed({ input: char });
    reader.feed({ input: "u", ctrl: true });
    await settle();

    expect(onChange).toHaveBeenLastCalledWith("");
    expect(onSubmit).not.toHaveBeenCalled();
    unmount();
  });

  it("freezes normal input while busy but allows explicit mid-turn steering", async () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const frozen = renderComposer({ disabled: true, onChange, onSubmit });
    await settle();

    frozen.reader.feed({ input: "x" });
    frozen.reader.feed({ return: true });
    await settle();

    expect(frozen.stdout.text()).toContain("waiting for response");
    expect(onChange).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    frozen.unmount();

    const steering = renderComposer({ disabled: true, steerBusy: true, onChange, onSubmit });
    await settle();
    expect(steering.stdout.text()).toContain("steer the current task");

    for (const char of "stop") steering.reader.feed({ input: char });
    steering.reader.feed({ return: true });
    await settle();

    expect(onChange).toHaveBeenLastCalledWith("stop");
    expect(onSubmit).toHaveBeenCalledWith("stop");
    steering.unmount();
  });
});
