# Codex Project Profile for FreedivingApp

Apply these rules when working in this repository root.

## Source of Truth

- Canonical guidance remains in `.claude/`.
- Core memory: `.claude/CLAUDE.md`
- Rules: `.claude/rules/`
- Skills: `.claude/skills/` and codex-native skills under `.agents/skills/`

## Skills-First + MCP-When-Useful

- Prefer using a relevant skill before ad-hoc implementation. Start with the smallest set of skills that fully covers the task.
- When a task can be validated or accelerated by MCP tools, use the matching MCP server instead of guessing.
- Explicitly state which skill(s) and MCP server(s) are used for substantive tasks.

## Skill Types In This Repo

- Development: `backend-dev`, `frontend-dev`
- Testing and verification: `test-backend`, `test-mobile`, `ios-simulator-skill`
- Quality and policy: `audit-rules`, `security`
- Product and documentation: `product-copilot`, `sync-docs`
- Dedicated agents:
  - `monitor-agent` via codex role config in `.codex/agents.toml`
  - `vertical-slice-implementor` in `.claude/agents/vertical-slice-implementor.md`

## Mandatory Lifecycle

Use this sequence for substantive tasks:

1. Understand
2. Plan
3. Implement
4. Verify
5. Report

## Mandatory Final Report Sections

Final delivery for implementation and review tasks must include:

- `Changes made`
- `Verification run`
- `Not run / limitations`
- `Risk notes`

## Verification Policy (Risk-Tiered)

Use `.claude/rules/testing.md` as authority.

- Low risk:
  - Localized docs/text/config with no behavior change.
  - Run at least one relevant targeted check or static validation.
- Medium risk:
  - Module-level logic change in one workspace.
  - Run targeted tests plus lint and type-check in affected workspace(s).
- High risk:
  - Cross-module behavior, auth/security/permissions, schema/migration, concurrency, or data-integrity paths.
  - Run broader tests (including integration/e2e where relevant), lint, and type-check.
  - If mobile-impacting, verify both iOS and Android behavior paths.

Frontend and mobile UI verification (mandatory when UI changes):

- Verify with screenshot evidence so visual updates are confirmed, not inferred.
- Capture screenshots for changed screens/states; include before/after when practical.
- For mobile UI changes, verify and capture both iOS and Android unless the change is explicitly platform-specific.
- If screenshots cannot be produced, report the exact limitation and residual risk.

## Guardrails

Use and follow these files:

- `.claude/rules/backend.md`
- `.claude/rules/mobile.md`
- `.claude/rules/domain.md`
- `.claude/rules/auth.md`
- `.claude/rules/prisma.md`
- `.claude/rules/workflow.md`

Non-negotiables:

- Preserve architecture and dependency direction.
- Keep domain logic framework-independent.
- Respect auth, permission, and ownership boundaries.
- Keep docs and behavior in sync when contracts change.

## Generated File Guard

Before editing, reject paths matching:

- `node_modules/`
- `/dist/`
- `/.expo/`
- `/.prisma/client/`
- `/ios/Pods/`

If Prisma generated client output must change, edit `apps/backend/prisma/schema.prisma` and regenerate instead.

## Hook Intent Mapped to Codex Policy

Mirror `.claude/hooks` behavior through explicit task flow:

- Pre-edit: perform generated-file guard check.
- Post-edit: suggest the nearest targeted test command for changed files.
- Pre-commit request: run type-check for touched app(s) (`backend` and/or `mobile`).
- Post-test: if coverage summary exists for backend/mobile, report statement coverage and warn below 80%.

## Codex Command Hooks

Use these explicit commands to run hook-equivalent checks in Codex:

- `./.codex/hooks/run-hook.sh pre-edit -- <file_path>`
- `./.codex/hooks/run-hook.sh post-edit -- <file_path>`
- `./.codex/hooks/run-hook.sh pre-edit -- <file1> <file2> <file3>` (batch, fail-fast)
- `./.codex/hooks/run-hook.sh post-edit -- <file1> <file2> <file3>` (batch, fail-fast)
- `./.codex/hooks/run-hook.sh pre-commit`
- `./.codex/hooks/run-hook.sh post-test -- "<command_string>"`

Compatibility fallback commands:

- `pnpm codex:hook:pre-edit -- <file_path>`
- `pnpm codex:hook:post-edit -- <file_path>`
- `pnpm codex:hook:pre-commit`
- `pnpm codex:hook:post-test -- "<command_string>"`
- `pnpm codex:hook:all -- <pre-edit|post-edit|pre-commit|post-test> [arg]`

## MCP Workspace Policy

Keep MCP workspace-scoped and use `.mcp.json` as source of truth.

When available, prefer:

- `ios-simulator`
- `postgres`
- `prisma`
- `semgrep`
- `security-audit`
- `sequential-thinking`

Use MCP server by task type:

- UI flow checks and screenshot capture: `ios-simulator`
- DB inspection and query validation: `postgres`
- Prisma schema/client workflows: `prisma`
- Static security scanning: `semgrep`, `security-audit`
- Structured multi-step analysis: `sequential-thinking`
