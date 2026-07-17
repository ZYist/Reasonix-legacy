/** Offline characterization of commit drafting and git subprocess semantics. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commitCommand } from "../src/cli/commands/commit.js";

const fakes = vi.hoisted(() => ({
  chat: vi.fn(),
  clientConstructor: vi.fn(),
  commitExitCode: 0 as number | null,
  loadDotenv: vi.fn(),
  loadEndpoint: vi.fn(() => ({ apiKey: "offline-api-key", baseUrl: "https://offline.invalid" })),
  spawn: vi.fn(),
  spawnSync: vi.fn(),
  stdinEnd: vi.fn(),
  stdinWrite: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawn: fakes.spawn,
  spawnSync: fakes.spawnSync,
}));
vi.mock("../src/client.js", () => ({
  DeepSeekClient: function FakeClient(options: unknown) {
    fakes.clientConstructor(options);
    return { chat: fakes.chat };
  },
}));
vi.mock("../src/config.js", () => ({ loadEndpoint: fakes.loadEndpoint }));
vi.mock("../src/env.js", () => ({ loadDotenv: fakes.loadDotenv }));

function captured(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.map((call) => String(call[0])).join("");
}

describe("commitCommand characterization", () => {
  let stdout: ReturnType<typeof vi.spyOn>;
  let stderr: ReturnType<typeof vi.spyOn>;
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fakes.commitExitCode = 0;
    fakes.loadEndpoint.mockReturnValue({
      apiKey: "offline-api-key",
      baseUrl: "https://offline.invalid",
    });
    fakes.chat.mockResolvedValue({
      content:
        "```\ntest(cli): characterize critical commands\n\nKeep offline behavior stable.\n```",
    });
    fakes.spawnSync.mockImplementation((_command: string, args: string[]) => {
      if (args[0] === "rev-parse") return { stdout: "true\n", stderr: "", status: 0 };
      if (args[0] === "diff" && args.includes("--staged")) {
        return {
          stdout: "diff --git a/file.ts b/file.ts\n+offline fixture\n",
          stderr: "",
          status: 0,
        };
      }
      if (args[0] === "log") {
        return { stdout: "test: prior style\n\n---END---\n", stderr: "", status: 0 };
      }
      throw new Error(`unexpected spawnSync args: ${args.join(" ")}`);
    });
    fakes.spawn.mockImplementation(() => ({
      stdin: { write: fakes.stdinWrite, end: fakes.stdinEnd },
      on: (event: string, listener: (code: number | null) => void) => {
        if (event === "close") listener(fakes.commitExitCode);
      },
    }));
    stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    exit.mockRestore();
    stderr.mockRestore();
    stdout.mockRestore();
  });

  it("drafts from the staged diff, prints the draft, and commits it through stdin", async () => {
    await commitCommand({ model: "deepseek-commit-offline", yes: true });

    expect(fakes.loadDotenv).toHaveBeenCalledOnce();
    expect(fakes.clientConstructor).toHaveBeenCalledWith({
      apiKey: "offline-api-key",
      baseUrl: "https://offline.invalid",
    });
    expect(fakes.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "deepseek-commit-offline",
        temperature: 0.2,
        messages: [
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("+offline fixture"),
          }),
        ],
      }),
    );
    expect(captured(stdout)).toContain("Drafting commit message…");
    expect(captured(stdout)).toContain("test(cli): characterize critical commands");
    expect(fakes.spawn).toHaveBeenCalledWith("git", ["commit", "-F", "-"], {
      stdio: ["pipe", "inherit", "inherit"],
    });
    expect(fakes.stdinWrite).toHaveBeenCalledWith(
      "test(cli): characterize critical commands\n\nKeep offline behavior stable.",
    );
    expect(fakes.stdinEnd).toHaveBeenCalledOnce();
    expect(exit).not.toHaveBeenCalled();
  });

  it("prints a model failure diagnostic and exits 1 before spawning git commit", async () => {
    const exitSignal = new Error("process.exit(1)");
    fakes.chat.mockRejectedValueOnce(new Error("offline model unavailable"));
    exit.mockImplementation(((code?: number) => {
      throw code === 1 ? exitSignal : new Error(`unexpected exit ${code}`);
    }) as never);

    await expect(commitCommand({ yes: true })).rejects.toBe(exitSignal);

    expect(captured(stderr)).toContain(
      "reasonix-legacy commit: model call failed — offline model unavailable",
    );
    expect(exit).toHaveBeenCalledWith(1);
    expect(fakes.spawn).not.toHaveBeenCalled();
  });

  it("reports the git commit status and preserves its non-zero exit code", async () => {
    const exitSignal = new Error("process.exit(7)");
    fakes.commitExitCode = 7;
    exit.mockImplementation(((code?: number) => {
      throw code === 7 ? exitSignal : new Error(`unexpected exit ${code}`);
    }) as never);

    await expect(commitCommand({ yes: true })).rejects.toBe(exitSignal);

    expect(captured(stderr)).toContain("reasonix-legacy commit: git commit exited 7.");
    expect(exit).toHaveBeenCalledWith(7);
  });
});
