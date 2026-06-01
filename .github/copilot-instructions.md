# GitHub Copilot Instructions

Follow the shared project instructions in `AGENTS.md`. That file is the canonical source of truth for Codex CLI, Claude Code, and GitHub Copilot.

## Repository context

Simi Avatar is an open-source BYOK AI avatar generator. MVP modes are `single`, `couple`, and `themed`; MVP providers are OpenAI and MiniMax; UI languages are English and Simplified Chinese; repository docs are English by default.

Before implementing, read the relevant docs:

1. `docs/prd.md`
2. `docs/architecture.md`
3. `docs/providers.md`
4. `docs/security.md`
5. `docs/planning/plan.md`
6. The relevant epic under `docs/planning/epics/`

## Non-negotiable rules

- Never commit, log, print, persist, or expose real API keys, tokens, passwords, or secrets.
- Never read secret stores such as `~/.simi/` from this workspace.
- `.env.example` is a template only; never create or commit real `.env` secrets.
- API keys and images may pass through server memory only for the current request; never write them to DB / KV / R2 / D1 / files / logs.
- Team preset URLs must never contain API keys or key-like fields.
- MiniMax M3 is a text/coding model, not an image model. Product image generation uses MiniMax `image-01` / `image-01-live`.
- MiniMax must expose Global (`https://api.minimax.io`) and China (`https://api.minimaxi.com`) regions; keys are not interchangeable.
- User-facing UI copy must go through i18n (`en`, `zh-CN`); docs and developer-facing text stay in English.

## Build and validation

When the project is scaffolded and code exists, use:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Run `npm install` first if dependencies are missing. If `package.json` is not present yet, implement the foundation epic before expecting these commands to work.

Do not create commits or branches unless explicitly asked.
