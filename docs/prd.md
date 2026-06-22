# Simi Avatar — Product Requirements Document (PRD)

> One-liner: Simi Avatar is an open-source, no-signup, no-database, no-subscription **BYOK (Bring Your Own API Key) AI avatar generator**. Users plug in their own AI provider API key and generate personalized avatars from two input sources — **text-to-avatar** (the default: pick a style and describe the avatar, no photo needed) and **from a photo** (single-person photo restyle or couple paired avatars) — plus themed avatars generated purely from a prompt, and can self-host with one command.

| Field        | Value                                               |
| ------------ | --------------------------------------------------- |
| Status       | Implemented through M9; next requirements proposed  |
| Version      | v0.4                                                |
| Last updated | 2026-06-19                                          |
| GitHub       | https://github.com/simi-studio/avatar               |
| Positioning  | Open Source / No signup / Non-commercial / BYOK     |
| App stack    | Next.js + TypeScript + Tailwind CSS + Shadcn UI     |
| License      | MIT                                                 |
| Plan         | [planning/plan.md](./planning/plan.md)              |
| Doc map      | [README.md](../README.md) / [docs map](./README.md) |

---

## 1. Overview

### 1.1 Name

Simi Avatar

### 1.2 Positioning

Simi Avatar is an open-source BYOK AI avatar generator. No signup, no login, no subscription — users just enter their own AI provider API key and generate personalized avatars in the browser.

### 1.3 Core principles

- Open Source
- Bring Your Own API Key (BYOK)
- No Login
- No Database
- No Subscription
- Easy Self-hosting

### 1.4 Tagline

> Open-source AI avatar generator powered by your own API key.

### 1.5 Target users

- Everyday users who want a quick avatar
- AI enthusiasts who already hold a provider API key
- Developers who want to compare different AI image models (e.g. OpenAI vs MiniMax)
- Teams or individuals who want a self-hostable avatar tool

---

## 2. Background & goals

### 2.1 Background

Many users already hold API keys for OpenAI, MiniMax, Fal.ai, Replicate, Stability AI, etc., but using those APIs directly to make an avatar usually means reading docs, writing code, and wiring up image upload and prompt parameters. Simi Avatar collapses that into a single web tool.

### 2.2 MVP goal

The MVP solves exactly one problem: **let users generate avatars with their own API key, without signup, login, or payment.**

Core flow:

```
Enter API key → choose source → pick goal/style/intent controls → generate → refine → download
```

### 2.3 Product shape: input sources, modes, and intent

> Simi Avatar is not just "upload a photo, get an avatar." It is built around a provider-neutral **AvatarIntent** that captures what the user wants, then compiles that intent into provider-specific prompts and request options. Modes still describe input shape; intent describes the desired avatar.

| Source         | Mode     | id            | Input photos | Description                                           | Underlying call                 |
| -------------- | -------- | ------------- | ------------ | ----------------------------------------------------- | ------------------------------- |
| Text to avatar | Describe | `text`        | **none**     | Pick a goal/style and describe the avatar             | text-to-image                   |
| Text to avatar | Couple   | `couple-text` | **none**     | Describe a couple and generate a style-matched pair   | text-to-image ×2, shared style  |
| Text to avatar | Themed   | `themed`      | **none**     | Generate from theme + variant + intent controls       | text-to-image                   |
| From a photo   | Single   | `single`      | 1 (required) | Restyle the user's own photo into an avatar           | image-to-image                  |
| From a photo   | Couple   | `couple`      | 2 (required) | Generate a style-consistent paired set for two people | image-to-image ×2, shared style |

**Couple mode design notes:**

- Couple avatars come in two flavors: photo-based (`couple`, two uploaded photos) and text-based (`couple-text`, no upload — describe the pair).
- The user uploads two photos (A, B). The system applies the **same style and consistency constraints** to both and outputs a paired set.
- A "paired consistency" option shares palette, background, lighting, and composition so the two avatars look visually unified.
- `couple-text` reuses the same style + paired-consistency controls but generates both avatars purely from text, with no face reference.
- Optional "same-frame composite" enhancement (V1.1). MVP does "generate separately, align style."
- Implemented as two generation requests with the same `styleId` + base prompt (see §8, §11).

**Themed / team-pack mode design notes:**

