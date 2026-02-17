---
name: freediving-audit-rules
description: Use to audit FreedivingApp changes against domain invariants, business constraints, ownership and auth boundaries, and docs consistency.
---

# Freediving Audit Rules

Use for domain-compliance reviews and rule validation.

## Load These Sources
- `/Users/torkildliebe/FreedivingApp/.claude/skills/audit-rules/SKILL.md`
- `/Users/torkildliebe/FreedivingApp/.claude/skills/audit-rules/domain-rules.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/domain.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/auth.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/prisma.md`
- `/Users/torkildliebe/FreedivingApp/docs/DOMAIN.md`

## Operating Workflow
1. List impacted invariants and constraints.
2. Verify enforcement paths, including negative and edge cases.
3. Check auth and ownership boundaries for mutating operations.
4. Report violations with clear file-level evidence.
5. Flag docs and implementation drift.
