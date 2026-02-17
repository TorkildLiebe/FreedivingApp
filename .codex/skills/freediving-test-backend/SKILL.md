---
name: freediving-test-backend
description: Use to add or update backend tests in FreedivingApp for services, repositories, controllers, and domain invariants with risk-based verification depth.
---

# Freediving Test Backend

Use when creating or updating tests for `apps/backend/**`.

## Load These Sources
- `/Users/torkildliebe/FreedivingApp/.claude/skills/test-backend/SKILL.md`
- `/Users/torkildliebe/FreedivingApp/.claude/skills/backend-dev/testing-backend.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/testing.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/backend.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/domain.md`

## Operating Workflow
1. Identify changed behavior and affected invariants.
2. Start with targeted tests around touched logic.
3. Add negative-path tests for validation and permission boundaries.
4. Escalate verification scope by risk tier.
5. Report exact commands and outcomes.
