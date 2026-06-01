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

- Providers: OpenAI `gpt-image-1`, MiniMax `image-01`.
- Styles: all 10 built-in styles have OpenAI and MiniMax fragments.
- Controls compiled into prompts: goal, style/theme, description, likeness, creativity, composition, background, palette, mood, accessories, avoid-list, paired consistency, variation.
- Native negative-prompt and reference-strength flags are modeled, but current MVP providers use safe prompt text because unsupported/unstable request params should not be sent speculatively.

## QA Expectations

- `__tests__/lib/provider-calibration.test.ts` verifies every provider/style pair has a fragment, known bias, and recovery hint.
- `__tests__/lib/prompt-compiler.test.ts` verifies the same intent compiles differently for OpenAI and MiniMax.
- Built-in styles and theme variants render as text chips (no preview thumbnails), keeping the form compact and avoiding bundled raster/SVG preview assets.

## Maintenance Rules

- Add calibration before exposing a new built-in style.
- Keep prompt fragments in English; the UI remains localized, but image models follow English instructions most reliably.
- Do not include user prompts, API keys, generated images, or production logs in calibration notes.
- When adding a provider capability such as native negative prompts or reference strength, update the prompt profile and add request payload tests before sending new upstream parameters.
