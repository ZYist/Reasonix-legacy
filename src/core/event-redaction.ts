const SECRET_KEY_RE =
  /(secret|token|password|passphrase|api[-_]?key|authorization|cookie|credential|passwd|pwd)/i;

const MIN_SECRET_LEN = 8;
const TELEGRAM_BOT_TOKEN_RE = /bot\d{5,}:[A-Za-z0-9_-]{20,}/g;
const BEARER_TOKEN_RE = /Bearer\s+\S+/gi;

export function redactEventValue<T>(value: T): T {
  return redactUnknown(value, null) as T;
}

// Value-level scrubber for free-form error text bound for logs or a chat channel:
// literal-replaces each known secret value, then strips Telegram bot-URL tokens
// and Bearer credentials by pattern.
export function redactSecretsInText(text: string, knownSecrets: readonly string[]): string {
  if (!text) return text;
  let out = text;
  for (const secret of knownSecrets) {
    if (secret.length >= MIN_SECRET_LEN) out = out.replaceAll(secret, "[redacted]");
  }
  out = out.replace(TELEGRAM_BOT_TOKEN_RE, "[redacted]");
  out = out.replace(BEARER_TOKEN_RE, "Bearer [redacted]");
  return out;
}

function redactUnknown(value: unknown, key: string | null): unknown {
  if (Array.isArray(value)) return value.map((item) => redactUnknown(item, null));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      out[childKey] = redactUnknown(childValue, childKey);
    }
    return out;
  }
  if (typeof value === "string") {
    if ((key && SECRET_KEY_RE.test(key)) || /^Bearer\s+/i.test(value)) return "[redacted]";
  }
  return value;
}
