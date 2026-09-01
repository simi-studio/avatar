# Contributing to Simi Avatar

Thanks for your interest! Simi Avatar is an open-source BYOK AI avatar generator. This guide covers conventions and the hard security rules.

> **All documentation and code comments are written in English.** The app UI ships English + Simplified Chinese; documentation is English-only.

## Development setup

```bash
npm install
npm run dev      # local dev at http://localhost:3000
npm run lint
npm run typecheck
npm run test
npm run build
```

No environment variables are required to develop — you provide an API key in the UI (BYOK).

## AI agent workflow

All project development may be performed by Codex CLI, Claude Code, or GitHub Copilot. They must follow the same project rules:

- [AGENTS.md](./AGENTS.md) is the canonical instruction file.
- [CLAUDE.md](./CLAUDE.md) imports `AGENTS.md` for Claude Code.
- [.github/copilot-instructions.md](./.github/copilot-instructions.md) is the GitHub Copilot repository instruction entrypoint.
- [docs/agent-workflow.md](./docs/agent-workflow.md) explains discovery behavior and verification steps for all three tools.

When updating agent rules, edit `AGENTS.md` first, then update tool-specific entrypoints only if their discovery behavior or critical summary changes.

## Project conventions

- **Language**: TypeScript, `strict` mode. No `any`.
- **Styling**: Tailwind CSS + Shadcn UI.
- **Structure**: keep provider logic in `lib/providers/`, prompt assembly in `lib/prompt-builder.ts`, styles/themes in `styles/`.
- **i18n**: user-facing strings go through the i18n layer (`i18n/en.json`, `i18n/zh-CN.json`); never hard-code UI copy. English is the source/default locale.
- **Filenames**: kebab-case.

## Commit convention

```
{type}({scope}): {description}
```

- type: `feat | fix | docs | chore | refactor | test | ci`
- scope: e.g. `provider | prompt | ui | api | docs | i18n | deploy`
- Example: `feat(provider): add minimax image-01 adapter`

## Security red lines 🔒

These are non-negotiable (see [docs/security.md](./docs/security.md)):

1. **Never** log an API key. No `console.log(apiKey)` or embedding keys in error messages/URLs.
2. **Never** persist keys or user images (no DB / KV / R2 / D1 / files).
3. The team **preset code must never contain an API key** — only non-sensitive generation params.
4. Strip EXIF from uploads on the client.
5. Mask keys to first/last 4 chars if they must be displayed.

PRs that touch the key/image path must pass the log-redaction CI guard.

## Adding things

### A new provider

Implement the `ImageProvider` interface (see [docs/providers.md](./docs/providers.md)), add it under `lib/providers/`, register it in the selector, and add unit tests with mocked `fetch`. If the provider has regional endpoints (like MiniMax Global/China), implement `resolveBaseUrl(region)` and surface the region in the UI.

### A new style

Add an `AvatarStyle` to `styles/avatar-styles.ts` with an `id`, `name`, `description`, and `promptTemplate`. Styles render as text chips, so no thumbnail asset is needed.

### A new theme/variant

Add an `AvatarTheme` (with `variants`) to `styles/avatar-themes.ts`.

## Testing

- Unit-test `prompt-builder`, `validation`, `image-utils`, `preset`, and provider adapters (mock `fetch`, including MiniMax region URL selection).
- Core lib coverage target ≥ 80%.
- Add an E2E happy-path test when changing a generation mode.

## Pull requests

Keep PRs focused. Update relevant docs (English) in the same PR. CI runs `lint → typecheck → test → build`.
