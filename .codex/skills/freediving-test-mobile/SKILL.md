---
name: freediving-test-mobile
description: Use to add or update mobile tests in FreedivingApp for React Native components, hooks, and screen orchestration with iOS and Android-aware coverage.
---

# Freediving Test Mobile

Use when creating or updating tests for `apps/mobile/**`.

## Load These Sources
- `.claude/skills/test-mobile/SKILL.md`
- `.claude/skills/frontend-dev/testing-mobile.md`
- `.claude/rules/testing.md`
- `.claude/rules/mobile.md`
- `.claude/rules/domain.md`
- `docs/design-os-plan/sections/`
- `docs/design-os-plan/instructions/incremental/`

## Operating Workflow
1. Treat `docs/design-os-plan` as canonical for UI behavior and copy expectations.
2. Pull behavior cases from `docs/design-os-plan/sections/<section>/tests.md`.
3. Add assertions for key Design OS copy and state transitions.
4. Require screenshot-based visual verification for changed UI states.
5. Document approved parity deviations with rationale.
6. Cover touched hook, component, and screen behavior.
7. Verify loading, error, and empty state transitions.
8. Add negative-path tests for domain and permission-related UI behavior.
9. Escalate verification scope by risk tier.
10. Report exact commands and outcomes.
