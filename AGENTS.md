# Codex Project Profile for FreedivingApp

Apply these rules when working in `/Users/torkildliebe/FreedivingApp`.

## Source of Truth
- Canonical guidance remains in `/Users/torkildliebe/FreedivingApp/.claude/`.
- Core memory: `/Users/torkildliebe/FreedivingApp/.claude/CLAUDE.md`
- Rules: `/Users/torkildliebe/FreedivingApp/.claude/rules/`
- Skills: `/Users/torkildliebe/FreedivingApp/.claude/skills/`

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
Use `/Users/torkildliebe/FreedivingApp/.claude/rules/testing.md` as authority.

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

## Guardrails
Use and follow these files:
- `/Users/torkildliebe/FreedivingApp/.claude/rules/backend.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/mobile.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/domain.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/auth.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/prisma.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/workflow.md`

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
- `pnpm codex:hook:pre-edit -- <file_path>`
- `pnpm codex:hook:post-edit -- <file_path>`
- `pnpm codex:hook:pre-commit`
- `pnpm codex:hook:post-test -- "<command_string>"`
- `pnpm codex:hook:all -- <pre-edit|post-edit|pre-commit|post-test> [arg]`

## MCP Workspace Policy
Keep MCP workspace-scoped and use `/Users/torkildliebe/FreedivingApp/.mcp.json` as source of truth.

When available, prefer:
- `ios-simulator`
- `postgres`
- `prisma`
- `semgrep`
- `security-audit`
- `sequential-thinking`
