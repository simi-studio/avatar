# Avatar Quality Evaluation

> Epic 11.1 runbook for comparing provider, model, prompt-profile, and editing configurations.

## Current coverage

Four reviewed synthetic references now cover Person A (front + three-quarter), Person B (front),
and a constrained-edit parent. Every rubric dimension has at least one `liveEligible` scenario:
`likeness` has 6 and `editPreservation` has 3. `npm run eval:avatar -- validate` checks the fixture
schema and reports per-dimension coverage without requiring a key or network call.

## Agent multimodal probes (not a release gate)

Built-in multimodal image edit tools can stress-test **prompt shape** and fixture usefulness on the
synthetic fixtures without user keys. They **do not** replace a BYOK adapter baseline: call counts,
adapter payloads, fixed-host behavior, model versions, and per-provider quality still require
`npm run eval:avatar:live` with user-owned keys and blinded human scoring before shipping
identity/edit quality claims.

### 2026-08-06 edit-path probes

- Confirmed background-only, expression-only, clothing-only, and clutter-removal edits can preserve
  identity when the instruction is pure change/preserve language.
- Exposed a product bug: the edit route previously wrapped `compileEditInstruction` inside the full
  generate-style `compileAvatarPrompt` stack (goal/style/creativity/background), which fights
  preservation. The route now uses `compileEditPrompt` instead.

### 2026-08-06 identity / multi-reference probes

Qualitative scores on synthetic fixtures (single reviewer, not blinded):

| Scenario | Likeness | Prompt adherence | Edit preservation | Couple separation | Notes |
| -------- | -------- | ---------------- | ----------------- | ----------------- | ----- |
| Single-ref comic restyle (Person A) | 4–5 | 5 | N/A | N/A | Explicit face-geometry wording beats vague creativity |
| Multi-ref professional (front + profile) | 5 | 5 | N/A | N/A | Second angle helped three-quarter consistency |
| Photo couple same-frame (A + B) | 4–5 | 5 | N/A | 5 | Distinct people, correct shirt colors, no blend |
| Clothing-only edit (edit-parent) | 5 | 5 | 4–5 | N/A | Specific outfit change + strong preserve list |

Product follow-through already landed: dedicated edit compiler, high-likeness photo restraint,
same-frame unblend language, reference geometry/budget helpers, and uploader soft guidance.

### 2026-08-06 weak-reference and stylized restyle probes

| Scenario | Finding | Product follow-through |
| -------- | ------- | ---------------------- |
| Underexposed front reference | Restyle invents lighting but loses facial micro-detail; likeness drops hard | Soft underexposure luma check + dark-photo hint |
| Eyes occluded (sunglasses + cap) | Identity cues blocked; not auto-detectable without face ML | Always-on quality checklist (face fully visible) |
| Anime restyle of clear front ref | Strong age-shift / enlarged eyes under stylization | Stylized-style high-likeness guard in prompt compiler |
| Subtle smile edit | Models still overshoot toward a wide smile | Expression chip + edit compiler minimal-smile language |
| Small-size readability | Face can shrink under stylized crops | Explicit 48×48 readability instruction in prompts |
| Extreme full profile | One-eye silhouette; poor sole identity anchor | Plan risk + checklist: prefer front / slight 3/4 |
| Two people in one “single” ref | Model may blend or pick the wrong person | Plan risk + checklist: one person only |

Fixture version `1.1.0` adds a same-task reference-count comparison group. Its single-reference
control is live-eligible; the multi-reference variant remains blocked so it cannot create a false
claim before a provider adapter supports that input shape. The photo-couple same-frame scenario is
also blocked until Provider Capabilities v2 verifies a matching adapter path. The fixture set is
ready for a paid provider baseline, but no identity/edit quality claim should ship until user-owned
keys are used for a controlled run and at least two reviewers score the applicable dimensions.

## Safety boundary

- Fixtures are synthetic, explicitly consented, or redistributable and record provenance/license.
- Fixture provenance, prompts, checksums, and licensing live beside the reference files under
  `fixtures/avatar-evaluation/references/`.
- A scenario is live-eligible only when the current adapter can execute its declared reference
  shape truthfully.
- Never copy production uploads, prompts, keys, continuation IDs, or logs into a run.
- `avatar-eval-results/` is gitignored because live runs may contain generated images.
- The harness records fixture IDs and normalized operational metadata, not complete prompts or image
  bytes in report JSON.
- Evaluation results guide decisions but do not prove universal demographic, cultural, or
  accessibility quality.

## Rubric

Human reviewers score applicable dimensions from 1 to 5. Use the same display order and blinded
configuration labels when comparing runs.

| Score | Meaning |
| ----- | ------- |
| 1 | Fails the intended outcome or has a severe defect |
| 2 | Major issues; not usable without another generation/edit |
| 3 | Usable with visible issues |
| 4 | Good and suitable for the intended avatar use |
| 5 | Excellent; closely matches the stated outcome |

