// `reasonix telegram` command assembly + dispatch vertical slice (Task 1 — BOT-02).
//
// Stubs HeadlessHost + TelegramChannel + installHeadlessGateBridges and proves
// telegramCommand wires them correctly: inbound onSubmitMessage -> host.runTurn
// -> channel.sendResponse. Pins the BOT-02 contract (Telegram runs detached
// from Tauri JSON-RPC, mounted on the headless host from 02-01, same
// gate-callback shape as QQ from 02-02).
//
// Divergence from qq-command.test.ts: TelegramChannel's ctor accepts ONLY
// {onSubmitMessage, onError?} — no onInfo callback (Telegram uses botToken
// long-polling with no QR login). The stub mirrors that surface.
//
// Lives under vitest (npm run test). The plan's `<verify>` gate runs it
// via `npx vitest run tests/telegram-command.test.ts` — the stubs mock Node
// entry points that cannot run under bare `node --import tsx`.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stub HeadlessHost before importing telegramCommand. The factory records its
// args and returns a fake host whose runTurn echoes the inbound text so
// the test can trace the dispatch end-to-end.
const hostCreateMock = vi.fn(async (_opts: unknown) => ({
  runTurn: vi.fn(async (text: string) => `echo: ${text}`),
  shutdown: vi.fn(),
  getActiveSessionId: vi.fn(() => "sess-test"),
}));
const hostResolveDirMock = vi.fn((raw: string | undefined, fallback: string) =>
  raw ? raw : fallback,
);

vi.mock("../src/cli/headless/host.js", () => ({
  HeadlessHost: {
    create: hostCreateMock,
  },
  resolveDir: hostResolveDirMock,
  bootHeadlessHost: vi.fn((opts: { workspace?: string }) =>
    hostCreateMock({ rootDir: hostResolveDirMock(opts.workspace, process.cwd()) }),
  ),
}));

// Stub installHeadlessGateBridges — returns a consumeReply that always
// returns false (no pending gate) so onSubmitMessage routes straight to
// host.runTurn. The bridge's pauseGate subscription is exercised in
// tests/headless-gate-bridges.test.ts; here we isolate the command layer.
const bridgeConsumeReplyMock = vi.fn(() => false);
const bridgeUnsubscribeMock = vi.fn();
vi.mock("../src/cli/headless/gate-bridges.js", () => ({
  installHeadlessGateBridges: vi.fn(() => ({
    consumeReply: bridgeConsumeReplyMock,
    unsubscribe: bridgeUnsubscribeMock,
  })),
  defaultBuildPrompt: vi.fn((_kind: string, _payload: unknown) => ""),
}));

// Capture onSubmitMessage so the test can drive an inbound message.
// TelegramChannel ctor accepts ONLY {onSubmitMessage, onError} — no onInfo.
let capturedOnSubmit: ((text: string) => void) | null = null;
let capturedCallbacks: { onSubmitMessage: unknown; onError?: unknown } | null = null;
const channelStartMock = vi.fn(async () => undefined);
const channelStopMock = vi.fn(async () => undefined);
const channelSendResponseMock = vi.fn(async (_text: string) => undefined);

vi.mock("../src/telegram/channel.js", () => ({
  TelegramChannel: class {
    constructor(callbacks: {
      onSubmitMessage: (text: string) => void;
      onError?: (msg: string) => void;
    }) {
      capturedOnSubmit = callbacks.onSubmitMessage;
      capturedCallbacks = callbacks;
    }
    start = channelStartMock;
    stop = channelStopMock;
    sendResponse = channelSendResponseMock;
    refreshAccessConfig = vi.fn(() => undefined);
    describeAccess = vi.fn(() => "owner-only");
  },
}));

// Stub config/env side effects so telegramCommand doesn't touch real disk config.
vi.mock("../src/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/config.js")>();
  return {
    ...actual,
    loadEditMode: vi.fn(() => "review" as const),
    bridgeEndpointEnv: vi.fn(() => undefined),
    DEFAULT_MODEL: "deepseek-v4-flash",
  };
});

vi.mock("../src/env.js", () => ({
  loadDotenv: vi.fn(() => undefined),
}));

const { telegramCommand } = await import("../src/cli/commands/telegram.js");

