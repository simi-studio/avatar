# Epic 11.3 — Conversational Image Editing

> Upstream: [PRD](../../prd.md) (§21.1 Candidate and editing loop) / [architecture](../../architecture.md) (M11)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | In progress — editable plan + candidate branch UI shipped; live quality gate pending |
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
- [x] Normalize refinement into `change[]` and `preserve[]`, show both before the paid call, and let
      the user correct them.
- [x] Implement capability-selected conversation, image-edit, and regeneration paths. Conversation
      remains disabled for providers without a verified continuation path.
- [ ] Integrate OpenAI's verified continuation/edit path first; add other providers only after 11.2
      verification. Image-edit is live for capability-supported providers; multi-turn continuation
      IDs remain deferred.
- [x] Support undo by selecting a prior candidate and branch without persisting the image graph.

### UX and failures

- [x] Provide common constrained actions: background, clothing, expression, framing, realism, and
      “keep face unchanged.”
- [x] Label regeneration fallbacks and identity-change risk before the call.
- [x] Preserve a usable prior candidate when an edit fails or content safety rejects the change.
- [x] Disclose per-turn call count and pricing link.

### Security and tests

- [x] Ensure selected image bytes and continuation IDs exist only for the active session/request.
      The current slice uses no continuation IDs.
- [x] Assert images/IDs never enter URLs, local history, analytics, logs, or error responses.
      Incomplete edit failures return only stable error codes; local history stores intents only.
- [x] Add graph, strategy, partial failure, stale context, abort, redaction, and mocked adapter tests.
- [ ] Run 11.1 preservation scenarios and meet the initial PRD threshold.

## Acceptance

- [x] A user can select a result, request “change the background to light gray; keep my face,
      clothing, and framing,” inspect the plan, and receive a child candidate.
- [x] The UI distinguishes true editing from regeneration.
- [x] Reloading clears image and continuation context without affecting the saved API-key preference.
- [x] A failed edit does not destroy the selected parent result.

## Remaining work

- [ ] Live 11.1 edit-preservation scoring with user-owned keys before advertising identity-safe
      editing quality.
- [ ] Enable conversation-style continuation only after 11.2 live capability verification.

## Implementation progress

- `lib/generation-session.ts` keeps parent/child candidates, optional `change`/`preserve` metadata,
  selection, and ancestor helpers in React session memory.
- `lib/edit-intent.ts` normalizes constrained actions, free text, multi-line plan edits, and short
  preserve-token expansions into bounded `change[]` / `preserve[]` instructions, then compiles a
  dedicated edit instruction without redesign language.
- `lib/prompt-compiler.ts` `compileEditPrompt` is the edit-only path (high reference strength; no
  goal/style/creativity injection). Multimodal probes on the synthetic edit-parent motivated this
  split from `compileAvatarPrompt`.
- `components/edit-plan-panel.tsx` shows an editable pre-call plan; confirm runs one paid call.
- `components/candidate-strip.tsx` lists session candidates for branch selection.
- `/api/generate` accepts an explicit edit operation only with one validated image and a
  capability-supported provider, then uses the existing adapter image-edit path with
  `compileEditPrompt`.
- Explicit regeneration fallbacks carry the reviewed change/preserve plan into the provider prompt
  without claiming that the prior result pixels are available.
- The result flow sends base64 output back only for the next request, keeps the parent visible on
  failure, supports restoring any prior session candidate even when no key is ready, refuses stale
  draft plans, and ignores late responses from superseded requests.
