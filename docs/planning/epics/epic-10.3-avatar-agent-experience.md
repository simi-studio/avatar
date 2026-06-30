# Epic 10.3 — Avatar Agent Experience

> Upstream: [plan.md](../plan.md) (M10 candidates) / [prd.md](../../prd.md) (§2.3 Product shape, §7 Intent and prompt compiler) / [provider-calibration.md](../../provider-calibration.md)

| Field | Value |
| ----- | ----- |
| Milestone | M10 |
| Status | Planned |
| Priority | P1 |
| Depends on | M7 (`AvatarIntent`, goal presets, refinement actions), M8 (advanced/quick split) |

## Goal

Turn the parameter form into an intent-first "avatar agent" feel **by adding the missing front
half**, not by rewriting the flow. The codebase already has the back half: a canonical
`AvatarIntent` ([lib/avatar-intent.ts](../../../lib/avatar-intent.ts)) and a provider-specific
compiler ([lib/prompt-compiler.ts](../../../lib/prompt-compiler.ts)). What is missing is a
**free-text → `AvatarIntent`** entry point and a pre-generation plan preview, so the user describes
intent once and the form fields become an editable parsed result rather than the starting point.

To preserve the BYOK-image-only / no-extra-provider / no-database red lines, intent extraction is
**deterministic** (keyword/heuristic mapping), not an LLM call. LLM-based extraction is explicitly
out of scope here (see Notes).

## Checklist

### Brief → intent (deterministic)
- [ ] Add a "describe what you want" brief input that maps free text to an `AvatarIntent` via a
      deterministic keyword/heuristic table (pure function, fully unit-tested, no network call).
- [ ] The brief populates editable intent controls; the user can still adjust every field after.
- [ ] Keep existing goal presets working; the brief is an additional entry point, not a replacement.

### Plan preview (before Generate)
- [ ] Derive a read-only "avatar plan" from the current intent — style/theme, composition,
      background, call count, and risk hints — as a pure function of intent + style/theme.
- [ ] The plan contains no API key, no uploaded image, and no provider response.

### Natural-language refinement
- [ ] Allow free-text refinement ("more like me", "make it work for LinkedIn") that maps to
      `AvatarIntent` deltas, reusing the `applyRefinementAction`-style transform path.
- [ ] Keep the existing fixed refinement buttons; NL refinement is additive.
- [ ] Each NL refinement is one intent transform + one provider call, explainable and consistent
      with the Epic 10.2 re-call notice.

### State & history
- [ ] Brief text and derived plan live in **client state only**; local history continues to store
      intents only (never images/keys/photos), honoring the existing cap and Clear flow.

### Tests
- [ ] Brief mapping table tests: e.g. "LinkedIn headshot, friendly" → `professional-profile` +
      `headshot` + `studio` + high likeness (deterministic, exact-asserted).
- [ ] Plan derivation tests assert no credential/image fields are present.
- [ ] NL refinement tests assert the intent delta and a single resulting provider call.

## Acceptance

- [ ] A representative brief produces the expected `AvatarIntent` deterministically (no LLM, no
      extra provider call), verified by tests.
- [ ] The plan preview reflects the current intent and call count and leaks no key/image.
- [ ] NL refinement produces an explainable intent delta plus exactly one provider call.
- [ ] Local history still stores only intents; full gate green
      (`lint`, `typecheck`, `test`, `build`, `guard:secrets`).

## Notes

- **Out of scope (future):** LLM-based intent extraction. It would be provider-coupled (the three
  image providers have no shared chat model) and add a call + dependency, so it is deferred behind
  the deterministic path. See decision log D17.
- This epic reuses the existing compiler unchanged; it only feeds it a richer, faster-to-reach intent.
</content>
