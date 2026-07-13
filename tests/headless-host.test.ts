// Headless host + turn-driver test.
//
// Lives under both the vitest runner (npm run test) and the plan's
// `<verify>` gate `node --import tsx tests/headless-host.test.ts`. The
// vitest-aware `run()` block is registered as a single test when vitest
// imports the file; a top-level self-execute tail drives the same assertions
// when node runs the file directly so the plan's automated gate has a process
// exit code.
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { HeadlessHost, formatHeadlessError } from "../src/cli/headless/host.js";
import {
  type HeadlessHostContext,
  getActiveSessionId,
  runHeadlessTurn,
} from "../src/cli/headless/turn-driver.js";
import type { ReasoningEffort } from "../src/config.js";
import { Eventizer } from "../src/core/eventize.js";
import { setLanguageRuntime } from "../src/i18n/index.js";
import type { CacheFirstLoop } from "../src/loop.js";
import type { LoopEvent } from "../src/loop/types.js";

setLanguageRuntime("en");

type Kev = { type: string };

/** Stub loop whose step() yields the events we hand it in order. */
async function* eventsFrom(list: LoopEvent[]): AsyncGenerator<LoopEvent, void, unknown> {
  for (const ev of list) {
    yield ev;
  }
}

function makeStubLoop(events: LoopEvent[]): CacheFirstLoop {
  const fake = {
    step(_input: string): AsyncGenerator<LoopEvent, void, unknown> {
      return eventsFrom(events);
    },
  };
  return fake as unknown as CacheFirstLoop;
}

/** Stub eventizer that records consumed events so we can assert telemetry flowed. */
function makeStubEventizer(consumed: Kev[]): Eventizer {
  const fake = {
    consume(ev: LoopEvent, _ctx: HeadlessHostContext): Kev[] {
      consumed.push({ type: ev.role });
      return [{ type: ev.role }];
    },
  };
  return fake as unknown as Eventizer;
}

const baseCtx: HeadlessHostContext = {
  model: "deepseek-test",
  prefixHash: "sha256:stub",
  reasoningEffort: "medium",
};

async function runAssistantTextCase(): Promise<void> {
  const events: LoopEvent[] = [
    { turn: 1, role: "assistant_delta", content: "h" },
    { turn: 1, role: "assistant_delta", content: "i" },
    { turn: 1, role: "assistant_final", content: "hi" },
    { turn: 1, role: "done", content: "" },
  ];
  const loop = makeStubLoop(events);
  const consumed: Kev[] = [];
  const eventizer = makeStubEventizer(consumed);
  let captured: string | null = null;
  await runHeadlessTurn({
    loop,
    ctx: baseCtx,
    eventizer: eventizer,
    signal: new AbortController().signal,
    text: "ping",
    onAssistantText: (content) => {
      captured = content;
    },
  });
  assert.equal(captured, "hi", "onAssistantText must be called with the assistant_final content");
  // Must have consumed all four raw events into the kernel (telemetry survives).
  assert.equal(consumed.length, 4, "eventizer.consume must run for every LoopEvent");
}

async function runAbortedCase(): Promise<void> {
  const events: LoopEvent[] = [
    { turn: 1, role: "assistant_delta", content: "partial" },
    { turn: 1, role: "assistant_final", content: "partial" },
  ];
  const loop = makeStubLoop(events);
  const eventizer = makeStubEventizer([]);
  const controller = new AbortController();
  controller.abort();
  let captured: string | null = null;
  const result = await runHeadlessTurn({
    loop,
    ctx: baseCtx,
    eventizer,
    signal: controller.signal,
    text: "ping",
    onAssistantText: (content) => {
      captured = content;
    },
  });
  // Pre-aborted signal: turn-driver breaks before processing any event, so no
  // assistant text is delivered (matches desktop.ts loop-abort precedence —
  // the aborter is checked at the top of the iteration). The host layer turns
  // this outcome into the "(aborted)" sentinel returned to the channel.
  assert.equal(captured, null, "pre-aborted turn must not surface assistant text");
  assert.equal(result, "aborted", "runHeadlessTurn resolves with the aborted outcome");
}

async function runErrorCase(): Promise<void> {
  async function* failing(): AsyncGenerator<LoopEvent, void, unknown> {
    yield { turn: 1, role: "assistant_delta", content: "x" };
    throw new Error("boom-from-loop");
  }
  const fake = { step: (_s: string) => failing() } as unknown as CacheFirstLoop;
  const eventizer = makeStubEventizer([]);
  let capturedErr: Error | null = null;
  const sentinel = await runHeadlessTurn({
    loop: fake,
    ctx: baseCtx,
    eventizer: eventizer,
    signal: new AbortController().signal,
    text: "ping",
    onAssistantText: () => undefined,
    onError: (err, _meta) => {
      capturedErr = err;
    },
  });
  assert.ok(capturedErr instanceof Error, "onError must be called with the thrown Error");
  assert.equal(capturedErr?.message, "boom-from-loop");
  assert.equal(sentinel, "error", "runHeadlessTurn resolves with the error sentinel");
}

