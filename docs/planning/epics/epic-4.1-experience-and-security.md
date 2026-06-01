# Epic 4.1 — Experience, Security & Quality

> Upstream: [plan.md](../plan.md) / [prd.md](../../prd.md) (§11.2, §12, §13, §15) / [security.md](../../security.md)

| Field | Value |
| ----- | ----- |
| Milestone | M4 |
| Status | Not started |
| Depends on | Epic 2.1, Epic 3.1 |

## Goal

Harden error handling, interaction, security guards, and the test baseline to release quality.

## Checklist

### Experience
- [ ] Six UI states: idle/uploading/ready/generating/success/error (skeletons, retryable error)
- [ ] Download, regenerate, Clear Key
- [ ] Mobile responsive (inputs/preview stack vertically)
- [ ] a11y: label association, keyboard reach, visible focus, contrast, result alt text, text-based errors
- [ ] i18n complete for all new strings (EN + zh-CN)

### Errors & validation
- [ ] Normalized error mapping (incl. `INVALID_MODE_INPUT`, `INVALID_REGION`, `RATE_LIMITED`, `PROVIDER_TIMEOUT`)
- [ ] Mode×input validation (single 1 / couple 2 / themed 0 + theme+variant)
- [ ] MiniMax region validation
- [ ] Client timeout (~60s) with friendly message

### Security
- [ ] Log redaction: errors never contain the full key
- [ ] CI static guard blocks `console.log(apiKey)`-style patterns
- [ ] File size/type/MIME validation
- [ ] (Public demo) per-IP rate limiting; optional Turnstile

### Tests
- [ ] Unit: prompt-builder / validation / image-utils / preset (≥ 80%)
- [ ] Provider adapter tests with mock fetch (OpenAI + MiniMax region URL)
- [ ] E2E: three modes happy path + key error-code paths

## Acceptance

- All security acceptance items pass ([security.md](../../security.md)).
- Core lib unit coverage ≥ 80%; CI green.