- **No photo upload** — pure text-to-image. The user picks a theme preset (e.g. "Dogs") and describes the individual via prompt.
- Built-in "Dogs" theme provides breeds as **character variants**: Shiba Inu, Corgi, Golden Retriever, Husky, Poodle, Border Collie, Dalmatian, Pug.
- Team play: a team defines one **shared Team Style Preset** (unified art style / palette / background); each member picks a **different breed variant** and adds a personal prompt (e.g. `wearing glasses, holding a laptop, friendly smile`) to produce a style-consistent, character-varied team set.
- The team preset travels via a URL query parameter / shareable preset code — no database needed to let teammates reuse the same base setup (see §6.3).

### 2.4 Non-goals (out of scope for MVP)

User registration, login, paid subscription, credit system, database, avatar history, server-side team workspace, admin panel, template marketplace, community feed, long-term image hosting.

> Note: "team avatars" are powered by a stateless shared preset code; this does **not** imply a server-side team workspace or account system.

---

## 3. Success metrics (KPIs)

> MVP optimizes for "validate the product and attract developers," so metrics lean toward open-source reach and flow success rate.

| Dimension   | Metric                                                | MVP target (4 weeks post-launch) |
| ----------- | ----------------------------------------------------- | -------------------------------- |
| Reliability | Generation success rate (excluding invalid user keys) | ≥ 95%                            |
| Experience  | Home LCP (mobile 4G)                                  | < 2.5s                           |
| Experience  | Median time from generate page to first image         | < 30s (provider-dependent)       |
| Reach       | GitHub stars                                          | ≥ 100                            |
| Reach       | Successful external self-hosts (issues/feedback)      | ≥ 5                              |
| Quality     | Critical-path unit coverage (prompt/validation)       | ≥ 80%                            |

---

## 4. Scope

### 4.1 MVP features

**Home**: name, tagline, Launch App button, GitHub button, BYOK explainer, self-host explainer, open-source note.

**Avatar generation page** (core): provider selector, API key input, session-only key save, image upload, image preview, style picker, optional prompt, size selector, Generate button, generation status, result preview, download, clear.

**About / docs entry**: project intro, GitHub URL, License, supported models, security note, deployment note.

**Legal pages (required for the public demo)**: Disclaimer / Terms of Use / Privacy Notice (static, no DB). Even with no data storage, the public demo must state that "users are responsible for their own key usage and generated content."

---

## 5. User flows

### 5.1 First-time flow

```
Open home → Launch App → generate page → pick provider → enter API key
→ upload photo → pick style → Generate → wait → view result → download
```

### 5.2 Returning flow

If an API key exists in `sessionStorage`:

```
Open generate page → auto-load session key → upload image → pick style → Generate
```

Users can click **Clear Key** at any time to remove the locally stored API key.

---

## 6. Page requirements

### 6.1 Home

**Goal**: within 10 seconds the user understands — this is an AI avatar generator, bring your own API key, no signup, no database, self-hostable, open source.

**Copy:**

- Title: `Simi Avatar`
- Subtitle: `Open-source AI avatar generator powered by your own API key.`
- Support line: `No login. No database. No subscriptions. Self-host anywhere.`
- Buttons: `Launch App` / `View on GitHub`

**Highlights**: BYOK, Privacy-first (key never persisted), Open Source, Extensible Providers.

**SEO / sharing**: `<title>`, `<meta description>`, OpenGraph / Twitter Card and a static OG image.

### 6.2 Avatar generation page

**Layout:**

- Top: **input source switch (Text to avatar / From a photo)**, then a mode switch within each source (Describe / Couple / Themed for text; Single / Couple for photo)
- Left input area (changes by mode): Provider / API Key / Avatar intent / Upload Image(s) / Style / Theme + Variant / Description or Optional Prompt / Size / Generate
- Right preview area: source preview (single/couple) / status / result(s) / download / refinement actions

**Mode-aware form** (the UI renders different inputs per mode):

| Mode          | Upload       | Style                                             | Theme                           | Intent controls                                                                     | Output     |
| ------------- | ------------ | ------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------- | ---------- |
| `text`        | none         | style picker                                      | —                               | goal, creativity, composition, background, palette/mood/accessories/avoid           | 1          |
| `couple-text` | none         | shared style picker + "paired consistency" toggle | —                               | goal, creativity, composition, background, palette/mood/accessories/avoid           | 2 (paired) |
| `single`      | 1 (required) | style picker                                      | —                               | goal, likeness, creativity, composition, background, palette/mood/accessories/avoid | 1          |
| `couple`      | 2 (required) | shared style picker + "paired consistency" toggle | —                               | goal, likeness, creativity, composition, background, palette/mood/accessories/avoid | 2 (paired) |
| `themed`      | none         | —                                                 | theme (Dogs…) + variant (breed) | goal, creativity, composition, background, palette/mood/accessories/avoid           | 1          |

