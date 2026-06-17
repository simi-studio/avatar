# Epic 9.1 — Provider & Theme Expansion

> Upstream: [plan.md](../plan.md) / [prd.md](../../prd.md) (§8.3, §7.4, §21) / [providers.md](../../providers.md) (§Planned providers)

| Field | Value |
| ----- | ----- |
| Milestone | M9 (candidate) |
| Status | Draft |
| Depends on | Epic 2.1 (`ImageProvider` interface), M7 calibration matrix |

## Goal

Grow surface area without touching the BYOK / no-login / no-database red lines. Two
parallel tracks that both ride the existing `ImageProvider` abstraction and the
intent-first prompt compiler:

- **More providers**: add at least one of Fal.ai / Replicate / Stability AI behind
  the shared interface, region/base-URL allowlisted like MiniMax.
- **More themes**: add Cats / Robots / Pixel Heroes alongside the existing Dogs theme,
  with calibration coverage per provider.

## Checklist

### New provider (pick one first; Fal.ai recommended for image-model fit)
- [ ] Extend `ProviderId` and `lib/providers/index.ts` registry with the new provider
- [ ] `lib/providers/<name>.ts` implementing `ImageProvider` (generate + edit/reference paths)
- [ ] Base URL from a fixed allowlist; **never** user-settable upstream host
- [ ] `lib/provider-capabilities.ts`: declare supported sizes + default size truthfully
- [ ] Prompt compiler branch in `lib/prompt-compiler.ts` (NL vs descriptor style as the API expects)
- [ ] Calibration entries in `lib/provider-calibration.ts` for every built-in style
- [ ] Mocked-fetch tests: success, normalized error mapping, size enum, region/base-URL selection
- [ ] i18n: provider label + any region switch copy in `i18n/en.json` and `i18n/zh-CN.json`

### New themes
- [x] `styles/avatar-themes.ts`: Cats / Robots / Pixel Heroes themes + variants
- [x] Each theme carries its own base prompt + per-variant fragments (the calibration
      matrix stays **style-only**; themed prompts compile from the theme data directly)
- [x] `theme-picker` renders new themes as compact text chips (no preview thumbnails — keep form short)
- [x] EN/zh-CN labels for every new theme/variant id, with a data-integrity test asserting
      label parity, id uniqueness, and lookups

## Acceptance

- A user can generate with the new provider using their own key, end-to-end, for at least
  `text` and `single` modes.
- New themes generate on every supported provider; calibration tests pass for all pairs.
- No secret/key path regressions: `npm run guard:secrets`, lint, typecheck, test, build all green.
- `docs/providers.md` and the decision log updated to reflect the newly supported provider.

## Open questions

- Which provider first? Fal.ai and Replicate both expose strong image models; Stability is
  most direct for text-to-image. Recommend Fal.ai for reference/likeness support parity.
- Does the new provider need a region/base-URL switch like MiniMax, or a single global host?
