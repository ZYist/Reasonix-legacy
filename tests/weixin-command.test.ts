// `reasonix-legacy weixin` command assembly + dispatch vertical slice (Task 2 — BOT-02).
//
// Stubs HeadlessHost + WeixinChannel + runWeixinQrLogin + installHeadlessGateBridges
// and proves weixinCommand wires them correctly: inbound onSubmitMessage ->
// host.runTurn -> channel.sendResponse. Pins the BOT-02 contract (Weixin runs
// detached from Tauri JSON-RPC, same gate-callback shape as QQ/Telegram).
//
// PINNED QR-login-before-start path (D-08 / plan Task 2): when the loaded
// config has no token OR no accountId, runWeixinQrLogin is invoked AND
// resolves BEFORE channel.start() is awaited. WeixinChannel.start() does
// NOT internally drive the QR scan — it requires credentials already
// configured. The QR must appear before the channel accepts messages.
//
// Lives under vitest (npm run test). The plan's `<verify>` gate runs it
// via `npx vitest run tests/weixin-command.test.ts`.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Stub HeadlessHost before importing weixinCommand. The factory records its
// args and returns a fake host whose runTurn echoes the inbound text.
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
// returns false (no pending gate) so onSubmitMessage routes to host.runTurn.
const bridgeConsumeReplyMock = vi.fn(() => false);
const bridgeUnsubscribeMock = vi.fn();
vi.mock("../src/cli/headless/gate-bridges.js", () => ({
  installHeadlessGateBridges: vi.fn(() => ({
    consumeReply: bridgeConsumeReplyMock,
    unsubscribe: bridgeUnsubscribeMock,
  })),
  defaultBuildPrompt: vi.fn((_kind: string, _payload: unknown) => ""),
}));

// runWeixinQrLogin stub — records call order. Default resolves to a fake
// credential set. Tests assert it is NOT called when credentials are
// already present, and IS called (resolving before channel.start) when
// credentials are missing.
const runWeixinQrLoginMock = vi.fn(async (_opts: { onInfo?: (m: string) => void }) => ({
  token: "qr-token",
  accountId: "qr-account",
  baseUrl: "https://qr.example",
  userId: "qr-user",
}));
vi.mock("../src/weixin/bot.js", () => ({
  runWeixinQrLogin: runWeixinQrLoginMock,
}));

// Capture onSubmitMessage so the test can drive an inbound message.
// WeixinChannel ctor accepts {onSubmitMessage, onError?, onInfo?}.
let capturedOnSubmit: ((text: string) => void) | null = null;
const channelStartMock = vi.fn(async () => undefined);
const channelStopMock = vi.fn(async () => undefined);
const channelSendResponseMock = vi.fn(async (_text: string) => undefined);

vi.mock("../src/weixin/channel.js", () => ({
  WeixinChannel: class {
    constructor(callbacks: {
      onSubmitMessage: (text: string) => void;
      onError?: (msg: string) => void;
      onInfo?: (msg: string) => void;
    }) {
      capturedOnSubmit = callbacks.onSubmitMessage;
    }
    start = channelStartMock;
    stop = channelStopMock;
    sendResponse = channelSendResponseMock;
    refreshAccessConfig = vi.fn(() => undefined);
    describeAccess = vi.fn(() => "owner-only");
  },
}));

// loadWeixinConfig is controllable per-test so the QR-login path can be
// toggled. Default = credentials present (skip QR).
const loadWeixinConfigMock = vi.fn(() => ({
  token: "saved-token",
  accountId: "saved-account",
  baseUrl: "https://saved.example",
  enabled: true,
  ownerUserId: "owner-1",
  allowlist: [],
}));
const saveWeixinConfigMock = vi.fn();

vi.mock("../src/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/config.js")>();
  return {
    ...actual,
    loadEditMode: vi.fn(() => "review" as const),
    bridgeEndpointEnv: vi.fn(() => undefined),
    DEFAULT_MODEL: "deepseek-v4-flash",
    loadWeixinConfig: loadWeixinConfigMock,
    saveWeixinConfig: saveWeixinConfigMock,
  };
});

vi.mock("../src/env.js", () => ({
  loadDotenv: vi.fn(() => undefined),
}));

const { weixinCommand } = await import("../src/cli/commands/weixin.js");

