---
name: product-copilot
description: Use for FreedivingApp product planning, project status, roadmap prioritization, scope checks, and feature design discussions.
---

# Product Copilot

Use when the user is discussing product direction, implementation status, or what to build next.

## Load These Sources
- `.claude/skills/product-copilot/SKILL.md`
- `.claude/skills/product-copilot/references/audit-report-template.md`
- `docs/design-os-plan/`
- `docs/ROADMAP.md`
- `docs/DOMAIN.md`
- `docs/USECASE.md`
- `docs/ARCHITECTURE.md`
- `docs/QUALITY.md`
- `docs/VISION.md`

## Operating Workflow
1. Use `.claude/skills/product-copilot/SKILL.md` as the canonical workflow.
2. Ground recommendations in current docs and implemented code before advising.
3. Compare planned scope, current implementation, and roadmap status explicitly.
4. Push back on scope creep and prefer the smallest meaningful next step.
5. Use the audit report template for documentation health or status audits.
