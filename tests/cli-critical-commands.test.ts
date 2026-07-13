/** Offline characterization of critical CLI routing and failure semantics. */

import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runCommand = vi.fn(async () => {
  process.stdout.write("run completed\n");
});
const commitCommand = vi.fn(async () => {
  process.stdout.write("commit completed\n");
});
const mcpListCommand = vi.fn(async () => {
  process.stdout.write("mcp list completed\n");
});
const mcpSearchCommand = vi.fn(async () => {
  process.stdout.write("mcp search completed\n");
});
const mcpInstallCommand = vi.fn(async () => {
  process.stdout.write("mcp install completed\n");
});
const mcpInspectCommand = vi.fn(async () => {
  process.stdout.write("mcp inspect completed\n");
});
const formatMcpInspectFailure = vi.fn((error: unknown) =>
  error instanceof Error ? `diagnostic: ${error.message}` : `diagnostic: ${String(error)}`,
);

vi.mock("../src/cli/node-version-guard.js", () => ({}));
vi.mock("../src/cli/heap-limit-launch.js", () => ({}));
vi.mock("../src/cli/strip-bel.js", () => ({}));
vi.mock("../src/cli/commands/run.js", () => ({ runCommand }));
vi.mock("../src/cli/commands/commit.js", () => ({ commitCommand }));
vi.mock("../src/cli/commands/mcp.js", () => ({
  mcpInstallCommand,
  mcpListCommand,
  mcpSearchCommand,
}));
vi.mock("../src/cli/commands/mcp-inspect.js", () => ({
  formatMcpInspectFailure,
  mcpInspectCommand,
}));

async function invokeCli(argv: string[]): Promise<void> {
  vi.resetModules();
  process.argv = ["node", "src/cli/index.ts", ...argv];
  await import("../src/cli/index.ts");
}

function outputOf(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.map((call) => String(call[0])).join("");
}

