// `reasonix telegram` — standalone Telegram bot command (BOT-02).
//
// Thin entry (D-04): assembles HeadlessHost (02-01) + TelegramChannel +
// installHeadlessGateBridges, wires inbound onSubmitMessage to
// host.runTurn and outbound replies to channel.sendResponse. Same
// gate-callback shape as `reasonix qq` (02-02) — the host mounts the
// channel rather than rewriting its long-polling protocol (D-08).
//
// Constructor divergence (PATTERNS.md): TelegramChannel's ctor accepts
// ONLY {onSubmitMessage, onError?} — there is no onInfo callback because
// Telegram uses botToken long-polling with no QR-login flow. Any
// informational startup text is written to stderr directly here, NOT
// through a channel callback.
//
// Coexistence (D-09): the desktop sidecar (desktopCommand + qqRuntime +
// src/desktop/*) is byte-for-byte unchanged. Telegram was never wired
// into the Tauri sidecar, but D-09 is the global no-regression contract.
import { DEFAULT_MODEL, bridgeEndpointEnv, collectBotSecrets, loadModel } from "../../config.js";
import { redactSecretsInText } from "../../core/event-redaction.js";
import { loadDotenv } from "../../env.js";
import { t } from "../../i18n/index.js";
import { TelegramChannel } from "../../telegram/channel.js";
import { defaultBuildPrompt, installHeadlessGateBridges } from "../headless/gate-bridges.js";
import { HeadlessHost, resolveDir } from "../headless/host.js";
import { SurfaceNotifier } from "../headless/surface-notifier.js";

export interface TelegramCommandOptions {
  /** Override the default model id. */
  model?: string;
  /** Workspace root for filesystem tools. Defaults to cwd. */
  workspace?: string;
  /** Reasoning effort tag (persisted upstream in cli/index.ts). */
  effort?: string;
  /** Soft USD spend cap. */
  budgetUsd?: number;
}

// Mount the Telegram channel onto a HeadlessHost and run until SIGINT/SIGTERM.
// Lifecycle: loadDotenv → bridgeEndpointEnv → resolveDir → HeadlessHost.create
// → installHeadlessGateBridges → new TelegramChannel({onSubmitMessage,
// onError}) → signal handlers → channel.start.
export async function telegramCommand(opts: TelegramCommandOptions = {}): Promise<void> {
  // (1) Boot — mirror code.tsx:48-87 env discipline so buildCodeToolset's
  // eager DeepSeekClient constructions pick up a configured key.
  loadDotenv();
  bridgeEndpointEnv();

  // Snapshot the channel secrets once (long-lived process, stable config) so
  // every error/sendFailed write below can scrub them.
  const botSecrets = collectBotSecrets();

  // (2) Workspace: --workspace flag > cwd > crash (resolveDir throws on
  // missing/non-dir — no silent fallback per CLAUDE.md log+crash rule).
  const rootDir = resolveDir(opts.workspace, process.cwd());

  // (3) Model resolution — mirror acp.ts resolveDefaults minimal path.
  const model = opts.model?.trim() || loadModel() || DEFAULT_MODEL;

  // (4) HeadlessHost (02-01) — replicates buildRuntimeFor: buildCodeToolset
  // → applyPlanMode → DeepSeekClient → ImmutablePrefix → CacheFirstLoop.
  const host = await HeadlessHost.create({
    rootDir,
    model,
    budgetUsd: opts.budgetUsd,
  });

  // channel is referenced by closures before construction completes; the
  // `let` binding lets the gate-bridge sendPrompt + onSubmitMessage read
  // the live instance once `new TelegramChannel` assigns it.
  let channel: TelegramChannel | null = null;
  let turnInFlight = false;
  let cleaningUp = false;

  // (5) Gate bridge — pauseGate.on subscription that prompts the channel
  // and dispatches replies. The bridge resolves pauseGate directly (it
  // owns the gateId); the observer callbacks here are no-ops because the
  // resolution path is fully owned by dispatchReply (Rule 1 fix in 02-02).
  const bridge = installHeadlessGateBridges({
    sendPrompt: (kind, payload) => {
      const prompt = defaultBuildPrompt(kind, payload);
      if (prompt) {
        void channel?.sendResponse(prompt).catch((err) => {
          process.stderr.write(
            t("commands.telegram.sendFailed", {
              msg: redactSecretsInText((err as Error).message, botSecrets),
            }),
          );
        });
      }
    },
    gateCallbacks: {
      onShellConfirm: () => undefined,
      onPathConfirm: () => undefined,
      onPlanCancel: () => undefined,
      onPlanFeedback: () => undefined,
      onCheckpointConfirm: () => undefined,
      onCheckpointRevise: () => undefined,
      onPlanRevision: () => undefined,
      onChoiceResolve: () => undefined,
    },
  });

  // (6) TelegramChannel — ctor accepts ONLY {onSubmitMessage, onError}:
  // Telegram has no QR-login flow, so there is no onInfo callback. Any
  // informational startup text is written to stderr directly below.
  channel = new TelegramChannel({
    onSubmitMessage: (text) => {
      if (bridge.consumeReply(text)) return;
      if (turnInFlight) {
        void channel?.sendResponse(t("commands.telegram.busy")).catch(() => undefined);
        return;
      }
      turnInFlight = true;
      // telegram = active push by chatId with no per-inbound budget -> LIVE notices,
      // emitted the moment each kernel event fires (thinking once + one per tool).
      const notifier = new SurfaceNotifier({
        mode: "live",
        emit: (message) => {
          void channel?.sendResponse(message).catch((err) => {
            process.stderr.write(
              t("commands.telegram.sendFailed", {
                msg: redactSecretsInText((err as Error).message, botSecrets),
              }),
            );
          });
        },
      });
      void host
        .runTurn(text, { onEvent: (kev) => notifier.note(kev) })
        .then((assistantText) => {
          if (assistantText) {
            void channel?.sendResponse(assistantText).catch((err) => {
              process.stderr.write(
                t("commands.telegram.sendFailed", {
                  msg: redactSecretsInText((err as Error).message, botSecrets),
                }),
              );
            });
          }
        })
        .catch((err) => {
          process.stderr.write(
            t("commands.telegram.error", {
              msg: redactSecretsInText((err as Error).message, botSecrets),
            }),
          );
        })
        .finally(() => {
          turnInFlight = false;
        });
    },
    onError: (msg) => {
      process.stderr.write(
        t("commands.telegram.error", { msg: redactSecretsInText(msg, botSecrets) }),
      );
    },
  });

  // (7) T-02-14 mitigation: install SIGINT/SIGTERM handlers BEFORE
  // channel.start so Ctrl-C always tears the channel down even if start
  // hangs. Idempotent guard prevents re-entry during the async cleanup.
  const cleanup = async (): Promise<void> => {
    if (cleaningUp) return;
    cleaningUp = true;
    bridge.unsubscribe();
    try {
      await channel?.stop();
    } catch {
      // best-effort teardown
    } finally {
      host.shutdown();
      process.exit(0);
    }
  };
  process.on("SIGINT", () => void cleanup());
  process.on("SIGTERM", () => void cleanup());

  // (8) channel.start opens the botToken long-poll connection and resolves
  // once the bot is online. The long-poll handle keeps Node alive after
  // this returns; signal handlers own teardown.
  await channel.start();
}
