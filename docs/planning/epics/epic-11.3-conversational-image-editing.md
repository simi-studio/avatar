# Epic 11.3 — Conversational Image Editing

> Upstream: [PRD](../../prd.md) (§21.1 Candidate and editing loop) / [architecture](../../architecture.md) (M11)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | In progress — selected-result editing vertical slice implemented |
| Priority | P0 |
| Depends on | Epics 11.1, 11.2 |

## Goal

Let a user select a generated candidate and continue working from that visual result. Each turn
must make the requested change while explicitly preserving identity and unrelated attributes as far
as the provider supports.

## Checklist

### Session and operations

- [x] Add an in-memory `GenerationSession` candidate graph with parent/branch relationships and
      selected candidate state.
- [ ] Normalize refinement into `change[]` and `preserve[]`, show both before the paid call, and let
      the user correct them. Normalization and server execution are implemented; editable pre-call
      review remains.
- [x] Implement capability-selected conversation, image-edit, and regeneration paths. Conversation
      remains disabled for providers without a verified continuation path.
- [ ] Integrate OpenAI's verified continuation/edit path first; add other providers only after 11.2
      verification.
- [x] Support undo by selecting a prior candidate and branch without persisting the image graph.

### UX and failures

- [ ] Provide common constrained actions: background, clothing, expression, framing, realism, and
      “keep face unchanged.”
- [x] Label regeneration fallbacks and identity-change risk before the call.
- [x] Preserve a usable prior candidate when an edit fails or content safety rejects the change.
- [x] Disclose per-turn call count and pricing link.

### Security and tests

- [x] Ensure selected image bytes and continuation IDs exist only for the active session/request.
      The current slice uses no continuation IDs.
- [ ] Assert images/IDs never enter URLs, local history, analytics, logs, or error responses.
- [ ] Add graph, strategy, partial failure, stale context, abort, redaction, and mocked adapter tests.
- [ ] Run 11.1 preservation scenarios and meet the initial PRD threshold.

## Acceptance

- [ ] A user can select a result, request “change the background to light gray; keep my face,
      clothing, and framing,” inspect the plan, and receive a child candidate.
- [x] The UI distinguishes true editing from regeneration.
- [x] Reloading clears image and continuation context without affecting the saved API-key preference.
- [x] A failed edit does not destroy the selected parent result.

## Implementation progress

- `lib/generation-session.ts` keeps parent/child candidates and selection in React session memory.
- `lib/edit-intent.ts` normalizes constrained actions and free text into bounded `change[]` and
  `preserve[]` instructions.
- `/api/generate` accepts an explicit edit operation only with one validated image and a
  capability-supported provider, then uses the existing adapter image-edit path.
- The result flow sends base64 output back only for the next request, keeps the parent visible on
  failure, and supports restoring the previous version.