**States**: define six UI states — idle / uploading / ready / generating / success / error — with skeleton loaders and a retryable error state.

#### Provider

MVP supports **OpenAI** and **MiniMax** (see §8). M9 adds **fal.ai** as a third provider. The provider selector also exposes a region switch for MiniMax (Global vs China). Replicate / Stability AI remain later candidates.

#### API Key

- Password-type input, hidden by default, with show/hide
- "Save for this session" (`sessionStorage`)
- Clear Key
- Optional pre-validation: a lightweight request to validate the key before generating

**Forbidden storage**: database, KV / R2 / D1, server logs.

#### Image upload (single / couple modes)

- Formats: JPG / PNG / WEBP
- Limits: 10MB max each; min 256×256; recommended 1024×1024
- `couple` requires two images, labeled Person A / Person B
- EXIF stripping on the client (removes GPS and other private metadata) before upload
- Client-side downscale/compress for oversized images to stay within request-body limits (§10.3)
- `themed` mode hides the upload area

#### Style picker

10 built-in styles: Anime, Pixar 3D, Cyberpunk, Professional Headshot, LinkedIn, Fantasy Hero, Comic Book, Watercolor, Retro Game, Sci-Fi.

> Styles are presented as compact text chips (no preview thumbnails) to keep the form short and the Generate button reachable without excessive scrolling.

#### Theme & variant (themed mode)

- Built-in theme: **Dogs**.
- Breed variants: Shiba Inu, Corgi, Golden Retriever, Husky, Poodle, Border Collie, Dalmatian, Pug.
- Each variant carries its own `promptFragment`, combined with the theme base prompt + user prompt.
- Themes and variants are extensible (Cats, Robots, Pixel Heroes later).

#### Optional prompt

Free-form extra description (e.g. `blue background, smiling, soft lighting` or `wearing glasses, holding a laptop`), appended to the template prompt.

#### Size

MVP supports `512x512` / `1024x1024`, default `1024x1024`. Sizes must align with each provider/model's supported values (see §8.1).

#### Cost transparency

Under BYOK, the user pays. Show an **estimated per-generation cost** near the Generate button for the current provider/size; couple modes (`couple` and `couple-text`) should note it is two generations.

### 6.3 Team preset sharing (themed collaboration)

> Let a team reuse one base setup with **no database and no accounts**.

- A team preset holds: `theme` (e.g. `dogs`) + optional shared `styleId` + shared quality prompt + `size`.
- It is encoded into a URL query parameter (e.g. `/generate?mode=themed&theme=dogs&style=pixar-3d&preset=<base64url>`). Opening the link loads the same base setup; the member only picks a breed variant and a personal prompt.
- The preset code **never contains an API key** — only non-sensitive generation params. The key is always entered locally by each member.
- A "Copy team preset link" button produces the shareable URL.

---

## 7. Intent and prompt compiler

### 7.1 Goal

Let users get stable results without learning provider-specific prompt habits. The app captures one canonical `AvatarIntent`, then compiles it into OpenAI-optimized and MiniMax-optimized prompts.

### 7.2 AvatarIntent

```ts
type AvatarIntent = {
  mode: "text" | "couple-text" | "single" | "couple" | "themed";
  goal:
    | "professional-profile"
    | "social-avatar"
    | "team-character"
    | "character";
  styleId?: string;
  themeId?: string;
  variantId?: string;
  subjectDescription?: string;
  likeness: "low" | "medium" | "high";
  creativity: "low" | "medium" | "high";
  composition: "headshot" | "half-body" | "full-body";
  background: "plain" | "studio" | "scene" | "transparent-like";
  palette?: string;
  mood?: string;
  accessories?: string;
  avoid?: string;
  pairedConsistency?: boolean;
  variation?: boolean;
  size: "512x512" | "1024x1024";
};
```

### 7.3 Provider compiler rules

