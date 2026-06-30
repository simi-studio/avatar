# Epic 10.2 — Cost & Call Transparency

> Upstream: [plan.md](../plan.md) (M10 candidates) / [prd.md](../../prd.md) (§6.2 Cost transparency, §21, §22.2 Q3)

| Field | Value |
| ----- | ----- |
| Milestone | M10 |
| Status | Planned |
| Priority | P1 |
| Depends on | M8 (generation count cues), M7 (refinement actions) |

## Goal

Make BYOK cost consequences explicit **without** hard-coding prices. The form today only flips
between `estimatedCostSingle` / `estimatedCostPair` by generation count
([components/generation-form.tsx](../../../components/generation-form.tsx)), and a refinement
silently fires a second provider call (`onRefine` → `onGenerate`). A user spending their own key
should always know the provider, model, size, and exactly how many calls an action triggers.

## Checklist

### Call-plan surface (before Generate)
- [ ] Show the active provider, a model label, size, and call count for the current mode
      (pair = 2 calls; couple-text same-frame = 1 call).
- [ ] Derive the call count from the same source as `generationCount`; do not duplicate the rule.

### Refinement re-call notice
- [ ] Near the refinement controls / result view, state that each refinement makes **another**
      provider call (`onRefine` triggers a fresh `onGenerate`).
- [ ] Note partial-pair billing: in pair modes, a call that returns only A or only B has still
      consumed provider quota.

### Official pricing links (no hard-coded numbers)
- [ ] Add official pricing-page links for OpenAI, MiniMax, and fal.ai near the cost copy.
- [ ] Do **not** embed any per-image/per-token price string anywhere in code or i18n.

### i18n
- [ ] All new copy lives in `i18n/en.json` / `i18n/zh-CN.json`; no hard-coded UI strings.

### Tests
- [ ] Unit/component test: pair mode shows 2 calls, same-frame shows 1, single shows 1.
- [ ] Guard test or grep assertion: no numeric currency/price literal is introduced.
- [ ] i18n parity test passes for the new keys.

## Acceptance

- [ ] Before generating, the form shows provider + model label + size + call count truthfully.
- [ ] The refinement area makes clear that refining calls the provider again and costs quota.
- [ ] Pricing links resolve to each provider's official pricing page; no price is hard-coded.
- [ ] Full gate green: `lint`, `typecheck`, `test`, `build`, `guard:secrets`.

## Notes

- Model labels are display-only and must track the IDs verified by the drift guard in
  [provider-calibration.md](../../provider-calibration.md).
- Resolves PRD §22.2 Q3 (inline official pricing links) — see decision log D18.
</content>