describe("critical CLI command routing", () => {
  const originalArgv = process.argv;
  const originalCwd = process.cwd();
  const originalHome = process.env.HOME;
  const originalUserProfile = process.env.USERPROFILE;
  let home: string;
  let cwd: string;
  let stdout: ReturnType<typeof vi.spyOn>;
  let stderr: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "reasonix-critical-cli-home-"));
    cwd = realpathSync(mkdtempSync(join(tmpdir(), "reasonix-critical-cli-cwd-")));
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    process.chdir(cwd);

    vi.clearAllMocks();
    stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    exit.mockRestore();
    consoleError.mockRestore();
    stderr.mockRestore();
    stdout.mockRestore();
    process.chdir(originalCwd);
    process.argv = originalArgv;
    rmSync(home, { recursive: true, force: true });
    rmSync(cwd, { recursive: true, force: true });
    if (originalHome === undefined) {
      // biome-ignore lint/performance/noDelete: restoring an absent environment variable
      delete process.env.HOME;
    } else {
      process.env.HOME = originalHome;
    }
    if (originalUserProfile === undefined) {
      // biome-ignore lint/performance/noDelete: restoring an absent environment variable
      delete process.env.USERPROFILE;
    } else {
      process.env.USERPROFILE = originalUserProfile;
    }
  });

  it("forwards every run argument and leaves the successful command at exit zero", async () => {
    await invokeCli([
      "run",
      "explain the patch",
      "--model",
      "deepseek-test",
      "--system",
      "deterministic system",
      "--budget",
      "1.25",
      "--transcript",
      "trace.jsonl",
      "--mcp",
      "alpha=node alpha.js",
      "--mcp",
      "beta=https://mcp.example.test/sse",
      "--mcp-prefix",
      "tool_",
      "--no-config",
      "--no-proxy",
    ]);

    await vi.waitFor(() =>
      expect(runCommand).toHaveBeenCalledWith({
        task: "explain the patch",
        model: "deepseek-test",
        system: expect.stringContaining("deterministic system"),
        budgetUsd: 1.25,
        transcript: "trace.jsonl",
        mcp: ["alpha=node alpha.js", "beta=https://mcp.example.test/sse"],
        mcpPrefix: "tool_",
      }),
    );
    expect(outputOf(stdout)).toContain("run completed");
    expect(exit).not.toHaveBeenCalled();
  });

  it("prints a rejected run error and exits 1", async () => {
    runCommand.mockRejectedValueOnce(new Error("offline run failure"));

    await invokeCli(["run", "fail deterministically", "--no-config"]);

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "offline run failure" }),
    );
  });

  it("forwards commit model and confirmation arguments on success", async () => {
    await invokeCli(["commit", "--model", "deepseek-commit-test", "--yes"]);

    await vi.waitFor(() =>
      expect(commitCommand).toHaveBeenCalledWith({ model: "deepseek-commit-test", yes: true }),
    );
    expect(outputOf(stdout)).toContain("commit completed");
    expect(exit).not.toHaveBeenCalled();
  });

  it("prints a rejected commit error and exits 1", async () => {
    commitCommand.mockRejectedValueOnce(new Error("offline commit failure"));

    await invokeCli(["commit"]);

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "offline commit failure" }),
    );
  });

  it("forwards normalized mcp list options and succeeds without an exit", async () => {
    await invokeCli([
      "mcp",
      "list",
      "--json",
      "--local",
      "--refresh",
      "--limit",
      "12",
      "--pages",
      "3",
      "--all",
    ]);

    await vi.waitFor(() =>
      expect(mcpListCommand).toHaveBeenCalledWith({
        json: true,
        local: true,
        refresh: true,
        limit: 12,
        pages: 3,
        all: true,
      }),
    );
    expect(outputOf(stdout)).toContain("mcp list completed");
    expect(exit).not.toHaveBeenCalled();
  });

  it("forwards mcp search query and pagination options", async () => {
    await invokeCli([
      "mcp",
      "search",
      "filesystem tools",
      "--json",
      "--refresh",
      "--limit",
      "7",
      "--max-pages",
      "9",
    ]);

    await vi.waitFor(() =>
      expect(mcpSearchCommand).toHaveBeenCalledWith("filesystem tools", {
        json: true,
        refresh: true,
        limit: 7,
        maxPages: 9,
      }),
    );
    expect(exit).not.toHaveBeenCalled();
  });

  it("forwards mcp install name and registry options", async () => {
    await invokeCli(["mcp", "install", "vendor/server", "--refresh", "--max-pages", "15"]);

    await vi.waitFor(() =>
      expect(mcpInstallCommand).toHaveBeenCalledWith("vendor/server", {
        refresh: true,
        maxPages: 15,
      }),
    );
    expect(exit).not.toHaveBeenCalled();
  });

  it("forwards the raw mcp inspect spec and json mode", async () => {
    await invokeCli(["mcp", "inspect", "demo=node fake-server.js", "--json"]);

    await vi.waitFor(() =>
      expect(mcpInspectCommand).toHaveBeenCalledWith({
        spec: "demo=node fake-server.js",
        json: true,
      }),
    );
    expect(exit).not.toHaveBeenCalled();
  });

  it.each([
    {
      argv: ["mcp", "list"],
      command: mcpListCommand,
      label: "list",
    },
    {
      argv: ["mcp", "search", "broken"],
      command: mcpSearchCommand,
      label: "search",
    },
    {
      argv: ["mcp", "install", "broken"],
      command: mcpInstallCommand,
      label: "install",
    },
  ])("labels an mcp $label error and exits 1", async ({ argv, command, label }) => {
    command.mockRejectedValueOnce(new Error(`${label} transport unavailable`));

    await invokeCli(argv);

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
    expect(outputOf(stderr)).toContain(`mcp ${label} failed: ${label} transport unavailable`);
  });

  it("formats an mcp inspect error and exits 1", async () => {
    mcpInspectCommand.mockRejectedValueOnce(new Error("spawn fake-mcp ENOENT"));

    await invokeCli(["mcp", "inspect", "fake-mcp"]);

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
    expect(formatMcpInspectFailure).toHaveBeenCalledWith(
      expect.objectContaining({ message: "spawn fake-mcp ENOENT" }),
    );
    expect(outputOf(stderr)).toContain("mcp inspect failed: diagnostic: spawn fake-mcp ENOENT");
  });
});