- `text` / `couple-text` / `themed`: no face reference; compile goal/style/theme/description and controls into text-to-image prompts. `couple-text` shares prompt/style/intent across both calls.
- `single` / `couple`: include source-reference instructions and likeness/creativity tradeoff; couple shares prompt/style/intent across both calls.
- OpenAI: natural-language prompt profile.
- MiniMax: concise comma-separated descriptor profile.
- Avoid-list: compiled as safe prompt text for current providers; native negative prompt fields are modeled but not sent unless a provider profile explicitly supports them.
- Style calibration: every built-in style has provider-specific prompt fragments, known bias, and recovery hints in `lib/provider-calibration.ts`.

```ts
compileAvatarPrompt({ provider, intent, style, theme, variant });
```

The UI never assembles provider prompt strings directly.

### 7.4 Style / theme / variant types

```ts
type AvatarStyle = {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
};

type AvatarVariant = {
  id: string; // e.g. "shiba-inu"
  name: string; // e.g. "Shiba Inu"
  promptFragment: string;
};

type AvatarTheme = {
  id: string; // e.g. "dogs"
  name: string; // e.g. "Dogs"
  basePrompt: string;
  variants: AvatarVariant[];
};
```

### 7.4 Template examples

```ts
const professionalHeadshot: AvatarStyle = {
  id: "professional-headshot",
  name: "Professional Headshot",
  description: "Clean, realistic, business-style portrait.",
  promptTemplate:
    "professional studio headshot, realistic lighting, clean neutral background",
};

const dogsTheme: AvatarTheme = {
  id: "dogs",
  name: "Dogs",
  basePrompt:
    "a cute anthropomorphic dog character avatar, friendly, expressive eyes, clean background",
  variants: [
    {
      id: "shiba-inu",
      name: "Shiba Inu",
      promptFragment: "shiba inu, orange and cream fur, curled tail",
    },
    {
      id: "corgi",
      name: "Corgi",
      promptFragment: "welsh corgi, short legs, big ears",
    },
    {
      id: "husky",
      name: "Husky",
      promptFragment: "siberian husky, blue eyes, grey and white fur",
    },
    // ...golden-retriever, poodle, border-collie, dalmatian, pug
  ],
};
```

---

## 8. AI provider design

### 8.1 MVP providers & models

MVP ships **two** providers so the abstraction is validated from day one and the maintainer can develop/test against MiniMax:

| Provider    | Single / Couple (image-to-image)                               | Text / Themed (text-to-image)                       | Notes                                                                 |
| ----------- | -------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| **OpenAI**  | `gpt-image-2` via `/v1/images/edits` (DALL·E 3 has no edits)   | `gpt-image-2` via `/v1/images/generations`          | Square avatar output; `quality: "medium"`; `background: "opaque"`     |
| **MiniMax** | `image-01` via `/v1/image_generation` with `subject_reference` | `image-01` via `/v1/image_generation` (prompt only) | Region-aware base URL; see §8.2                                       |

> **Important model clarification**: MiniMax **M3 is a text/coding model**, not an image model. Avatar generation uses MiniMax's **image** models — `image-01` (and `image-01-live` for illustrated/cartoon styles). The maintainer's "test with MiniMax" workflow targets `image-01`.
>
> Face fidelity depends on the model. Docs must clearly state results are "stylized generation, not strict photographic reproduction."

### 8.2 MiniMax regions (Global vs China)

MiniMax operates two separate platforms with **different base URLs and separate API keys**. The provider must expose a region switch:

| Region | Base URL                   | Console               |
| ------ | -------------------------- | --------------------- |
| Global | `https://api.minimax.io`   | platform.minimax.io   |
| China  | `https://api.minimaxi.com` | platform.minimaxi.com |

- Image endpoint (both regions): `POST {baseUrl}/v1/image_generation`
- Auth: `Authorization: Bearer <apiKey>`
- Models: `image-01`, `image-01-live`
- Text-to-image: `prompt`, `aspect_ratio`/size, `n`, `response_format` (`url` | `base64`)
- Image-to-image: add `subject_reference` (character reference image) to carry the source face/subject
- A key from one region does **not** work on the other; the UI must make the region explicit.

### 8.3 Provider expansion

Shipped (M9): **fal.ai** (FLUX.1 [dev] text-to-image and image-to-image via the synchronous `fal.run` endpoint).

Still planned: Replicate, Stability AI.

### 8.4 Provider abstraction

