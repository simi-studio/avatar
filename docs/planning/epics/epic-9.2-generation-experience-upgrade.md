# Epic 9.2 — Generation Experience Upgrade

> Upstream: [plan.md](../plan.md) / [prd.md](../../prd.md) (§6.2, §7, §21 V1.1/V1.2) / [architecture.md](../../architecture.md)

| Field | Value |
| ----- | ----- |
| Milestone | M9 (candidate) |
| Status | Draft |
| Depends on | M8 (quick/advanced split, preview workspace states) |

## Goal

Deepen the existing single-page experience with high-value, **client-only** improvements that
respect the no-database / no-history-server red lines. Each item is independently shippable.

## Checklist

### Couple same-frame composite (V1.1 roadmap item)
- [x] Intent flag (`sameFrame`) for one combined frame vs the A/B paired output
- [x] Provider path: couple-text makes one unlabeled text-to-image call across all three providers
- [x] Single composite result flows through preview (no A/B labels); generation count drops to one
- [x] Compiler + provider call-count tests for both output shapes
- [ ] **Follow-up**: photo `couple` same-frame (multi-face input) — left as A/B for now since
      multi-image composition is provider-specific and unverifiable without live keys

### Provider side-by-side comparison — DEFERRED
> Deferred: comparing OpenAI vs MiniMax vs fal in one run requires **two provider keys at
> once**, which changes the current single-provider/single-key BYOK model and its security
> surface. Revisit as its own epic once the two-key UX is decided.
- [ ] Run one intent against multiple providers in parallel, labeled columns
- [ ] Reuse partial-success handling from M8 for per-provider failures
- [ ] Make the multi-provider cost/time + two-key implications explicit in the UI

### Copyable compiled prompt (developer education, zero backend)
- [x] Expose the compiled per-provider prompt as read-only copyable text in Advanced settings
- [x] **Security**: the compiled request is a pure function of intent + style/theme and never
      receives the API key; a safety test asserts no key/token/secret field can appear
- [x] i18n copy for the panel in `en.json` / `zh-CN.json`

### Local-only history (client persistence, no DB)
- [x] Store recent intents (never images/keys/photos) in `localStorage`, capped at 10
- [x] Explicit "saved only in this browser, never uploaded" copy + a Clear control
- [x] Honor the existing Clear Key flow — clearing key offers to clear local history too
- [x] Unit tests for the store (cap, ordering, malformed recovery, no-credentials assertion)

## Acceptance

- Same-frame composite produces one coherent image on supporting providers, with a truthful
  fallback notice otherwise.
- Comparison view renders labeled results per provider and degrades gracefully on partial failure.
- Compiled-prompt panel never contains key material; verified by a redaction test.
- Local history persists across reloads, is clearable, and writes nothing to any server.
- Full gate green: lint, typecheck, test, build, `guard:secrets`.

## Notes

- R2 temp hosting / share links are intentionally **excluded** here — they cross the
  "no long-term image hosting" red line and belong to a separate decision (PRD §21 V1.2).
