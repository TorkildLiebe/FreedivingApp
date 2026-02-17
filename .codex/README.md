# Codex Command Hooks

This project provides command-based Codex hooks under `/.codex/hooks`.

These hooks are explicit commands (not automatic prompt hooks) and mirror the intent of `.claude/hooks`.

## Available Commands

- `pnpm codex:hook:pre-edit -- <file_path>`
- `pnpm codex:hook:post-edit -- <file_path>`
- `pnpm codex:hook:pre-commit`
- `pnpm codex:hook:post-test -- "<command_string>"`
- `pnpm codex:hook:all -- <pre-edit|post-edit|pre-commit|post-test> [arg]`

Direct dispatcher usage is also supported:

- `./.codex/hooks/run-hook.sh <pre-edit|post-edit|pre-commit|post-test> [arg]`

## Event Behavior

- `pre-edit`: generated file guard blocks writes to generated directories and warns on Prisma schema edits.
- `post-edit`: suggests nearest backend/mobile targeted test command when an adjacent test exists.
- `pre-commit`: type-checks only touched app(s) based on staged files.
- `post-test`: reports statements coverage from backend/mobile coverage summary (warns below 80%).
