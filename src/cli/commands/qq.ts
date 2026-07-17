// `reasonix-legacy qq` — standalone QQ bot command (BOT-01).
//
// Thin entry (D-04): assembles HeadlessHost (02-01) + QQChannel +
// installHeadlessGateBridges, wires inbound onSubmitMessage to
// host.runTurn and outbound replies to channel.sendResponse. The command
// owns ONLY装配 + lifecycle — no business logic (that lives in the host
// + adapter + channel protocol layer).
//
// Coexistence (D-09/D-10): the desktop sidecar (desktopCommand +
// qqRuntime + src/desktop/qq-*.ts) is byte-for-byte unchanged. QQ now
// has TWO entries — the sidecar and this command — guarded against
// same-account double-drive by QQ_LOCK_FILE (channel.ts:11). Sidecar
// deletion is deferred to a later milestone.
import { collectBotSecrets } from "../../config.js";
import { redactSecretsInText } from "../../core/event-redaction.js";
import { t } from "../../i18n/index.js";
import { QQChannel } from "../../qq/channel.js";
import { installHeadlessGateBridges } from "../headless/gate-bridges.js";
import { bootHeadlessHost } from "../headless/host.js";
import { SurfaceNotifier } from "../headless/surface-notifier.js";

export interface QqCommandOptions {
  /** Override the default model id. */
  model?: string;
  /** Workspace root for filesystem tools. Defaults to cwd. */
  workspace?: string;
  /** Soft USD spend cap. */
  budgetUsd?: number;
}

// Mount the QQ channel onto a HeadlessHost and run until SIGINT/SIGTERM.
// Lifecycle: loadDotenv → bridgeEndpointEnv → resolveDir → HeadlessHost.create →
// installHeadlessGateBridges → new QQChannel → signal handlers → channel.start.
// Signal handlers own teardown: channel.stop releases QQ_LOCK_FILE,
// host.shutdown aborts in-flight turns, bridge.unsubscribe frees the listener.
export async function qqCommand(opts: QqCommandOptions = {}): Promise<void> {
  // Boot the shared headless preamble (env discipline + workspace + model).
  const host = await bootHeadlessHost(opts);

  // Snapshot the channel secrets once (long-lived process, stable config) so
  // every error/sendFailed write below can scrub them.
  const botSecrets = collectBotSecrets();

  // channel is referenced by closures before construction completes; the
  // `let` binding lets the gate-bridge sendPrompt + onSubmitMessage read
  // the live instance once `new QQChannel` assigns it.
  let channel: QQChannel | null = null;
  let turnInFlight = false;
  let cleaningUp = false;

  // (5) Gate bridge — pauseGate.on subscription that prompts the channel
  // and dispatches replies. The bridge resolves pauseGate directly (it owns
  // the gateId), so no observer callbacks are wired here.
  const bridge = installHeadlessGateBridges({
    sendPrompt: (promptText) => {
      if (promptText) {
        void channel?.sendResponse(promptText).catch((err) => {
          process.stderr.write(
            t("commands.qq.sendFailed", {
              msg: redactSecretsInText((err as Error).message, botSecrets),
            }),
          );
        });
      }
    },
  });

  // (6) QQChannel — inbound onSubmitMessage routes gate replies first
  // (consumeReply), else drives a new host turn. Concurrent inbound
  // (D-10 + 02-01 T-02-04): if a turn is in flight, drop with a busy
  // notice (host.runTurn rejects concurrent; classifyDesktopQQIngress
  // replication — the drop is surfaced via sendResponse, not silent).
  channel = new QQChannel({
    onSubmitMessage: (text) => {
      if (bridge.consumeReply(text)) return;
      if (turnInFlight) {
        void channel?.sendResponse(t("commands.qq.busy")).catch(() => undefined);
        return;
      }
      turnInFlight = true;
      // qq = bounded C2C msgSeq reply budget keyed to the inbound message -> FOLD the
      // notices into the one reply so the final answer is never starved of msgSeq.
      const notifier = new SurfaceNotifier({ mode: "fold", emit: () => undefined });
      void host
        .runTurn(text, { onEvent: (kev) => notifier.note(kev) })
        .then((assistantText) => {
          // Empty answer -> reply collapses to "" and the guard suppresses it: the
          // notices adorn a real answer, they never stand alone as a reply.
          const summary = notifier.summary();
          const reply = summary && assistantText ? `${summary}\n\n${assistantText}` : assistantText;
          if (reply) {
            void channel?.sendResponse(reply).catch((err) => {
              process.stderr.write(
                t("commands.qq.sendFailed", {
                  msg: redactSecretsInText((err as Error).message, botSecrets),
                }),
              );
            });
          }
        })
        .catch((err) => {
          process.stderr.write(
            t("commands.qq.error", {
              msg: redactSecretsInText((err as Error).message, botSecrets),
            }),
          );
        })
        .finally(() => {
          turnInFlight = false;
        });
    },
    onError: (msg) => {
      process.stderr.write(t("commands.qq.error", { msg: redactSecretsInText(msg, botSecrets) }));
    },
    onInfo: (msg) => {
      process.stderr.write(`${msg}\n`);
    },
  });

  // (7) T-02-09 mitigation: install SIGINT/SIGTERM handlers BEFORE
  // channel.start so Ctrl-C always releases the PID lock even if start
  // hangs. Idempotent guard prevents re-entry during the async cleanup.
  const cleanup = async (): Promise<void> => {
    if (cleaningUp) return;
    cleaningUp = true;
    bridge.unsubscribe();
    try {
      await channel?.stop();
    } catch {
      // best-effort — the lock release inside stop() is the load-bearing bit
    } finally {
      host.shutdown();
      process.exit(0);
    }
  };
  process.on("SIGINT", () => void cleanup());
  process.on("SIGTERM", () => void cleanup());

  // (8) channel.start acquires QQ_LOCK_FILE, connects the WebSocket, and
  // resolves once the bot is online. The WebSocket handle keeps Node
  // alive after this returns; signal handlers own teardown.
  await channel.start();
}