```ts
type GenerationMode = "text" | "couple-text" | "single" | "couple" | "themed";

interface ImageProvider {
  id: string; // "openai" | "minimax"
  name: string;
  /** Some providers may support only a subset of modes */
  supportedModes: GenerationMode[];
  /** Region-specific base URL (e.g. MiniMax global vs china) */
  resolveBaseUrl?(region?: string): string;
  generateAvatar(input: {
    apiKey: string;
    region?: string; // e.g. "global" | "china" for MiniMax
    mode: GenerationMode;
    images?: File[]; // text/couple-text/themed: 0; single: 1; couple: 2
    prompt: string;
    styleId?: string;
    themeId?: string;
    variantId?: string;
    size: "512x512" | "1024x1024";
  }): Promise<GeneratedImage[]>; // text/single/themed: 1; couple/couple-text: 2
}
```

### 8.5 Result type

```ts
type GeneratedImage = {
  url?: string;
  base64?: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  label?: string; // "A" / "B" in couple mode
};
```

---

## 9. Key trust model (key architecture decision)

> Any request that flows through a server-side proxy necessarily passes the plaintext key and image **through server memory**. This section makes the trade-off explicit.

**MVP uses Scheme B (Worker proxy) with an explicit commitment boundary:**

| Scheme                         | Pros                                                                          | Cons                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| A. Browser → provider directly | Key never touches the server; strongest privacy                               | Subject to provider CORS; exposes request shape to the client            |
| **B. Worker proxy (MVP)**      | Avoids CORS, unifies error handling, enables rate limiting / abuse protection | Key and image pass through Worker memory (never persisted, never logged) |

**Hard commitments for Scheme B (enforced in the security doc and in code):**

- API key and image are used **only in memory for the lifetime of a single request**, then released
- Never written to any persistent store (DB / KV / R2 / D1 / files)
- Never written to any log (error, access, or third-party analytics)
- Error messages never contain the full key (mask to first/last 4 chars if shown)
- Lint/review rules forbid patterns like `console.log(apiKey)`

> V1.1 may add Scheme A as a "zero-trust mode" toggle.

---

## 10. Runtime & deployment architecture

> The app is a standard Next.js application. The default reference deployment target is **Cloudflare Workers** (via the OpenNext Cloudflare adapter), documented in [cloudflare-deploy.md](./cloudflare-deploy.md). Cloudflare is a deployment choice, not a core part of the app stack — the app can run on any Node/edge host that supports Next.js.

### 10.1 App stack

- **Frontend**: Next.js (App Router), TypeScript (strict), Tailwind CSS, Shadcn UI
- **Server**: Next.js Route Handler (`/api/generate`)
- **i18n**: next-intl (or equivalent), English + Simplified Chinese

### 10.2 Reference deployment (Cloudflare)

- Runtime: Cloudflare Workers via OpenNext Cloudflare adapter
- Tooling: Wrangler
- DNS/domain: Cloudflare (optional)
- No R2 / KV / D1 in MVP (Turnstile reserved for public-demo abuse protection)

### 10.3 Runtime constraints & timeout strategy

> Image generation often takes 10–30s and base64 inflates the body (a 10MB image → ~13MB). Platform limits must be handled explicitly.

- **Body size**: compress/downscale on the client before upload; the server pre-rejects oversized `Content-Length` and stream-counts requests without `Content-Length` before parsing, returning `IMAGE_TOO_LARGE`.
- **Duration / CPU**: confirm typical provider response time fits within the host's limits. MVP uses a synchronous "request → wait → single response" model with a sensible client timeout (~60s) and a `PROVIDER_TIMEOUT` error.
- **Plan differences**: document CPU-time and subrequest differences (e.g. Cloudflare Free vs Paid) and give self-host guidance.
- **Concurrency**: no server-side queue in MVP; the public demo throttles at the edge via Cloudflare WAF / Rate Limiting and optional Turnstile, with the app's instance-local rate limiter as fallback (§12.4).

---

## 11. API design

### 11.1 Generate API

`POST /api/generate`

Body is `multipart/form-data` (with images) or `application/json` (themed, no image). Logical payload:

