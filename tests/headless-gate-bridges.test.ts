// Headless gate-bridges test.
//
// Lives under both vitest (npm run test) and the plan's `<verify>` gate
// `node --import tsx tests/headless-gate-bridges.test.ts`. The self-execute
// tail drives the assertions when node runs the file directly so the plan's
// automated gate has a process exit code.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  defaultBuildPrompt,
  installHeadlessGateBridges,
  parseRunPermissionChoice,
} from "../src/cli/headless/gate-bridges.js";
import { headlessContext } from "../src/cli/headless/turn-driver.js";
import { saveEditMode } from "../src/config.js";
import { pauseGate } from "../src/core/pause-gate.js";
import { autoResolveVerdict } from "../src/core/pause-policy.js";
import { setLanguageRuntime } from "../src/i18n/index.js";

setLanguageRuntime("EN");

// Tests target the deepest default-config path the bridge hits. Mutating the
// real `~/.reasonix/config.json` would be hostile to whoever runs the suite
// on their machine, so we steer via a temp HOME written to a tmp config that
// `saveEditMode` reads/writes through defaultConfigPath. The temp HOME is set
// before any bridge call and restored in finally.
let origHome: string | undefined;

function withTempHome<T>(
  editMode: "review" | "auto" | "yolo" | "plan",
  fn: () => Promise<T>,
): Promise<T> {
  origHome = process.env.HOME;
  const tmpHome = mkdtempSync(join(tmpdir(), "reasonix-gate-test-"));
  process.env.HOME = tmpHome;
  try {
    // Prime the config dir + file with a chosen editMode before the bridge /
    // saveEditMode can read it. defaultConfigPath uses homedir() which Node
    // resolves from HOME on posix and USERPROFILE on win32 — set both.
    if (process.platform === "win32") process.env.USERPROFILE = tmpHome;
    const cfgDir = join(tmpHome, ".reasonix");
    writeFileSync(join(cfgDir, "config.json"), JSON.stringify({ editMode }, null, 2), "utf8");
  } catch {
    // If priming fails the test still runs with the default — just less
    // deterministic. Don't hide the failure entirely.
    void saveEditMode(editMode);
  }
  return fn().finally(() => {
    // Restore HOME — assign empty string when it was originally unset (avoids
    // the `delete` operator that Biome's noDelete rule forbids; an empty
    // string is falsy so `homedir()` falls back to the OS user db).
    process.env.HOME = origHome ?? "";
    if (process.platform === "win32") process.env.USERPROFILE = origHome ?? "";
    rmSync(tmpHome, { recursive: true, force: true });
  });
}

async function runAutoResolveShortCircuitCase(): Promise<void> {
  // (a) autoResolveVerdict short-circuit: with editMode='auto', a
  // plan_checkpoint request must resolve to {type:'continue'} WITHOUT
  // surfacing a prompt to the channel. Tests the policy + the bridge's
  // early-return path.
  let sendPromptCalls = 0;
  let onShellConfirmCalls = 0;
  const { consumeReply, unsubscribe } = installHeadlessGateBridges({
    sendPrompt: () => {
      sendPromptCalls++;
    },
    gateCallbacks: {
      onShellConfirm: () => {
        onShellConfirmCalls++;
      },
      onPathConfirm: () => undefined,
      onPlanCancel: () => undefined,
      onPlanFeedback: () => undefined,
      onCheckpointConfirm: () => undefined,
      onCheckpointRevise: () => undefined,
      onPlanRevision: () => undefined,
      onChoiceResolve: () => undefined,
    },
  });
  try {
    await withTempHome("auto", async () => {
      // Drive a plan_checkpoint request via pauseGate.ask. The bridge's
      // pauseGate.on listener should auto-resolve it (autoResolveVerdict
      // returns {type:'continue'} for plan_checkpoint in auto/yolo) so the
      // ask() promise resolves with that verdict AND sendPrompt is never
      // called.
      const verdictPromise: Promise<unknown> = pauseGate.ask({
        kind: "plan_checkpoint",
        payload: {
          stepId: "step-1",
          title: "First step",
          result: "done",
          notes: "",
        },
      });
      const verdict = await verdictPromise;
      assert.deepEqual(verdict, { type: "continue" }, "auto-resolve must return {type:'continue'}");
      assert.equal(sendPromptCalls, 0, "auto-resolved request must NOT call sendPrompt");
      assert.equal(onShellConfirmCalls, 0, "auto-resolved request must NOT touch gateCallbacks");
      // consumeReply on a never-pending interaction must return false (no
      // pending gate from the auto-resolved request above).
      assert.equal(consumeReply("1"), false, "no pending interaction → consumeReply returns false");
    });
  } finally {
    unsubscribe();
  }
}

