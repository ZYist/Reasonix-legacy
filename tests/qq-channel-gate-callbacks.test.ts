// QQ channel adapter gate-callbacks dispatch test (Task 1 — D-05/D-06).
//
// Validates that `useQQChannel` accepts the OBJECT-injection shape
// (`onShellConfirm`, `onPlanFeedback`, … as plain functions rather than
// `{current: ...}` refs) and that `consumePauseReply` dispatches inbound
// reply text to the matching callback for every gate kind. Pins the
// T-02-06 mitigation: unmatched reply text resolves to deny/cancel —
// never auto-allow.
//
// Lives under both vitest (npm run test) and the plan's `<verify>` gate
// `node --import tsx tests/qq-channel-gate-callbacks.test.ts`. The
// self-execute tail drives the assertions when node runs the file
// directly so the plan's automated gate has a process exit code.
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setLanguageRuntime } from "../src/i18n/index.js";
import { QQChannel } from "../src/qq/channel.js";
import { render } from "./helpers/ink-test.js";

const { useQQChannel } = await import("../src/qq/use-qq-channel.js");

const startMock = vi.fn(async () => undefined);
const stopMock = vi.fn(async () => undefined);
const sendResponseMock = vi.fn(async () => undefined);

vi.mock("../src/qq/channel.js", () => ({
  QQChannel: class {
    start = startMock;
    stop = stopMock;
    sendResponse = sendResponseMock;
    refreshAccessConfig = vi.fn(() => undefined);
    getRuntimeBoundOpenId() {
      return null;
    }
  },
}));

vi.mock("../src/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/config.js")>();
  return {
    ...actual,
    loadQQConfig: vi.fn(() => ({
      appId: "test-app",
      appSecret: "test-secret",
      sandbox: false,
      enabled: true,
      ownerOpenId: "owner-open-id",
      allowlist: [],
    })),
  };
});

type GateSpies = {
  onShellConfirm: ReturnType<typeof vi.fn>;
  onPathConfirm: ReturnType<typeof vi.fn>;
  onPlanCancel: ReturnType<typeof vi.fn>;
  onPlanFeedback: ReturnType<typeof vi.fn>;
  onCheckpointConfirm: ReturnType<typeof vi.fn>;
  onCheckpointRevise: ReturnType<typeof vi.fn>;
  onPlanRevision: ReturnType<typeof vi.fn>;
  onChoiceResolve: ReturnType<typeof vi.fn>;
};

function makeGateSpies(): GateSpies {
  return {
    onShellConfirm: vi.fn(),
    onPathConfirm: vi.fn(),
    onPlanCancel: vi.fn(),
    onPlanFeedback: vi.fn(),
    onCheckpointConfirm: vi.fn(),
    onCheckpointRevise: vi.fn(),
    onPlanRevision: vi.fn(),
    onChoiceResolve: vi.fn(),
  };
}

