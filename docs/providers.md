# Providers

> The `ImageProvider` interface, supported providers (OpenAI, MiniMax, fal.ai, xAI), how to add a new one, and the normalized error model. See [architecture.md](./architecture.md) and [prd.md](./prd.md) §8.

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
  id: string; // "openai" | "minimax" | "fal" | "xai"
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
- Key params: `prompt`, square `width`/`height` (`512` or `1024`), `n`, `response_format` (`url` | `base64`), `prompt_optimizer` (on for generate, off for constrained edit), and `subject_reference` for image-to-image.
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
    width: input.size === "512x512" ? 512 : 1024,
    height: input.size === "512x512" ? 512 : 1024,
    n: 1, // couple and couple-text use two separate calls
    response_format: "base64",
    prompt_optimizer: input.operation !== "edit",
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

### fal.ai

| Mode                        | Endpoint                                          | Model                          |
| --------------------------- | ------------------------------------------------- | ------------------------------ |
| text / couple-text / themed | `POST /fal-ai/flux/dev` (text-to-image)           | FLUX.1 [dev]                   |
| single / couple             | `POST /fal-ai/flux/dev/image-to-image`            | FLUX.1 [dev] image-to-image    |

- Base URL: `https://fal.run` (synchronous endpoint — the result JSON is returned directly).
- Auth: `Authorization: Key <apiKey>`.
- Request: `{ prompt, image_size, num_images: 1, enable_safety_checker: true }`; image-to-image adds `image_url` (a `data:` URL of the upload) and `strength`.
- Sizes: app square sizes map to FLUX `square` (512) and `square_hd` (1024).
- `strength` inverts intent reference strength (higher likeness → lower transformation strength).
- **Response handling**: fal returns image **URLs**, not base64. The adapter downloads each result and base64-encodes it, but **only from fal-controlled hosts** (`fal.media`, `*.fal.media`, `*.fal.run`, `*.fal.ai`) to prevent SSRF via a tampered response.
- For `couple` / `couple-text`, call twice with the same style and label the results `A` / `B`.

### xAI (Grok Imagine)

| Mode                        | Endpoint                                 | Model                          |
| --------------------------- | ---------------------------------------- | ------------------------------ |
| text / couple-text / themed | `POST /v1/images/generations`            | `grok-imagine-image-quality`   |
| single / couple             | `POST /v1/images/edits` (JSON body)      | `grok-imagine-image-quality`   |

