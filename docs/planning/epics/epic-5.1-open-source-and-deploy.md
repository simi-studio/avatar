# Epic 5.1 — Open Source, Docs & Deployment

> Upstream: [plan.md](../plan.md) / [prd.md](../../prd.md) (§16, §17, §18, §20) / [cloudflare-deploy.md](../../cloudflare-deploy.md)

| Field | Value |
| ----- | ----- |
| Milestone | M5 |
| Status | Done |
| Depends on | Epic 4.1 |

## Goal

Finish open-source governance, finalize English docs, and ship the Cloudflare production deployment so external users can self-host in ~10 minutes.

## Checklist

### Docs (English)
- [x] README finalized (screenshots, demo link, features, local run, deploy, providers, security, License, Contributing)
- [x] docs/security.md / providers.md / cloudflare-deploy.md / architecture.md finalized
- [x] Legal pages `/legal`: Disclaimer / Terms / Privacy
- [ ] Screenshots in `public/screenshots/`

### Open-source governance
- [x] LICENSE (MIT) ✅
- [x] CONTRIBUTING.md ✅
- [ ] GitHub repo Description + Topics
- [x] `.env.example` (template only, no real keys)

### CI/CD
- [x] GitHub Actions: lint → typecheck → test → build
- [ ] (Optional) auto-deploy on merge to default branch (Wrangler secrets)

### Deploy
- [x] `wrangler.jsonc` complete
- [ ] Deploy Cloudflare Workers
- [ ] Bind custom domain (e.g. `avatar.simi.studio`)
- [ ] Post-deploy checklist passes ([cloudflare-deploy.md](../../cloudflare-deploy.md))

## Acceptance

- Open-sourced on GitHub, demo reachable, docs guide self-host.
- Local run in 10 minutes; Cloudflare deploy succeeds; OpenAI + MiniMax both verified live.
