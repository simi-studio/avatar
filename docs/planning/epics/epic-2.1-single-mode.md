# Epic 2.1 — Single Mode (OpenAI + MiniMax)

> Upstream: [plan.md](../plan.md) / [prd.md](../../prd.md) (§7, §8, §11) / [providers.md](../../providers.md)

| Field | Value |
| ----- | ----- |
| Milestone | M2 |
| Status | Not started |
| Depends on | Epic 1.1 |

## Goal

Deliver the single-mode closed loop end-to-end with **both** MVP providers, validating the provider abstraction from day one.

## Checklist

### Input
- [ ] `api-key-input`: password field, show/hide, "save for this session" (`sessionStorage`), Clear Key
- [ ] `provider-selector`: OpenAI + MiniMax; MiniMax **region** switch (Global / China)
- [ ] `image-uploader`: JPG/PNG/WEBP, size/dimension checks
- [ ] `image-utils`: client-side **EXIF strip** + downscale/compress
- [ ] `style-picker`: 10 built-in styles

### Prompt & providers
- [ ] `prompt-builder`: mode-aware assembly (single branch)
- [ ] `lib/providers/openai.ts`: `gpt-image-1` via `/v1/images/edits`
- [ ] `lib/providers/minimax.ts`: `image-01` via `/v1/image_generation` + `resolveBaseUrl(region)` (global/china) + `subject_reference`
- [ ] `lib/providers/index.ts` registry + `supportedModes`

### API
- [ ] `POST /api/generate`: validate single (exactly 1 image), proxy, normalize errors
- [ ] In-memory only; no key/image persistence or logging

### Result
- [ ] `result-preview`: status states (idle/uploading/ready/generating/success/error) + download

## Acceptance

- A user generates and downloads a single avatar using their own **OpenAI** key.
- A user generates and downloads a single avatar using their own **MiniMax** key with the correct **region**.
- Wrong MiniMax region surfaces `INVALID_REGION`; no key appears in logs.
- Provider adapter unit tests pass (mock `fetch`, incl. region URL selection).
