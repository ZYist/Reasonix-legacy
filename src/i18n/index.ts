import { loadLanguage, saveLanguage } from "../config.js";
import { EN } from "./EN.js";
import type { LanguageCode, TranslationSchema } from "./types.js";
import { zhCN } from "./zh-CN.js";

const translations = {
  en: EN,
  "zh-CN": zhCN,
} satisfies Record<LanguageCode, TranslationSchema>;

export function canonicalLanguage(locale: string | null | undefined): LanguageCode | null {
  const value = locale?.trim().replaceAll("_", "-").toLowerCase();
  if (!value) return null;
  if (value === "en" || value.startsWith("en-")) return "en";
  if (value === "zh" || value.startsWith("zh-")) return "zh-CN";
  return null;
}

export function detectSystemLanguage(locale: string = systemLocale()): LanguageCode {
  return canonicalLanguage(locale) ?? "en";
}

export function resolveConfiguredLanguage(
  configured: string | null | undefined,
  systemLanguage: string,
): LanguageCode {
  return canonicalLanguage(configured) ?? detectSystemLanguage(systemLanguage);
}

function systemLocale(): string {
  return (
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    process.env.LANG ||
    Intl.DateTimeFormat().resolvedOptions().locale
  );
}

const persistedLanguage = loadLanguage() as string | undefined;
let currentLang: LanguageCode = resolveConfiguredLanguage(persistedLanguage, systemLocale());
if (persistedLanguage && persistedLanguage !== currentLang) saveLanguage(currentLang);

type Listener = () => void;
const listeners: Listener[] = [];
export function onLanguageChange(cb: Listener): () => void {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}
export function notifyLanguageChange(): void {
  for (const cb of listeners) cb();
}
export function setLanguage(lang: LanguageCode): void {
  currentLang = lang;
  saveLanguage(lang);
}
export function setLanguageRuntime(lang: LanguageCode): void {
  currentLang = lang;
}
export function getLanguage(): LanguageCode {
  return currentLang;
}
export function getSupportedLanguages(): LanguageCode[] {
  return ["en", "zh-CN"];
}

export function tObj<T>(path: string): T {
  const parts = path.split(".");
  let val: unknown = translations[currentLang];
  for (const part of parts) {
    val = (val as Record<string, unknown> | undefined)?.[part];
    if (val === undefined) break;
  }
  if (val === undefined && currentLang !== "en") {
    val = translations.en;
    for (const part of parts) {
      val = (val as Record<string, unknown> | undefined)?.[part];
      if (val === undefined) break;
    }
  }
  return val as T;
}
export function t(path: string, params?: Record<string, string | number>): string {
  const parts = path.split(".");
  let val: unknown = translations[currentLang];
  for (const part of parts) {
    val = (val as Record<string, unknown> | undefined)?.[part];
    if (val === undefined) break;
  }
  if (val === undefined && currentLang !== "en") {
    val = translations.en;
    for (const part of parts) {
      val = (val as Record<string, unknown> | undefined)?.[part];
      if (val === undefined) break;
    }
  }
  if (typeof val !== "string") return path;
  if (!params) return val;
  let result = val;
  for (const [k, v] of Object.entries(params)) result = result.replaceAll(`{${k}}`, String(v));
  return result;
}