```ts
type GenerationMode = "text" | "couple-text" | "single" | "couple" | "themed";

type GenerateRequest = {
  provider: "openai" | "minimax" | "fal";
  region?: "global" | "china"; // MiniMax only
  apiKey: string;
  mode: GenerationMode;
  images?: File[]; // text/couple-text/themed: omitted; single: 1; couple: 2
  styleId?: string; // required for text/couple-text/single/couple; optional for themed
  themeId?: string; // required for themed (e.g. "dogs")
  variantId?: string; // required for themed (e.g. "shiba-inu")
  userPrompt?: string;
  intent?: AvatarIntent; // canonical intent; legacy fields remain as fallback
  size: "512x512" | "1024x1024";
};

type GenerateResponse = {
  success: boolean;
  images?: Array<{
    url?: string;
    base64?: string;
    mimeType: string;
    label?: string; // couple: "A" / "B"
  }>;
  error?: { code: string; message: string };
};
```

**Server validates per mode**: `text` needs a `styleId` and no image; `couple-text` needs a `styleId` and no image (outputs a pair); `single` needs exactly 1 image; `couple` exactly 2; `themed` accepts no image but needs `themeId` + `variantId`. Invalid combinations return `INVALID_MODE_INPUT`.

### 11.2 Error codes

```
INVALID_API_KEY
INSUFFICIENT_CREDITS
INVALID_IMAGE
IMAGE_TOO_LARGE
UNSUPPORTED_FILE_TYPE
INVALID_MODE_INPUT     // mode/input mismatch (e.g. couple with 1 image)
INVALID_REGION         // MiniMax region/base-url mismatch
PROVIDER_TIMEOUT
CONTENT_REJECTED
RATE_LIMITED
UNKNOWN_ERROR
```

---

## 12. Security & privacy

### 12.1 API key security

- Stored only in `sessionStorage`; server uses it only in-memory for the current request
- Never written to DB / KV / R2 / D1 / logs
- Error messages never contain the full key
- UI provides show/hide, Clear Key, and a session-only note
- See §9 for the full trust model

### 12.2 Image privacy

- MVP stores neither uploads nor results; images go only to the provider during generation
- EXIF (incl. GPS) is stripped on the client before upload
- UI note: `Your image and API key are only used for this generation request. Simi Avatar does not store your API key or images.`

### 12.3 Content safety

Follow provider content policies; the UI states that illegal, sexual, hateful content and deceptive impersonation of real people are not supported. Rejected generations return `CONTENT_REJECTED` with a friendly message.

### 12.4 Interface protection

The public demo enables: Cloudflare WAF / Rate Limiting, optional Turnstile, file-size limits, request timeout, MIME validation. The in-app `RATE_LIMIT_PER_MINUTE` limiter is instance-local fallback protection for self-host and local deployments, not the primary multi-instance public-demo control. Self-hosters using their own key bear abuse cost, but basic protections stay on by default.

---

## 13. Accessibility, i18n & compatibility

- **a11y**: WCAG 2.1 AA basics — label association, keyboard reachability, visible focus, sufficient contrast, alt text on result images, errors conveyed by text (not color alone).
- **Responsive**: mobile-first; on narrow screens the input and preview areas stack vertically.
- **Browsers**: latest two versions of Chrome / Edge / Safari / Firefox.
- **i18n (MVP)**: **English + Simplified Chinese**. **Default English.** The deployed app auto-selects the initial language from the user's locale (e.g. `Accept-Language` / `navigator.language`); a manual language switcher is always available and the choice persists in `localStorage`. **All repository docs are written in English by default.**

---

## 14. File & directory structure

```
avatar/
  app/
    [locale]/
      page.tsx
      generate/page.tsx
      about/page.tsx
      legal/page.tsx
    api/generate/route.ts
  components/
    api-key-input.tsx
    provider-selector.tsx       # OpenAI / MiniMax + MiniMax region switch
    mode-selector.tsx           # Single / Couple / Themed
    image-uploader.tsx          # single/double image (couple)
    style-picker.tsx
    theme-picker.tsx            # theme + variant (themed)
    result-preview.tsx          # multi-image result (couple)
    team-preset-share.tsx       # copy team preset link
    language-switcher.tsx       # EN / zh-CN
    generation-form.tsx
  lib/
    providers/openai.ts
    providers/minimax.ts        # region-aware base URL (global/china)
    prompt-builder.ts           # mode-aware assembly
    image-utils.ts              # EXIF strip / compress
    preset.ts                   # team preset encode/decode (URL-safe)
    validation.ts               # mode×input validation
    constants.ts
  i18n/
    en.json
    zh-CN.json
  styles/
    avatar-styles.ts
    avatar-themes.ts            # Dogs theme + breed variants
  docs/ ...
  public/screenshots/ , public/styles/ , public/themes/
  __tests__/
  .github/workflows/
  README.md , LICENSE , CONTRIBUTING.md
  wrangler.jsonc , package.json
```

