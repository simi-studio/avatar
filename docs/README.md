# Simi Avatar — Documentation Map

> Product, architecture, planning, security, deployment, and provider docs for Simi Avatar.
> Project management uses a `PRD → Plan → Epic` chain; other docs are technical support.
> All documentation is written in English.

## Planning chain

| Doc                                    | Purpose                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------- |
| [prd.md](./prd.md)                     | Product requirements: WHY + WHAT (input sources, modes, scope, decisions) |
| [planning/plan.md](./planning/plan.md) | Roadmap and milestones                                                    |
| [planning/epics/](./planning/epics/)   | Epic breakdown, checklists, status                                        |

## Technical docs

| Doc                                                  | Purpose                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| [architecture.md](./architecture.md)                 | Architecture, data flow, module boundaries (HOW)                        |
| [providers.md](./providers.md)                       | Provider interface, OpenAI + MiniMax, how to add one                    |
| [provider-calibration.md](./provider-calibration.md) | Provider/style prompt calibration and QA rules                          |
| [security.md](./security.md)                         | Security & privacy model, hard constraints, checklist                   |
| [cloudflare-deploy.md](./cloudflare-deploy.md)       | Cloudflare Workers deployment guide                                     |
| [release.md](./release.md)                           | Release runbook: gate, deploy, smoke, rollback, observability           |
| [agent-workflow.md](./agent-workflow.md)             | Shared AI-agent workflow for Codex CLI, Claude Code, and GitHub Copilot |

## Repository root

| Doc                                                                      | Purpose                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------ |
| [../README.md](../README.md)                                             | Project front page, local run, feature overview  |
| [../CONTRIBUTING.md](../CONTRIBUTING.md)                                 | Contribution conventions and security red lines  |
| [../AGENTS.md](../AGENTS.md)                                             | Canonical AI-agent instructions                  |
| [../CLAUDE.md](../CLAUDE.md)                                             | Claude Code project memory importing `AGENTS.md` |
| [../.github/copilot-instructions.md](../.github/copilot-instructions.md) | GitHub Copilot repository instructions           |
| [../LICENSE](../LICENSE)                                                 | MIT License                                      |

## Epic index

| Epic                                                             | Milestone | Theme                          |
| ---------------------------------------------------------------- | --------- | ------------------------------ |
| [epic-1.1](./planning/epics/epic-1.1-foundation.md)              | M1        | Foundation, i18n & home        |
| [epic-2.1](./planning/epics/epic-2.1-single-mode.md)             | M2        | Single mode (OpenAI + MiniMax) |
| [epic-3.1](./planning/epics/epic-3.1-couple-and-themed.md)       | M3        | Couple + themed + team preset  |
| [epic-4.1](./planning/epics/epic-4.1-experience-and-security.md) | M4        | Experience, security & quality |
| [epic-5.1](./planning/epics/epic-5.1-open-source-and-deploy.md)  | M5        | Open source, docs & deploy     |
| [epic-9.1](./planning/epics/epic-9.1-provider-and-theme-expansion.md) | M9 | Provider & theme expansion     |
| [epic-9.2](./planning/epics/epic-9.2-generation-experience-upgrade.md) | M9 | Generation experience upgrade |
| [epic-9.3](./planning/epics/epic-9.3-engineering-health-and-confidence.md) | M9 | Engineering health & confidence |