async function runInteractiveReplyResolveCase(): Promise<void> {
  // (b) Interactive reply → resolve: simulate a run_command PauseRequest
  // (run_command only auto-resolves in yolo; with default 'review' mode the
  // bridge MUST surface). Assert sendPrompt called with the prompt text, then
  // consumeReply("1") triggers gateCallbacks.onShellConfirm("run_once").
  let sendPromptCalls = 0;
  let lastPrompt = "";
  let onShellConfirmChoice: string | null = null;
  const { consumeReply, unsubscribe } = installHeadlessGateBridges({
    sendPrompt: (promptText) => {
      sendPromptCalls++;
      lastPrompt = promptText;
    },
    gateCallbacks: {
      onShellConfirm: (choice) => {
        onShellConfirmChoice = choice;
      },
      onPathConfirm: () => undefined,
      onPlanCancel: () => undefined,
      onPlanFeedback: () => undefined,
      onCheckpointConfirm: () => undefined,
      onCheckpointRevise: () => undefined,
      onPlanRevision: () => undefined,
      onChoiceResolve: () => undefined,
    },
  });
  try {
    // Wrap the request in headlessContext so getActiveSessionId() returns a
    // session id — the bridge cancels the request if there's no active session.
    await headlessContext.run("sess-interactive", async () => {
      await withTempHome("review", async () => {
        // Don't await — the gate won't resolve until consumeReply fires.
        const verdictPromise: Promise<unknown> = pauseGate.ask({
          kind: "run_command",
          payload: { command: "echo hi" },
        });
        // Yield so the pauseGate.on listener (synchronous in dispatch but
        // the await lets the microtask queue drain) fires before asserts.
        await Promise.resolve();
        assert.equal(sendPromptCalls, 1, "run_command in review mode must call sendPrompt once");
        assert.ok(lastPrompt.includes("echo hi"), "sendPrompt receives the built prompt text");
        // Reply "1" → onShellConfirm("run_once")
        const consumed = consumeReply("1");
        assert.equal(
          consumed,
          true,
          "consumeReply must return true when it consumed a pending reply",
        );
        assert.equal(
          onShellConfirmChoice,
          "run_once",
          "consumeReply('1') → onShellConfirm('run_once')",
        );
        // The pauseGate.ask promise now resolves with the verdict the callback
        // would have surfaced. gateCallbacks.onShellConfirm is the bridge —
        // the actual pauseGate.resolve/cancel is the channel command's job in
        // 02-02; here we just verify the callback dispatched correctly.
        void verdictPromise;
      });
    });
  } finally {
    unsubscribe();
  }
}

async function runTamperingMitigationCase(): Promise<void> {
  // (c) T-02-02 mitigation: spoofed/ambiguous reply text must NEVER
  // auto-approve. consumeReply("garbage") on a run_command pending must
  // dispatch onShellConfirm with "deny" (parseRunPermissionChoice's
  // default-else), never "run_once" or "always_allow".
  let onShellConfirmChoice: string | null = null;
  const { consumeReply, unsubscribe } = installHeadlessGateBridges({
    sendPrompt: () => undefined,
    gateCallbacks: {
      onShellConfirm: (choice) => {
        onShellConfirmChoice = choice;
      },
      onPathConfirm: () => undefined,
      onPlanCancel: () => undefined,
      onPlanFeedback: () => undefined,
      onCheckpointConfirm: () => undefined,
      onCheckpointRevise: () => undefined,
      onPlanRevision: () => undefined,
      onChoiceResolve: () => undefined,
    },
  });
  try {
    await headlessContext.run("sess-tamper", async () => {
      await withTempHome("review", async () => {
        const verdictPromise: Promise<unknown> = pauseGate.ask({
          kind: "run_command",
          payload: { command: "rm -rf /" },
        });
        await Promise.resolve();
        void verdictPromise;
        // Spoofed / unmatched reply text — falls to the deny default.
        consumeReply("garbage-nonsense-not-a-choice");
        assert.equal(
          onShellConfirmChoice,
          "deny",
          "T-02-02: unmatched reply text must default to 'deny' (never auto-allow)",
        );
        // Empty text also denies (no matching digit/keyword).
        // Re-arm with another request to test the empty case.
      });
    });
  } finally {
    unsubscribe();
  }
}

async function runDefaultBuildPromptCase(): Promise<void> {
  // defaultBuildPrompt localizes the desktop.ts:1939-1985 strings via the
  // headless.gate.* keys already in all 5 locale files. Sanity-check the EN
  // rendering for run_command + choice so the bridge's default path is
  // exercised without a channel.
  const runPrompt = defaultBuildPrompt("run_command", { command: "ls" });
  assert.ok(
    runPrompt.includes("ls") && runPrompt.toLowerCase().includes("reply"),
    "defaultBuildPrompt run_command must include the command + reply hint",
  );
  const choicePrompt = defaultBuildPrompt("choice", {
    question: "Pick one",
    options: [
      { id: "a", title: "Alpha" },
      { id: "b", title: "Beta" },
    ],
    allowCustom: false,
  } as Record<string, unknown>);
  assert.ok(choicePrompt.includes("Pick one"), "choice prompt must include the question");
  assert.ok(choicePrompt.includes("Alpha"), "choice prompt must list the option titles");
  assert.ok(
    !choicePrompt.includes("custom text"),
    "allowCustom=false must not mention custom text",
  );
  const choiceCustom = defaultBuildPrompt("choice", {
    question: "Pick one",
    options: [{ id: "a", title: "Alpha" }],
    allowCustom: true,
  } as Record<string, unknown>);
  assert.ok(choiceCustom.includes("custom text"), "allowCustom=true must mention custom text");
}