---

## 15. Quality: testing & CI

### 15.1 Testing

- **Unit**: `prompt-builder`, `validation` (size/type/dimensions, mode×input), `image-utils` (EXIF strip/compress), `preset` (must reject keys), provider adapters (mock fetch, incl. MiniMax region URL selection).
- **Integration/E2E**: mock providers; cover the full flow (upload → style → generate → download) and major error paths.
- **Coverage target**: core lib ≥ 80%.

### 15.2 CI (GitHub Actions)

- On PR: `lint` → `typecheck` → `test` → `build`
- Optional: auto-`deploy` on merge to default branch (credentials via Wrangler secrets)
- Guard: static rule forbidding key logging

---

## 16. Open source

### 16.1 Repository

- URL: https://github.com/simi-studio/avatar
- Description: `Open-source AI avatar generator powered by your own API key.`
- Topics: `ai` `avatar` `openai` `minimax` `byok` `nextjs` `typescript` `image-generation` `open-source`

### 16.2 README

Intro, screenshots, live demo, feature list, local run, deployment, provider extension guide, key-security note, License, Contributing. **Written in English.**

### 16.3 License

MIT.

---

## 17. Environment variables

**Required:**

```
NEXT_PUBLIC_APP_NAME=Simi Avatar
NEXT_PUBLIC_GITHUB_URL=https://github.com/simi-studio/avatar
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

**Optional** (public-demo abuse protection, via Wrangler secrets):

```
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

**Not needed** (BYOK — no server key / DB / login / payment):

```
OPENAI_API_KEY
MINIMAX_API_KEY
DATABASE_URL
AUTH_SECRET
STRIPE_SECRET_KEY
```

---

## 18. Local development

```bash
npm install      # install
npm run dev      # local dev
npm run build    # build
npm run preview  # local Cloudflare preview
npm run deploy   # deploy
```

---

## 19. MVP acceptance

### 19.1 Functional

**General**: visit home without signup; open generate page; pick OpenAI or MiniMax (with region); enter and session-save the key; clear the key; add optional prompt; pick size; Generate; call the provider; view result; download; regenerate; switch language EN↔zh-CN.

**Modes:**

- `single`: upload JPG/PNG/WEBP; see preview; pick a style; generate and download 1 avatar.
- `couple`: upload 2 (A/B); pick a shared style; generate a style-consistent pair; download each.
- `themed`: no upload; pick Dogs theme + breed variant; enter a personal prompt; generate and download.
- Team preset: produce a shareable link; opening it in another browser loads the same theme/style base setup and the preset contains no key.

### 19.2 Security

Key never written to server logs / DB / R2 / KV / D1; errors never show the full key; size limit works; type validation works; EXIF stripped; failures show clear errors; rejected content is messaged.

### 19.3 Engineering & open source

README / deploy / providers / security docs complete and in English; MIT License added; clear structure; new providers extendable via the interface; core lib unit tests ≥ 80% with passing CI; local run in 10 minutes; successful Cloudflare deploy.

---

## 20. Milestones

> Stage breakdown and acceptance detail live in [planning/plan.md](./planning/plan.md) and [planning/epics/](./planning/epics/).

| Stage                      | Goal                                                                                                                                       | Deliverable                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| M1 (Foundation)            | Init Next.js / TS / Tailwind / Shadcn; i18n scaffold (EN+zh-CN); home; generate-page layout; mode-switch skeleton                          | Home + generate page reachable, base UI done                     |
| M2 (Single loop)           | Key input + sessionStorage; upload + EXIF strip; styles; mode-aware prompt builder; OpenAI + MiniMax adapters; `/api/generate`             | Generate a single avatar with your own OpenAI **or** MiniMax key |
| M3 (Playful modes)         | `couple` paired generation; `themed` text-to-image; Dogs theme + breeds; team preset link                                                  | All three modes work; dog-themed team set reuses a preset        |
| M4 (Experience & security) | Error handling; download/regenerate; Clear Key; mode×input validation; timeout & edge rate-limit guidance/fallback; log redaction; mobile + a11y; core unit tests | Feature loop + test baseline done                                |
| M5 (Open source & deploy)  | README / deploy / providers / security docs; legal pages; Wrangler config; CI; deploy Workers + bind domain                                | Open-sourced on GitHub, demo reachable, docs guide self-host     |

