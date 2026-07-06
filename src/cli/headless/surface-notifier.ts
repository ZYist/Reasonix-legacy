// Transport-agnostic MINIMAL notice engine for bot chat surfaces: one thinking
// notice + one line per tool.intent, emitted live or folded into a summary.
import type { Event } from "../../core/events.js";
import { t } from "../../i18n/index.js";

export type NoticeMode = "live" | "fold";

export interface SurfaceNotifierOptions {
  mode: NoticeMode;
  /** Fire-and-forget sink — MUST be non-throwing (commands wrap sendResponse().catch()). */
  emit: (message: string) => void;
}

export class SurfaceNotifier {
  private readonly mode: NoticeMode;
  private readonly emit: (message: string) => void;
  private thinkingSeen = false;
  private readonly foldLines: string[] = [];

  constructor(opts: SurfaceNotifierOptions) {
    this.mode = opts.mode;
    this.emit = opts.emit;
  }

  // Surface ONLY a thinking notice (first model event) + one line per tool.intent.
  // Tool args, tool-result bodies, and reasoning text are never surfaced.
  note(kev: Event): void {
    if (kev.type === "model.turn.started" || kev.type === "model.delta") {
      if (this.thinkingSeen) return;
      this.thinkingSeen = true;
      this.record(t("headless.notice.thinking"));
      return;
    }
    if (kev.type === "tool.intent") {
      this.record(t("headless.notice.tool", { tool: kev.name }));
    }
  }

  /** Live: emit the line the moment its event fires. Fold: buffer it for summary(). */
  private record(line: string): void {
    if (this.mode === "live") this.emit(line);
    else this.foldLines.push(line);
  }

  // Fold: thinking line first, then one line per tool.intent ("" when empty). Live
  // already emitted each line as it fired, so there is nothing to summarize.
  summary(): string {
    return this.mode === "fold" ? this.foldLines.join("\n") : "";
  }
}
