# Epic 11.4 — Multi-Reference Identity

> Upstream: [PRD](../../prd.md) (§21.1 Reference identity) / supersedes [Epic 10.4](./epic-10.4-photo-couple-same-frame.md)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | In progress — intake helpers + photo prompt strengthening; multi-upload UI gated |
| Priority | P1 |
| Depends on | Epics 11.1, 11.2 |

## Goal

Improve likeness and multi-person reliability with better reference inputs, while maintaining the
session-only privacy boundary and truthful provider-specific limits.

## Checklist

### Reference intake

- [x] Accept a capability-limited set of references per person, targeting front, slight profile,
      and natural-expression coverage. `ReferenceIntakePanel` activates extra slots only when
      `identityPreservation === "multi-reference"`; otherwise it shows an honest single-photo path.
- [x] Add client-side checks for dimensions and extreme aspect ratio with actionable soft guidance
      for small or elongated crops. Blur, exposure, face size, occlusion, and face-count checks
      remain deferred (no client face ML yet).
- [x] Strip metadata and compress each accepted image (existing uploader) while defining a total
      reference-byte budget helper under the generate request ceiling.
- [x] Define role labels (`front` / `profile` / `expression`) and person labels (`A` / `B`) without
      biometric embeddings or face templates.

### Generation

- [x] Compile reference role guidance and strengthen photo/same-frame identity language in the
      prompt compiler (from multimodal single-ref, multi-ref, and couple probes).
- [ ] Compare one-reference and multi-reference likeness using 11.1 before changing defaults.
- [ ] Implement photo-couple same-frame only where `supportsMultiImageComposite` and verified person
      capacity allow it. UI shows a disabled same-frame control with provider-specific copy; server
      forces A/B fallback when composite is not capability-true.
- [x] Preserve the existing two-call, style-matched A/B fallback everywhere else.

### Security and tests

- [x] Revalidate image magic bytes and strip metadata server-side as defense in depth (existing).
- [x] Unit-test reference geometry, budget, capability gates, role prompt compilation, multi-image
      single rejection, and UI honesty for unsupported multi-ref / same-frame.
- [ ] Adapter multi-image paths and live 11.1 one-vs-multi comparison once a provider is verified.

## Acceptance

- [ ] Users understand which references will help and why an image is rejected or considered weak.
- [ ] Multi-reference mode improves the agreed likeness metric without unacceptable latency/cost.
- [ ] Two referenced people appear in one frame only on a verified provider path; unsupported paths
      remain truthful and usable.
- [ ] No reference image, embedding, or derived biometric identifier persists after the session.
