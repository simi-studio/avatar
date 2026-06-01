# Epic 4.1 — Experience, Security & Quality

> Upstream: [plan.md](../plan.md) / [prd.md](../../prd.md) (§11.2, §12, §13, §15) / [security.md](../../security.md)

| Field | Value |
| ----- | ----- |
| Milestone | M4 |
| Status | Done |
| Depends on | Epic 2.1, Epic 3.1 |

## Goal

Harden error handling, interaction, security guards, and the test baseline to release quality.

## Checklist

### Experience
- [x] Six UI states: idle/uploading/ready/generating/success/error (skeletons, retryable error)
- [x] Download, regenerate, Clear Key
- [x] Mobile responsive (inputs/preview stack vertically)
- [x] a11y: label association, keyboard reach, visible focus, contrast, result alt text, text-based errors
- [x] i18n complete for all new strings (EN + zh-CN)

### Errors & validation
- [x] Normalized error mapping (incl. `INVALID_MODE_INPUT`, `INVALID_REGION`, `RATE_LIMITED`, `PROVIDER_TIMEOUT`)
- [x] Mode×input validation (single 1 / couple 2 / themed 0 + theme+variant)
- [x] MiniMax region validation
- [x] Client timeout (~60s) with friendly message

### Security
- [x] Log redaction: errors never contain the full key
- [x] CI static guard blocks `console.log(apiKey)`-style patterns
- [x] File size/type/MIME validation
- [x] (Public demo) per-IP rate limiting; optional Turnstile

### Tests
- [x] Unit: prompt-builder / validation / image-utils / preset (≥ 80%)
- [x] Provider adapter tests with mock fetch (OpenAI + MiniMax region URL)
- [x] E2E: three modes happy path + key error-code paths

## Acceptance

- All security acceptance items pass ([security.md](../../security.md)).
- Core lib unit coverage ≥ 80%; CI green.
