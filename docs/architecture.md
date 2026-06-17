# Architecture

> Technical architecture, data flow, and module boundaries for Simi Avatar. See [prd.md](./prd.md) for the WHY/WHAT.

| Field            | Value                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------ |
| App stack        | Next.js (App Router) + TypeScript (strict) + Tailwind + Shadcn UI                          |
| Server           | Next.js Route Handler (`/api/generate`)                                                    |
| i18n             | English + Simplified Chinese (default English, locale auto-detected)                       |
| Reference deploy | Cloudflare Workers (OpenNext adapter) — see [cloudflare-deploy.md](./cloudflare-deploy.md) |
| Persistence      | None (no DB / KV / R2 / D1 in MVP)                                                         |

## Overview

```mermaid
flowchart TD
  U[User browser] -->|locale auto-detect| I18N[i18n: en / zh-CN]
  U -->|API key in sessionStorage| FE[Next.js UI]
  FE -->|"POST /api/generate (key + image + params)"| API[Route Handler]
  API -->|in-memory only| PROV{Provider}
  PROV -->|OpenAI| OAI[gpt-image-2]
  PROV -->|MiniMax Global| MMG[api.minimax.io image-01]
  PROV -->|MiniMax China| MMC[api.minimaxi.com image-01]
  OAI --> API
  MMG --> API
  MMC --> API
  API -->|images| FE
  FE -->|download| U
```

> The key and image flow through Route Handler **memory only** for a single request — never persisted, never logged (see [security.md](./security.md)).

## Generation modes

All modes share one provider abstraction, intent model, prompt compiler, and `/api/generate` endpoint. They differ only in input shape and provider request family.

| Mode          | Input    | Endpoint family                  | Output |
| ------------- | -------- | -------------------------------- | ------ |
| `text`        | none     | text-to-image                    | 1      |
| `couple-text` | none     | text-to-image ×2 (shared style)  | 2      |
| `single`      | 1 image  | image-to-image                   | 1      |
| `couple`      | 2 images | image-to-image ×2 (shared style) | 2      |
| `themed`      | none     | text-to-image                    | 1      |

## Module boundaries

| Module                        | Responsibility                                             | Must not                   |
| ----------------------------- | ---------------------------------------------------------- | -------------------------- |
| `components/*`                | UI, intent/mode/provider/theme selection, language switch  | Talk to providers directly |
| `app/api/generate/route.ts`   | Validate, normalize intent, proxy to provider, map errors  | Persist or log key/image   |
| `lib/avatar-intent.ts`        | Canonical intent, goal presets, refinement actions         | Know provider HTTP details |
| `lib/prompt-compiler.ts`      | Compile one intent into provider-specific prompt payloads  | Touch API keys/images      |
| `lib/provider-calibration.ts` | Provider/style prompt profiles, known bias, recovery hints | Contain user data/secrets  |
| `lib/providers/*`             | Provider adapters (OpenAI, MiniMax)                        | Hold global state          |
| `lib/prompt-builder.ts`       | Backward-compatible prompt-builder wrapper                 | Know about HTTP            |
| `lib/preset.ts`               | Encode/decode team preset (URL-safe)                       | Ever include an API key    |
| `lib/image-utils.ts`          | EXIF strip, downscale/compress                             | —                          |
| `lib/validation.ts`           | Mode×input, size/type checks                               | —                          |
| `i18n/*`                      | en / zh-CN message catalogs                                | Contain secrets            |

## Provider abstraction

```ts
type GenerationMode = "text" | "couple-text" | "single" | "couple" | "themed";

interface ImageProvider {
  id: string; // "openai" | "minimax"
  name: string;
  supportedModes: GenerationMode[];
  resolveBaseUrl?(region?: string): string; // MiniMax: global | china
  generateAvatar(input: {
    apiKey: string;
    region?: string;
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

The final `prompt` is compiled server-side from `AvatarIntent`; UI components never assemble provider prompt strings directly. See [provider-calibration.md](./provider-calibration.md).

### MiniMax region resolution

MiniMax runs two independent platforms with separate keys and base URLs:

| Region | Base URL                   | Image endpoint              |
| ------ | -------------------------- | --------------------------- |
| Global | `https://api.minimax.io`   | `POST /v1/image_generation` |
| China  | `https://api.minimaxi.com` | `POST /v1/image_generation` |

`resolveBaseUrl(region)` returns the correct base; the UI surfaces the region so a Global key is never sent to the China endpoint (and vice versa). See [providers.md](./providers.md).

## Request sequence (themed example)

```mermaid
sequenceDiagram
  participant U as User
  participant FE as UI
  participant API as /api/generate
  participant P as MiniMax image-01
  U->>FE: pick Dogs theme + breed + intent controls, enter key + region
  FE->>API: POST {provider, region, key, mode:themed, intent}
  API->>API: validate mode×input and compile provider prompt
  API->>P: text-to-image (base URL by region)
  P-->>API: image (url/base64)
  API-->>FE: { success, images }
  FE-->>U: preview + download
  Note over API: key/image used in-memory only, then released
```

## i18n

- Catalogs: `i18n/en.json` (source), `i18n/zh-CN.json`.
- Initial locale auto-detected from `Accept-Language` / `navigator.language`; falls back to **English**.
- A manual switcher persists the choice in `localStorage`.
- Routing via `app/[locale]/...`.

## Runtime constraints

- Synchronous request → wait → single response; provider timeout ~120s (`PROVIDER_TIMEOUT`).
- Client compresses/downscales images before upload; the route pre-rejects oversized `Content-Length` and stream-counts requests without `Content-Length` before JSON/form parsing (`IMAGE_TOO_LARGE`).
- No server-side queue in MVP; public demo should use Cloudflare WAF/Rate Limiting and optional Turnstile at the edge, with the app's instance-local `RATE_LIMIT_PER_MINUTE` guard as a self-host/default fallback.
- Document host plan differences (e.g. Cloudflare Free vs Paid CPU/subrequests) in the deploy guide.

## Error handling

Adapters map provider errors to a normalized set: `INVALID_API_KEY`, `INSUFFICIENT_CREDITS`, `INVALID_IMAGE`, `IMAGE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`, `INVALID_MODE_INPUT`, `INVALID_REGION`, `PROVIDER_TIMEOUT`, `CONTENT_REJECTED`, `RATE_LIMITED`, `UNKNOWN_ERROR`.

## Security constraints (summary)

- Key/image in-memory only; never persisted or logged.
- Preset codes never contain a key.
- EXIF stripped client-side.
- Full details in [security.md](./security.md).
