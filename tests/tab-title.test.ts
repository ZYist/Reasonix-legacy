import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setTabTitle, stopTabTitleKeeper } from "../src/cli/tab-title.js";

describe("setTabTitle", () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let originalIsTTY: unknown;

  beforeEach(() => {
    vi.useFakeTimers();
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    originalIsTTY = Object.getOwnPropertyDescriptor(process.stdout, "isTTY")?.value;
  });

  afterEach(() => {
    stopTabTitleKeeper();
    vi.useRealTimers();
    writeSpy.mockRestore();
    Object.defineProperty(process.stdout, "isTTY", {
      value: originalIsTTY,
      configurable: true,
      writable: true,
    });
  });

  function setTTY(value: boolean | undefined): void {
    Object.defineProperty(process.stdout, "isTTY", { value, configurable: true });
  }

  it("writes OSC 0 with the fixed product name on a TTY", () => {
    setTTY(true);
    setTabTitle();
    expect(writeSpy).toHaveBeenCalledWith("\x1b]0;reasonix-legacy\x1b\\");
  });

  it("re-emits on an interval to survive ConPTY child-process title overwrites", () => {
    setTTY(true);
    setTabTitle();
    writeSpy.mockClear();
    vi.advanceTimersByTime(2000);
    expect(writeSpy).toHaveBeenCalledWith("\x1b]0;reasonix-legacy\x1b\\");
    vi.advanceTimersByTime(2000);
    expect(writeSpy).toHaveBeenCalledTimes(2);
  });

  it("does not stack intervals on repeated calls", () => {
    setTTY(true);
    setTabTitle();
    setTabTitle();
    writeSpy.mockClear();
    vi.advanceTimersByTime(2000);
    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when stdout is not a TTY (pipes)", () => {
    setTTY(false);
    setTabTitle();
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("is a no-op when isTTY is undefined (acp protocol channel)", () => {
    setTTY(undefined);
    setTabTitle();
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
