# Epic 12.1 — First impression and first success

> Upstream: [prd.md](../../prd.md) (§1.5, D25) / [plan.md](../plan.md)

| Field | Value |
| ----- | ----- |
| Milestone | M12 |
| Status | In progress |
| Priority | P0 |
| Depends on | M10 shipped; M11 continues in parallel |

## Goal

Make the public site visitable and the first generation finishable without adding providers,
themes, or identity-quality claims.

A visitor should understand the product from real sample looks in ten seconds. A visitor who
already has a provider key should reach Generate without opening Advanced.

## Checklist

### Positioning
- [x] PRD primary user is a key-holder (D25); everyday users without a key are not primary
- [x] §2.4 non-goal is server-side / image history, not client intent history
- [x] Deploy guide does not call `npm run build` an OpenNext build

### Proof gallery
- [x] Committed synthetic sample stills under `public/gallery/` with CC0 provenance
- [x] Home shows a real grid; tiles deep-link to `/generate?example=<id>`
- [x] README shows sample images under the tagline
- [x] Open Graph / Twitter card uses a gallery hero
- [x] About copy lists all four providers and current model labels

### First-run generate
- [x] Default visible: source, style or one photo, description, provider + key, Generate
- [x] Couple / Themed under “More ways”; intent / size / compiled prompt stay in Advanced
- [x] `?example=` and `?preset=` hydrate visible fields
- [x] Brief box merged into description via existing deterministic parser

### Result-state and adapters
- [x] Preview labels come from the intent that produced the images
- [x] History restore and source/mode change do not leave a stale image on a new intent
- [x] Couple restore restores the pair
- [x] Last result stays visible while a follow-up call runs
- [x] MiniMax sends width/height; edit disables `prompt_optimizer`
- [x] fal result downloads use `redirect: "manual"`
- [x] OpenAI generic 400 is not mapped to `INVALID_IMAGE` for text modes

### Chrome
- [x] Header links to Legal
- [x] Team preset share copies origin + pathname + sanitized `preset` only
- [x] E2E covers gallery visibility, first-run Generate without Advanced, and example hydration

### Presentation polish
- [x] README shows a large sample grid (not 120px thumbnails)
- [x] Landscape 1200×630 OG image composed from synthetic stills
- [x] Style picker uses compact image tiles; missing stills are illustrated SVG
- [x] Generate empty preview shows gallery samples next to the form
- [x] Lightweight English bug + feature issue templates

## Acceptance

- [x] Homepage shows sample avatars, not a wireframe
- [x] A key-holder can generate a text avatar without opening Advanced
- [x] Couple / themed / intent / compiled prompt still exist for experts
- [x] Security red lines unchanged: no key in gallery URLs, presets, logs, or local history
- [x] `identityPreservation` remains `none` until Epic 11.1 evidence exists
- [x] `npm run lint`, `typecheck`, `test`, `test:e2e`, and `build` pass
