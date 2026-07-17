#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const structureOnly = process.argv.includes("--structure-only");
const errors = [];
const requiredDocs = [
  "docs/README.md",
  "docs/getting-started.md",
  "docs/cli-reference.md",
  "docs/configuration.md",
  "docs/architecture.md",
  "docs/qq-connect.md",
  "docs/qq-connect.zh-CN.md",
  "docs/telegram-connect.md",
  "docs/telegram-connect.zh-CN.md",
  "docs/weixin-connect.md",
  "docs/weixin-connect.zh-CN.md",
  "REASONIX.md",
];
const archiveManifest = "docs/archive/upstream-reasonix/ARCHIVE.md";

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}
function fail(message) {
  errors.push(message);
}
function collectCurrentFiles(relativeDir, extensions) {
  const absoluteDir = resolve(root, relativeDir);
  if (!existsSync(absoluteDir)) return [];
  return readdirSync(absoluteDir, { recursive: true })
    .map((entry) => `${relativeDir}/${String(entry).replaceAll("\\", "/")}`)
    .filter((relativePath) => extensions.some((extension) => relativePath.endsWith(extension)))
    .filter((relativePath) => statSync(resolve(root, relativePath)).isFile());
}

for (const relativePath of [...requiredDocs, archiveManifest]) {
  if (!existsSync(resolve(root, relativePath))) fail(`missing required file: ${relativePath}`);
}
for (const relativePath of requiredDocs) {
  if (
    existsSync(resolve(root, relativePath)) &&
    !read(relativePath).includes("<!-- source-of-truth:")
  ) {
    fail(`missing source-of-truth marker: ${relativePath}`);
  }
}
if (existsSync(resolve(root, "docs/README.md"))) {
  const hub = read("docs/README.md");
  for (const relativePath of requiredDocs.filter(
    (path) => path.startsWith("docs/") && path !== "docs/README.md",
  )) {
    const basename = relativePath.slice("docs/".length);
    if (!hub.includes(`](${basename})`)) fail(`docs hub does not link ${relativePath}`);
  }
  if (!hub.includes("archive/upstream-reasonix/ARCHIVE.md")) {
    fail("docs hub does not link the upstream archive manifest");
  }
}

