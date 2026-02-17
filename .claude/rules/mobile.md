---
paths:
  - "apps/mobile/**"
---
# Mobile Rules

## Structure and Dependency Direction

- Keep route files in `app/` thin; put feature logic in `src/features/<feature>/`.
- Allowed dependency direction: `app/ -> features/ -> shared|infrastructure`.
- Do not add direct cross-feature imports; extract shared contracts into `src/shared`.

## Platform Requirements

- All changes must work on iOS and Android.
- Use `.ios.tsx` / `.android.tsx` only when platform behavior truly differs.
- Keep map implementation aligned with MapLibre + Kartverket tile usage.

## UX and Data Boundaries

- Keep screen components focused on composition; business logic belongs in hooks/services.
- Keep API payload handling typed and minimal.
- Preserve loading/error/empty states for networked UI paths.

## Verification Expectations

For mobile behavior changes:
- Run targeted tests for affected feature logic.
- Run lint and type-check in mobile workspace.
- For platform-impacting changes, verify both iOS and Android behavior paths.
- Verify state/network transitions for loading, error, and empty states.

Use risk escalation rules from `.claude/rules/testing.md` for final check scope.