---

## 21. Roadmap

- **M9 shipped**: fal.ai, Cats / Robots / Pixel Heroes themes, couple-text same-frame composite, copyable compiled prompt, local-only history, E2E smoke tests, release/observability docs.
- **M10 candidates**: photo couple same-frame composite, app-level Turnstile challenge, browser-direct zero-trust research, provider pricing links, Replicate or Stability AI, one additional UI locale, optional release automation.
- **V1.2+**: R2 temporary image hosting; share links; batch generation.
- **V2**: optional login; optional D1; user history; team workspace; theme/template marketplace; hosted SaaS; private deployment.

---

## 22. Risks & open questions

### 22.1 Risk register

| Risk                                                       | Impact              | Mitigation                                                                       |
| ---------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------- |
| `gpt-image-2` / `image-01` face fidelity below expectation | Core experience     | State "stylized, not photographic" in docs; offer styles and prompt tuning       |
| Generation time approaches host execution limits           | Timeouts            | Client compression, sensible timeout, plan-difference note (§10.3)               |
| Public demo abuse                                          | Cost / availability | Cloudflare WAF / Rate Limiting + optional Turnstile (§12.4)                      |
| Key passing through Worker raises trust concerns           | Adoption            | Explicit commitment boundary (§9); browser-direct mode in V1.1                   |
| Confusing MiniMax M3 (text) with image models              | Wrong integration   | Docs pin image models `image-01`/`image-01-live` and region base URLs (§8.1–8.2) |
| Provider API / size changes                                | Broken flow         | Provider abstraction; pin/validate model & size enums                            |

### 22.2 Open questions

1. Ship browser-direct (zero-trust) mode at launch, or in V1.1?
2. Public-demo Cloudflare edge rate-limit thresholds and app fallback thresholds (per-IP/min, concurrency cap)?
3. Inline each provider's official pricing link for cost transparency?
4. Beyond EN + zh-CN, which language is next?

---

## 23. Decision log

| ID  | Decision                                                                    | Rationale                                                                                             |
| --- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| D1  | No signup in MVP                                                            | Lower complexity and barrier; better for open-source reach                                            |
| D2  | No monetization in MVP                                                      | Goal is to validate the product and attract developers                                                |
| D3  | No database in MVP                                                          | No accounts/history/subscription; BYOK needs no server-side key persistence                           |
| D4  | Cloudflare Workers as the reference deployment (not core stack)             | Convenient self-host target via OpenNext; the app stays host-agnostic                                 |
| D5  | MVP supports OpenAI **and** MiniMax                                         | Validate the abstraction from day one; maintainer develops/tests against MiniMax `image-01`           |
| D6  | OpenAI uses `gpt-image-2` for image generation and image-to-image edits      | Current GPT Image model supports both avatar generation paths; DALL·E 3 lacks edits (§8.1)            |
| D7  | Key via Worker proxy (Scheme B)                                             | Avoid CORS, unify errors/rate limiting; hard "in-memory only, never persisted/logged" constraint (§9) |
| D8  | Single `GenerationMode` abstraction                                         | single/couple/themed share one provider/prompt/API; only input & assembly differ (§2.3)               |
| D9  | Themed mode is text-to-image, no upload                                     | No personal photo needed; lowers privacy concern and barrier; uses generations endpoint (§8.1)        |
| D10 | Team preset via stateless URL encoding                                      | Reuse without a database; preset never carries a key (§6.3)                                           |
| D11 | MiniMax is region-aware (Global vs China)                                   | Separate base URLs and keys; UI must make region explicit (§8.2)                                      |
| D12 | Docs in English; app i18n EN + zh-CN, default English, locale auto-detected | Open-source audience is global; deployed app adapts to user origin (§13)                              |
| D13 | Provider-neutral `AvatarIntent` compiles to provider-specific prompts       | Users express intent once; OpenAI and MiniMax receive wording tuned to their behavior (§7)            |
| D14 | fal.ai added as a third provider (M9), FLUX via the synchronous `fal.run`    | Validates the abstraction beyond two providers; fal results are URLs, downloaded only from fal hosts (SSRF guard) |
| D15 | Provider side-by-side comparison dropped (won't do)                          | One-time selection is served by switching the provider dropdown; a true compare needs two keys at once, breaking single-key BYOK and adding lasting complexity for niche value (M9) |
