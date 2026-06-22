# Epic 9.1 — Provider & Theme Expansion

> Upstream: [plan.md](../plan.md) / [prd.md](../../prd.md) (§8.3, §7.4, §21) / [providers.md](../../providers.md) (§Planned providers)

| Field | Value |
| ----- | ----- |
| Milestone | M9 |
| Status | Done |
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

### New provider — fal.ai (FLUX) shipped
- [x] Extend `ProviderId` and `lib/providers/index.ts` registry with fal
- [x] `lib/providers/fal.ts` implementing `ImageProvider` (text-to-image + image-to-image paths)
- [x] Base URL from a fixed allowlist (`https://fal.run`); image download restricted to fal hosts (SSRF guard)
- [x] `lib/provider-capabilities.ts`: fal exposes `512x512` + `1024x1024`
- [x] Prompt compiler reuses the natural-language branch (FLUX prefers prose) via the fal prompt profile
- [x] Calibration entries in `lib/provider-calibration.ts` for every built-in style
- [x] Mocked-fetch tests: success, normalized error mapping, size + strength mapping, SSRF host allowlist
- [x] i18n: provider label in `i18n/en.json` and `i18n/zh-CN.json` (no region switch needed)

### New themes
- [x] `styles/avatar-themes.ts`: Cats / Robots / Pixel Heroes themes + variants
- [x] Each theme carries its own base prompt + per-variant fragments (the calibration
      matrix stays **style-only**; themed prompts compile from the theme data directly)
- [x] `theme-picker` renders new themes as compact text chips (no preview thumbnails — keep form short)
- [x] EN/zh-CN labels for every new theme/variant id, with a data-integrity test asserting
      label parity, id uniqueness, and lookups

## Acceptance

- [x] A user can generate with the new provider using their own key, end-to-end, for at least
  `text` and `single` modes.
- [x] New themes generate on every supported provider; calibration tests pass for all pairs.
- [x] No secret/key path regressions covered by provider tests and the full quality gate.
- [x] `docs/providers.md` and the decision log updated to reflect the newly supported provider.

## Resolved decisions

- **First provider: fal.ai** (FLUX), for image-model fit and reference/likeness parity.
- **Single global host** (`https://fal.run`) — no region switch needed, unlike MiniMax.
- Replicate / Stability AI remain candidates for a future provider epic.
