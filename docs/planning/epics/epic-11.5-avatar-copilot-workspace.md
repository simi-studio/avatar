# Epic 11.5 — Avatar Copilot Workspace

> Upstream: [PRD](../../prd.md) (§2.5, §21.1 Copilot workspace) / [plan](../plan.md)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | Planned |
| Priority | P1 |
| Depends on | Epics 11.3, 11.4 |

## Goal

Make the successful path feel like guided creation rather than provider configuration: brief,
references, plan, candidates, selection, editing, and download.

## Checklist

### Entry and progressive disclosure

- [ ] Default to one brief, optional reference upload, purpose shortcuts, and one primary action.
- [ ] Infer mode/style/intent where confidence is sufficient and keep all inferred values editable.
- [ ] Move provider, model, size, prompt compiler output, and detailed intent controls into secondary
      settings without removing expert access.
- [ ] Offer an automatic provider recommendation based on verified capability, cost-call plan, and
      task requirements; never transmit a key to a different provider.

### Visual creation loop

- [ ] Replace text-only style chips with representative, licensed/generated visual examples.
- [ ] Show 3–4 intentionally differentiated candidates where the disclosed plan permits.
- [ ] Make selection and conversational editing dominant after first generation.
- [ ] Preserve clear empty, planning, generating, partial, success, editing, and recoverable-error
      states across desktop and mobile.

### Accessibility and measurement

- [ ] Verify keyboard order, visible focus, status announcements, candidate selection semantics,
      error recovery, 200% zoom/reflow, and touch target sizes.
- [ ] Add privacy-safe local/session events needed to calculate calls-to-download and candidate
      selection without sending prompts, images, keys, or continuation IDs to analytics.
- [ ] Cover the core flow with mocked E2E tests in EN and zh-CN.

## Acceptance

- [ ] A first-time user can reach a first candidate without understanding provider terminology.
- [ ] An expert can still inspect and change provider, model, size, intent, and compiled prompt.
- [ ] The selected candidate and next editing action are visually unambiguous.
- [ ] Mobile, keyboard, and screen-reader flows have documented verification results.
