import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { collectBotSecrets } from "../src/config.js";
import { redactEventValue, redactSecretsInText } from "../src/core/event-redaction.js";

const FAKE_DEEPSEEK_KEY = "sk-FAKEDEEPSEEKKEY0123456789abcdef";
const FAKE_TELEGRAM_TOKEN = "123456789:AAFfakeTELEGRAMtoken0123456789xyz";
const FAKE_TELEGRAM_URL = `https://api.telegram.org/bot${FAKE_TELEGRAM_TOKEN}/sendMessage`;
const FAKE_QQ_SECRET = "fakeQQappSecret0123456789";
const FAKE_WEIXIN_TOKEN = "fakeWEIXINtoken0123456789";
const SHORT_ACCOUNT_ID = "wx4";

describe("redactSecretsInText", () => {
  it("strips a Telegram bot-URL token and a known DeepSeek key while preserving structure", () => {
    const raw = `send failed: POST ${FAKE_TELEGRAM_URL} rejected for key ${FAKE_DEEPSEEK_KEY}`;
    const scrubbed = redactSecretsInText(raw, [FAKE_DEEPSEEK_KEY]);
    expect(scrubbed).not.toContain(FAKE_TELEGRAM_TOKEN);
    expect(scrubbed).not.toContain(FAKE_DEEPSEEK_KEY);
    expect(scrubbed).toContain("[redacted]");
    // Targeted redaction: the surrounding URL frame survives, only the token is cut.
    expect(scrubbed).toContain("api.telegram.org");
    expect(scrubbed).toContain("sendMessage");
  });

  it("replaces a Bearer credential while preserving surrounding text", () => {
    const raw = "GET /api 401: Authorization: Bearer abc.def.ghi-SECRET failed";
    const scrubbed = redactSecretsInText(raw, []);
    expect(scrubbed).not.toContain("abc.def.ghi-SECRET");
    expect(scrubbed).toContain("Bearer [redacted]");
    expect(scrubbed.startsWith("GET /api 401: Authorization: ")).toBe(true);
    expect(scrubbed.endsWith(" failed")).toBe(true);
  });

  it("does not over-redact when a known secret is empty or shorter than the minimum", () => {
    const benign = "connection reset by peer at host abc";
    expect(redactSecretsInText(benign, ["", "short"])).toBe(benign);
  });

  it("returns benign text unchanged with an empty knownSecrets array", () => {
    const benign = "ECONNREFUSED 127.0.0.1:443";
    expect(redactSecretsInText(benign, [])).toBe(benign);
  });
});

describe("collectBotSecrets", () => {
  const ENV_KEYS = [
    "DEEPSEEK_API_KEY",
    "DEEPSEEK_BASE_URL",
    "DEEPSEEK_API_BASE_URL",
    "TELEGRAM_BOT_TOKEN",
    "QQ_SECRET",
    "WEIXIN_TOKEN",
    "WEIXIN_ACCOUNT_ID",
    "REASONIX_WEIXIN_ACCOUNTS_DIR",
  ] as const;

  let dir: string;
  let configPath: string;
  const savedEnv = new Map<string, string | undefined>();

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "reasonix-event-redaction-"));
    configPath = join(dir, "config.json");
    // Loaders read env FIRST, so a developer's real env would mask the temp
    // config; snapshot then clear the known keys and pin the weixin accounts
    // dir at an empty temp subdir so loadWeixinAccount resolves to nothing.
    for (const key of ENV_KEYS) {
      savedEnv.set(key, process.env[key]);
      Reflect.deleteProperty(process.env, key);
    }
    process.env.REASONIX_WEIXIN_ACCOUNTS_DIR = join(dir, "accounts");
    writeFileSync(
      configPath,
      JSON.stringify({
        apiKey: FAKE_DEEPSEEK_KEY,
        telegram: { botToken: FAKE_TELEGRAM_TOKEN },
        qq: { appSecret: FAKE_QQ_SECRET },
        weixin: { token: FAKE_WEIXIN_TOKEN, accountId: SHORT_ACCOUNT_ID },
      }),
      "utf8",
    );
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    for (const key of ENV_KEYS) {
      const prior = savedEnv.get(key);
      if (prior === undefined) Reflect.deleteProperty(process.env, key);
      else process.env[key] = prior;
    }
    savedEnv.clear();
  });

  it("collects the four channel secrets and excludes a sub-8-char accountId", () => {
    const secrets = collectBotSecrets(configPath);
    expect(secrets).toContain(FAKE_DEEPSEEK_KEY);
    expect(secrets).toContain(FAKE_TELEGRAM_TOKEN);
    expect(secrets).toContain(FAKE_QQ_SECRET);
    expect(secrets).toContain(FAKE_WEIXIN_TOKEN);
    expect(secrets).not.toContain(SHORT_ACCOUNT_ID);
  });
});

describe("redactEventValue is unchanged (public event path regression guard)", () => {
  it("still redacts a value under a secret-named key", () => {
    const out = redactEventValue({ token: "plaintext-secret-value", label: "safe" });
    expect(out).toEqual({ token: "[redacted]", label: "safe" });
  });

  it("passes a top-level free-form string (key === null) through unchanged", () => {
    expect(redactEventValue("just a normal error message")).toBe("just a normal error message");
  });
});
