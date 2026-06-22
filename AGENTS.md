# Simi Avatar — Agent Instructions

> Shared project instructions for Codex CLI, Claude Code, and GitHub Copilot. This file is the canonical source of truth for AI agents working in this repository.

## Tool entrypoints

- **Codex CLI** reads `AGENTS.md` files from the repository root down to the current working directory. Start Codex from this repository root unless a task explicitly targets a subdirectory.
- **Claude Code** reads `CLAUDE.md`, which imports this file with `@AGENTS.md`.
- **GitHub Copilot** reads `.github/copilot-instructions.md`; Copilot agents may also load the nearest `AGENTS.md`. If instructions differ, this file wins.

## Project overview

Simi Avatar is an open-source BYOK AI avatar generator. It supports five generation modes (`text`, `couple-text`, `single`, `couple`, `themed`), three providers (OpenAI, MiniMax, and fal.ai — the MVP shipped with OpenAI and MiniMax; fal.ai was added in M9), English + Simplified Chinese UI, and English-only repository documentation.

The project is currently docs-first. Before implementation, read:

1. `docs/prd.md`
2. `docs/architecture.md`
3. `docs/providers.md`
4. `docs/security.md`
5. `docs/planning/plan.md`
6. The relevant epic in `docs/planning/epics/`

## Core product decisions

- BYOK only: users enter their own provider API key in the UI.
- Do not add login, subscriptions, credits, database persistence, or image history to the MVP.
- Cloudflare Workers is the reference deployment target, not a product-level architectural principle.
- Supported providers are **OpenAI**, **MiniMax**, and **fal.ai**. The MVP shipped with OpenAI and MiniMax; fal.ai was added in M9.
- MiniMax **M3 is a text/coding model**, not an avatar image model. Product image generation uses MiniMax `image-01` / `image-01-live` via `/v1/image_generation`.
- MiniMax must be region-aware: Global `https://api.minimax.io`, China `https://api.minimaxi.com`; keys are not interchangeable.
- UI languages: English and Simplified Chinese. Default is English. Auto-detect initial locale from the user's source/locale and keep a manual switcher.
- Repository docs are English by default.

## Security rules

- Never commit, print, log, or persist real API keys, tokens, passwords, or secrets.
- Never read secret stores such as `~/.simi/` when working from this workspace.
- Keep `.env.example` as a template only; never create or commit `.env` with real values.
- API keys and images may pass through server memory only for one request; never write them to DB / KV / R2 / D1 / files / logs.
- Team preset URLs must never contain API keys or key-like fields.
- Strip EXIF metadata from uploads on the client.
- Provider base URLs must come from a fixed allowlist; never allow user input to set an arbitrary upstream host.

## Implementation conventions

- Use Next.js App Router, TypeScript strict mode, Tailwind CSS, and Shadcn UI.
- Prefer `npm` commands in this repo unless `package.json` later proves otherwise.
- Do not use `any`; model provider responses with explicit types and narrow unknown data.
- Keep provider logic under `lib/providers/`; use the shared `ImageProvider` interface.
- Keep prompt assembly in `lib/prompt-builder.ts`; do not duplicate prompt templates in UI components.
- Keep validation in `lib/validation.ts`; enforce mode-by-input rules server-side and client-side.
- Put user-facing copy in i18n message files (`i18n/en.json`, `i18n/zh-CN.json`); do not hard-code UI strings in components.
- Keep docs, comments, commit messages, and PR descriptions in English.

## Validation expectations

When code exists, run the smallest relevant checks first, then the full gate before handoff:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If dependencies are missing, run `npm install` first. If the repo has not been scaffolded yet, implement Epic 1.1 before expecting these commands to exist.

For provider changes, add mocked-fetch tests for OpenAI and MiniMax, including MiniMax Global/China region URL selection.

For security-sensitive changes, verify no key or image can be logged, persisted, or embedded in errors/preset URLs.

## Planning and documentation discipline

- Keep changes aligned with `docs/prd.md` and the relevant epic.
- When completing an epic task, update the corresponding checklist/status in `docs/planning/epics/` and `docs/planning/plan.md` if needed.
- Do not introduce new architecture outside the PRD/architecture docs without updating the decision log.
- Keep edits focused; avoid unrelated refactors.
- Do not create commits or branches unless explicitly asked.

## Git and review workflow

- Use commit format `{type}({scope}): {description}` when asked to commit.
- Before adding files to git, check for secrets and accidental `.env` files.
- For non-trivial code changes, run tests and request/perform a review pass before commit.
- Pure documentation changes can skip code tests, but still check links and consistency.
