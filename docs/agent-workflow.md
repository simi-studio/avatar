# Agent Workflow

> How Codex CLI, Claude Code, and GitHub Copilot share one development standard in this repository.

| Field | Value |
| ----- | ----- |
| Canonical rules | [../AGENTS.md](../AGENTS.md) |
| Claude Code entrypoint | [../CLAUDE.md](../CLAUDE.md) |
| GitHub Copilot entrypoint | [../.github/copilot-instructions.md](../.github/copilot-instructions.md) |
| Docs language | English |
| UI languages | English (default) + Simplified Chinese |

## Goal

All AI development in this project should follow the same rules regardless of whether the work is done with Codex CLI, Claude Code, or GitHub Copilot. To avoid drift, `AGENTS.md` is the source of truth; tool-specific files are thin entrypoints that load or point to it.

## Official discovery behavior

### Codex CLI

Official Codex docs state that Codex reads `AGENTS.md` files before work. It builds an instruction chain from global scope and then from the project root down to the current working directory. Files closer to the current directory appear later and can override earlier guidance.

Project setup: use the repository-root [../AGENTS.md](../AGENTS.md).

Verification:

```bash
codex --ask-for-approval never "Summarize the current instructions."
```

Expected: Codex mentions the Simi Avatar rules from `AGENTS.md`.

### Claude Code

Official Claude Code docs state that Claude reads `CLAUDE.md` project memory, not `AGENTS.md` directly. The docs recommend creating a `CLAUDE.md` that imports `AGENTS.md` with `@AGENTS.md` when a repository already uses `AGENTS.md`.

Project setup: [../CLAUDE.md](../CLAUDE.md) imports `@AGENTS.md`.

Verification: run `/memory` in Claude Code and confirm both `CLAUDE.md` and the imported `AGENTS.md` are loaded.

### GitHub Copilot

GitHub Copilot repository instructions are read from `.github/copilot-instructions.md`. GitHub's current custom-instructions docs also describe `AGENTS.md` files for AI agents, where the nearest `AGENTS.md` in the directory tree takes precedence.

Project setup: [../.github/copilot-instructions.md](../.github/copilot-instructions.md) points Copilot at `AGENTS.md` and repeats the critical security/provider rules.

Verification: in Copilot Chat / Copilot agent responses, expand references and confirm `.github/copilot-instructions.md` is listed when repository instructions are used.

## Shared development contract

Agents must follow [../AGENTS.md](../AGENTS.md), especially:

- Read PRD/architecture/providers/security/planning docs before implementation.
- Keep docs and developer-facing text in English.
- Put user-facing UI text in i18n catalogs (`en`, `zh-CN`), default English.
- Preserve BYOK security: no key persistence, no key logging, no key in team presets.
- Treat MiniMax M3 as a development/coding model only; product image generation uses MiniMax `image-01` / `image-01-live`.
- Validate code with lint/typecheck/test/build once the app is scaffolded.

## Maintenance

When changing shared rules:

1. Update [../AGENTS.md](../AGENTS.md) first.
2. Update tool-specific entrypoints only if discovery behavior or critical summaries change.
3. Keep this document aligned with the current official tool docs.
