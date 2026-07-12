# Epic 11.1 — Avatar Quality Evaluation

> Upstream: [PRD](../../prd.md) (§3.1, §21.1) / [plan](../plan.md) (M11)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | Planned |
| Priority | P0 |
| Depends on | M10 |

## Goal

Create a repeatable, privacy-safe way to decide whether a provider, model, prompt profile, or edit
strategy improves the user's chance of getting a satisfactory avatar. This epic is the gate for
M11 capability claims and quality-sensitive changes.

## Checklist

### Fixtures and scenarios

- [ ] Define 20–30 versioned scenarios across text, single-photo, multi-reference, couple, themed,
      professional, social, realistic, and stylized outcomes.
- [ ] Use only synthetic, explicitly consented, or redistributable reference images; document
      provenance and license for every committed fixture.
- [ ] Cover equivalent EN and zh-CN briefs, difficult constraints, negation, and preserve-only edits.
- [ ] Keep generated outputs gitignored by default; never source fixtures from production users.

### Rubric and harness

- [ ] Score likeness, prompt adherence, edit preservation, small-size readability, identity
      separation for couples, visual defects, latency, call count, and estimated cost metadata.
- [ ] Define deterministic checks where possible and a blinded human review sheet for subjective
      dimensions.
- [ ] Record provider, exact model/version, capability timestamp, normalized intent, fixture ID,
      and settings without recording keys.
- [ ] Produce a machine-readable summary plus a concise Markdown comparison report.

### Release policy

- [ ] Define critical regression thresholds and the process for documenting an intentional
      quality/cost/latency trade-off.
- [ ] Add a no-key dry run to normal CI and a separate opt-in live evaluation command.
- [ ] Link provider-calibration updates to an evaluation run ID and date.

## Acceptance

- [ ] A maintainer can compare two provider/model/prompt configurations on the same fixture set.
- [ ] Results expose identity and edit regressions that unit tests cannot detect.
- [ ] The harness and reports contain no real user content, API keys, or persisted production data.
- [ ] Documentation states that a small fixture set informs decisions but does not prove universal
      demographic or accessibility quality.

## Out of scope

- Production telemetry collection, face recognition, biometric identification, or automated use of
  user uploads for training/evaluation.
