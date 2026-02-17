---
name: freediving-backend-dev
description: Use for FreedivingApp backend work in apps/backend, including DTO validation, service and repository boundaries, domain invariants, auth-sensitive behavior, and Prisma data logic.
---

# Freediving Backend Dev

Use when working in `apps/backend/**`.

## Load These Sources
- `/Users/torkildliebe/FreedivingApp/.claude/skills/backend-dev/SKILL.md`
- `/Users/torkildliebe/FreedivingApp/.claude/skills/backend-dev/auth-flow.md`
- `/Users/torkildliebe/FreedivingApp/.claude/skills/backend-dev/backend-patterns.md`
- `/Users/torkildliebe/FreedivingApp/.claude/skills/backend-dev/testing-backend.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/backend.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/auth.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/prisma.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/domain.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/testing.md`

## Operating Workflow
1. Confirm module flow: `controller -> dto -> service -> repository`.
2. Apply DTO validation and explicit domain errors.
3. Keep domain checks out of controllers.
4. Keep persistence details in repositories, with transactions for atomic multi-step writes.
5. Run risk-tier verification and report with required sections.