if (!structureOnly) {
  const packageJson = JSON.parse(read("package.json"));
  const packageLock = JSON.parse(read("package-lock.json"));
  const expectedBin = { "reasonix-legacy": "dist/cli/index.js" };
  if (packageJson.name !== "reasonix-legacy") fail("root package name is not reasonix-legacy");
  if (packageJson.version !== "1.3.0") fail("root package version is not 1.3.0");
  if (JSON.stringify(packageJson.bin) !== JSON.stringify(expectedBin)) {
    fail("root package must expose only the reasonix-legacy bin");
  }
  const lockRoot = packageLock.packages?.[""];
  if (
    lockRoot?.name !== packageJson.name ||
    lockRoot?.version !== packageJson.version ||
    JSON.stringify(lockRoot?.bin) !== JSON.stringify(expectedBin)
  ) {
    fail("package-lock root identity does not match package.json");
  }
  const dsnixPackageRecords = Object.keys(packageLock.packages ?? {}).filter((record) =>
    /(?:^|[\/])dsnix(?:$|[\/])/i.test(record),
  );
  if (dsnixPackageRecords.length > 0) {
    fail(`package-lock still contains dsnix records: ${dsnixPackageRecords.join(", ")}`);
  }
  if (existsSync(resolve(root, "packages/dsnix"))) fail("packages/dsnix still exists");
  const workflowDir = resolve(root, ".github/workflows");
  if (existsSync(workflowDir)) {
    for (const workflowPath of readdirSync(workflowDir, { recursive: true })) {
      const relativeWorkflowPath = String(workflowPath);
      if (/dsnix/i.test(relativeWorkflowPath)) {
        fail(`dsnix publication workflow path still exists: ${relativeWorkflowPath}`);
        continue;
      }
      if (/\bdsnix\b/i.test(readFileSync(resolve(workflowDir, relativeWorkflowPath), "utf8"))) {
        fail(`workflow still contains dsnix publication logic: ${relativeWorkflowPath}`);
      }
    }
  }

  const maintainedMarkdown = [
    "README.md",
    "REASONIX.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    ".claude/CLAUDE.md",
    "benchmarks/README.md",
    ...requiredDocs.filter((path) => path.startsWith("docs/")),
    "docs/channel-lifecycle-testing.md",
    "docs/ci-branch-protection.md",
    "docs/governance.md",
  ];
  const identitySurfaces = [
    ...maintainedMarkdown,
    ".github/ISSUE_TEMPLATE/bug_report.md",
    ".github/ISSUE_TEMPLATE/display_issue.md",
    "scripts/probe-fanout.mts",
    ...collectCurrentFiles("src", [".ts", ".tsx", ".md"]),
    ...collectCurrentFiles("examples", [".ts", ".tsx", ".md"]),
    ...collectCurrentFiles("benchmarks", [".ts", ".tsx", ".mts", ".md"]),
  ];
  const obsoleteExecutable = /\bdsnix\b|\breasonix(?=\s+(?:--(?:help|version)|<command>|setup|code|chat|run|acp|desktop|stats|doctor(?:-cache)?|commit|sessions|prune-sessions|events|replay|diff|mcp|version|update|index|qq|telegram|weixin)\b)/m;
  for (const relativePath of new Set(identitySurfaces)) {
    if (!existsSync(resolve(root, relativePath))) continue;
    if (obsoleteExecutable.test(read(relativePath))) {
      fail(`obsolete executable identity in maintained surface: ${relativePath}`);
    }
  }
  if (!read("README.md").includes("reasonix-legacy 1.3.0")) {
    fail("README.md does not state reasonix-legacy 1.3.0");
  }
  if (!read("docs/governance.md").includes("package `1.3.0` and milestone `v1.3`")) {
    fail("docs/governance.md does not state the current package/milestone pair");
  }
  if (!/^milestone: v1\.3$/m.test(read(".planning/STATE.md"))) {
    fail(".planning/STATE.md does not declare milestone v1.3");
  }
  if (!read("CHANGELOG.md").includes("## [1.3.0] — 2026-07-17")) {
    fail("CHANGELOG.md does not contain the current v1.3 entry");
  }
  const markdownLink = /!?(?:\[[^\]]*\])\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const relativePath of maintainedMarkdown) {
    if (!existsSync(resolve(root, relativePath))) continue;
    for (const match of read(relativePath).matchAll(markdownLink)) {
      const target = match[1];
      if (/^(?:https?:|mailto:|data:|#)/i.test(target)) continue;
      const decoded = decodeURIComponent(target.split("#", 1)[0]);
      if (!decoded || isAbsolute(decoded)) continue;
      if (!existsSync(resolve(root, dirname(relativePath), decoded))) {
        fail(`broken relative link in ${relativePath}: ${target}`);
      }
    }
  }

  for (const relativePath of ["README.md", "docs/README.md"]) {
    if (!existsSync(resolve(root, relativePath))) continue;
    const text = read(relativePath);
    if (relativePath === "README.md" && !text.includes("docs/README.md")) {
      fail("README.md does not link docs/README.md");
    }
    if (!text.includes("archive/upstream-reasonix/ARCHIVE.md")) {
      fail(`${relativePath} does not link the upstream archive manifest`);
    }
  }

  const cliDoc = read("docs/cli-reference.md");
  let help = "";
  try {
    help = execFileSync(process.execPath, [resolve(root, "dist/cli/index.js"), "--help"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
    });
  } catch (error) {
    fail(`could not run built CLI help: ${error.message}`);
  }
  let version = "";
  try {
    version = execFileSync(process.execPath, [resolve(root, "dist/cli/index.js"), "--version"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, NO_COLOR: "1" },
    }).trim();
  } catch (error) {
    fail(`could not run built CLI version: ${error.message}`);
  }
  if (version !== "reasonix-legacy 1.3.0") {
    fail(`built CLI version identity is ${JSON.stringify(version)}`);
  }
  try {
    const versionCommand = execFileSync(
      process.execPath,
      [resolve(root, "dist/cli/index.js"), "version"],
      { cwd: root, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } },
    ).trim();
    if (versionCommand !== version) {
      fail(`built CLI version subcommand is ${JSON.stringify(versionCommand)}`);
    }
  } catch (error) {
    fail(`could not run built CLI version subcommand: ${error.message}`);
  }
  const commandsBlock = help.split("Commands:")[1] ?? "";
  const topLevelCommands = [...commandsBlock.matchAll(/^ {2}([a-z][a-z0-9-]*)(?:\s|$)/gm)].map(
    (match) => match[1],
  );
  if (!help.startsWith("Usage: reasonix-legacy ")) {
    fail("built CLI help does not use reasonix-legacy as the program name");
  }
  if (topLevelCommands.length === 0) fail("no top-level commands parsed from built CLI help");
  for (const command of topLevelCommands) {
    if (!cliDoc.includes(`reasonix-legacy ${command}`)) {
      fail(`docs/cli-reference.md omits top-level command: ${command}`);
    }
  }

  const liveEntrypoints = [
    "README.md",
    "CONTRIBUTING.md",
    "src/skills.ts",
    "src/cli/cpu-prof.ts",
    "src/cli/ui/feedback.ts",
    "src/cli/ui/mcp-lifecycle.ts",
    "src/cli/ui/slash/handlers/basic.ts",
  ];
  const upstreamUrl = /https:\/\/github\.com\/esengine\/DeepSeek-Reasonix[^\s)"'`]*/g;
  for (const relativePath of liveEntrypoints) {
    if (!existsSync(resolve(root, relativePath))) continue;
    for (const match of read(relativePath).matchAll(upstreamUrl)) {
      const allowedAttribution =
        relativePath === "README.md" &&
        match[0] === "https://github.com/esengine/DeepSeek-Reasonix";
      if (!allowedAttribution)
        fail(`historical upstream used as live URL in ${relativePath}: ${match[0]}`);
    }
  }

  const currentForkRequired = [
    "README.md",
    "CONTRIBUTING.md",
    "src/skills.ts",
    "src/cli/cpu-prof.ts",
    "src/cli/ui/feedback.ts",
    "src/cli/ui/slash/handlers/basic.ts",
  ];
  for (const relativePath of currentForkRequired) {
    if (
      existsSync(resolve(root, relativePath)) &&
      !read(relativePath).includes("ZYist/reasonix-legacy")
    ) {
      fail(`current fork URL missing from live entrypoint: ${relativePath}`);
    }
  }
  if (!read("src/cli/ui/mcp-lifecycle.ts").includes("docs/archive/upstream-reasonix/")) {
    fail("MCP lifecycle design reference does not point into the historical archive");
  }
}

if (errors.length > 0) {
  console.error(`documentation check failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`documentation check passed${structureOnly ? " (structure only)" : ""}`);
