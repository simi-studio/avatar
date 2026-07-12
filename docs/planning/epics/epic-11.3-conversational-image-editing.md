# Epic 11.3 — Conversational Image Editing

> Upstream: [PRD](../../prd.md) (§21.1 Candidate and editing loop) / [architecture](../../architecture.md) (M11)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | Planned |
| Priority | P0 |
| Depends on | Epics 11.1, 11.2 |

## Goal

Let a user select a generated candidate and continue working from that visual result. Each turn
must make the requested change while explicitly preserving identity and unrelated attributes as far
as the provider supports.

## Checklist

### Session and operations

- [ ] Add an in-memory `GenerationSession` candidate graph with parent/branch relationships and
      selected candidate state.
- [ ] Normalize refinement into `change[]` and `preserve[]`, show both before the paid call, and let
      the user correct them.
- [ ] Implement capability-selected conversation, image-edit, and regeneration paths.
- [ ] Integrate OpenAI's verified continuation/edit path first; add other providers only after 11.2
      verification.
- [ ] Support undo by selecting a prior candidate and branch without persisting the image graph.

### UX and failures

- [ ] Provide common constrained actions: background, clothing, expression, framing, realism, and
      “keep face unchanged.”
- [ ] Label regeneration fallbacks and identity-change risk before the call.
- [ ] Preserve a usable prior candidate when an edit fails or content safety rejects the change.
- [ ] Disclose per-turn call count and pricing link.

### Security and tests

- [ ] Ensure selected image bytes and continuation IDs exist only for the active session/request.
- [ ] Assert images/IDs never enter URLs, local history, analytics, logs, or error responses.
- [ ] Add graph, strategy, partial failure, stale context, abort, redaction, and mocked adapter tests.
- [ ] Run 11.1 preservation scenarios and meet the initial PRD threshold.

## Acceptance

- [ ] A user can select a result, request “change the background to light gray; keep my face,
      clothing, and framing,” inspect the plan, and receive a child candidate.
- [ ] The UI distinguishes true editing from regeneration.
- [ ] Reloading clears image and continuation context without affecting the saved API-key preference.
- [ ] A failed edit does not destroy the selected parent result.
