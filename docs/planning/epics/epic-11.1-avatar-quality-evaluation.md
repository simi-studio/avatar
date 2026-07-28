# Epic 11.1 — Avatar Quality Evaluation

> Upstream: [PRD](../../prd.md) (§3.1, §21.1) / [plan](../plan.md) (M11)

| Field | Value |
| ----- | ----- |
| Milestone | M11 |
| Status | In progress — reference coverage complete; scored provider baseline pending |
| Priority | P0 |
| Depends on | M10 |

## Goal

Create a repeatable, privacy-safe way to decide whether a provider, model, prompt profile, or edit
strategy improves the user's chance of getting a satisfactory avatar. This epic is the gate for
M11 capability claims and quality-sensitive changes.

## Checklist

### Fixtures and scenarios

- [x] Define 20–30 versioned scenarios across text, single-photo, multi-reference, couple, themed,
      professional, social, realistic, and stylized outcomes.
- [x] Use only synthetic, explicitly consented, or redistributable reference images; document
      provenance, prompt, checksum, and license for every included fixture. Four synthetic,
      metadata-stripped references cover the live single-photo, A/B couple, and edit scenarios.
- [x] Cover equivalent EN and zh-CN briefs, difficult constraints, negation, and preserve-only edits.
- [x] Keep generated outputs gitignored by default; never source fixtures from production users.

### Rubric and harness

- [x] Score likeness, prompt adherence, edit preservation, small-size readability, identity
      separation for couples, visual defects, latency, call count, and estimated cost metadata.
- [x] Define deterministic checks where possible and a blinded human review sheet for subjective
      dimensions.
- [x] Record provider, exact model/version, capability timestamp, normalized intent, fixture ID,
      and settings without recording keys.
- [x] Produce a machine-readable summary plus a concise Markdown comparison report.

### Release policy

- [x] Define critical regression thresholds and the process for documenting an intentional
      quality/cost/latency trade-off.
- [x] Add a no-key dry run to normal CI and a separate opt-in live evaluation command.
- [x] Link provider-calibration updates to an evaluation run ID and date.

## Acceptance

- [x] A maintainer can compare two provider/model/prompt configurations on the same fixture set.
- [ ] Results expose identity and edit regressions that unit tests cannot detect. Reference coverage
      is complete, but this acceptance item still requires a paid live run and blinded human
      scoring.
- [x] The harness and reports contain no real user content, API keys, or persisted production data.
- [x] Documentation states that a small fixture set informs decisions but does not prove universal
      demographic or accessibility quality.

## Remaining work

- [x] Source, review, and include synthetic reference assets for `synthetic-person-a-front`,
      `synthetic-person-a-profile`, `synthetic-person-b-front`, and `synthetic-edit-parent`.
- [x] Re-run the coverage check until `unreachableLiveDimensions()` is empty.
- [ ] Run a same-fixture provider baseline with user-owned keys, complete blinded human scoring,
      and attach only approved aggregate evidence before marking this epic Done.
- [x] Run a clearly labeled exploratory built-in OpenAI quality baseline. This provides useful
      product-outcome evidence but does not replace the adapter/API baseline or two-reviewer gate.

## Out of scope

- Production telemetry collection, face recognition, biometric identification, or automated use of
  user uploads for training/evaluation.

## Implementation

- `lib/avatar-evaluation/fixtures.ts` — fixture version `1.0.0`, 24 scenario specifications,
  bilingual pairs, provenance metadata, and live-eligibility gates.
- `lib/avatar-evaluation/harness.ts` — validation, templates, aggregation, regression comparison,
  recursive privacy scanning, coverage reporting, and Markdown reporting. The gate fails on a mean
  regression, a single-fixture collapse of 2+ points, or any unscored dimension, and refuses to
  compare runs scored on different fixture sets.
- `scripts/avatar-eval.ts` — no-key `validate`, `template`, `report`, and `compare` commands.
- `scripts/avatar-eval-live.ts` — explicit-cost selected-fixture live generation with reviewed
  reference-file loading and workspace path confinement.
- [Avatar evaluation runbook](../../avatar-evaluation.md) — rubric, commands, blinded review,
  thresholds, safety limits, and evidence caveats.
- `__tests__/lib/avatar-evaluation.test.ts` — fixture coverage, privacy, aggregation, regression gate,
  and report tests.
