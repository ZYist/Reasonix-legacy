// Transport-protocol-agnostic headless conversation host.
//
// Replicates the `buildRuntimeFor` recipe from `src/cli/commands/desktop.ts:1374-1397`
// (CacheFirstLoop + ImmutablePrefix + DeepSeekClient + ToolRegistry via applyPlanMode
// + Eventizer) so that QQ / Telegram / Weixin channel CLI commands can mount onto a
// single, tested core-construction path (BOT-03: core reuse without reimplementation).
//
// This module is the HEADLESS host — no React, no Ink, no NDJSON-RPC, no channel
// transport import (`src/qq/*`, `src/telegram/*`, `src/weixin/*` are forbidden).
// Channel commands (02-02 qq.ts, 02-03 telegram.ts / weixin.ts) wire
// `HeadlessHost.create({...})` + `host.runTurn(text)` + `host.shutdown()`.
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { codeSystemPrompt } from "../../code/prompt.js";
import { applyPlanMode, buildCodeToolset } from "../../code/setup.js";
import {
  DEFAULT_MODEL,
  type ReasoningEffort,
  loadEditMode,
  loadEndpoint,
  loadMaxIterPerTurn,
  loadModel,
  loadReasoningEffort,
} from "../../config.js";
import { Eventizer } from "../../core/eventize.js";
import { t } from "../../i18n/index.js";
import { CacheFirstLoop, DeepSeekClient, ImmutablePrefix } from "../../index.js";
import { errorMeta } from "../../loop/errors.js";
import { timestampSuffix } from "../../memory/session.js";
import { type HeadlessHostContext, runHeadlessTurn } from "./turn-driver.js";

// Re-exported so gate-bridges.ts can recover the active session id from the
// AsyncLocalStorage binding set in host.runTurn without importing turn-driver
// directly. The plan (Task 2) mandates gate-bridges read the session id via
// getActiveSessionId() exported from host.ts.
export { getActiveSessionId, headlessContext } from "./turn-driver.js";

export interface HeadlessHostOptions {
  // Resolved workspace root — must exist + be a directory. Crash on missing
  // (D-09 + CLAUDE.md "log + crash > silent wrong output": no silent cwd
  // fallback here, the COMMAND layer decides workspace precedence).
  rootDir: string;
  model: string;
  budgetUsd?: number;
  /** Override the auto-minted `headless-<timestampSuffix>` session name. */
  session?: string;
  /** Inline string appended after the code system prompt (mirrors ACP's
   *  REASONIX_ACP_SYSTEM_APPEND and desktop's tab.system). */
  systemAppend?: string;
}

// Resolves a workspace override against a fallback (cwd), crash-validating
// that the path exists + is a directory — mirrors acp.ts:148-155 exactly.
// No silent fallback: an empty/non-dir path throws rather than degrade to cwd.
export function resolveDir(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const abs = resolve(raw);
  if (!existsSync(abs) || !statSync(abs).isDirectory()) {
    throw new Error(`workspace directory not found: ${abs}`);
  }
  return abs;
}

export class HeadlessHost {
  /** Constructed loop + eventizer + ctx bundle (RuntimeState from desktop.ts:1315). */
  private readonly loop: CacheFirstLoop;
  private readonly eventizer: Eventizer;
  private readonly ctx: HeadlessHostContext;
  private readonly session: string;
  private aborter: AbortController | null = null;

  private constructor(opts: {
    loop: CacheFirstLoop;
    eventizer: Eventizer;
    ctx: HeadlessHostContext;
    session: string;
  }) {
    this.loop = opts.loop;
    this.eventizer = opts.eventizer;
    this.ctx = opts.ctx;
    this.session = opts.session;
  }

  // Build a HeadlessHost by replicating the desktop buildRuntimeFor recipe
  // (desktop.ts:1374-1397). Factory avoids leaking partially-built state if any
  // step throws (e.g. buildCodeToolset fails on an unreadable rootDir).
  static async create(opts: HeadlessHostOptions): Promise<HeadlessHost> {
    const model = opts.model || loadModel() || DEFAULT_MODEL;
    const toolset = await buildCodeToolset({ rootDir: opts.rootDir });
    // Plan-mode gate threaded in ahead of prefix build so the registry's dispatch
    // gate matches the persisted EditMode — same call order as desktop.ts:1377.
    applyPlanMode(toolset.tools, loadEditMode());
    const system = codeSystemPrompt(opts.rootDir, {
      hasSemanticSearch: toolset.semantic.enabled,
      modelId: model,
      systemAppend: opts.systemAppend,
    });
    const ep = loadEndpoint();
    const client = new DeepSeekClient({ apiKey: ep.apiKey, baseUrl: ep.baseUrl });
    const prefix = new ImmutablePrefix({ system, toolSpecs: toolset.tools.specs() });
    const reasoningEffort = loadReasoningEffort();
    const session = opts.session ?? `headless-${timestampSuffix()}`;
    const loop = new CacheFirstLoop({
      client,
      prefix,
      tools: toolset.tools,
      model,
      budgetUsd: opts.budgetUsd,
      session,
      reasoningEffort,
      maxIterPerTurn: loadMaxIterPerTurn(),
      hookCwd: opts.rootDir,
    });
    const eventizer = new Eventizer();
    const ctx: HeadlessHostContext = {
      model,
      prefixHash: prefix.fingerprint,
      reasoningEffort,
    };
    return new HeadlessHost({ loop, eventizer, ctx, session });
  }

  // Drive a single conversation turn end-to-end. Returns the captured
  // assistant_final text, the "(aborted)" sentinel on abort, or the
  // errorMeta-classified error message captured via runHeadlessTurn's onError
  // (surfaces to the caller via sendResponse, and is mirrored to stderr so a
  // detached-bot operator tailing the log can diagnose it).
  async runTurn(text: string): Promise<string> {
    this.aborter = new AbortController();
    let lastAssistantText = "";
    let outcome: "end_turn" | "aborted" | "error" = "end_turn";
    let errMessage = "";
    // runHeadlessTurn classifies a thrown loop error via errorMeta and reports
    // it through onError — it never rethrows — so the cause is captured here
    // rather than dropped to the generic fallback. Detached bots have no TUI
    // "error above" to read, so the same message is mirrored to stderr.
    try {
      outcome = await runHeadlessTurn({
        loop: this.loop,
        ctx: this.ctx,
        eventizer: this.eventizer,
        signal: this.aborter.signal,
        text,
        sessionId: this.session,
        onAssistantText: (content) => {
          lastAssistantText = content;
        },
        onError: (cause, meta) => {
          errMessage =
            meta.code || meta.phase
              ? `${cause.message} [code=${meta.code ?? "?"} phase=${meta.phase ?? "?"}]`
              : cause.message;
          process.stderr.write(`${errMessage}\n`);
        },
      });
    } finally {
      this.aborter = null;
    }
    if (outcome === "aborted") return t("headless.host.abortedSentinel");
    if (outcome === "error") return errMessage || t("headless.host.errorFallback");
    return lastAssistantText;
  }

  /** Release the in-flight aborter (if any) and free loop resources. */
  shutdown(): void {
    this.aborter?.abort();
    this.aborter = null;
  }
}
