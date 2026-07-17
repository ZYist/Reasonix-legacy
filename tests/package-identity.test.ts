import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DISPLAY_VERSION, VERSION } from "../src/version.js";

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const expectedBin = { "reasonix-legacy": "dist/cli/index.js" };

const maintainedDocs = [
  "README.md",
  "REASONIX.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  ".claude/CLAUDE.md",
  "benchmarks/README.md",
  "docs/README.md",
  "docs/architecture.md",
  "docs/channel-lifecycle-testing.md",
  "docs/ci-branch-protection.md",
  "docs/cli-reference.md",
  "docs/configuration.md",
  "docs/getting-started.md",
  "docs/governance.md",
  "docs/qq-connect.md",
  "docs/qq-connect.zh-CN.md",
  "docs/telegram-connect.md",
  "docs/telegram-connect.zh-CN.md",
  "docs/weixin-connect.md",
  "docs/weixin-connect.zh-CN.md",
];

const obsoleteExecutable =
  /\bdsnix\b|\breasonix(?=\s+(?:--(?:help|version)|<command>|setup|code|chat|run|acp|desktop|stats|doctor(?:-cache)?|commit|sessions|prune-sessions|events|replay|diff|mcp|version|update|index|qq|telegram|weixin)\b)/m;

describe("v1.3 package identity contract", () => {
  it("publishes one package, version, and executable identity", () => {
    const pkg = readJson("package.json");
    expect(pkg.name).toBe("reasonix-legacy");
    expect(pkg.version).toBe("1.3.0");
    expect(pkg.bin).toEqual(expectedBin);
    expect(VERSION).toBe(pkg.version);
    expect(DISPLAY_VERSION).toBe("reasonix-legacy 1.3.0");
  });

  it("keeps the lockfile root synchronized and removes dsnix records", () => {
    const pkg = readJson("package.json");
    const lock = readJson("package-lock.json");
    expect(lock.packages[""]).toMatchObject({
      name: pkg.name,
      version: pkg.version,
      bin: expectedBin,
    });
    expect(
      Object.keys(lock.packages).filter((record) => /(?:^|[\/])dsnix(?:$|[\/])/i.test(record)),
    ).toEqual([]);
    expect(existsSync("packages/dsnix")).toBe(false);

    const workflowPaths = readdirSync(".github/workflows", { recursive: true }).map(String);
    expect(workflowPaths.filter((path) => /dsnix/i.test(path))).toEqual([]);
    for (const path of workflowPaths) {
      expect(readFileSync(`.github/workflows/${path}`, "utf8"), path).not.toMatch(/\bdsnix\b/i);
    }
  });

  it("uses reasonix-legacy commands on maintained documentation surfaces", () => {
    for (const path of maintainedDocs) {
      const text = readFileSync(path, "utf8");
      expect(text, path).not.toMatch(obsoleteExecutable);
    }
    expect(readFileSync("README.md", "utf8")).toContain("reasonix-legacy 1.3.0");
    expect(readFileSync("docs/governance.md", "utf8")).toContain(
      "package `1.3.0` and milestone `v1.3`",
    );
    expect(readFileSync(".planning/STATE.md", "utf8")).toMatch(/^milestone: v1\.3$/m);
    expect(readFileSync("CHANGELOG.md", "utf8")).toContain("## [1.3.0] — 2026-07-17");
  });
});