async function runAutoResolvePolicyCase(): Promise<void> {
  // Direct unit test of autoResolveVerdict — the policy the bridge trusts.
  const checkpointReq = { id: 0, kind: "plan_checkpoint" as const, payload: {} };
  assert.deepEqual(autoResolveVerdict(checkpointReq, "auto"), { type: "continue" });
  assert.deepEqual(autoResolveVerdict(checkpointReq, "yolo"), { type: "continue" });
  assert.equal(
    autoResolveVerdict(checkpointReq, "review"),
    null,
    "review mode must surface checkpoints",
  );
  const runReq = { id: 0, kind: "run_command" as const, payload: {} };
  assert.deepEqual(autoResolveVerdict(runReq, "yolo"), { type: "run_once" });
  assert.equal(autoResolveVerdict(runReq, "review"), null, "review mode must surface run_command");
  assert.equal(
    autoResolveVerdict(runReq, "auto"),
    null,
    "auto mode still surfaces run_command (only yolo bypasses)",
  );
}

let testCount = 0;
let failure: Error | null = null;

async function runParseRunPermissionChoiceCase(): Promise<void> {
  // WR-02 regression: deny-intent replies must never approve a destructive
  // run_command. "don't run it" contains "run" but must resolve to "deny".
  assert.equal(parseRunPermissionChoice("don't run it"), "deny");
  assert.equal(parseRunPermissionChoice("do not run"), "deny");
  assert.equal(parseRunPermissionChoice("no"), "deny");
  assert.equal(parseRunPermissionChoice("cancel"), "deny");
  assert.equal(parseRunPermissionChoice("never run that"), "deny");
  // Positive + indexed approvals still resolve.
  assert.equal(parseRunPermissionChoice("1"), "run_once");
  assert.equal(parseRunPermissionChoice("run"), "run_once");
  assert.equal(parseRunPermissionChoice("yes"), "run_once");
  assert.equal(parseRunPermissionChoice("2"), "always_allow");
  assert.equal(parseRunPermissionChoice("always"), "always_allow");
  // Substring safety: "rerun" must not match the \brun\ boundary.
  assert.equal(parseRunPermissionChoice("rerun"), "deny");
  // Empty / unrecognized fail closed to deny.
  assert.equal(parseRunPermissionChoice(""), "deny");
  assert.equal(parseRunPermissionChoice("maybe"), "deny");
}

async function run(): Promise<void> {
  const cases: Array<[string, () => Promise<void>]> = [
    [
      "autoResolveVerdict policy: checkpoint auto in auto/yolo, surfaces in review",
      runAutoResolvePolicyCase,
    ],
    [
      "auto-resolve short-circuit: plan_checkpoint in auto mode never reaches sendPrompt",
      runAutoResolveShortCircuitCase,
    ],
    [
      "interactive reply: run_command surfaces prompt + consumeReply('1') → onShellConfirm('run_once')",
      runInteractiveReplyResolveCase,
    ],
    [
      "T-02-02 tampering mitigation: unmatched reply defaults to deny, never auto-allow",
      runTamperingMitigationCase,
    ],
    [
      "WR-02 run-permission parser: deny-intent replies fail closed, never approve",
      runParseRunPermissionChoiceCase,
    ],
    [
      "defaultBuildPrompt renders the i18n-localized gate prompt strings",
      runDefaultBuildPromptCase,
    ],
  ];
  for (const [name, fn] of cases) {
    testCount++;
    try {
      await fn();
      console.log("ok %d - %s", testCount, name);
    } catch (err) {
      if (!failure) failure = err as Error;
      console.error("not ok %d - %s: %s", testCount, name, (err as Error).message);
    }
  }
}

const isDirectRun = (() => {
  try {
    if (!process.argv[1]) return false;
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  void run().then(() => {
    if (failure) {
      console.error("\nFAILED: %s", failure.message);
      process.exit(1);
    }
    console.log("\n%d tests passed", testCount);
    process.exit(0);
  });
}

// Vitest registration: the dual-mode `run()` above also runs under `npm test`
// so this file counts toward the vitest suite. The node-direct tail
// (`isDirectRun`) still drives the plan's `node --import tsx` gate exit code.
describe("headless-gate-bridges", () => {
  it("runs all gate-bridge cases (policy, auto-resolve, interactive, tampering, parser, prompt)", async () => {
    await run();
    expect(failure, failure?.message ?? "").toBeNull();
  });
});
