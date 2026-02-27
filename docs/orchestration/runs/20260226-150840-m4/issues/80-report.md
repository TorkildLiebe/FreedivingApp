## Changes made
- Implemented backend profile stats contract for M4 profile shell:
  - Added `GET /users/me/stats` in `apps/backend/src/modules/users/users.controller.ts`.
  - Added `GetMyStatsResponseDto` in `apps/backend/src/modules/users/dto/get-my-stats-response.dto.ts`.
  - Extended user response DTO with `createdAt` in `apps/backend/src/modules/users/dto/get-me-response.dto.ts`.
  - Added `getMyStats` service logic and repository counters in:
    - `apps/backend/src/modules/users/users.service.ts`
    - `apps/backend/src/modules/users/users.repository.ts`
  - Updated controller/service/repository specs for new behavior.
- Replaced profile placeholder with full Design OS profile shell in `apps/mobile/src/features/auth/screens/profile-screen.tsx`:
  - identity header, stat strip, grouped activity/account/more rows
  - detail subviews for reports/spots/favorites
  - stable test IDs for runtime verification
- Added profile data integration layer:
  - `apps/mobile/src/features/auth/hooks/use-profile-data.ts`
  - `apps/mobile/src/features/auth/types/profile.ts`
  - tests in `use-profile-data.test.tsx`
- Added mobile tests for the profile shell and activity-detail transitions in `profile-screen.test.tsx`.
- Added Maestro flow `apps/mobile/.maestro/flows/auth/profile-shell.yaml` and validated profile navigation.
- Stabilized tab press behavior in `apps/mobile/src/shared/components/CustomTabBar.tsx` (`navigation.navigate(route.name)`).
- Added graceful fallback for non-fatal stats endpoint failures so profile shell still renders with derived default stats.

Design OS assets used:
- `docs/design-os-plan/product-overview.md`
- `docs/design-os-plan/instructions/incremental/04-auth-and-profiles.md`
- `docs/design-os-plan/sections/auth-and-profiles/README.md`
- `docs/design-os-plan/sections/auth-and-profiles/tests.md`
- `docs/design-os-plan/sections/auth-and-profiles/types.ts`
- `docs/design-os-plan/sections/auth-and-profiles/components/ProfilePage.tsx`
- `docs/design-os-plan/sections/auth-and-profiles/screenshot-profile.png`

Component mapping:
- Design `ProfilePage` hero/profile header -> `profile-screen.tsx` header with avatar initials fallback, alias/email, and edit button.
- Design stats strip (`Reports`, `Spots`, `Saved`, `Since`) -> `profile-screen.tsx` four-cell stats grid bound to `useProfileData`.
- Design grouped lists (`Activity`, `Account`, `More`) -> `ProfileRow`-based grouped cards with mapped row IDs/actions.
- Design activity detail entry points -> in-screen detail states (`reports`, `spots`, `favorites`) with back navigation.

Design parity evidence:
- iOS runtime flow passed:
  - `PATH="/opt/homebrew/opt/openjdk/bin:$PATH" maestro test apps/mobile/.maestro/flows/auth/profile-shell.yaml`
- iOS screenshot evidence captured after Maestro navigation:
  - `docs/orchestration/runs/20260226-150840-m4/issues/evidence/80-profile-menu-ios.png`
  - `docs/orchestration/runs/20260226-150840-m4/issues/evidence/80-profile-detail-ios.png`
- Visual parity confirmed for profile header, grouped section structure, stat strip, and tab-based profile entry flow.

Approved deviations:
- When `/users/me/stats` is unavailable in the running environment, profile renders with fallback stats (`0` counters) instead of blocking the screen; this preserves UX continuity for M4 while backend rollout catches up.
- `memberSince` can render as `Unknown` when upstream profile payload lacks `createdAt` in the connected runtime API instance.

## Verification run
- `pnpm --filter backend test -- users.controller.spec.ts users.service.spec.ts users.repository.spec.ts` -> PASS
- `pnpm --filter backend type-check` -> PASS
- `pnpm --filter backend lint` -> FAIL (unrelated pre-existing errors in `apps/backend/src/modules/dive-logs/dive-logs.service.spec.ts`)
- `pnpm --filter mobile test -- use-profile-data.test.tsx profile-screen.test.tsx` -> PASS
- `pnpm --filter mobile test -- custom-tab-bar.test.tsx profile-screen.test.tsx` -> PASS
- `pnpm --filter mobile lint` -> PASS
- `pnpm --filter mobile type-check` -> PASS
- `PATH="/opt/homebrew/opt/openjdk/bin:$PATH" maestro test apps/mobile/.maestro/flows/auth/profile-shell.yaml` -> PASS
- `PATH="/opt/homebrew/opt/openjdk/bin:$PATH" pnpm orchestrator:mobile-auth-check` -> PASS

## Not run / limitations
- Android runtime verification for profile UI was not run in this issue cycle (no Android emulator session provisioned).
- Backend lint is currently blocked by unrelated pre-existing errors in `apps/backend/src/modules/dive-logs/dive-logs.service.spec.ts`; issue #80 touched modules pass targeted tests/type-check.

## Risk notes
- Residual risk: environments still running an older backend contract (without `/users/me/stats` or `createdAt`) will show fallback profile stats and `Unknown` membership date until deployment alignment.
- Residual risk: Android-specific touch/typography/spacing behavior for profile shell remains unverified at runtime for this issue.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 80
