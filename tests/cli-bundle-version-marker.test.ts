import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Verifies scripts/write-cli-package-marker.mjs writes the dist/cli/package.json
// ESM marker (the 01-01 anti-regression contract: dist/cli must carry a
// package.json so Node skips the CJS-then-ESM reparse warning when the bundle
// is loaded outside its own npm install). The script previously lived inside
// the now-deleted scripts/copy-dashboard-vendor-css.mjs; this test now targets
// the live marker writer directly.
describe("write-cli-package-marker", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "reasonix-cli-marker-"));
    writeFileSync(
      join(tmp, "package.json"),
      JSON.stringify({ name: "reasonix", version: "9.8.7" }),
    );
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("writes the dist/cli ESM package marker from the root package.json", () => {
    const script = resolve("scripts/write-cli-package-marker.mjs");
    const run = spawnSync(process.execPath, [script], { cwd: tmp, encoding: "utf8" });

    expect(run.status).toBe(0);
    const marker = JSON.parse(readFileSync(join(tmp, "dist/cli/package.json"), "utf8"));
    expect(marker).toEqual({
      name: "reasonix",
      version: "9.8.7",
      type: "module",
    });
  });

  it("carries the reasonix-legacy package name through unchanged", () => {
    // The fork publishes as reasonix-legacy; the script must echo that name
    // from package.json rather than silently coercing to upstream reasonix.
    writeFileSync(
      join(tmp, "package.json"),
      JSON.stringify({ name: "reasonix-legacy", version: "0.55.0" }),
    );
    const script = resolve("scripts/write-cli-package-marker.mjs");
    const run = spawnSync(process.execPath, [script], { cwd: tmp, encoding: "utf8" });

    expect(run.status).toBe(0);
    const marker = JSON.parse(readFileSync(join(tmp, "dist/cli/package.json"), "utf8"));
    expect(marker).toEqual({
      name: "reasonix-legacy",
      version: "0.55.0",
      type: "module",
    });
  });

  it("creates the dist/cli directory if it does not exist", () => {
    // No pre-create of dist/cli — the script must mkdirSync(recursive: true).
    const script = resolve("scripts/write-cli-package-marker.mjs");
    const run = spawnSync(process.execPath, [script], { cwd: tmp, encoding: "utf8" });

    expect(run.status).toBe(0);
    expect(readFileSync(join(tmp, "dist/cli/package.json"), "utf8")).toBeTruthy();
  });

  it("falls back to reasonix-legacy name + 0.0.0-dev version when fields are absent", () => {
    // A package.json missing name/version — the script's ?? fallbacks apply.
    writeFileSync(join(tmp, "package.json"), JSON.stringify({}));
    // Remove the marker written by the previous iteration if present.
    rmSync(join(tmp, "dist"), { recursive: true, force: true });
    mkdirSync(join(tmp, "dist/cli"), { recursive: true });

    const script = resolve("scripts/write-cli-package-marker.mjs");
    const run = spawnSync(process.execPath, [script], { cwd: tmp, encoding: "utf8" });

    expect(run.status).toBe(0);
    const marker = JSON.parse(readFileSync(join(tmp, "dist/cli/package.json"), "utf8"));
    expect(marker.name).toBe("reasonix-legacy");
    expect(marker.version).toBe("0.0.0-dev");
    expect(marker.type).toBe("module");
  });
});
