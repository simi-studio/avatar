# Epic 11.7 — Avatar Delivery Pack

> Upstream: [PRD](../../prd.md) (§21.1 Delivery) / [plan](../plan.md)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | Planned |
| Priority | P2 |
| Depends on | Epic 11.5 |

## Goal

Turn a selected result into immediately usable avatar assets without another provider call or any
server-side image persistence.

## Checklist

- [ ] Add circular crop/safe-area overlays and previews at common small display sizes.
- [ ] Provide named export presets for LinkedIn, GitHub, Discord, WeChat, and a generic square
      master; verify current platform requirements before implementation/release.
- [ ] Generate crops, resize variants, format conversion, and ZIP/manifest entirely client-side
      where browser support permits.
- [ ] Preserve transparency only when the source/provider output truly contains an alpha channel.
- [ ] Warn when face position, crop, or small-size readability is likely poor and allow manual
      repositioning.
- [ ] Ensure exported filenames and manifests contain no key, provider continuation ID, source
      filename, EXIF data, or hidden user prompt unless explicitly requested.
- [ ] Test dimensions, crop math, alpha behavior, metadata stripping, keyboard controls, large-image
      memory cleanup, and mobile download fallback.

## Acceptance

- [ ] One selected avatar can produce the documented platform pack without a provider call.
- [ ] Every output matches its declared dimensions and visible crop preview.
- [ ] Exports contain no sensitive metadata and do not pass through Simi server storage.
- [ ] A generic master download remains available when ZIP or advanced browser APIs are unsupported.
