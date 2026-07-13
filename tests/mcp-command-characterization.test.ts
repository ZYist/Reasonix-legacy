/** Offline characterization of MCP CLI output and early failure behavior. */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mcpInstallCommand, mcpListCommand } from "../src/cli/commands/mcp.js";
import { MCP_CATALOG, mcpCommandFor } from "../src/mcp/catalog.js";

function consoleOutput(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.map((call) => call.map(String).join(" ")).join("\n");
}

describe("MCP command characterization", () => {
  let log: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;
  let exit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    exit.mockRestore();
    error.mockRestore();
    log.mockRestore();
  });

  it("prints the bundled catalog and install commands without opening a registry", async () => {
    await mcpListCommand({ local: true });

    const output = consoleOutput(log);
    expect(output).toContain("Bundled MCP servers (offline catalog):");
    expect(output).toContain(MCP_CATALOG[0]!.name);
    expect(output).toContain(mcpCommandFor(MCP_CATALOG[0]!));
    expect(exit).not.toHaveBeenCalled();
  });

  it("emits stable machine-readable local catalog JSON", async () => {
    await mcpListCommand({ local: true, json: true });

    expect(log).toHaveBeenCalledOnce();
    expect(JSON.parse(String(log.mock.calls[0]![0]))).toEqual(MCP_CATALOG);
    expect(exit).not.toHaveBeenCalled();
  });

  it("prints install usage and exits 1 before any registry or network access for an empty name", async () => {
    const exitSignal = new Error("process.exit(1)");
    exit.mockImplementation(((code?: number) => {
      throw code === 1 ? exitSignal : new Error(`unexpected exit ${code}`);
    }) as never);

    await expect(mcpInstallCommand("   ")).rejects.toBe(exitSignal);

    expect(consoleOutput(error)).toContain("usage: reasonix mcp install <name>");
    expect(exit).toHaveBeenCalledWith(1);
    expect(log).not.toHaveBeenCalled();
  });
});
