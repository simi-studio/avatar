# Epic 5.1 — Open Source, Docs & Deployment

> Upstream: [plan.md](../plan.md) / [prd.md](../../prd.md) (§16, §17, §18, §20) / [cloudflare-deploy.md](../../cloudflare-deploy.md)

| Field | Value |
| ----- | ----- |
| Milestone | M5 |
| Status | Done |
| Depends on | Epic 4.1 |

## Goal

Finish open-source governance, finalize English docs, and ship the Cloudflare production deployment so external users can self-host in ~10 minutes.

## Current progress (2026-06-11)

- Done: README/docs/legal pages, MIT license, contributing guide, `.env.example`, GitHub Actions CI, Wrangler/OpenNext config, production config template, GitHub repo metadata, Cloudflare Workers production deploy, custom-domain binding, and post-deploy smoke validation.
- Public demo: `https://avatar.simi.studio/zh-CN` returns `HTTP/2 200` on Cloudflare/OpenNext.
- Deferred by decision: product screenshots are not required during high-velocity development because they would add maintenance overhead while the UI changes frequently.
- Optional future work: auto-deploy on merge to default branch.
- Local verification passed: `npm run guard:secrets`, `npm run lint`, `npm run typecheck`, `npm run test` (104 tests), and `npm run build`.

## Checklist

### Docs (English)
- [x] README finalized (demo link, features, local run, deploy, providers, security, License, Contributing)
- [x] docs/security.md / providers.md / cloudflare-deploy.md / architecture.md finalized
- [x] Legal pages `/legal`: Disclaimer / Terms / Privacy
- [x] Screenshots intentionally deferred during high-velocity development

### Open-source governance
- [x] LICENSE (MIT) ✅
- [x] CONTRIBUTING.md ✅
- [x] GitHub repo Description + Topics
- [x] `.env.example` (template only, no real keys)

### CI/CD
- [x] GitHub Actions: lint → typecheck → test → build
- [ ] (Optional) auto-deploy on merge to default branch (Wrangler secrets)

### Deploy
- [x] `wrangler.jsonc` complete
- [x] Deploy Cloudflare Workers
- [x] Bind custom domain (`avatar.simi.studio`)
- [x] Post-deploy smoke validation passes ([cloudflare-deploy.md](../../cloudflare-deploy.md))

## Acceptance

- Open-sourced on GitHub, demo reachable, docs guide self-host.
- Local run in 10 minutes; Cloudflare deploy succeeds; OpenAI + MiniMax both verified live.
