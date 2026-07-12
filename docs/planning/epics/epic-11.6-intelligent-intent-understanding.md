# Epic 11.6 — Intelligent Intent Understanding

> Upstream: [PRD](../../prd.md) (§21.1 Intent understanding, D21) / [Epic 10.3](./epic-10.3-avatar-agent-experience.md)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | Planned |
| Priority | P2 |
| Depends on | Epics 11.1, 11.5 |

## Goal

Understand nuanced EN/zh-CN avatar briefs, including negation, priorities, missing information, and
preservation constraints, without introducing a Simi-owned model key or mandatory extra call.

## Checklist

- [ ] Define a strict, versioned structured-output schema for `AvatarIntent`, confidence, conflicts,
      assumptions, and clarifying questions.
- [ ] Add optional BYOK extraction for explicitly supported text/multimodal models; show provider,
      model, call count, and pricing link before use.
- [ ] Ask at most the minimum high-value questions; skip clarification when defaults are low-risk.
- [ ] Let the user inspect and edit the interpreted plan before image generation.
- [ ] Expand deterministic fallback to EN and zh-CN and label it as best-effort local parsing.
- [ ] Prevent prompt injection from changing system security, provider hosts, key handling, or output
      schema; treat user briefs and model output as untrusted data.
- [ ] Evaluate exact intent fields and clarification usefulness on the 11.1 bilingual set.

## Acceptance

- [ ] Complex EN and zh-CN examples meet the PRD intent-parity threshold.
- [ ] Negated requests such as “professional but not a suit” do not invert into unwanted features.
- [ ] Users can decline the extra model call and complete the flow with deterministic parsing/manual
      controls.
- [ ] Extraction never receives uploaded photos unless the selected model/path explicitly requires
      them and the user has authorized that transmission.

## Out of scope

- Autonomous repeated calls, hidden chain-of-thought display, Simi-hosted extraction credits, or a
  general chat assistant unrelated to avatar creation.
