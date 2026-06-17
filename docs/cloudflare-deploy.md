# Cloudflare Deployment

> Deploy Simi Avatar to Cloudflare Workers using the OpenNext Cloudflare adapter. Cloudflare is the **reference** deployment target — the app is a standard Next.js app and can run on any compatible host. See [prd.md](./prd.md) §10 and [architecture.md](./architecture.md).

## Prerequisites

- Node.js 20+
- A Cloudflare account
- Wrangler CLI: `npm i -D wrangler`
- Authenticated: `npx wrangler login`

## Quick deploy

```bash
npm install
npm run build      # OpenNext build for Cloudflare
npm run deploy     # wrangler deploy
```

That's it — no database, KV, R2, or D1 to provision for MVP. Users bring their own API key in the UI (BYOK).

## Environment variables

Required (public, non-secret):

```
NEXT_PUBLIC_APP_NAME=Simi Avatar
NEXT_PUBLIC_GITHUB_URL=https://github.com/simi-studio/avatar
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

Optional (public-demo abuse protection — set secrets via Wrangler, never commit):

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
# NEXT_PUBLIC_TURNSTILE_SITE_KEY is public and can live in vars
```

**Not needed** (BYOK): `OPENAI_API_KEY`, `MINIMAX_API_KEY`, `DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`.

## `wrangler.jsonc` (example)

```jsonc
{
  "name": "simi-avatar",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-05-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "vars": {
    "NEXT_PUBLIC_APP_NAME": "Simi Avatar",
    "NEXT_PUBLIC_GITHUB_URL": "https://github.com/simi-studio/avatar",
    "NEXT_PUBLIC_DEFAULT_LOCALE": "en",
  },
}
```

## Runtime limits

| Concern          | Note                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Request body     | Compress/downscale images client-side; the route pre-rejects oversized `Content-Length` and stream-counts requests without `Content-Length` before parsing, returning `IMAGE_TOO_LARGE`. base64 inflates ~33%. |
| CPU / duration   | Image generation takes 10–30s. Use the synchronous request→wait→response model with a ~60s client timeout (`PROVIDER_TIMEOUT`). |
| Plan differences | Cloudflare **Free** has tighter CPU-time and subrequest limits than **Paid**; heavy/public demos should use a Paid plan.        |
| Concurrency      | No server queue in MVP; throttle the public demo with Cloudflare WAF / Rate Limiting and optional Turnstile. The app's `RATE_LIMIT_PER_MINUTE` guard is instance-local fallback protection, not the primary multi-instance public-demo control. |
| Outbound         | Only the fixed provider hosts are called (OpenAI, MiniMax global/china).                                                        |

## Custom domain (optional)

By default `npm run deploy` publishes to a `*.workers.dev` subdomain, which is
the right choice for forks. To bind your **own** custom domain without putting
production-specific details into this open-source repo, use a private,
gitignored production config:

```bash
# 1. Make sure your domain is already added to Cloudflare.
# 2. Create your private prod config from the template:
cp wrangler.prod.jsonc.example wrangler.prod.jsonc

# 3. Edit wrangler.prod.jsonc and set the route pattern to your domain, e.g.
#    "routes": [{ "pattern": "avatar.example.com", "custom_domain": true }]

# 4. Provide your Cloudflare account id (kept out of the repo):
export CLOUDFLARE_ACCOUNT_ID=<your-account-id>

# 5. Authenticate and deploy to the custom domain:
npx wrangler login
npm run deploy:prod        # or: make deploy-prod
```

- `wrangler.prod.jsonc` is gitignored; only `wrangler.prod.jsonc.example` is
  committed, so the production domain and account id never land in the repo.
- `deploy:prod` runs the OpenNext build and then
  `wrangler deploy --config wrangler.prod.jsonc`.
- Cloudflare provisions the DNS record and TLS automatically when the domain is
  on Cloudflare.

## Post-deploy checklist

- [ ] Home and generate pages load.
- [ ] Locale auto-detects (EN default) and the switcher works (EN ↔ zh-CN).
- [ ] Single mode generates with an OpenAI key.
- [ ] MiniMax works for the selected region (Global/China) with `image-01`.
- [ ] Couple and themed modes work; team preset link loads on another browser.
- [ ] No key/image appears in `wrangler tail` logs.
- [ ] Cloudflare WAF / Rate Limiting and timeout active (if public).
- [ ] Optional Turnstile enabled for public demos that need stronger abuse resistance.

## Rollback

```bash
npx wrangler deployments list
npx wrangler rollback [--message "reason"]
```

For the end-to-end release flow (local gate → deploy → smoke → rollback) and
production log observability without leaking secrets, see the
[release runbook](./release.md).

## Other hosts

Because it is a standard Next.js app, Simi Avatar can also run on Node servers or other edge platforms that support Next.js. Cloudflare is documented here as the recommended zero-infra target.