async function runAsyncLocalStorageCase(): Promise<void> {
  // The turn-driver must run inside headlessContext.run(sessionId, async () => ...)
  // so gate-bridges can recover the active session id from getActiveSessionId().
  let seenInside = undefined as string | undefined;
  let seenOutside = undefined as string | undefined;
  const events: LoopEvent[] = [{ turn: 1, role: "done", content: "" }];
  const loop = makeStubLoop(events);
  const eventizer = makeStubEventizer([]);
  await runHeadlessTurn({
    loop,
    ctx: baseCtx,
    eventizer: eventizer,
    signal: new AbortController().signal,
    text: "ping",
    sessionId: "sess-abc",
    onAssistantText: () => undefined,
    onEvent: () => {
      seenInside = getActiveSessionId();
    },
  });
  seenOutside = getActiveSessionId();
  // At least one event was dispatched, and within the loop body the context
  // reported the session id we passed in.
  assert.ok(
    seenInside === "sess-abc",
    `inside the loop run headlessContext must hold sess-abc (got: ${String(seenInside)})`,
  );
  assert.equal(seenOutside, undefined, "after the loop run the headlessContext must be cleared");
}

type HeadlessHostCtorArgs = {
  loop: CacheFirstLoop;
  eventizer: Eventizer;
  ctx: HeadlessHostContext;
  session: string;
  knownSecrets: readonly string[];
};

async function runFormatHeadlessErrorScrubCase(): Promise<void> {
  const telegramUrl =
    "https://api.telegram.org/bot123456789:AAFfakeTELEGRAMtoken0123456789xyz/sendMessage";
  const deepseekKey = "sk-FAKEDEEPSEEKKEY0123456789abcdef";
  const cause = new Error(`send failed: POST ${telegramUrl} using key ${deepseekKey}`);
  const scrubbed = formatHeadlessError(cause, { code: "net", phase: "send" }, [deepseekKey]);
  // host.runTurn derives BOTH its stderr write and its chat-bound return from
  // this one scrubbed string, so covering formatHeadlessError covers both sinks.
  assert.ok(
    !scrubbed.includes("123456789:AAFfakeTELEGRAMtoken0123456789xyz"),
    "formatHeadlessError must strip the Telegram bot-URL token",
  );
  assert.ok(!scrubbed.includes(deepseekKey), "formatHeadlessError must strip the known key");
  assert.ok(scrubbed.includes("[redacted]"), "formatHeadlessError must show the [redacted] marker");
}

async function runHostRunTurnReturnScrubCase(): Promise<void> {
  const telegramUrl =
    "https://api.telegram.org/bot123456789:AAFfakeTELEGRAMtoken0123456789xyz/sendMessage";
  async function* failing(): AsyncGenerator<LoopEvent, void, unknown> {
    yield { turn: 1, role: "assistant_delta", content: "x" };
    throw new Error(`send failed: POST ${telegramUrl}`);
  }
  const loop = { step: (_s: string) => failing() } as unknown as CacheFirstLoop;
  const eventizer = makeStubEventizer([]);
  // Private ctor is bypassed via a construct-signature cast so a throwing stub
  // loop can be injected. knownSecrets is [] because the bot-URL token is
  // caught by the redaction PATTERN, so no real secret is injected.
  const Ctor = HeadlessHost as unknown as new (
    opts: HeadlessHostCtorArgs,
  ) => {
    runTurn(text: string): Promise<string>;
  };
  const host = new Ctor({ loop, eventizer, ctx: baseCtx, session: "sess-scrub", knownSecrets: [] });
  const returned = await host.runTurn("ping");
  assert.ok(
    !returned.includes("123456789:AAFfakeTELEGRAMtoken0123456789xyz"),
    "HeadlessHost.runTurn return must not carry the plaintext Telegram token",
  );
  assert.ok(returned.includes("[redacted]"), "HeadlessHost.runTurn return must show [redacted]");
}

// REAL force-summary shape (force-summary.ts:71-83): status → error(recoverable)
// → done, with NO assistant_final. A naive `!recoverable` guard would collapse
// this into silence; the fix routes the message to onRecoverableError instead.
function forceSummaryEvents(): LoopEvent[] {
  return [
    { turn: 1, role: "status", content: "summarizing…" },
    {
      turn: 1,
      role: "error",
      content: "",
      error: "context guard summary failed: upstream 503",
      errorDetail: {
        name: "ForceSummaryFailed",
        message: "context guard summary failed: upstream 503",
        retryable: true,
        recoverable: true,
      },
    },
    { turn: 1, role: "done", content: "" },
  ];
}

