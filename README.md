# Simi Avatar

> Open-source AI avatar generator powered by your own API key.

Simi Avatar is an open-source, **BYOK (Bring Your Own API Key)** AI avatar generator. No signup, no database, no subscription — plug in your own provider key and generate personalized avatars in the browser. Self-host anywhere with one command.

Live demo: [avatar.simi.studio](https://avatar.simi.studio)

## Features

| Source                         | Mode         | Upload   | What it does                                                    |
| ------------------------------ | ------------ | -------- | --------------------------------------------------------------- |
| **Text to avatar** _(default)_ | **Describe** | none     | Pick a style + short description and generate — no photo needed |
| **Text to avatar**             | **Couple**   | none     | Describe a couple and generate a style-matched pair — no photos |
| **Text to avatar**             | **Themed**   | none     | Generate from a prompt only — e.g. **dog-themed team avatars**  |
| **From a photo**               | **Single**   | 1 photo  | Restyle your photo into an avatar (10 built-in styles)          |
| **From a photo**               | **Couple**   | 2 photos | Generate a style-consistent paired set for two people           |

- 🔑 **BYOK** — use your own OpenAI, MiniMax, or fal.ai API key; nothing is stored
- ✍️ **Text-to-avatar** — start from a style + description, no upload required
- 🎯 **Intent-first controls** — choose goal, likeness, creativity, composition, background, palette, accessories, and avoid-list
- 🔁 **One-click refinement** — try closer likeness, more realistic, cuter, cleaner background, or another variation
- 🐶 **Themed team avatars** — pick a breed per teammate, share a stateless team preset link
- 🌗 **Dark / light theme** — system-aware toggle
- 🛡️ **Privacy-first** — keys live in `sessionStorage`; never written to any database or log
- 🌍 **i18n** — English + Simplified Chinese, auto-detected from your locale (default English)
- 🧩 **Extensible providers** — add a new provider by implementing one interface
- ☁️ **Self-host** — reference deployment on Cloudflare Workers

## Supported providers

| Provider | Models                      | Notes                                                                         |
| -------- | --------------------------- | ----------------------------------------------------------------------------- |
| OpenAI   | `gpt-image-2`               | image-to-image (edits) + text-to-image (generations)                          |
| MiniMax  | `image-01`, `image-01-live` | Region-aware: **Global** (`api.minimax.io`) or **China** (`api.minimaxi.com`) |
| fal.ai   | FLUX.1 [dev]                | Text-to-image + image-to-image via `fal.run`; result downloads are host-allowlisted |

> Note: MiniMax **M3 is a text/coding model** — avatar generation uses MiniMax's **image** models (`image-01`). Pick your MiniMax region in the provider selector; keys are not interchangeable between regions.

## Quick start (local)

```bash
git clone https://github.com/simi-studio/avatar.git
cd avatar
npm install
npm run dev
```

Open http://localhost:3000, click **Launch App**, choose a provider, paste your API key, and generate.

No environment variables are required to run — you bring your key in the UI. See [.env.example](./.env.example) for optional settings.

> Prefer a task runner? `make help` lists the common targets (`make dev`, `make check`, `make deploy`).

## Deploy (Cloudflare Workers)

```bash
npm run build
npm run deploy
```

To deploy to your **own custom domain** without leaking production-private
details into the repo, copy `wrangler.prod.jsonc.example` to the gitignored
`wrangler.prod.jsonc`, set your domain, and run `npm run deploy:prod`
(or `make deploy-prod`).

Full guide: [docs/cloudflare-deploy.md](./docs/cloudflare-deploy.md). The app is a standard Next.js app and can run on any Next.js-compatible host; Cloudflare is the documented reference target.

## Privacy

Your image and API key are used **only** for the current generation request. Simi Avatar does not store your API key or images, and never writes them to logs. EXIF metadata is stripped from uploads on the client. See [docs/security.md](./docs/security.md).

## Documentation

| Doc                                                            | Purpose                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [docs/prd.md](./docs/prd.md)                                   | Product requirements                                                    |
| [docs/architecture.md](./docs/architecture.md)                 | Architecture & data flow                                                |
| [docs/providers.md](./docs/providers.md)                       | Provider interface & how to add one                                     |
| [docs/provider-calibration.md](./docs/provider-calibration.md) | Provider/style prompt calibration matrix                                |
| [docs/security.md](./docs/security.md)                         | Security & privacy model                                                |
| [docs/cloudflare-deploy.md](./docs/cloudflare-deploy.md)       | Deployment guide                                                        |
| [docs/release.md](./docs/release.md)                           | Release runbook: gate, deploy, smoke, rollback, observability           |
| [docs/agent-workflow.md](./docs/agent-workflow.md)             | Shared AI-agent workflow for Codex CLI, Claude Code, and GitHub Copilot |
| [docs/planning/plan.md](./docs/planning/plan.md)               | Roadmap & milestones                                                    |
| [docs/README.md](./docs/README.md)                             | Doc map                                                                 |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All documentation is written in English.

AI agents must follow [AGENTS.md](./AGENTS.md). Claude Code loads it through [CLAUDE.md](./CLAUDE.md), and GitHub Copilot loads the repository entrypoint at [.github/copilot-instructions.md](./.github/copilot-instructions.md).

## License

[MIT](./LICENSE) © 2026 Simi Studio