| Dimension | Review question |
| --------- | --------------- |
| `likeness` | Is the referenced person recognizable without identity confusion? |
| `promptAdherence` | Are purpose, composition, background, style, and explicit constraints followed? |
| `editPreservation` | Did non-target identity, clothing, framing, and scene details stay unchanged? |
| `smallSizeReadability` | Is the subject clear and distinctive at 48×48 and 32×32? |
| `coupleIdentitySeparation` | Are both people distinct, correctly represented, and not blended? |
| `visualIntegrity` | Are face, hands, edges, text, crop, lighting, and background free of material defects? |

Record latency, call count, and estimated cost separately; do not turn faster/cheaper output into a
subjective quality score. The live command records `imageCount` and the real `upstreamRequestCount`
separately, because a provider may poll or retry and the two are not the same number. Fill
`estimatedCostUsd` from the provider's own pricing page; the harness does not infer it.

Every live run also writes `review.html` beside its generated images. Open that local file to review
each output at 256×256 for context and at the actual rubric sizes of 48×48 and 32×32. The page scales
the original locally, makes no network requests, and remains inside the gitignored results folder.

## Commands

Validate the versioned fixture set without a key or network call. This runs in normal CI and also
prints per-dimension fixture coverage:

```bash
npm run eval:avatar -- validate
```

Create a blank scoring template and initial Markdown report:

```bash
npm run eval:avatar -- template \
  --provider openai \
  --model gpt-image-2 \
  --verified-at 2026-07-12 \
  --run-id openai-baseline-2026-07-12 \
  --label "Configuration A"
```

After reviewers fill the JSON scores, validate and render it again:

```bash
npm run eval:avatar -- report \
  --run avatar-eval-results/openai-baseline-2026-07-12.json
```

Compare two runs using identical fixture versions:

```bash
npm run eval:avatar -- compare \
  --baseline avatar-eval-results/baseline.json \
  --candidate avatar-eval-results/candidate.json
```

The compare command exits with code `2` when the critical gate fails. The gate fails when any of:

- a rubric **mean** regresses by at least `0.35`;
- a **single fixture** drops by 2 or more points on any dimension, which an aggregate mean would
  otherwise dilute below the threshold;
- a rubric dimension was **not fully scored**, reported as a coverage gap. A dimension with no data
  cannot show a regression, so missing coverage fails rather than passing for lack of evidence.

Both runs must score the identical fixture set; `compare` refuses to run otherwise, because means
across different fixtures are not comparable. `report` and `compare` also reject a run that omits
any fixture.

A mean latency change of at least 25% is reported as operational context but does not alone fail the
quality gate. Intentional regressions require an explicit PR trade-off explaining user benefit,
affected fixtures, cost/latency effect, and rollback path.

## Optional live generation

Live evaluation is never part of normal CI and may incur cost. Review the fixture IDs first, then
pass the narrow provider key in the command environment and confirm cost explicitly:

```bash
OPENAI_API_KEY=... npm run eval:avatar:live -- \
  --provider openai \
  --fixtures professional-founder-en,professional-founder-zh \
  --run-id openai-live-2026-07-12 \
  --confirm-cost
```

For MiniMax, use `MINIMAX_API_KEY` and optional `--region global|china`; for fal.ai use `FAL_KEY`;
for xAI use `XAI_API_KEY`.
The command never prints or writes the key. Multi-reference and same-frame photo fixtures remain
blocked until their provider paths are capability-verified.

## Review process

1. Generate both configurations against the exact same fixture version.
2. Randomize or rename outputs as Configuration A/B before human scoring.
3. Use at least two reviewers for likeness/edit-preservation release decisions and resolve score
   differences greater than one point.
4. Generate comparison JSON/Markdown and attach the run ID and concise result to the PR.
5. Do not commit generated images. Commit only deliberately approved, non-sensitive aggregate
   reports when they are useful as a release record.

## Exploratory built-in OpenAI baseline (2026-07-27)

A single-reviewer, non-blinded exploratory run used the Codex built-in OpenAI image tool with the
synthetic fixtures. It completed text-to-avatar, single-reference stylization, multi-reference
identity, two-person same-frame composition, and a background-only constrained edit.

Applicable mean scores were: likeness 4.5/5, prompt adherence 5.0/5, edit preservation 4.0/5,
small-size readability 4.6/5, couple identity separation 5.0/5, and visual integrity 5.0/5.
The main observed weakness was small identity/crop/lighting drift during stylization and constrained
editing. Multi-reference and composite outputs were promising, but this run does not prove that the
project's OpenAI API adapter supports those request shapes.

This is product-outcome evidence, not a formal provider baseline: it did not execute
`/api/generate`, did not verify BYOK payloads/costs/call counts, and had only one reviewer. The
built-in edit transport also produced transient network failures before successful retries, which
must not be attributed to the Simi adapter or OpenAI API reliability.
