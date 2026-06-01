# Epic 3.1 — Couple + Themed + Team Preset

> Upstream: [plan.md](../plan.md) / [prd.md](../../prd.md) (§2.3, §6.2, §6.3, §7, §8) / [architecture.md](../../architecture.md)

| Field | Value |
| ----- | ----- |
| Milestone | M3 |
| Status | Not started |
| Depends on | Epic 2.1 (GenerationMode abstraction, provider interface) |

## Goal

Add two playful modes and team collaboration on top of the shared abstraction:
- **Couple**: two uploads → a style-consistent paired set.
- **Themed**: no upload → prompt-only generation (Dogs team theme first).
- **Team preset**: stateless URL preset code so teammates reuse one base setup.

## Checklist

### Couple
- [ ] `image-uploader` supports two images (Person A / Person B)
- [ ] Shared style + "paired consistency" toggle (palette/background/lighting/composition)
- [ ] Provider: two calls per person, same prompt + styleId (OpenAI edits / MiniMax `subject_reference`)
- [ ] `result-preview` supports multi-image results; A/B download separately
- [ ] Cost hint notes two generations

### Themed
- [ ] `styles/avatar-themes.ts`: Dogs theme + breed variants (Shiba/Corgi/Golden/Husky/Poodle/Border Collie/Dalmatian/Pug)
- [ ] `theme-picker`: theme + variant; themed hides the upload area
- [ ] `prompt-builder` themed branch: base prompt + variant fragment + optional style + user prompt (no face reference)
- [ ] Provider: themed → text-to-image (OpenAI `generations` / MiniMax `image_generation` prompt-only)
- [ ] Personal prompt input

### Team preset
- [ ] `lib/preset.ts`: URL-safe encode/decode (base64url), field allowlist
- [ ] **Security**: preset code contains no API key; decode drops any key-like field
- [ ] `team-preset-share`: "Copy team preset link" button
- [ ] Generate page parses `?mode=themed&theme=&style=&preset=` and loads the base setup

## Acceptance

- All three modes generate and download independently.
- Teammates use one preset link to produce a style-consistent, breed-varied team set, each with their own key.
- `preset.ts` "rejects keys" unit test passes; couple outputs two style-consistent images.
