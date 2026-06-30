# Provider Calibration

> Provider/style calibration notes for Simi Avatar's intent-first generation flow. Upstream: [providers.md](./providers.md), [architecture.md](./architecture.md), and [prd.md](./prd.md).

## Purpose

Simi Avatar does not send the user's visible text directly as the final provider prompt. The UI captures a provider-neutral `AvatarIntent`, then the server compiles it into provider-specific prompts and safe request options.

The calibration matrix records how each built-in style should be worded for each provider, plus known bias and a recovery hint. This keeps model-specific behavior out of UI components.

## Runtime Shape

| Module                                                | Role                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| `lib/avatar-intent.ts`                                | Canonical intent model, goal presets, refinement actions        |
| `lib/prompt-compiler.ts`                              | Compiles one `AvatarIntent` into OpenAI/MiniMax prompt payloads |
| `lib/provider-calibration.ts`                         | Provider prompt profiles and style calibration matrix           |
| `styles/avatar-styles.ts` / `styles/avatar-themes.ts` | Built-in style/theme metadata and preview asset paths           |

## Current Calibration Scope

- Providers: OpenAI `gpt-image-2`, MiniMax `image-01`.
- Styles: all 10 built-in styles have OpenAI and MiniMax fragments.
- Controls compiled into prompts: goal, style/theme, description, likeness, creativity, composition, background, palette, mood, accessories, avoid-list, paired consistency, variation.
- Native negative-prompt and reference-strength flags are modeled, but current MVP providers use safe prompt text because unsupported/unstable request params should not be sent speculatively. OpenAI uses explicit avatar prompt constraints plus `quality: "medium"` and `background: "opaque"` request options.

## QA Expectations

- `__tests__/lib/provider-calibration.test.ts` verifies every provider/style pair has a fragment, known bias, and recovery hint.
- `__tests__/lib/prompt-compiler.test.ts` verifies the same intent compiles differently for OpenAI and MiniMax.
- Built-in styles and theme variants render as text chips (no preview thumbnails), keeping the form compact and avoiding bundled raster/SVG preview assets.

## Model & Capability Drift Guard

Provider model IDs, supported sizes, edit/composition support, and pricing change upstream. The
adapters hard-code these (e.g. `lib/providers/openai.ts` `gpt-image-2`, `lib/providers/minimax.ts`
`image-01` / `image-01-live`, `lib/providers/fal.ts` FLUX), so they must be re-verified, not assumed.

**Cadence:** run this checklist every release, and before flipping any new capability bit on.

- [ ] Confirm each hard-coded model ID still exists in the provider's current docs (OpenAI image
      generation, MiniMax `image_generation`, fal FLUX). Update the ID and the cost-transparency
      display label (M10.2) together if it changed.
- [ ] Confirm supported sizes in `lib/provider-capabilities.ts` still match each provider.
- [ ] Confirm multi-image composition / edit support before exposing photo `couple` same-frame
      (M10.4): OpenAI edits accept multiple inputs; MiniMax `image-01` supports subject reference;
      FLUX image-to-image is single-image.
- [ ] Confirm the official pricing-page URLs used by the cost surface still resolve.
- [ ] If any upstream parameter (native negative prompt, reference strength) becomes stable, add it
      to the prompt profile **with** request-payload tests before sending it.

Record outcomes in the PR description; do not paste keys, user prompts, generated images, or
production logs into this file. Known model-ID risk is tracked in [prd.md](./prd.md) §22.1.

## Maintenance Rules

- Add calibration before exposing a new built-in style.
- Keep prompt fragments in English; the UI remains localized, but image models follow English instructions most reliably.
- Do not include user prompts, API keys, generated images, or production logs in calibration notes.
- When adding a provider capability such as native negative prompts or reference strength, update the prompt profile and add request payload tests before sending new upstream parameters.
