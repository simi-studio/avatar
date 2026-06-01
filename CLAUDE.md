@AGENTS.md

## Claude Code

This file exists because Claude Code reads project memory from `CLAUDE.md`, while this repository keeps shared agent rules in `AGENTS.md`.

- Treat `AGENTS.md` as the canonical project instruction file.
- Keep this file small; put shared rules in `AGENTS.md`, not here.
- Use `/memory` to verify this file and the imported `AGENTS.md` are loaded when debugging instruction issues.
