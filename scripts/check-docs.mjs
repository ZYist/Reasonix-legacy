#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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
  const maintainedMarkdown = [
    "README.md",
    "REASONIX.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "CODE_OF_CONDUCT.md",
    "benchmarks/README.md",
    "packages/dsnix/README.md",
    ...requiredDocs.filter((path) => path.startsWith("docs/")),
    "docs/channel-lifecycle-testing.md",
    "docs/ci-branch-protection.md",
    "docs/governance.md",
  ];
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
  const commandsBlock = help.split("Commands:")[1] ?? "";
  const topLevelCommands = [...commandsBlock.matchAll(/^ {2}([a-z][a-z0-9-]*)(?:\s|$)/gm)].map(
    (match) => match[1],
  );
  if (topLevelCommands.length === 0) fail("no top-level commands parsed from built CLI help");
  for (const command of topLevelCommands) {
    if (!cliDoc.includes(`reasonix ${command}`)) {
      fail(`docs/cli-reference.md omits top-level command: ${command}`);
    }
  }

  const liveEntrypoints = [
    "README.md",
    "CONTRIBUTING.md",
    "packages/dsnix/README.md",
    "packages/dsnix/package.json",
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
    "packages/dsnix/README.md",
    "packages/dsnix/package.json",
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
