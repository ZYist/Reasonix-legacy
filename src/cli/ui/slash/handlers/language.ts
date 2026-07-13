import {
  canonicalLanguage,
  getSupportedLanguages,
  notifyLanguageChange,
  setLanguage,
  t,
} from "@/i18n/index.js";
import type { LanguageCode } from "@/i18n/types.js";
import type { SlashHandler } from "../dispatch.js";

export const handlers: Record<string, SlashHandler> = {
  language: (args, _loop, ctx) => {
    const lang = args[0];
    if (!lang) {
      return { openArgPickerFor: "language" };
    }

    const supported = getSupportedLanguages();
    const canonical = canonicalLanguage(lang);
    if (!canonical) {
      return {
        info: t("slash.language.unsupported", {
          code: lang,
          supported: supported.join(", "),
        }),
      };
    }

    setLanguage(canonical);
    notifyLanguageChange();
    ctx.dispatch?.({ type: "language.change", lang: canonical });

    return { info: t("slash.language.success") };
  },
};
