## Changes made
- Rebuilt `apps/mobile/src/features/auth/screens/login-screen.tsx` into a three-view Design OS auth flow (`login`, `signup`, `forgot-password`) with full-screen deep-ocean styling, inline validation, and strict form-state reset on view switches.
- Added signup avatar picking and alias support in UI (`auth-signup-avatar-button`, `auth-signup-alias-input`) and wired submit actions to auth context.
- Extended `apps/mobile/src/features/auth/context/auth-context.tsx` with:
  - metadata-aware signup (`alias`, optional `avatarUrl`)
  - Google OAuth trigger (`signInWithGoogle`)
  - forgot-password action (`resetPassword`)
- Updated auth unit tests and Supabase mocks to cover new context/screen contracts.
- Added/updated Maestro auth flows:
  - `apps/mobile/.maestro/flows/auth/login-screen.yaml`
  - `apps/mobile/.maestro/flows/auth/auth-signup-forgot.yaml`
- Fixed existing mobile type-check drift by adding missing `ratingCount` in `apps/mobile/src/__tests__/fixtures/spots.fixture.ts`.

Design OS assets used:
- `docs/design-os-plan/product-overview.md`
- `docs/design-os-plan/instructions/incremental/04-auth-and-profiles.md`
- `docs/design-os-plan/sections/auth-and-profiles/README.md`
- `docs/design-os-plan/sections/auth-and-profiles/tests.md`
- `docs/design-os-plan/sections/auth-and-profiles/types.ts`
- `docs/design-os-plan/sections/auth-and-profiles/components/AuthPage.tsx`
- `docs/design-os-plan/sections/auth-and-profiles/screenshot-auth.png`

Component mapping:
- Design `AuthPage` login card -> `login-screen.tsx` login view with `auth-google-button`, `auth-email-input`, `auth-password-input`, `auth-submit-button`.
- Design `AuthPage` signup form -> `login-screen.tsx` signup view with alias + optional avatar picker + create-account CTA.
- Design `AuthPage` forgot-password form/success -> `login-screen.tsx` forgot-password view and success confirmation copy.

Design parity evidence:
- Preserved Design OS view model and copy hierarchy: login/signup/forgot states, Google CTA, forgot-password success messaging, and footer cross-links.
- Maintained visual intent: standalone auth screen (outside tabs), deep-ocean layered background, frosted card container, emerald CTA/links, and Space Grotesk/Inter typography usage.
- Runtime validation ran via Maestro on iOS simulator for auth flows after Java runtime setup:
  - `maestro test .maestro/flows/auth/` -> pass (2/2 flows).

Approved deviations:
- Signup avatar currently stores local selected URI in Supabase signup metadata (`avatarUrl`) for downstream profile flow wiring; server-side avatar upload persistence is handled in issue #82.
- Google OAuth flow opens provider URL via `Linking.openURL` from `signInWithOAuth` response; callback/session completion depends on environment OAuth redirect configuration.

## Verification run
- `pnpm --filter mobile test -- login-screen.test.tsx auth-context.test.tsx` -> PASS
- `pnpm --filter mobile lint` -> PASS
- `pnpm --filter mobile type-check` -> PASS
- `pnpm orchestrator:mobile-auth-check` -> PASS
- `PATH="/opt/homebrew/opt/openjdk/bin:$PATH" maestro test .maestro/flows/auth/` (run in `apps/mobile`) -> PASS (2/2)

## Not run / limitations
- Android runtime verification was not run for this issue (no Android emulator session provisioned during this run).
- Auth runtime screenshot capture for explicit login/signup/forgot states was blocked by auto-login environment routing to map in direct capture scripts; functional auth view transitions were still covered by updated unit tests and Maestro flow definitions.

## Risk notes
- Residual risk: OAuth callback/session completion remains environment-sensitive and should be rechecked in final integrated M4 run after logout flow (#83) is in place.
- Residual risk: Android-specific input/keyboard behavior for auth views remains unverified in runtime for this issue.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 79