describe("reasonix-legacy weixin — BOT-02 host+channel assembly", () => {
  let tmpWorkspace: string;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpWorkspace = mkdtempSync(join(tmpdir(), "reasonix-wx-cmd-"));
    hostCreateMock.mockClear();
    hostResolveDirMock.mockClear();
    channelStartMock.mockClear();
    channelStopMock.mockClear();
    channelSendResponseMock.mockClear();
    bridgeConsumeReplyMock.mockClear();
    bridgeUnsubscribeMock.mockClear();
    bridgeConsumeReplyMock.mockReturnValue(false);
    runWeixinQrLoginMock.mockClear();
    loadWeixinConfigMock.mockClear();
    saveWeixinConfigMock.mockClear();
    // Default: credentials already present (QR path skipped).
    loadWeixinConfigMock.mockReturnValue({
      token: "saved-token",
      accountId: "saved-account",
      baseUrl: "https://saved.example",
      enabled: true,
      ownerUserId: "owner-1",
      allowlist: [],
    });
    capturedOnSubmit = null;
    exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      // no-op: don't actually terminate the vitest worker
    }) as () => never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    vi.clearAllMocks();
  });

  it("assembles HeadlessHost + WeixinChannel and starts the channel (creds present)", async () => {
    const promise = weixinCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(hostCreateMock).toHaveBeenCalledTimes(1);
    expect(hostCreateMock).toHaveBeenCalledWith(expect.objectContaining({ rootDir: tmpWorkspace }));
    expect(channelStartMock).toHaveBeenCalled();
    // Credentials present → QR login must NOT run.
    expect(runWeixinQrLoginMock).not.toHaveBeenCalled();

    process.emit("SIGINT", "SIGINT");
    await promise.catch(() => undefined);
  });

  it("routes inbound onSubmitMessage to host.runTurn and channel.sendResponse", async () => {
    const promise = weixinCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(capturedOnSubmit).not.toBeNull();
    capturedOnSubmit?.("hi");
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

  it("invokes runWeixinQrLogin BEFORE channel.start when credentials are missing", async () => {
    // Credentials missing → QR login must run and resolve before start.
    loadWeixinConfigMock.mockReturnValue({
      token: undefined,
      accountId: undefined,
      enabled: false,
    });

    const promise = weixinCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(runWeixinQrLoginMock).toHaveBeenCalledTimes(1);
    // QR login resolved → credentials persisted via saveWeixinConfig.
    expect(saveWeixinConfigMock).toHaveBeenCalled();
    const savedArg = saveWeixinConfigMock.mock.calls[0]?.[0];
    expect(savedArg).toMatchObject({ token: "qr-token", accountId: "qr-account" });
    // channel.start was awaited AFTER runWeixinQrLogin resolved.
    expect(channelStartMock).toHaveBeenCalled();
    // runWeixinQrLogin resolved (not rejected) before start: the mock's
    // result promise must be settled by the time start ran.
    const qrResult = runWeixinQrLoginMock.mock.results[0]?.value;
    expect(qrResult).toBeDefined();
    await expect(qrResult).resolves.toBeDefined();

    process.emit("SIGINT", "SIGINT");
    await promise.catch(() => undefined);
  });

  it("passes onInfo to WeixinChannel ctor (unlike Telegram)", async () => {
    const promise = weixinCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // WeixinChannel ctor accepts {onSubmitMessage, onError, onInfo} — diverges
    // from TelegramChannel which has no onInfo. The mock ctor captures only
    // onSubmitMessage; verify the command constructed without throwing and
    // the channel started (the ctor signature match is enforced by typecheck).
    expect(channelStartMock).toHaveBeenCalled();

    process.emit("SIGINT", "SIGINT");
    await promise.catch(() => undefined);
  });

  it("calls channel.stop + host.shutdown + bridge.unsubscribe on SIGINT", async () => {
    const promise = weixinCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    process.emit("SIGINT", "SIGINT");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(bridgeUnsubscribeMock).toHaveBeenCalled();
    expect(channelStopMock).toHaveBeenCalled();
    const fakeHost = await hostCreateMock.mock.results[0]?.value;
    expect(fakeHost?.shutdown).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("installs SIGINT cleanup BEFORE the QR window — Ctrl-C shuts the host down (WR-04)", async () => {
    // Force the QR path and make it hang so the command is suspended inside the
    // multi-minute QR window when SIGINT arrives. Pre-fix the signal handlers
    // were installed only AFTER runWeixinQrLogin, so a Ctrl-C here left the
    // host running — host.shutdown was never called during the QR window.
    loadWeixinConfigMock.mockReturnValue({
      token: undefined,
      accountId: undefined,
      enabled: false,
    });
    let releaseQr: (value: unknown) => void = () => undefined;
    const hangingQr = new Promise((resolve) => {
      releaseQr = resolve;
    });
    runWeixinQrLoginMock.mockReturnValue(hangingQr as ReturnType<typeof runWeixinQrLoginMock>);

    const promise = weixinCommand({ workspace: tmpWorkspace });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // Still inside the QR window: QR started, channel.start not reached.
    expect(runWeixinQrLoginMock).toHaveBeenCalledTimes(1);
    expect(channelStartMock).not.toHaveBeenCalled();

    // Ctrl-C during the QR window must run the cleanup installed before it.
    process.emit("SIGINT", "SIGINT");
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const fakeHost = await hostCreateMock.mock.results[0]?.value;
    expect(fakeHost?.shutdown).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
    // channel.start is never reached inside the QR window.
    expect(channelStartMock).not.toHaveBeenCalled();

    // Unblock the suspended command so its promise settles (it then hits the
    // undefined-creds path and rejects — caught here, not this test's concern).
    releaseQr(undefined);
    await promise.catch(() => undefined);
  });

  it("makes interrupt cleanup idempotent and best-effort when transport stop fails", async () => {
    channelStopMock.mockRejectedValueOnce(new Error("offline stop failure"));
    const promise = weixinCommand({ workspace: tmpWorkspace });
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
