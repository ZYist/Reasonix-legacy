# Phase 7: Bilingual i18n Boundary - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning

## Phase Boundary
Runtime, selectors, tests, fixtures, and current release resources expose only canonical `en` and `zh-CN`. English and Chinese aliases normalize safely; unsupported legacy values fall back from system language and are rewritten canonically. Historical CHANGELOG remains unchanged.

## Decisions
- Canonical values are lowercase `en` and `zh-CN`.
- `en-*` maps to `en`; `zh`, `zh-*`, underscore variants map to `zh-CN`.
- Unsupported configured locales use Chinese only when system locale is Chinese; otherwise English, then write back.
- English is runtime missing-key fallback.
- Both dictionaries must satisfy one exact TypeScript schema; focused tests assert exposed locale/key parity behavior.
- Japanese/German/Russian runtime dictionaries and current Japanese README are removed; history is preserved.
