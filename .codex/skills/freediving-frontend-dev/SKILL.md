---
name: freediving-frontend-dev
description: Use for FreedivingApp mobile work in apps/mobile, including route-to-feature architecture, hooks-driven logic, typed API boundaries, and iOS and Android-safe behavior.
---

# Freediving Frontend Dev

Use when working in `apps/mobile/**`.

## Load These Sources
- `.claude/skills/frontend-dev/SKILL.md`
- `.claude/skills/frontend-dev/mobile-patterns.md`
- `.claude/skills/frontend-dev/testing-mobile.md`
- `.claude/skills/frontend-dev/expo-setup.md`
- `.claude/rules/mobile.md`
- `.claude/rules/domain.md`
- `.claude/rules/testing.md`
- `docs/design-os-plan/product-overview.md`
- `docs/design-os-plan/instructions/incremental/`
- `docs/design-os-plan/sections/`
- `docs/design-os-plan/shell/`
- `docs/design-os-plan/design-system/`

## Operating Workflow
1. Treat `docs/design-os-plan` as the only canonical UI design source.
2. Load Design OS assets in order: product overview -> incremental instruction -> section assets/tests/components/types/screenshots.
3. Reuse/adapt finished Design OS components before introducing custom UI structure.
4. Preserve design copy, labels, placeholders, tokens, and state flow semantics unless deviation is required.
5. Document and justify approved visual/interaction deviations.
6. Keep route files thin; keep logic in feature hooks and services.
7. Preserve allowed dependency direction and avoid cross-feature coupling.
8. Maintain loading, error, and empty states on networked flows.
9. Keep payload handling typed and minimal.
10. Verify iOS and Android behavior as required by risk tier.
