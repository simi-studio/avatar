# Providers

> The `ImageProvider` interface, the MVP providers (OpenAI, MiniMax), how to add a new one, and the normalized error model. See [architecture.md](./architecture.md) and [prd.md](./prd.md) §8.

## Interface

```ts
type GenerationMode = "text" | "couple-text" | "single" | "couple" | "themed";

type GeneratedImage = {
  url?: string;
  base64?: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  label?: string; // "A" / "B" in couple and couple-text modes
};

interface ImageProvider {
  id: string; // "openai" | "minimax"
  name: string;
  supportedModes: GenerationMode[];
  /** Region-specific base URL (e.g. MiniMax global vs china). */
  resolveBaseUrl?(region?: string): string;
  generateAvatar(input: {
    apiKey: string;
    region?: string; // "global" | "china" (MiniMax)
    mode: GenerationMode;
    images?: File[]; // text/couple-text/themed:0 single:1 couple:2
    prompt: string;
    negativePrompt?: string;
    referenceStrength?: number;
    styleId?: string;
    themeId?: string;
    variantId?: string;
    size: "512x512" | "1024x1024";
  }): Promise<GeneratedImage[]>;
}
```

## MVP providers

### OpenAI

| Mode            | Endpoint                                      | Model         |
| --------------- | --------------------------------------------- | ------------- |
| text / couple-text / themed | `POST /v1/images/generations` (text-to-image) | `gpt-image-2` |
| single / couple             | `POST /v1/images/edits` (image-to-image)      | `gpt-image-2` |

- Base URL: `https://api.openai.com`
- Auth: `Authorization: Bearer <apiKey>`
- Request defaults: `size: "1024x1024"`, `quality: "medium"`, `background: "opaque"`, `n: 1`.
- DALL·E 3 does **not** support image edits — image-to-image must use a GPT Image model.
- Do not send `input_fidelity` for `gpt-image-2`; image inputs are processed at high fidelity by default.
- Align requested `size` with the app's square avatar flow.

### MiniMax

> **Model clarification**: MiniMax **M3 is a text/coding model** and is **not** used here. Avatar generation uses MiniMax **image** models: `image-01` (photo-realistic, supports text-to-image and image-to-image) and `image-01-live` (illustrated/cartoon styling).

MiniMax runs two independent platforms. **Keys are not interchangeable across regions.** The UI must surface a region switch.

| Region | Base URL                   | Console               |
| ------ | -------------------------- | --------------------- |
| Global | `https://api.minimax.io`   | platform.minimax.io   |
| China  | `https://api.minimaxi.com` | platform.minimaxi.com |

| Mode            | Endpoint                                                   | Notes                                                 |
| --------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| text / couple-text / themed | `POST {baseUrl}/v1/image_generation` (prompt only)         | No reference image                                    |
| single / couple             | `POST {baseUrl}/v1/image_generation` + `subject_reference` | Pass the source face/subject as a character reference |

- Auth: `Authorization: Bearer <apiKey>`
- Model: `image-01` by default; photo-based illustrated styles may use `image-01-live` for stronger stylization.
- Key params: `prompt`, square `aspect_ratio` (`1:1`) for avatars, `n`, `response_format` (`url` | `base64`), `prompt_optimizer`, and `subject_reference` for image-to-image.
- `resolveBaseUrl("global" | "china")` selects the base URL; sending a key to the wrong region returns `INVALID_REGION` (mapped from auth failure).

Minimal adapter sketch:

```ts
const MINIMAX_BASE = {
  global: "https://api.minimax.io",
  china: "https://api.minimaxi.com",
} as const;

function resolveBaseUrl(region: string = "global") {
  return (
    MINIMAX_BASE[region as keyof typeof MINIMAX_BASE] ?? MINIMAX_BASE.global
  );
}

type ProviderGenerateInput = Parameters<ImageProvider["generateAvatar"]>[0];

async function minimaxGenerate(
  input: ProviderGenerateInput,
): Promise<GeneratedImage[]> {
  const baseUrl = resolveBaseUrl(input.region);
  const body: Record<string, unknown> = {
    model: "image-01",
    prompt: input.prompt,
    aspect_ratio: "1:1",
    n: 1, // couple and couple-text use two separate calls
    response_format: "base64",
    prompt_optimizer: true,
  };
  if (input.mode !== "themed" && input.images?.length) {
    body.subject_reference = [
      /* character ref built from input.images */
    ];
  }
  const res = await fetch(`${baseUrl}/v1/image_generation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  // ...map response to GeneratedImage[] and normalize errors
}
```

> For `couple`, call the endpoint twice with the same prompt/style — once per person — and label the results `A` / `B`. For `couple-text`, call the text-to-image endpoint twice with the same style/paired-consistency prompt and the same labels.

## Prompt compilation and calibration

The UI captures a provider-neutral `AvatarIntent` instead of treating the visible text box as the final provider prompt. The server compiles that intent through:

- `lib/avatar-intent.ts` for canonical fields, goal presets, and refinement actions.
- `lib/prompt-compiler.ts` for provider-specific prompt wording and safe request options.
- `lib/provider-calibration.ts` for per-provider/per-style fragments, known bias, and recovery hints.

OpenAI receives richer natural-language prompts; MiniMax receives concise comma-separated descriptors. Current providers use soft avoid-list text rather than speculative native negative-prompt parameters. See [provider-calibration.md](./provider-calibration.md).

## Adding a new provider

1. Create `lib/providers/<id>.ts` implementing `ImageProvider`.
2. If it has regional endpoints, implement `resolveBaseUrl(region)` and add the region to the UI.
3. Declare `supportedModes` honestly (a provider may support only some modes).
4. Map provider errors to the normalized error codes below.
5. Register it in the provider selector and `lib/providers/index.ts`.
6. Add unit tests with mocked `fetch` (cover each supported mode and, if applicable, region URL selection).
7. **Never** log the key or embed it in URLs/errors.

## Normalized error model

| Code                    | Meaning                                        |
| ----------------------- | ---------------------------------------------- |
| `INVALID_API_KEY`       | Auth failed / malformed key                    |
| `INSUFFICIENT_CREDITS`  | Quota/balance exhausted                        |
| `INVALID_IMAGE`         | Unreadable/invalid image                       |
| `IMAGE_TOO_LARGE`       | Exceeds body/size limit                        |
| `UNSUPPORTED_FILE_TYPE` | Not JPG/PNG/WEBP                               |
| `INVALID_MODE_INPUT`    | Mode/input mismatch (e.g. couple with 1 image) |
| `INVALID_REGION`        | Key/region/base-url mismatch (MiniMax)         |
| `PROVIDER_TIMEOUT`      | Upstream timed out                             |
| `CONTENT_REJECTED`      | Blocked by provider content policy             |
| `RATE_LIMITED`          | Throttled                                      |
| `UNKNOWN_ERROR`         | Unmapped failure                               |

## Planned providers (V1.1)

Fal.ai, Replicate, Stability AI — each behind the same interface, with security requirements identical to the above (no key persistence, no key logging).
