import { spawn } from "node:child_process";
import { appendFile } from "node:fs/promises";

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(npmCommand, args, { stdio: "inherit", env: process.env });
    child.on("error", () => resolve(1));
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function summarize(status, detail) {
  const markdown = `## Test retry visibility\n\n- Result: **${status}**\n- ${detail}\n`;
  console.log(markdown);
  if (summaryPath) await appendFile(summaryPath, markdown);
}

const first = await run(["exec", "--", "vitest", "run", "--coverage", "--retry=0"]);
if (first === 0) {
  await summarize("first-attempt pass", "The complete suite passed without retry.");
  process.exit(0);
}

console.error(`First test attempt failed with exit code ${first}; running one diagnostic retry.`);
const retry = await run(["exec", "--", "vitest", "run", "--coverage", "--retry=1"]);
if (retry === 0) {
  await summarize(
    "first-attempt failure; retry pass",
    `The original exit code was ${first}. Inspect the first attempt logs for the flaky test.`,
  );
  process.exit(0);
}

await summarize(
  "first-attempt failure; retry failure",
  `Original exit code: ${first}; retry exit code: ${retry}.`,
);
process.exit(retry);
