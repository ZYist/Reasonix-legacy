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
import {
  DEFAULT_MODEL,
  bridgeEndpointEnv,
  loadModel,
  loadWeixinConfig,
  saveWeixinConfig,
} from "../../config.js";
import { loadDotenv } from "../../env.js";
import { t } from "../../i18n/index.js";
import { runWeixinQrLogin } from "../../weixin/bot.js";
import { WeixinChannel } from "../../weixin/channel.js";
import { defaultBuildPrompt, installHeadlessGateBridges } from "../headless/gate-bridges.js";
import { HeadlessHost, resolveDir } from "../headless/host.js";

export interface WeixinCommandOptions {
  /** Override the default model id. */
  model?: string;
  /** Workspace root for filesystem tools. Defaults to cwd. */
  workspace?: string;
  /** Reasoning effort tag (persisted upstream in cli/index.ts). */
  effort?: string;
  /** Soft USD spend cap. */
  budgetUsd?: number;
}

// Mount the Weixin channel onto a HeadlessHost and run until SIGINT/SIGTERM.
// Lifecycle: loadDotenv → bridgeEndpointEnv → resolveDir → HeadlessHost.create
// → (QR login if creds missing) → installHeadlessGateBridges → new
// WeixinChannel → signal handlers → channel.start.
export async function weixinCommand(opts: WeixinCommandOptions = {}): Promise<void> {
  // (1) Boot — mirror code.tsx:48-87 env discipline.
  loadDotenv();
  bridgeEndpointEnv();

  // (2) Workspace: --workspace flag > cwd > crash (resolveDir throws on
  // missing/non-dir — no silent fallback).
  const rootDir = resolveDir(opts.workspace, process.cwd());

  // (3) Model resolution.
  const model = opts.model?.trim() || loadModel() || DEFAULT_MODEL;

  // (4) HeadlessHost (02-01) — replicates buildRuntimeFor.
  const host = await HeadlessHost.create({
    rootDir,
    model,
    budgetUsd: opts.budgetUsd,
  });

  // (5) PINNED QR-login-before-start path: WeixinChannel.start() requires
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

  // channel is referenced by closures before construction completes.
  let channel: WeixinChannel | null = null;
  let turnInFlight = false;
  let cleaningUp = false;

  // (6) Gate bridge — pauseGate.on subscription. The bridge resolves
  // pauseGate directly (owns gateId); observer callbacks are no-ops
  // (resolution path owned by dispatchReply — Rule 1 fix in 02-02).
  const bridge = installHeadlessGateBridges({
    sendPrompt: (kind, payload) => {
      const prompt = defaultBuildPrompt(kind, payload);
      if (prompt) {
        void channel?.sendResponse(prompt).catch((err) => {
          process.stderr.write(t("commands.weixin.sendFailed", { msg: (err as Error).message }));
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

  // (7) WeixinChannel — ctor accepts {onSubmitMessage, onError, onInfo}
  // (matches QQChannel, diverges from TelegramChannel). onInfo surfaces
  // runtime channel messages (e.g. online banner) to stderr.
  channel = new WeixinChannel({
    onSubmitMessage: (text) => {
      if (bridge.consumeReply(text)) return;
      if (turnInFlight) {
        void channel?.sendResponse(t("commands.weixin.busy")).catch(() => undefined);
        return;
      }
      turnInFlight = true;
      void host
        .runTurn(text)
        .then((assistantText) => {
          if (assistantText) {
            void channel?.sendResponse(assistantText).catch((err) => {
              process.stderr.write(
                t("commands.weixin.sendFailed", { msg: (err as Error).message }),
              );
            });
          }
        })
        .catch((err) => {
          process.stderr.write(t("commands.weixin.error", { msg: (err as Error).message }));
        })
        .finally(() => {
          turnInFlight = false;
        });
    },
    onError: (msg) => {
      process.stderr.write(t("commands.weixin.error", { msg }));
    },
    onInfo: (msg) => {
      process.stderr.write(`${msg}\n`);
    },
  });

  // (8) T-02-14 mitigation: install SIGINT/SIGTERM handlers BEFORE
  // channel.start so Ctrl-C always tears the channel down + releases the
  // Weixin PID lock even if start hangs. Idempotent guard.
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

  // (9) channel.start acquires the Weixin PID lock, re-loads the (now
  // persisted) config, constructs WeixinBot, and connects. The bot
  // handle keeps Node alive after this returns; signal handlers own
  // teardown.
  await channel.start();
}
