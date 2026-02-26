# Issue #83 Plan

## Scope
Add working language picker and logout behavior on the profile page, aligned with Design OS interaction patterns.

## Design Bundle
- docs/design-os-plan/product-overview.md
- docs/design-os-plan/instructions/incremental/04-auth-and-profiles.md
- docs/design-os-plan/sections/auth-and-profiles/README.md
- docs/design-os-plan/sections/auth-and-profiles/tests.md
- docs/design-os-plan/sections/auth-and-profiles/types.ts
- docs/design-os-plan/sections/auth-and-profiles/components/ProfilePage.tsx
- docs/design-os-plan/sections/auth-and-profiles/screenshot-profile.png

## Implementation Steps
1. Extend backend `PATCH /users/me` to support partial updates including `preferredLanguage` (`en`/`no`).
2. Wire profile screen language row to a dedicated language picker detail view with checkmark state.
3. Persist language selection through backend and refresh profile state.
4. Wire `Log out` row to auth sign-out flow (`useAuth().signOut()`) with basic failure handling.
5. Add/adjust backend and mobile tests for language update + logout behavior.
6. Add Maestro flow to verify language picker interaction and logout navigation.

## Verification
- Backend users module targeted tests + backend type-check/lint
- Mobile profile screen targeted tests + mobile lint/type-check
- Maestro profile shell + language/logout flow
- `pnpm orchestrator:mobile-auth-check`
