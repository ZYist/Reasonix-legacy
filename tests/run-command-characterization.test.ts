/** Offline characterization of the one-shot `run` command boundary. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCommand } from "../src/cli/commands/run.js";

const fakes = vi.hoisted(() => ({
  appendUsage: vi.fn(),
  bridgeEndpointEnv: vi.fn(),
  clientConstructor: vi.fn(),
  loadApiKey: vi.fn((): string | null => "offline-api-key"),
  loadDotenv: vi.fn(),
  loadEndpoint: vi.fn(() => ({ apiKey: "offline-api-key", baseUrl: "https://offline.invalid" })),
  loopConstructor: vi.fn(),
  normalizeMcpConfig: vi.fn(() => []),
  prefixConstructor: vi.fn(),
  step: vi.fn(),
  summary: vi.fn(() => ({
    turns: 1,
    cacheHitRatio: 0.5,
    totalCostUsd: 0.000123,
    savingsVsClaudePct: 99.5,
  })),
}));

vi.mock("../src/config.js", () => ({
  bridgeEndpointEnv: fakes.bridgeEndpointEnv,
  defaultConfigPath: () => "/offline/.reasonix/config.json",
  isPlausibleKey: () => true,
  loadApiKey: fakes.loadApiKey,
  loadEndpoint: fakes.loadEndpoint,
  loadMaxIterPerTurn: () => 8,
  loadToolRateLimit: () => 4,
  normalizeMcpConfig: fakes.normalizeMcpConfig,
  readConfig: () => ({}),
  saveApiKey: vi.fn(),
}));
vi.mock("../src/env.js", () => ({ loadDotenv: fakes.loadDotenv }));
vi.mock("../src/index.js", () => ({
  CacheFirstLoop: function FakeLoop(options: unknown) {
    fakes.loopConstructor(options);
    return { step: fakes.step, stats: { summary: fakes.summary } };
  },
  DeepSeekClient: function FakeClient(options: unknown) {
    fakes.clientConstructor(options);
  },
  ImmutablePrefix: function FakePrefix(options: unknown) {
    fakes.prefixConstructor(options);
    return { fingerprint: "offline-prefix-hash" };
  },
}));
vi.mock("../src/telemetry/usage.js", () => ({ appendUsage: fakes.appendUsage }));
vi.mock("../src/transcript/log.js", () => ({
  openTranscriptFile: vi.fn(),
  recordFromLoopEvent: vi.fn(),
  writeRecord: vi.fn(),
}));

function captured(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.map((call) => String(call[0])).join("");
}

describe("runCommand characterization", () => {
  let stdout: ReturnType<typeof vi.spyOn>;
  let stderr: ReturnType<typeof vi.spyOn>;
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fakes.loadApiKey.mockReturnValue("offline-api-key");
    fakes.loadEndpoint.mockReturnValue({
      apiKey: "offline-api-key",
      baseUrl: "https://offline.invalid",
    });
    fakes.normalizeMcpConfig.mockReturnValue([]);
    fakes.summary.mockReturnValue({
      turns: 1,
      cacheHitRatio: 0.5,
      totalCostUsd: 0.000123,
      savingsVsClaudePct: 99.5,
    });
    fakes.step.mockImplementation(() =>
      (async function* () {
        yield { turn: 1, role: "assistant_delta", content: "offline answer" };
        yield { turn: 1, role: "tool", toolName: "read_file", content: "fixture.txt" };
        yield { turn: 1, role: "error", error: "recoverable fixture warning" };
        yield { turn: 1, role: "done" };
        yield {
          turn: 1,
          role: "assistant_final",
          content: "offline answer",
          stats: {
            model: "deepseek-offline",
            usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
          },
        };
      })(),
    );
    stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    exit.mockRestore();
    stderr.mockRestore();
    stdout.mockRestore();
  });

  it("passes task/model/system/budget to the offline loop and renders success output", async () => {
    await runCommand({
      task: "characterize this task",
      model: "deepseek-offline",
      system: "offline system prompt",
      budgetUsd: 0.75,
      mcp: [],
    });

    expect(fakes.loadDotenv).toHaveBeenCalledOnce();
    expect(fakes.bridgeEndpointEnv).toHaveBeenCalledOnce();
    expect(fakes.clientConstructor).toHaveBeenCalledWith({
      apiKey: "offline-api-key",
      baseUrl: "https://offline.invalid",
    });
    expect(fakes.prefixConstructor).toHaveBeenCalledWith({
      system: "offline system prompt",
      toolSpecs: undefined,
    });
    expect(fakes.loopConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "deepseek-offline",
        budgetUsd: 0.75,
        maxIterPerTurn: 8,
        tools: undefined,
      }),
    );
    expect(fakes.step).toHaveBeenCalledWith("characterize this task");
    expect(fakes.appendUsage).toHaveBeenCalledWith({
      session: null,
      model: "deepseek-offline",
      usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
    });

    expect(captured(stdout)).toContain("offline answer");
    expect(captured(stdout)).toContain("[tool read_file] fixture.txt");
    expect(captured(stdout)).toContain("— turns:1 cache:50.0% cost:$0.000123 save-vs-claude:99.5%");
    expect(captured(stderr)).toContain("[error] recoverable fixture warning");
    expect(exit).not.toHaveBeenCalled();
  });

  it("prints the non-interactive missing-key diagnostic and exits 1", async () => {
    const exitSignal = new Error("process.exit(1)");
    fakes.loadApiKey.mockReturnValue(null);
    exit.mockImplementation(((code?: number) => {
      throw code === 1 ? exitSignal : new Error(`unexpected exit ${code}`);
    }) as never);

    await expect(
      runCommand({
        task: "cannot start",
        model: "deepseek-offline",
        system: "offline system prompt",
      }),
    ).rejects.toBe(exitSignal);

    expect(captured(stderr)).toContain("DEEPSEEK_API_KEY");
    expect(exit).toHaveBeenCalledWith(1);
    expect(fakes.clientConstructor).not.toHaveBeenCalled();
    expect(fakes.step).not.toHaveBeenCalled();
  });
});
