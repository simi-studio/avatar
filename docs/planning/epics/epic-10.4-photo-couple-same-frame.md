# Epic 10.4 — Photo Couple Same-Frame Composite

> Upstream: [plan.md](../plan.md) (M10 candidates) / [epic-9.2](./epic-9.2-generation-experience-upgrade.md) (deferred follow-up) / [prd.md](../../prd.md) (§7, §8.4 Provider abstraction)

| Field | Value |
| ----- | ----- |
| Milestone | M10 |
| Status | Planned |
| Priority | P2 |
| Depends on | Epic 9.2 (couple-text same-frame), M8 (provider-aware capabilities) |

## Goal

Extend the M9 same-frame option from `couple-text` to photo `couple`, where two uploaded faces are
composited into one frame. This requires **multi-image composition**, which is provider-specific:
not every provider that does text-to-image can place two reference faces in one image. Gate the
feature on a real capability bit and show truthful fallback copy where it is unsupported — never
advertise a capability a provider does not actually have.

## Checklist

### Capability model
- [ ] Add a `supportsMultiImageComposite` (or equivalently named) flag to
      [lib/provider-capabilities.ts](../../../lib/provider-capabilities.ts).
- [ ] Set each provider's value from its **verified** real behavior (see Notes); document the
      per-provider truth in [providers.md](../../providers.md).

### UI gating
- [ ] Show the photo `couple` same-frame control only on providers where the flag is true.
- [ ] Where unsupported, show truthful fallback copy ("generates two style-matched avatars") and
      keep the A/B path.
- [ ] i18n copy in `i18n/en.json` / `i18n/zh-CN.json`.

### Generation path
- [ ] Supported provider: one composite call with both faces as references → one combined image
      through the preview (no A/B labels), call count = 1.
- [ ] Unsupported / disabled: unchanged A/B paired output, call count = 2.
- [ ] Reuse the existing `sameFrame` intent flag and compiler subject branch where possible.

### Tests
- [ ] Capability gating test: control hidden on unsupported providers.
- [ ] Compiler test: composite vs A/B subject/prompt shapes.
- [ ] Provider call-count test for both output shapes.
- [ ] Partial-failure test for the A/B fallback path.

## Acceptance

- [ ] Photo `couple` same-frame appears only where the provider truly supports multi-image
      composition; elsewhere the A/B fallback and its copy are shown.
- [ ] Supported path returns one coherent combined avatar (1 call); fallback returns A/B (2 calls).
- [ ] No capability is advertised that the provider cannot deliver.
- [ ] Full gate green: `lint`, `typecheck`, `test`, `build`, `guard:secrets`.

## Notes

- Per-provider reality must be confirmed against live docs before flipping the flag on: OpenAI image
  edits accept multiple input images; MiniMax `image-01` supports subject reference; FLUX
  image-to-image is single-image. The drift guard in
  [provider-calibration.md](../../provider-calibration.md) tracks this.
- Closes the Epic 9.2 deferred follow-up. See decision log D19.
</content>
