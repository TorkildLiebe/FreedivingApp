# Codex Command Hooks

This project provides command-based Codex hooks under `/.codex/hooks`.

These hooks are explicit commands (not automatic prompt hooks) and mirror the intent of `.claude/hooks`.

## Available Commands

- `./.codex/hooks/run-hook.sh pre-edit -- <file_path>`
- `./.codex/hooks/run-hook.sh post-edit -- <file_path>`
- `./.codex/hooks/run-hook.sh pre-edit -- <file1> <file2> <file3>` (batch, fail-fast)
- `./.codex/hooks/run-hook.sh post-edit -- <file1> <file2> <file3>` (batch, fail-fast)
- `./.codex/hooks/run-hook.sh pre-commit`
- `./.codex/hooks/run-hook.sh post-test -- "<command_string>"`

Compatibility fallback commands are still available:

- `pnpm codex:hook:pre-edit -- <file_path>`
- `pnpm codex:hook:post-edit -- <file_path>`
- `pnpm codex:hook:pre-commit`
- `pnpm codex:hook:post-test -- "<command_string>"`
- `pnpm codex:hook:all -- <pre-edit|post-edit|pre-commit|post-test> [arg]`

## Event Behavior

- `pre-edit`: generated file guard blocks writes to generated directories and warns on Prisma schema edits.
- `post-edit`: suggests nearest backend/mobile targeted test command when an adjacent test exists.
- `pre-commit`: type-checks only touched app(s) based on staged files.
- `post-test`: reports statements coverage from backend/mobile coverage summary (warns below 80%).

## Performance Note

Use direct dispatcher calls for frequent `pre-edit` / `post-edit` loops. This avoids `pnpm` startup overhead and is substantially faster in this repository.
