import { beforeEach, describe, expect, it, vi } from "vitest";

const fakeFs = vi.hoisted(() => {
  let lockHeld = false;
  const readFileSync = vi.fn((path: unknown) => {
    if (String(path).endsWith("telegram-channel.pid") && lockHeld) return String(process.pid);
    const error = Object.assign(new Error(`ENOENT: ${String(path)}`), { code: "ENOENT" });
    throw error;
  });
  const mkdirSync = vi.fn();
  const writeFileSync = vi.fn((path: unknown) => {
    if (String(path).endsWith("telegram-channel.pid")) lockHeld = true;
  });
  const unlinkSync = vi.fn((path: unknown) => {
    if (String(path).endsWith("telegram-channel.pid")) lockHeld = false;
  });
  return {
    readFileSync,
    mkdirSync,
    writeFileSync,
    unlinkSync,
    reset() {
      lockHeld = false;
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
    readFileSync: fakeFs.readFileSync,
    mkdirSync: fakeFs.mkdirSync,
    writeFileSync: fakeFs.writeFileSync,
    unlinkSync: fakeFs.unlinkSync,
  };
});

const fakeConfig = vi.hoisted(() => ({
  loadTelegramConfig: vi.fn(() => ({
    botToken: "offline-token",
    enabled: true,
    ownerUserId: "42",
    allowlist: [] as string[],
  })),
}));

vi.mock("../src/config.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/config.js")>();
  return { ...actual, loadTelegramConfig: fakeConfig.loadTelegramConfig };
});

const fakeEnv = vi.hoisted(() => ({ loadDotenv: vi.fn() }));
vi.mock("../src/env.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/env.js")>();
  return { ...actual, loadDotenv: fakeEnv.loadDotenv };
});

const fakeTransport = vi.hoisted(() => {
  const instances: object[] = [];
  const behavior: { startError?: Error } = {};

  class FakeTelegramBot {
    readonly config: { token: string };
    readonly listeners = new Map<string, Array<(...args: unknown[]) => void>>();
    readonly setCommands = vi.fn(async (_commands: readonly unknown[]) => undefined);
    readonly start = vi.fn(async () => {
      if (behavior.startError) throw behavior.startError;
    });
    readonly stop = vi.fn(async () => undefined);
    readonly sendMessage = vi.fn(async () => 101);

    constructor(config: { token: string }) {
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
    FakeTelegramBot,
    instances,
    behavior,
    reset() {
      instances.length = 0;
      behavior.startError = undefined;
    },
  };
});

vi.mock("../src/telegram/bot.js", () => ({ TelegramBot: fakeTransport.FakeTelegramBot }));

const { TelegramChannel } = await import("../src/telegram/channel.js");

type FakeTelegramBotInstance = InstanceType<typeof fakeTransport.FakeTelegramBot>;

function currentTransport(): FakeTelegramBotInstance {
  const transport = fakeTransport.instances.at(-1);
  if (!transport) throw new Error("Telegram fake transport was not constructed");
  return transport as FakeTelegramBotInstance;
}

describe("TelegramChannel lifecycle with an offline fake transport", () => {
  beforeEach(() => {
    fakeFs.reset();
    fakeTransport.reset();
    fakeEnv.loadDotenv.mockClear();
    fakeConfig.loadTelegramConfig.mockClear();
  });

  it("starts, registers commands, and forwards authorized transport events", async () => {
    const onSubmitMessage = vi.fn();
    const channel = new TelegramChannel({ onSubmitMessage });

    await channel.start();
    const transport = currentTransport();

    expect(fakeEnv.loadDotenv).toHaveBeenCalledOnce();
    expect(transport.config).toEqual({ token: "offline-token" });
    expect(transport.setCommands).toHaveBeenCalledOnce();
    expect(transport.start).toHaveBeenCalledOnce();

    transport.emit("message", {
      message_id: 7,
      text: "  inspect status  ",
      chat: { id: 99, type: "private" },
      from: { id: 42, is_bot: false },
      date: 1,
    });

    expect(onSubmitMessage).toHaveBeenCalledWith("[TG] inspect status");
  });

  it("reports a recoverable polling error and continues forwarding later messages", async () => {
    const onSubmitMessage = vi.fn();
    const onError = vi.fn();
    const channel = new TelegramChannel({ onSubmitMessage, onError });

    await channel.start();
    const transport = currentTransport();
    transport.emit("bot_error", "Telegram polling: temporary offline failure");
    transport.emit("message", {
      message_id: 8,
      text: "retry worked",
      chat: { id: 99, type: "private" },
      from: { id: 42, is_bot: false },
      date: 2,
    });

    expect(onError).toHaveBeenCalledWith("Telegram polling: temporary offline failure");
    expect(onSubmitMessage).toHaveBeenCalledWith("[TG] retry worked");
    expect(transport.stop).not.toHaveBeenCalled();
  });

  it("propagates a fatal startup error and releases the process lock", async () => {
    fakeTransport.behavior.startError = new Error("fatal Telegram initialization failure");
    const channel = new TelegramChannel({ onSubmitMessage: vi.fn() });

    await expect(channel.start()).rejects.toThrow("fatal Telegram initialization failure");

    expect(fakeFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/telegram-channel\.pid$/),
      String(process.pid),
      "utf8",
    );
    expect(fakeFs.unlinkSync).toHaveBeenCalledWith(expect.stringMatching(/telegram-channel\.pid$/));
  });

  it("stops the transport and releases the process lock during shutdown", async () => {
    const channel = new TelegramChannel({ onSubmitMessage: vi.fn() });
    await channel.start();
    const transport = currentTransport();

    await channel.stop();

    expect(transport.stop).toHaveBeenCalledOnce();
    expect(fakeFs.unlinkSync).toHaveBeenCalledWith(expect.stringMatching(/telegram-channel\.pid$/));
  });
});