describe("QQ channel — GateCallbacks object injection (D-05/D-06)", () => {
  type QQApi = ReturnType<typeof useQQChannel>;

  function mountHarness(spies: GateSpies): QQApi {
    let api: QQApi | null = null;
    function Harness() {
      // KEY: the new OBJECT-injection shape — plain callbacks, NOT refs.
      // If use-qq-channel.ts still expected `{current: ...}` refs this
      // would fail TypeScript compilation (excess/missing property).
      api = useQQChannel({
        codeMode: true,
        initialChannel: new QQChannel({
          onSubmitMessage: () => undefined,
          onError: () => undefined,
          onInfo: () => undefined,
        }),
        log: { pushInfo: () => undefined, pushWarning: () => undefined },
        setQueuedSubmit: () => undefined,
        currentRootDir: process.cwd(),
        pendingGateIdRef: { current: 1 },
        completedStepIdsRef: { current: new Set<string>() },
        planStepsRef: { current: null },
        onModelPick: () => "",
        onThemePick: () => "",
        onShellConfirm: spies.onShellConfirm,
        onPathConfirm: spies.onPathConfirm,
        onPlanCancel: spies.onPlanCancel,
        onPlanFeedback: spies.onPlanFeedback,
        onCheckpointConfirm: spies.onCheckpointConfirm,
        onCheckpointRevise: spies.onCheckpointRevise,
        onPlanRevision: spies.onPlanRevision,
        onChoiceResolve: spies.onChoiceResolve,
      });
      return null;
    }
    // React.createElement keeps this file a .ts (no JSX) — the plan's
    // `<verify>` gate runs `node --import tsx tests/qq-channel-gate-callbacks.test.ts`.
    const mounted = render(React.createElement(Harness));
    if (!api) throw new Error("QQ harness did not mount");
    return { ...api, ...mounted } as unknown as QQApi;
  }

  beforeEach(() => {
    setLanguageRuntime("en");
    startMock.mockClear();
    stopMock.mockClear();
    sendResponseMock.mockClear();
  });

  afterEach(() => {
    setLanguageRuntime("en");
    vi.clearAllMocks();
  });

  it("dispatches run_command reply '1' to onShellConfirm('run_once')", () => {
    const spies = makeGateSpies();
    const api = mountHarness(spies);
    api.handlePauseRequest("run_command", { command: "ls" });
    const consumed = api.consumePauseReply("1");
    expect(consumed).toBe(true);
    expect(spies.onShellConfirm).toHaveBeenCalledWith("run_once");
  });

  it("dispatches path_access reply '2' to onPathConfirm('always_allow')", () => {
    const spies = makeGateSpies();
    const api = mountHarness(spies);
    api.handlePauseRequest("path_access", {
      path: "/tmp",
      intent: "read",
      toolName: "read_file",
    });
    expect(api.consumePauseReply("2")).toBe(true);
    expect(spies.onPathConfirm).toHaveBeenCalledWith("always_allow");
  });

  it("dispatches plan_proposed reply '1' to onPlanFeedback with mode 'approve'", () => {
    const spies = makeGateSpies();
    const api = mountHarness(spies);
    api.handlePauseRequest("plan_proposed", { plan: "do the thing" });
    expect(api.consumePauseReply("1")).toBe(true);
    expect(spies.onPlanFeedback).toHaveBeenCalledWith("", {
      plan: "do the thing",
      mode: "approve",
    });
  });

  it("dispatches plan_proposed reply '3' to onPlanCancel()", () => {
    const spies = makeGateSpies();
    const api = mountHarness(spies);
    api.handlePauseRequest("plan_proposed", { plan: "do the thing" });
    expect(api.consumePauseReply("3")).toBe(true);
    expect(spies.onPlanCancel).toHaveBeenCalled();
    expect(spies.onPlanFeedback).not.toHaveBeenCalled();
  });

  it("dispatches plan_checkpoint reply '1' to onCheckpointConfirm('continue')", () => {
    const spies = makeGateSpies();
    const api = mountHarness(spies);
    api.handlePauseRequest("plan_checkpoint", {
      stepId: "s1",
      title: "step",
      result: "ok",
    });
    expect(api.consumePauseReply("1")).toBe(true);
    expect(spies.onCheckpointConfirm).toHaveBeenCalledWith("continue");
  });

  it("dispatches plan_checkpoint reply '2' to onCheckpointRevise", () => {
    const spies = makeGateSpies();
    const api = mountHarness(spies);
    api.handlePauseRequest("plan_checkpoint", {
      stepId: "s1",
      title: "step",
      result: "ok",
    });
    expect(api.consumePauseReply("2 more detail")).toBe(true);
    expect(spies.onCheckpointRevise).toHaveBeenCalledWith("more detail", {
      stepId: "s1",
      title: "step",
    });
  });

  it("dispatches plan_revision reply '1' to onPlanRevision('accept')", () => {
    const spies = makeGateSpies();
    const api = mountHarness(spies);
    api.handlePauseRequest("plan_revision", { reason: "why" });
    expect(api.consumePauseReply("1")).toBe(true);
    expect(spies.onPlanRevision).toHaveBeenCalledWith("accept");
  });

  it("dispatches choice reply '1' to onChoiceResolve({type:'pick', optionId})", () => {
    const spies = makeGateSpies();
    const api = mountHarness(spies);
    api.handlePauseRequest("choice", {
      question: "pick",
      options: [
        { id: "a", title: "Alpha" },
        { id: "b", title: "Beta" },
      ],
      allowCustom: false,
    });
    expect(api.consumePauseReply("1")).toBe(true);
    expect(spies.onChoiceResolve).toHaveBeenCalledWith({ type: "pick", optionId: "a" });
  });

  it("T-02-06: unmatched run_command reply defaults to 'deny' (never auto-allow)", () => {
    const spies = makeGateSpies();
    const api = mountHarness(spies);
    api.handlePauseRequest("run_command", { command: "rm -rf /" });
    expect(api.consumePauseReply("garbage-not-a-choice")).toBe(true);
    expect(spies.onShellConfirm).toHaveBeenCalledWith("deny");
  });
});
