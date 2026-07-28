# Epic 11.2 — Provider Capability v2

> Upstream: [providers](../../providers.md) (Capability v2) / [architecture](../../architecture.md) (M11) / [plan](../plan.md)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | In progress — typed registry and conservative resolver implemented |
| Priority | P0 |
| Depends on | Epic 11.1 |

## Goal

Replace size-only provider metadata with verified capability truth that can drive execution,
copy, cost plans, and graceful fallback for generation and editing.

## Checklist

- [x] Add typed capabilities for aspect ratios, candidate count, reference image/person limits,
      image edit, multi-turn edit, masks, composite, transparent background, seed, identity level,
      edit strategy, exact model version, and verification date.
- [ ] Populate every current provider from official documentation and focused fixture smoke tests.
      The documentation baseline is recorded; quality-sensitive flags remain off until live runs.
- [ ] Make server validation and UI controls derive from the same capability source. Provider size
      validation and existing size/model/pricing UI now share the registry; new M11 controls remain.
- [x] Add explicit execution resolution: `conversation` → `image-edit` → `regenerate`.
- [ ] Ensure unsupported controls are hidden or disabled with truthful fallback copy in EN/zh-CN.
- [x] Add model/version drift tests and a release checklist failure for stale critical verification.
- [ ] Evaluate Gemini only if 11.1 shows a material conversational or multi-reference gap.

## Acceptance

- [ ] No provider is advertised for multi-turn, multi-reference, masks, or composite without
      documented and smoke-tested support.
- [ ] Call count, accepted inputs, UI controls, and adapter behavior agree for every provider.
- [ ] A text-only retry is represented as `regenerate`, never `edit`.
- [ ] Mocked-fetch tests cover each supported operation and fallback path.

## Migration

Keep the existing `ImageProvider.generateAvatar` interface during transition. Add v2 operations
incrementally and remove compatibility code only after all current providers are migrated.

## Implementation progress

- `lib/provider-capabilities.ts` exposes one typed registry for every current provider, registry
  invariants, reference-limit checks, a 90-day staleness guard, and conservative edit resolution.
- The registry was reconciled with current official documentation on 2026-07-27. Upstream features
  that the app does not execute and fixture-test remain disabled.
- `/api/generate` rejects a size that is globally valid but unsupported by the selected provider,
  using the same registry as the form.
- Current adapters resolve to `image-edit`; multi-turn, multi-reference identity, masks,
  transparency, seed, and composite claims remain disabled.