- Base URL: `https://api.x.ai` (fixed allowlist; user input never sets the host).
- Auth: `Authorization: Bearer <apiKey>` — keys come from [console.x.ai](https://console.x.ai/), **not** from an X Premium+ subscription.
- Request defaults: `aspect_ratio: "1:1"`, `resolution: "1k"`, `n: 1`, `response_format: "b64_json"`.
- **Edits are JSON, not multipart.** Unlike OpenAI's form-data edits, xAI expects
  `{ image: { url: "data:image/...;base64,..." } }` in an `application/json`
  body. Do not use the OpenAI SDK `images.edit()` multipart path.
- **Response handling**: request `b64_json` first. Prefer `data[].b64_json` and
  honor `data[].mime_type` (with magic-byte sniffing fallback). If only a
  temporary `url` is returned, download it **only** from xAI-controlled hosts
  (`*.x.ai`, including `imgen.x.ai`) with redirects disabled to prevent SSRF.
- App size mapping: supported UI size is `1024x1024` → Grok Imagine `1k`. Higher
  `2k` output is not exposed until the app gains a larger avatar size option.
- Client fetch timeout is slightly above the **120s** provider adapter timeout so
  quality generation can return a normalized provider timeout/error from the route
  instead of being aborted in the browser first.
- For `couple` / `couple-text` (A/B pair), call twice with the same style and label
  the results `A` / `B`. `sameFrame` couple-text uses a single text-to-image call.

## Prompt compilation and calibration

The UI captures a provider-neutral `AvatarIntent` instead of treating the visible text box as the final provider prompt. The server compiles that intent through:

- `lib/avatar-intent.ts` for canonical fields, goal presets, and refinement actions.
- `lib/prompt-compiler.ts` for provider-specific prompt wording and safe request options.
- `lib/provider-calibration.ts` for per-provider/per-style fragments, known bias, and recovery hints.

OpenAI, fal.ai, and xAI receive richer natural-language prompts; MiniMax receives concise comma-separated descriptors. Current providers use soft avoid-list text rather than speculative native negative-prompt parameters. See [provider-calibration.md](./provider-calibration.md).

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

## Provider capabilities v2 (M11)

Provider selection must be based on verified operations, not on a flat list of names. M11 extends
the current size/model metadata with the following shape:

```ts
type EditStrategy = "conversation" | "image-edit" | "regenerate";

type ProviderCapabilitiesV2 = {
  sizes: readonly ImageSize[];
  aspectRatios: readonly string[];
  maxCandidatesPerCall: number;
  maxReferenceImages: number;
  maxReferencePeople: number;
  supportsImageEdit: boolean;
  supportsMultiTurnEdit: boolean;
  supportsMasks: boolean;
  supportsMultiImageComposite: boolean;
  supportsTransparentBackground: boolean;
  supportsSeed: boolean;
  identityPreservation: "none" | "single-reference" | "multi-reference";
  editStrategy: EditStrategy;
  modelLabel: string;
  modelVersion?: string;
  pricingUrl: string;
  verifiedAt: string;
};
```

Capability values require both current official documentation and a fixture-based smoke check where
the behavior is quality-sensitive. A documented endpoint is not sufficient evidence that it
preserves a person's identity well enough for the product to advertise that outcome.

### Truthful degradation

| Requested operation | Capability present | Capability absent |
| ------------------- | ------------------ | ----------------- |
| Continue editing selected result | Multi-turn edit | Use image edit; otherwise label “regenerate” |
| Keep face, change background | Image edit / mask | Regenerate with an identity-change warning |
| Use several photos of one person | Multi-reference identity | Accept only the supported reference count |
| Put two referenced people in one frame | Multi-image composite + verified people count ≥ 2 | Generate style-matched A/B avatars |
| Produce several candidates | Batch/multi-output | Make disclosed parallel calls within limits |

The UI must never call a result an edit merely because it reused the accumulated text prompt.

### Initial M11 verification targets

- **OpenAI**: verify GPT Image multi-image input and high-fidelity edit behavior; evaluate the
  Responses API continuation path separately from the Image API.
- **MiniMax**: verify the real reference count, whether two identities can be preserved in one
  frame, and whether follow-up edits preserve the selected result.
- **fal.ai / FLUX.1 [dev]**: retain single-image generation/edit support until a different fal model
  is deliberately selected and calibrated for multi-reference identity.
- **xAI / Grok Imagine**: verify identity preservation on photo modes and multi-image edit (up to 3
  references) before advertising multi-person same-frame composition. Text/themed paths are
  available; photo identity quality is evaluation-gated under Epic 11.1.
- **Gemini candidate**: evaluate only if it materially closes M11 gaps in multi-reference character
  consistency or conversational editing. Adding it is an outcome-driven decision, not a provider
  count goal.

See [provider-calibration.md](./provider-calibration.md) for the release drift guard and
[planning/epics/epic-11.1-avatar-quality-evaluation.md](./planning/epics/epic-11.1-avatar-quality-evaluation.md)
for the evaluation gate.

### Registry baseline (2026-07-27)

The first v2 registry is intentionally conservative: all current adapters have a documented and
mock-tested single-image edit path, so they resolve to `image-edit`. Multi-turn editing,
multi-reference identity, masks, transparent output, seeds, and multi-image composition remain
disabled until the app executes them and quality-sensitive claims pass the 11.1 fixtures.

Official documentation reviewed for this baseline:

- [OpenAI GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2)
- [MiniMax image-to-image](https://platform.minimax.io/docs/api-reference/image-generation-i2i)
- [fal.ai FLUX.1 dev image-to-image](https://fal.ai/models/fal-ai/flux/dev/image-to-image/api)
- [xAI image edit API](https://docs.x.ai/developers/rest-api-reference/inference/images)
- [xAI multi-image editing](https://docs.x.ai/developers/model-capabilities/images/multi-image-editing)

The last link documents up to three xAI inputs, but the product capability remains disabled because
the current adapter accepts one and no identity/composite fixture smoke has been scored.

## Planned providers

Do not schedule Replicate, Stability AI, Gemini, or another provider solely to expand the catalog.
Add one only when the M11 evaluation identifies a user-critical capability or quality gap that the
current providers cannot satisfy. Security requirements remain identical: no key persistence, no
key logging, fixed upstream hosts, normalized errors, and mocked-fetch coverage.
