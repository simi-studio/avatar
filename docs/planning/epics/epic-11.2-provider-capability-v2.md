# Epic 11.2 — Provider Capability v2

> Upstream: [providers](../../providers.md) (Capability v2) / [architecture](../../architecture.md) (M11) / [plan](../plan.md)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | Planned |
| Priority | P0 |
| Depends on | Epic 11.1 |

## Goal

Replace size-only provider metadata with verified capability truth that can drive execution,
copy, cost plans, and graceful fallback for generation and editing.

## Checklist

- [ ] Add typed capabilities for aspect ratios, candidate count, reference image/person limits,
      image edit, multi-turn edit, masks, composite, transparent background, seed, identity level,
      edit strategy, exact model version, and verification date.
- [ ] Populate every current provider from official documentation and focused fixture smoke tests.
- [ ] Make server validation and UI controls derive from the same capability source.
- [ ] Add explicit execution resolution: `conversation` → `image-edit` → `regenerate`.
- [ ] Ensure unsupported controls are hidden or disabled with truthful fallback copy in EN/zh-CN.
- [ ] Add model/version drift tests and a release checklist failure for stale critical verification.
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