async function runRecoverableErrorKeepsEndTurnCase(): Promise<void> {
  const loop = makeStubLoop(forceSummaryEvents());
  let captured = "";
  let recoverableMsg = "";
  const outcome = await runHeadlessTurn({
    loop,
    ctx: baseCtx,
    eventizer: new Eventizer(),
    signal: new AbortController().signal,
    text: "ping",
    onAssistantText: (content) => {
      captured = content;
    },
    onRecoverableError: (message) => {
      recoverableMsg = message;
    },
  });
  assert.equal(outcome, "end_turn", "a recoverable error must NOT flip the turn to error");
  assert.equal(captured, "", "no assistant_final followed the recoverable error");
  assert.ok(
    recoverableMsg.includes("context guard summary failed"),
    "onRecoverableError must receive the recoverable error message",
  );
}

async function runTerminalErrorTerminatesCase(): Promise<void> {
  const events: LoopEvent[] = [
    { turn: 1, role: "assistant_delta", content: "x" },
    {
      turn: 1,
      role: "error",
      content: "",
      error: "fatal boom",
      errorDetail: { name: "Fatal", message: "fatal boom", retryable: false, recoverable: false },
    },
  ];
  const outcome = await runHeadlessTurn({
    loop: makeStubLoop(events),
    ctx: baseCtx,
    eventizer: new Eventizer(),
    signal: new AbortController().signal,
    text: "ping",
    onAssistantText: () => undefined,
  });
  assert.equal(outcome, "error", "a non-recoverable error must terminate the turn");
}

async function runHostForwardsOnEventCase(): Promise<void> {
  const events: LoopEvent[] = [
    { turn: 1, role: "assistant_delta", content: "x" },
    { turn: 1, role: "tool_start", content: "", toolName: "read_file", toolArgs: "{}" },
    { turn: 1, role: "tool", content: "ok", toolName: "read_file" },
    { turn: 1, role: "assistant_final", content: "hi" },
    { turn: 1, role: "done", content: "" },
  ];
  const Ctor = HeadlessHost as unknown as new (
    opts: HeadlessHostCtorArgs,
  ) => {
    runTurn(text: string, hooks?: { onEvent?: (kev: { type: string }) => void }): Promise<string>;
  };
  const host = new Ctor({
    loop: makeStubLoop(events),
    eventizer: new Eventizer(),
    ctx: baseCtx,
    session: "sess-onevent",
    knownSecrets: [],
  });
  const received: string[] = [];
  await host.runTurn("ping", {
    onEvent: (kev) => {
      received.push(kev.type);
    },
  });
  assert.ok(received.includes("model.turn.started"), "onEvent must see model.turn.started");
  assert.ok(received.includes("tool.intent"), "onEvent must see tool.intent");
  assert.ok(received.includes("model.final"), "onEvent must see model.final");
}

async function runHostSurfacesRecoverableErrorCase(): Promise<void> {
  const Ctor = HeadlessHost as unknown as new (
    opts: HeadlessHostCtorArgs,
  ) => {
    runTurn(text: string): Promise<string>;
  };
  const host = new Ctor({
    loop: makeStubLoop(forceSummaryEvents()),
    eventizer: new Eventizer(),
    ctx: baseCtx,
    session: "sess-recover",
    knownSecrets: [],
  });
  const returned = await host.runTurn("ping");
  assert.ok(returned.trim() !== "", "recoverable force-summary failure must not return silence");
  assert.ok(
    returned.includes("context guard summary failed"),
    "host.runTurn must surface the recoverable error message, not the empty string",
  );
}

let testCount = 0;
let failure: Error | null = null;

async function run(): Promise<void> {
  const cases: Array<[string, () => Promise<void>]> = [
    ["assistant_final captures text + eventizer consumes every event", runAssistantTextCase],
    [
      "abort renders the aborted sentinel and does NOT surface prior assistant text",
      runAbortedCase,
    ],
    ["loop error calls onError and resolves with the error sentinel", runErrorCase],
    [
      "headlessContext AsyncLocalStorage is set for the duration of the turn",
      runAsyncLocalStorageCase,
    ],
    [
      "formatHeadlessError scrubs the classified error string (both host sinks)",
      runFormatHeadlessErrorScrubCase,
    ],
    [
      "HeadlessHost.runTurn scrubs the error it returns to the channel",
      runHostRunTurnReturnScrubCase,
    ],
    [
      "recoverable error keeps end_turn and routes its message to onRecoverableError",
      runRecoverableErrorKeepsEndTurnCase,
    ],
    ["non-recoverable error terminates the turn", runTerminalErrorTerminatesCase],
    [
      "host.runTurn forwards onEvent kernel events (turn.started/tool.intent/final)",
      runHostForwardsOnEventCase,
    ],
    [
      "host.runTurn surfaces a recoverable error message instead of the empty string",
      runHostSurfacesRecoverableErrorCase,
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

// Self-execute when node imports this file directly so the plan's
// `node --import tsx tests/headless-host.test.ts` verify gate emits an exit code.
// vitest importing this file triggers `import.meta.url === pathToFileURL(process.argv[1])`
// to be false, so the self-exec tail is inert under vitest.
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
describe("headless-host", () => {
  it("runs all headless host cases (assistant text, abort, error, AsyncLocalStorage)", async () => {
    await run();
    expect(failure, failure?.message ?? "").toBeNull();
  });
});