describe("reasonix telegram — BOT-02 host+channel assembly", () => {
  let tmpWorkspace: string;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpWorkspace = mkdtempSync(join(tmpdir(), "reasonix-tg-cmd-"));
    hostCreateMock.mockClear();
    hostResolveDirMock.mockClear();
    channelStartMock.mockClear();
    channelStopMock.mockClear();
    channelSendResponseMock.mockClear();
    bridgeConsumeReplyMock.mockClear();
    bridgeUnsubscribeMock.mockClear();
    bridgeConsumeReplyMock.mockReturnValue(false);
    capturedOnSubmit = null;
    capturedCallbacks = null;
    // telegramCommand's cleanup calls process.exit(0) — intercept so the test
    // worker survives to assert. The spy records the call without exiting.
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      // no-op: don't actually terminate the vitest worker
    }) as () => never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("assembles HeadlessHost + TelegramChannel and starts the channel", async () => {
    const promise = telegramCommand({ workspace: tmpWorkspace });
    // Yield so the async assembly (host.create + channel.start) resolves.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(hostCreateMock).toHaveBeenCalledTimes(1);
    expect(hostCreateMock).toHaveBeenCalledWith(expect.objectContaining({ rootDir: tmpWorkspace }));
    expect(channelStartMock).toHaveBeenCalled();

    // Trigger cleanup so the process-event-loop handlers don't leak.
    process.emit("SIGINT", "SIGINT");
    await promise.catch(() => undefined);
  });

  it("constructs TelegramChannel with {onSubmitMessage, onError} only (no onInfo)", async () => {
    const promise = telegramCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // TelegramChannel ctor divergence (PATTERNS.md): no onInfo callback.
    expect(capturedCallbacks).not.toBeNull();
    expect(Object.keys(capturedCallbacks as object).sort()).toEqual(["onError", "onSubmitMessage"]);

    process.emit("SIGINT", "SIGINT");
    await promise.catch(() => undefined);
  });

  it("routes inbound onSubmitMessage to host.runTurn and channel.sendResponse", async () => {
    const promise = telegramCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(capturedOnSubmit).not.toBeNull();
    capturedOnSubmit?.("hi");
    // host.runTurn is async (.then chain) — let the microtask queue drain.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const fakeHost = await hostCreateMock.mock.results[0]?.value;
    expect(fakeHost?.runTurn).toHaveBeenCalledWith(
      "hi",
      expect.objectContaining({ onEvent: expect.any(Function) }),
    );
    expect(channelSendResponseMock).toHaveBeenCalledWith("echo: hi");

    process.emit("SIGINT", "SIGINT");
    await promise.catch(() => undefined);
  });

  it("routes a gate reply through bridge.consumeReply instead of host.runTurn", async () => {
    // consumeReply returns true → the message was a pending gate reply,
    // so host.runTurn must NOT be called.
    bridgeConsumeReplyMock.mockReturnValue(true);
    const promise = telegramCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    capturedOnSubmit?.("1");
    await Promise.resolve();

    const fakeHost = await hostCreateMock.mock.results[0]?.value;
    expect(fakeHost?.runTurn).not.toHaveBeenCalled();
    expect(bridgeConsumeReplyMock).toHaveBeenCalledWith("1");

    process.emit("SIGINT", "SIGINT");
    await promise.catch(() => undefined);
  });

  it("calls channel.stop + host.shutdown + bridge.unsubscribe on SIGINT", async () => {
    const promise = telegramCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    process.emit("SIGINT", "SIGINT");
    // Let the async cleanup (channel.stop awaits) settle before asserting.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(bridgeUnsubscribeMock).toHaveBeenCalled();
    expect(channelStopMock).toHaveBeenCalled();
    const fakeHost = await hostCreateMock.mock.results[0]?.value;
    expect(fakeHost?.shutdown).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("makes interrupt cleanup idempotent and best-effort when transport stop fails", async () => {
    channelStopMock.mockRejectedValueOnce(new Error("offline stop failure"));
    const promise = telegramCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    process.emit("SIGTERM", "SIGTERM");
    process.emit("SIGINT", "SIGINT");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(bridgeUnsubscribeMock).toHaveBeenCalledTimes(1);
    expect(channelStopMock).toHaveBeenCalledTimes(1);
    const fakeHost = await hostCreateMock.mock.results[0]?.value;
    expect(fakeHost?.shutdown).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
    await promise.catch(() => undefined);
  });
});
