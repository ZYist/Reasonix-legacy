// `reasonix weixin` — standalone Weixin (WeChat) bot command (BOT-02).
//
// Thin entry (D-04): assembles HeadlessHost (02-01) + WeixinChannel +
// installHeadlessGateBridges, wires inbound onSubmitMessage to
// host.runTurn and outbound replies to channel.sendResponse. Same
// gate-callback shape as `reasonix qq`/`telegram` (D-08).
//
// PINNED QR-login-before-start path: WeixinChannel.start() does NOT
// internally drive the QR scan — it requires loadWeixinConfig() to
// already yield token+accountId (throws missingToken/missingAccountId
// otherwise). The interactive QR scan is driven by the standalone helper
// runWeixinQrLogin (bot.ts), invoked HERE before channel.start() when
// (and only when) the loaded config has no token OR no accountId. The QR
// text is surfaced via the runWeixinQrLogin onInfo callback to stderr.
//
// Constructor shape: WeixinChannel ctor accepts {onSubmitMessage,
// onError?, onInfo?} — diverges from TelegramChannel (no onInfo) and
// matches QQChannel.
//
// Coexistence (D-09): desktop sidecar byte-for-byte unchanged.
import { collectBotSecrets, loadWeixinConfig, saveWeixinConfig } from "../../config.js";
import { redactSecretsInText } from "../../core/event-redaction.js";
import { t } from "../../i18n/index.js";
import { runWeixinQrLogin } from "../../weixin/bot.js";
import { WeixinChannel } from "../../weixin/channel.js";
import {
  type InstalledHeadlessGateBridge,
  installHeadlessGateBridges,
} from "../headless/gate-bridges.js";
import { bootHeadlessHost } from "../headless/host.js";
import { SurfaceNotifier } from "../headless/surface-notifier.js";

export interface WeixinCommandOptions {
  /** Override the default model id. */
  model?: string;
  /** Workspace root for filesystem tools. Defaults to cwd. */
  workspace?: string;
  /** Soft USD spend cap. */
  budgetUsd?: number;
}

// Mount the Weixin channel onto a HeadlessHost and run until SIGINT/SIGTERM.
// Lifecycle: loadDotenv → bridgeEndpointEnv → resolveDir → HeadlessHost.create
// → signal handlers → (QR login if creds missing) → installHeadlessGateBridges
// → new WeixinChannel → channel.start.
export async function weixinCommand(opts: WeixinCommandOptions = {}): Promise<void> {
  // Boot the shared headless preamble (env discipline + workspace + model).
  const host = await bootHeadlessHost(opts);

  // Mutable bindings declared up front so the cleanup closure + signal handlers
  // (installed BEFORE the QR window) can reference the not-yet-built
  // channel/bridge via optional chaining.
  let channel: WeixinChannel | null = null;
  let bridge: InstalledHeadlessGateBridge | null = null;
  let turnInFlight = false;
  let cleaningUp = false;

  // (5) T-02-14 mitigation: install SIGINT/SIGTERM cleanup BEFORE the QR-login
  // window so Ctrl-C during the multi-minute scan tears the host down cleanly
  // even before the channel/bridge exist (null-safe teardown).
  const cleanup = async (): Promise<void> => {
    if (cleaningUp) return;
    cleaningUp = true;
    bridge?.unsubscribe();
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

  // (6) PINNED QR-login-before-start path: WeixinChannel.start() requires
  // token+accountId already configured (throws otherwise). When the saved
  // config lacks either, run runWeixinQrLogin (bot.ts) to obtain
  // {token, accountId, baseUrl, userId} and persist them via
  // saveWeixinConfig (mirrors completeConnect in use-weixin-channel.ts).
  // The QR text is rendered to stderr by runWeixinQrLogin's onInfo callback.
  const existing = loadWeixinConfig();
  if (!existing.token || !existing.accountId) {
    const creds = await runWeixinQrLogin({
      onInfo: (msg) => process.stderr.write(`${msg}\n`),
    });
    saveWeixinConfig({
      token: creds.token,
      accountId: creds.accountId,
      baseUrl: creds.baseUrl,
      enabled: true,
      ownerUserId: existing.ownerUserId ?? creds.userId,
      allowlist: existing.allowlist,
    });
  }

  // Snapshot the channel secrets AFTER the QR-login persist so a freshly
  // scanned Weixin token is included in the redaction set for this run.
  const botSecrets = collectBotSecrets();

  // (7) Gate bridge — pauseGate.on subscription. The bridge resolves
  // pauseGate directly (owns gateId), so no observer callbacks are wired here.
  bridge = installHeadlessGateBridges({
    sendPrompt: (promptText) => {
      if (promptText) {
        void channel?.sendResponse(promptText).catch((err) => {
          process.stderr.write(
            t("commands.weixin.sendFailed", {
              msg: redactSecretsInText((err as Error).message, botSecrets),
            }),
          );
        });
      }
    },
  });

  // (8) WeixinChannel — ctor accepts {onSubmitMessage, onError, onInfo}
  // (matches QQChannel, diverges from TelegramChannel). onInfo surfaces
  // runtime channel messages (e.g. online banner) to stderr.
  channel = new WeixinChannel({
    onSubmitMessage: (text) => {
      if (bridge?.consumeReply(text)) return;
      if (turnInFlight) {
        void channel?.sendResponse(t("commands.weixin.busy")).catch(() => undefined);
        return;
      }
      turnInFlight = true;
      // weixin = active send-by-userId gateway with no per-inbound budget -> LIVE
      // notices; this is the internal-feedback surface for the weixin chat session.
      const notifier = new SurfaceNotifier({
        mode: "live",
        emit: (message) => {
          void channel?.sendResponse(message).catch((err) => {
            process.stderr.write(
              t("commands.weixin.sendFailed", {
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
                t("commands.weixin.sendFailed", {
                  msg: redactSecretsInText((err as Error).message, botSecrets),
                }),
              );
            });
          }
        })
        .catch((err) => {
          process.stderr.write(
            t("commands.weixin.error", {
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
        t("commands.weixin.error", { msg: redactSecretsInText(msg, botSecrets) }),
      );
    },
    onInfo: (msg) => {
      process.stderr.write(`${msg}\n`);
    },
  });

  // (9) channel.start acquires the Weixin PID lock, re-loads the (now
  // persisted) config, constructs WeixinBot, and connects. The bot
  // handle keeps Node alive after this returns; signal handlers own
  // teardown.
  await channel.start();
}
