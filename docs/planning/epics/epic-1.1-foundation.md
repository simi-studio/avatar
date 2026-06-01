# Epic 1.1 — Foundation & Home

> Upstream: [plan.md](../plan.md) / [prd.md](../../prd.md) (§6.1, §10, §13) / [architecture.md](../../architecture.md)

| Field | Value |
| ----- | ----- |
| Milestone | M1 |
| Status | Not started |
| Depends on | — |

## Goal

Stand up the project base, i18n scaffold, the home page, and the generate-page layout shell (with a mode-switch skeleton).

## Checklist

### Project base
- [ ] Init Next.js (App Router) + TypeScript `strict` (no `any`)
- [ ] Tailwind CSS + Shadcn UI
- [ ] ESLint/Biome + Prettier; npm scripts (`dev`/`build`/`lint`/`typecheck`/`test`)
- [ ] Base layout, theme tokens, fonts

### i18n
- [ ] i18n library (e.g. next-intl) with `app/[locale]/...`
- [ ] Catalogs `i18n/en.json` (source) + `i18n/zh-CN.json`
- [ ] Locale auto-detect from `Accept-Language` / `navigator.language`, fallback **English**
- [ ] `language-switcher` persists choice in `localStorage`

### Home
- [ ] Title / subtitle / support line / `Launch App` / `View on GitHub`
- [ ] Highlights: BYOK, Privacy-first, Open Source, Extensible Providers
- [ ] SEO: `<title>`, meta description, OpenGraph/Twitter Card, static OG image

### Generate layout shell
- [ ] Mode switch skeleton (Single / Couple / Themed)
- [ ] Empty input/preview regions wired to state (idle)

## Acceptance

- Home and generate pages are reachable.
- App starts in English, auto-detects locale, and the switcher toggles EN ↔ zh-CN.
- `npm run lint && npm run typecheck && npm run build` pass.
