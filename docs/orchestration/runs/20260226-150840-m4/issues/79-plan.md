# Issue #79 Plan

## Scope
Build M4 auth screens (login, signup, forgot password) with Supabase email/password + Google OAuth and Design OS parity.

## Design Bundle
- docs/design-os-plan/product-overview.md
- docs/design-os-plan/instructions/incremental/04-auth-and-profiles.md
- docs/design-os-plan/sections/auth-and-profiles/README.md
- docs/design-os-plan/sections/auth-and-profiles/tests.md
- docs/design-os-plan/sections/auth-and-profiles/types.ts
- docs/design-os-plan/sections/auth-and-profiles/components/AuthPage.tsx
- docs/design-os-plan/sections/auth-and-profiles/screenshot-auth.png

## Implementation Steps
1. Expand auth route set to include signup + forgot-password views while keeping standalone full-screen auth flow.
2. Replace current simple auth UI with Design OS-parity React Native auth screen states and form reset-on-view-switch behavior.
3. Extend auth context for signup alias handling, forgot-password, and Google OAuth trigger.
4. Add inline validation and actionable error surfaces aligned with acceptance criteria.
5. Add/update mobile unit tests for auth view switching, validation, and callbacks.
6. Add/update Maestro auth flows for login/signup/forgot-password coverage.

## Verification
- Targeted auth unit tests in mobile workspace
- Mobile lint + type-check
- Maestro auth flows on iOS simulator with screenshots for design parity evidence
