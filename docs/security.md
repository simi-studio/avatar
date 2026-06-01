# Security & Privacy

> The trust model, hard constraints, and acceptance checklist for Simi Avatar. See [prd.md](./prd.md) §9 and §12.

## Trust model

Simi Avatar uses **Scheme B (Worker/Route Handler proxy)**: requests pass through the server to avoid provider CORS, unify error handling, and enable abuse protection. This means the plaintext API key and image necessarily pass through **server memory** for a single request.

| Scheme | Pros | Cons | Status |
| ------ | ---- | ---- | ------ |
| A. Browser → provider directly | Key never touches the server | Provider CORS limits; exposes request shape | Deferred to V1.1 (zero-trust toggle) |
| B. Server proxy | Avoids CORS, unifies errors, enables rate limiting | Key/image transit server memory | **MVP** |

## API key — hard constraints

1. Stored client-side only in `sessionStorage`.
2. Used server-side **only in memory** for the lifetime of one request, then released.
3. **Never** written to a database, KV, R2, D1, files, or **any** log (error, access, analytics).
4. **Never** placed in URLs, query strings, preset codes, or error bodies.
5. If displayed, masked to first/last 4 characters.
6. A CI static guard rejects key-logging patterns (e.g. `console.log(apiKey)`).

## Image privacy

- Uploads and results are **not stored**; images go only to the provider during generation.
- **EXIF (incl. GPS) is stripped on the client** before upload.
- Oversized images are downscaled/compressed client-side.
- UI note: `Your image and API key are only used for this generation request. Simi Avatar does not store your API key or images.`

## Team preset security

- The team preset code carries **only non-sensitive generation params** (`theme`, optional `styleId`, quality prompt, `size`).
- It **never** contains an API key. Decoding must drop any field that looks like a key.
- Each teammate enters their own key locally.

## Regional keys (MiniMax)

- MiniMax Global (`api.minimax.io`) and China (`api.minimaxi.com`) use **separate keys and base URLs**.
- The server routes by the explicit `region`; a mismatch surfaces as `INVALID_REGION` rather than leaking which endpoint was tried.
- Region selection is non-sensitive and may appear in preset codes; keys never do.

## Content safety

- Follow each provider's content policy.
- The UI states that illegal, sexual, hateful content and deceptive impersonation of real people are unsupported.
- Blocked generations return `CONTENT_REJECTED` with a friendly message.

## Interface protection (public demo)

- Optional Cloudflare Turnstile.
- Per-IP rate limiting.
- File size limit + MIME validation.
- Request timeout (`PROVIDER_TIMEOUT`).

Self-hosters using their own key bear abuse cost, but basic protections remain on by default.

## OWASP notes

- **Injection / SSRF**: provider base URLs are from a fixed allowlist (OpenAI, MiniMax global/china); user input never sets the request host.
- **Sensitive data exposure**: see key/image constraints above.
- **Security logging**: logs must exclude keys, images, and full prompts that could contain personal data.
- **Dependencies**: keep adapters minimal; pin and audit.

## CI guards

- Static rule forbidding key logging in the key/image code path.
- Type checks (`strict`, no `any`).
- Unit test asserting `preset` encode/decode **rejects** any key-like field.

## Acceptance checklist

- [ ] Key never written to server logs / DB / R2 / KV / D1.
- [ ] Errors never contain the full key.
- [ ] EXIF stripped from uploads.
- [ ] File size + type validation enforced.
- [ ] Preset code contains no key (unit-tested).
- [ ] MiniMax region routed explicitly; mismatch → `INVALID_REGION`.
- [ ] Rate limiting + timeout active on the public demo.
- [ ] Content rejections messaged clearly.
