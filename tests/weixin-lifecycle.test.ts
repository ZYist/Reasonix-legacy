import { beforeEach, describe, expect, it, vi } from "vitest";

const fakeFs = vi.hoisted(() => {
  let lockHeld = false;
  const existsSync = vi.fn(() => false);
  const readFileSync = vi.fn((path: unknown) => {
    if (String(path).endsWith("weixin-channel.pid") && lockHeld) return String(process.pid);
    const error = Object.assign(new Error(`ENOENT: ${String(path)}`), { code: "ENOENT" });
    throw error;
  });
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn((path: unknown) => {
    if (String(path).endsWith("weixin-channel.pid")) lockHeld = true;
  });
  const unlinkSync = vi.fn((path: unknown) => {
    if (String(path).endsWith("weixin-channel.pid")) lockHeld = false;
  });
  return {
    existsSync,
    readFileSync,
    mkdirSync,
    writeFileSync,
    unlinkSync,
    reset() {
      lockHeld = false;
      existsSync.mockClear();
      readFileSync.mockClear();
      mkdirSync.mockClear();
      writeFileSync.mockClear();
      unlinkSync.mockClear();
    },
  };
});

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    existsSync: fakeFs.existsSync,
    readFileSync: fakeFs.readFileSync,
    mkdirSync: fakeFs.mkdirSync,
    writeFileSync: fakeFs.writeFileSync,
    unlinkSync: fakeFs.unlinkSync,
  };
});

const fakeConfig = vi.hoisted(() => ({
  loadWeixinConfig: vi.fn(() => ({
    token: "offline-token",
    accountId: "offline-account",
    baseUrl: "https://ilinkai.weixin.qq.com",
    enabled: true,
    ownerUserId: "owner-42",
    allowlist: [] as string[],
  })),
}));

vi.mock("../src/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/config.js")>();
  return { ...actual, loadWeixinConfig: fakeConfig.loadWeixinConfig };
});

const fakeEnv = vi.hoisted(() => ({ loadDotenv: vi.fn() }));
vi.mock("../src/env.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/env.js")>();
  return { ...actual, loadDotenv: fakeEnv.loadDotenv };
});

const fakeTransport = vi.hoisted(() => {
  const instances: object[] = [];
  const behavior: { startError?: Error } = {};

  class FakeWeixinBot {
    readonly config: Record<string, unknown>;
    readonly listeners = new Map<string, Array<(...args: unknown[]) => void>>();
    readonly start = vi.fn(async () => {
      if (behavior.startError) throw behavior.startError;
    });
    readonly stop = vi.fn(async () => undefined);
    readonly sendMessage = vi.fn(async () => undefined);

    constructor(config: Record<string, unknown>) {
      this.config = config;
      instances.push(this);
    }

    on(event: string, listener: (...args: unknown[]) => void): this {
      const listeners = this.listeners.get(event) ?? [];
      listeners.push(listener);
      this.listeners.set(event, listeners);
      return this;
    }

    emit(event: string, ...args: unknown[]): boolean {
      const listeners = this.listeners.get(event) ?? [];
      for (const listener of listeners) listener(...args);
      return listeners.length > 0;
    }
  }

  return {
    FakeWeixinBot,
    instances,
    behavior,
    reset() {
      instances.length = 0;
      behavior.startError = undefined;
    },
  };
});

vi.mock("../src/weixin/bot.js", () => ({ WeixinBot: fakeTransport.FakeWeixinBot }));

const { WeixinChannel } = await import("../src/weixin/channel.js");

type FakeWeixinBotInstance = InstanceType<typeof fakeTransport.FakeWeixinBot>;

function currentTransport(): FakeWeixinBotInstance {
  const transport = fakeTransport.instances.at(-1);
  if (!transport) throw new Error("Weixin fake transport was not constructed");
  return transport as FakeWeixinBotInstance;
}

describe("WeixinChannel lifecycle with an offline fake transport", () => {
  beforeEach(() => {
    fakeFs.reset();
    fakeTransport.reset();
    fakeEnv.loadDotenv.mockClear();
    fakeConfig.loadWeixinConfig.mockClear();
  });

  it("starts with persisted credentials and forwards authorized transport events", async () => {
    const onSubmitMessage = vi.fn();
    const channel = new WeixinChannel({ onSubmitMessage });

    await channel.start();
    const transport = currentTransport();

    expect(fakeEnv.loadDotenv).toHaveBeenCalledOnce();
    expect(transport.config).toMatchObject({
      token: "offline-token",
      accountId: "offline-account",
      baseUrl: "https://ilinkai.weixin.qq.com",
      initialSyncBuf: "",
    });
    expect(transport.start).toHaveBeenCalledOnce();

    transport.emit("message", {
      messageId: "message-7",
      fromUserId: "owner-42",
      text: "  inspect status  ",
    });

    expect(onSubmitMessage).toHaveBeenCalledWith("[WX] inspect status");
  });

  it("reports a recoverable polling error and continues forwarding later messages", async () => {
    const onSubmitMessage = vi.fn();
    const onError = vi.fn();
    const channel = new WeixinChannel({ onSubmitMessage, onError });

    await channel.start();
    const transport = currentTransport();
    transport.emit("bot_error", "Weixin polling failed: temporary offline failure");
    transport.emit("message", {
      messageId: "message-8",
      fromUserId: "owner-42",
      text: "retry worked",
    });

    expect(onError).toHaveBeenCalledWith("Weixin polling failed: temporary offline failure");
    expect(onSubmitMessage).toHaveBeenCalledWith("[WX] retry worked");
    expect(transport.stop).not.toHaveBeenCalled();
  });

  it("propagates a fatal startup error and releases the process lock", async () => {
    fakeTransport.behavior.startError = new Error("fatal Weixin initialization failure");
    const channel = new WeixinChannel({ onSubmitMessage: vi.fn() });

    await expect(channel.start()).rejects.toThrow("fatal Weixin initialization failure");

    expect(fakeFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/weixin-channel\.pid$/),
      String(process.pid),
      "utf8",
    );
    expect(fakeFs.unlinkSync).toHaveBeenCalledWith(expect.stringMatching(/weixin-channel\.pid$/));
  });

  it("stops the transport and releases the process lock during shutdown", async () => {
    const channel = new WeixinChannel({ onSubmitMessage: vi.fn() });
    await channel.start();
    const transport = currentTransport();

    await channel.stop();

    expect(transport.stop).toHaveBeenCalledOnce();
    expect(fakeFs.unlinkSync).toHaveBeenCalledWith(expect.stringMatching(/weixin-channel\.pid$/));
  });
});
