## Changes made
- Extended backend profile update contract to support language persistence through existing `PATCH /users/me`:
  - `apps/backend/src/modules/users/dto/update-me.dto.ts`
    - `alias` is optional for partial updates.
    - added optional `preferredLanguage` constrained to `en | no`.
  - `apps/backend/src/modules/users/users.service.ts`
    - `updateMe` now supports partial updates and validates that at least one profile field is provided.
    - preserves alias validation when alias is provided.
    - forwards optional `preferredLanguage` updates.
  - `apps/backend/src/modules/users/users.repository.ts`
    - `updateProfile` now applies only defined fields (`alias`, `bio`, `avatarUrl`, `preferredLanguage`).
- Added backend tests for language update behavior:
  - `apps/backend/src/modules/users/users.controller.spec.ts`
  - `apps/backend/src/modules/users/users.service.spec.ts`
  - `apps/backend/src/modules/users/users.repository.spec.ts`
- Implemented profile language picker and logout wiring on mobile:
  - `apps/mobile/src/features/auth/screens/profile-screen.tsx`
    - language row now opens dedicated language detail view.
    - language options (`English`, `Norsk`) render with active checkmark.
    - language selection persists via `PATCH /users/me` and refreshes profile.
    - logout row now calls `useAuth().signOut()` with inline failure message handling.
  - `apps/mobile/src/features/auth/types/profile.ts`
    - added `language` to `ProfileView` union.
- Added mobile tests for language and logout behaviors:
  - `apps/mobile/src/features/auth/screens/__tests__/profile-screen.test.tsx`
- Added Maestro flow for runtime verification of language picker and logout:
  - `apps/mobile/.maestro/flows/auth/profile-language-logout.yaml`

Design OS assets used:
- `docs/design-os-plan/product-overview.md`
- `docs/design-os-plan/instructions/incremental/04-auth-and-profiles.md`
- `docs/design-os-plan/sections/auth-and-profiles/README.md`
- `docs/design-os-plan/sections/auth-and-profiles/tests.md`
- `docs/design-os-plan/sections/auth-and-profiles/types.ts`
- `docs/design-os-plan/sections/auth-and-profiles/components/ProfilePage.tsx`
- `docs/design-os-plan/sections/auth-and-profiles/screenshot-profile.png`

Component mapping:
- Design `Language` row navigation -> mobile `profile-row-language` opens detail view (`view === 'language'`).
- Design language picker options/checkmark -> `profile-language-option-en/no` with active `✓` indicator.
- Design `onChangeLanguage` behavior -> mobile persists `preferredLanguage` through backend patch.
- Design logout row immediate action -> mobile `profile-row-logout` invokes auth `signOut` directly.

Design parity evidence:
- Maestro runtime verification (iOS):
  - `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" maestro test apps/mobile/.maestro/flows/auth/profile-shell.yaml apps/mobile/.maestro/flows/auth/profile-language-logout.yaml` -> PASS (2/2)
- iOS screenshots captured:
  - `docs/orchestration/runs/20260226-150840-m4/issues/evidence/83-language-picker-ios.png`
  - `docs/orchestration/runs/20260226-150840-m4/issues/evidence/83-language-selected-ios.png`
  - `docs/orchestration/runs/20260226-150840-m4/issues/evidence/83-logout-login-ios.png`

Approved deviations:
- Language persistence is implemented by extending existing `PATCH /users/me` instead of adding a dedicated language endpoint to keep profile mutations consolidated.

## Verification run
- `pnpm --filter backend test -- users.controller.spec.ts users.service.spec.ts users.repository.spec.ts` -> PASS
- `pnpm --filter backend type-check` -> PASS
- `pnpm --filter backend lint` -> FAIL (unrelated pre-existing errors in `apps/backend/src/modules/dive-logs/dive-logs.service.spec.ts`)
- `pnpm --filter mobile test -- profile-screen.test.tsx use-profile-data.test.tsx` -> PASS
- `pnpm --filter mobile lint` -> PASS
- `pnpm --filter mobile type-check` -> PASS
- `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" pnpm orchestrator:mobile-auth-check` -> PASS
- `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" maestro test apps/mobile/.maestro/flows/auth/profile-shell.yaml apps/mobile/.maestro/flows/auth/profile-language-logout.yaml` -> PASS
- `PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" maestro -p android test apps/mobile/.maestro/flows/auth/profile-shell.yaml apps/mobile/.maestro/flows/auth/profile-language-logout.yaml` -> FAIL (`0 devices connected`)

## Not run / limitations
- Android runtime verification with screenshot evidence is blocked by missing Android device availability in this environment (`maestro -p android` reports `0 devices connected`).
- Backend lint remains blocked by unrelated existing issues in `apps/backend/src/modules/dive-logs/dive-logs.service.spec.ts`.

## Risk notes
- Residual risk: Android-specific language picker interaction and logout navigation remain unverified at runtime.
- Residual risk: if future consumers rely on `PATCH /users/me` requiring alias, they must adapt to the new partial-update semantics (current mobile behavior is covered by tests).

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 83
