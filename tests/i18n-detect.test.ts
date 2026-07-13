import { describe, expect, it } from "vitest";
import {
  canonicalLanguage,
  detectSystemLanguage,
  getSupportedLanguages,
  resolveConfiguredLanguage,
} from "../src/i18n/index.js";
describe("bilingual locale boundary", () => {
  it("exposes only canonical locales", () =>
    expect(getSupportedLanguages()).toEqual(["en", "zh-CN"]));
  it.each([
    ["en-US", "en"],
    ["en-GB", "en"],
    ["en", "en"],
    ["zh", "zh-CN"],
    ["zh-Hans", "zh-CN"],
    ["zh-SG", "zh-CN"],
    ["zh_Hans_CN", "zh-CN"],
  ])("normalizes %s", (input, expected) => expect(canonicalLanguage(input)).toBe(expected));
  it.each(["ja", "de", "ru", "fr-FR", ""])("rejects unsupported %s", (input) =>
    expect(canonicalLanguage(input)).toBeNull(),
  );
  it("falls system language back to English", () =>
    expect(detectSystemLanguage("ja-JP")).toBe("en"));
  it("uses Chinese system aliases", () => expect(detectSystemLanguage("zh-TW")).toBe("zh-CN"));
  it("falls unsupported persisted values back to the system language", () => {
    expect(resolveConfiguredLanguage("ja", "zh-CN")).toBe("zh-CN");
    expect(resolveConfiguredLanguage("de", "en-GB")).toBe("en");
    expect(resolveConfiguredLanguage("ru", "fr-FR")).toBe("en");
  });
});
