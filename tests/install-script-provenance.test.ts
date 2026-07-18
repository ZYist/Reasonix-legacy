import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type InstallScriptEntry = {
  path: string;
  version: string;
  dev: boolean;
  optional: boolean;
};

type InstallScriptReview = {
  rootPrepareScript: string;
  productionInstallScriptsAllowed: boolean;
  entries: InstallScriptEntry[];
};

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

function collectInstallScriptEntries(lock: {
  packages?: Record<string, any>;
}): InstallScriptEntry[] {
  return Object.entries(lock.packages ?? {})
    .filter(([, meta]) => meta?.hasInstallScript)
    .map(([packagePath, meta]) => ({
      path: packagePath,
      version: meta.version,
      dev: Boolean(meta.dev),
      optional: Boolean(meta.optional),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

function parseInstallScriptReview(markdown: string): InstallScriptReview {
  const match = markdown.match(/```install-script-review\r?\n([\s\S]*?)\r?\n```/);
  expect(
    match,
    "docs/install-script-provenance.md must contain an install-script-review block",
  ).not.toBeNull();
  return JSON.parse(match?.[1] ?? "{}");
}

describe("install-script provenance contract", () => {
  it("records the root prepare script and the full reviewed hasInstallScript set", () => {
    const pkg = readJson("package.json");
    const lock = readJson("package-lock.json");
    const doc = readFileSync("docs/install-script-provenance.md", "utf8");
    const review = parseInstallScriptReview(doc);

    expect(pkg.scripts.prepare).toBe("simple-git-hooks || true");
    expect(review.rootPrepareScript).toBe(pkg.scripts.prepare);
    expect(review.productionInstallScriptsAllowed).toBe(false);
    expect(review.entries).toEqual(collectInstallScriptEntries(lock));
    expect(doc).toContain(
      "No current production dependency is allowed to require an install script.",
    );
  });

  it("keeps the remediated production dependencies aligned with the lockfile and free of install scripts", () => {
    const pkg = readJson("package.json");
    const lock = readJson("package-lock.json");

    expect(pkg.dependencies.undici).toBe("^8.7.0");
    expect(pkg.dependencies.ws).toBe("^8.21.1");
    expect(lock.packages["node_modules/undici"]?.version).toBe("8.7.0");
    expect(lock.packages["node_modules/ws"]?.version).toBe("8.21.1");

    const productionInstallScripts = collectInstallScriptEntries(lock).filter(
      (entry) => !entry.dev,
    );
    expect(productionInstallScripts).toEqual([]);
  });
});
