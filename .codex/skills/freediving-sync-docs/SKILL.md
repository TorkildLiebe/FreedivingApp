---
name: freediving-sync-docs
description: Use to keep FreedivingApp documentation synchronized with behavior, constraints, contracts, and workflow changes in code.
---

# Freediving Sync Docs

Use when implementation changes may require documentation updates.

## Load These Sources
- `.claude/skills/sync-docs/SKILL.md`
- `.claude/CLAUDE.md`
- `.claude/rules/workflow.md`
- `.claude/rules/domain.md`
- `docs/DOMAIN.md`
- `docs/CONTRIBUTING.md`
- `docs/design-os-plan/`

## Operating Workflow
1. Determine whether behavior or contracts changed.
2. Update only the authoritative docs required for consistency.
3. For UI changes, treat `docs/design-os-plan` as canonical design reference.
4. If implementation intentionally diverges, record explicit design drift and rationale.
5. When divergence is intended to persist, update canonical product docs accordingly.
6. Verify docs match implementation constraints and flows.
7. Report remaining documentation debt explicitly.
