# Epic 11.4 — Multi-Reference Identity

> Upstream: [PRD](../../prd.md) (§21.1 Reference identity) / supersedes [Epic 10.4](./epic-10.4-photo-couple-same-frame.md)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | Planned |
| Priority | P1 |
| Depends on | Epics 11.1, 11.2 |

## Goal

Improve likeness and multi-person reliability with better reference inputs, while maintaining the
session-only privacy boundary and truthful provider-specific limits.

## Checklist

### Reference intake

- [ ] Accept a capability-limited set of references per person, targeting front, slight profile,
      and natural-expression coverage.
- [ ] Add client-side checks for dimensions, blur, exposure, face size, occlusion, and unexpected
      face count; provide actionable replacement guidance.
- [ ] Strip metadata and compress each accepted image while enforcing a total request-size budget.
- [ ] Let users label the role of references without storing biometric embeddings or face templates.

### Generation

- [ ] Compile reference roles and identity-preservation constraints per provider.
- [ ] Compare one-reference and multi-reference likeness using 11.1 before changing defaults.
- [ ] Implement photo-couple same-frame only where `supportsMultiImageComposite` and verified person
      capacity allow it.
- [ ] Preserve the existing two-call, style-matched A/B fallback everywhere else.

### Security and tests

- [ ] Revalidate image magic bytes and strip metadata server-side as defense in depth.
- [ ] Test reference limits, mixed file failures, request budget, person labeling, composite gating,
      A/B fallback, and absence from history/logs/errors.

## Acceptance

- [ ] Users understand which references will help and why an image is rejected or considered weak.
- [ ] Multi-reference mode improves the agreed likeness metric without unacceptable latency/cost.
- [ ] Two referenced people appear in one frame only on a verified provider path; unsupported paths
      remain truthful and usable.
- [ ] No reference image, embedding, or derived biometric identifier persists after the session.
