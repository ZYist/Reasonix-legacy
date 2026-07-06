// Gate reply parsers — pure string→verdict functions shared by the headless
// gate-bridge and the qq/telegram/weixin channel hooks. React-free by design.

export type ReviseChoice = "accept" | "reject";

export function parseIndexedChoice(text: string): number {
  const rawIndex = text.match(/^(\d+)/)?.[1];
  return rawIndex ? Number.parseInt(rawIndex, 10) - 1 : -1;
}

export function parseRunPermissionChoice(text: string): "run_once" | "always_allow" | "deny" {
  const lower = text.toLowerCase().trim();
  // Refusals short-circuit first: "don't run it" contains "run" but is a deny.
  // Word boundaries stop substring false-matches ("rerun" → deny, not run_once).
  if (/\b(don't|do not|no|nope|cancel|deny|stop|never)\b/.test(lower)) return "deny";
  const idx = parseIndexedChoice(text);
  if (idx === 0) return "run_once";
  if (idx === 1) return "always_allow";
  if (/\b(run|yes|ok|allow|approve)\b/.test(lower)) return "run_once";
  if (/\balways\b/.test(lower)) return "always_allow";
  return "deny";
}

export function parsePlanChoice(text: string): "approve" | "refine" | "cancel" {
  const lower = text.toLowerCase();
  if (lower.includes("1") || lower.includes("approve")) return "approve";
  if (lower.includes("2") || lower.includes("refine")) return "refine";
  return "cancel";
}

export function parseCheckpointChoice(text: string): "continue" | "revise" | "stop" {
  const lower = text.toLowerCase();
  if (lower.includes("1") || lower.includes("continue")) return "continue";
  if (lower.includes("2") || lower.includes("revise")) return "revise";
  return "stop";
}

export function parseRevisionChoice(text: string): ReviseChoice | "cancel" {
  const lower = text.toLowerCase();
  if (lower.includes("1") || lower.includes("accept")) return "accept";
  if (lower.includes("2") || lower.includes("reject")) return "reject";
  return "cancel";
}

export function stripFollowupPrefix(text: string): string {
  return text
    .replace(
      /^(?:\d+\s*|approve\s*|refine\s*|cancel\s*|continue\s*|revise\s*|stop\s*|accept\s*|reject\s*|run\s*|always\s*|deny\s*)/iu,
      "",
    )
    .trim();
}
