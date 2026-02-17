---
name: freediving-frontend-dev
description: Use for FreedivingApp mobile work in apps/mobile, including route-to-feature architecture, hooks-driven logic, typed API boundaries, and iOS and Android-safe behavior.
---

# Freediving Frontend Dev

Use when working in `apps/mobile/**`.

## Load These Sources
- `/Users/torkildliebe/FreedivingApp/.claude/skills/frontend-dev/SKILL.md`
- `/Users/torkildliebe/FreedivingApp/.claude/skills/frontend-dev/mobile-patterns.md`
- `/Users/torkildliebe/FreedivingApp/.claude/skills/frontend-dev/testing-mobile.md`
- `/Users/torkildliebe/FreedivingApp/.claude/skills/frontend-dev/expo-setup.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/mobile.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/domain.md`
- `/Users/torkildliebe/FreedivingApp/.claude/rules/testing.md`

## Operating Workflow
1. Keep route files thin; keep logic in feature hooks and services.
2. Preserve allowed dependency direction and avoid cross-feature coupling.
3. Maintain loading, error, and empty states on networked flows.
4. Keep payload handling typed and minimal.
5. Verify iOS and Android behavior as required by risk tier.
