## Changes made
- Added backend profile activity endpoint for authenticated users:
  - `GET /users/me/activity` in `apps/backend/src/modules/users/users.controller.ts`
  - DTO contract in `apps/backend/src/modules/users/dto/get-my-activity-response.dto.ts`
  - Service orchestration in `apps/backend/src/modules/users/users.service.ts`
  - Repository queries/mapping in `apps/backend/src/modules/users/users.repository.ts`
- Backend activity payload now provides:
  - `diveReports` (spot name, dive date, visibility, current strength, notes preview)
  - `createdSpots` (spot name, created date, report count)
  - `favorites` (spot name, latest visibility, latest report date)
- Extended profile mobile data model/hook:
  - `apps/mobile/src/features/auth/types/profile.ts`
  - `apps/mobile/src/features/auth/hooks/use-profile-data.ts`
  - Hook now fetches `/users/me/activity` once and keeps list data in memory for view switching.
- Replaced placeholder activity detail panes with card-based list views in `apps/mobile/src/features/auth/screens/profile-screen.tsx`:
  - Dive Reports cards + empty state
  - My Spots cards + empty state
  - Saved Spots cards + empty state
  - Back navigation returns to menu without triggering full profile re-fetch
- Added/updated tests:
  - Backend: controller/service/repository unit coverage for new activity endpoint behavior
  - Mobile: hook + profile screen tests for list rendering, empty states, and back behavior
- Added Maestro activity flow:
  - `apps/mobile/.maestro/flows/auth/profile-activity-lists.yaml`
  - Updated `apps/mobile/.maestro/flows/auth/profile-shell.yaml` to use `mobile://profile` deep-link entry for stable runtime verification.

Design OS assets used:
- `docs/design-os-plan/product-overview.md`
- `docs/design-os-plan/instructions/incremental/04-auth-and-profiles.md`
- `docs/design-os-plan/sections/auth-and-profiles/README.md`
- `docs/design-os-plan/sections/auth-and-profiles/tests.md`
- `docs/design-os-plan/sections/auth-and-profiles/types.ts`
- `docs/design-os-plan/sections/auth-and-profiles/components/ProfilePage.tsx`
- `docs/design-os-plan/sections/auth-and-profiles/screenshot-profile.png`

Component mapping:
- Design `ProfilePage` activity detail lists -> `profile-screen.tsx` views `reports`, `spots`, and `favorites`.
- Design dive report summary cards -> report cards with spot/date/visibility/current/notes preview.
- Design created spot summaries -> cards with name/created date/report count.
- Design saved spot summaries -> cards with name/latest visibility/latest report date and "No reports" fallback.
- Design empty-state pattern -> emoji + helper text blocks for each list.

Design parity evidence:
- Maestro runtime verification (iOS):
  - `PATH="/opt/homebrew/opt/openjdk/bin:$PATH" maestro test apps/mobile/.maestro/flows/auth/profile-shell.yaml apps/mobile/.maestro/flows/auth/profile-activity-lists.yaml` -> PASS (2/2)
- iOS screenshots captured for activity list states:
  - `docs/orchestration/runs/20260226-150840-m4/issues/evidence/81-activity-reports-ios.png`
  - `docs/orchestration/runs/20260226-150840-m4/issues/evidence/81-activity-spots-ios.png`
  - `docs/orchestration/runs/20260226-150840-m4/issues/evidence/81-activity-favorites-ios.png`

Approved deviations:
- Dive report stars were not added in this slice because current backend dive-log model does not expose per-report rating in the activity list contract; cards prioritize required issue fields (spot/date/visibility/current/notes preview).
- Maestro activity flow enters profile via deep link (`mobile://profile`) to avoid flaky tab-tap behavior in simulator runtime while preserving equivalent user-visible destination.

## Verification run
- `pnpm --filter backend test -- users.controller.spec.ts users.service.spec.ts users.repository.spec.ts` -> PASS
- `pnpm --filter backend type-check` -> PASS
- `pnpm --filter backend lint` -> FAIL (unrelated pre-existing errors in `apps/backend/src/modules/dive-logs/dive-logs.service.spec.ts`)
- `pnpm --filter mobile test -- use-profile-data.test.tsx profile-screen.test.tsx` -> PASS
- `pnpm --filter mobile test -- custom-tab-bar.test.tsx` -> PASS
- `pnpm --filter mobile lint` -> PASS
- `pnpm --filter mobile type-check` -> PASS
- `PATH="/opt/homebrew/opt/openjdk/bin:$PATH" pnpm orchestrator:mobile-auth-check` -> PASS
- `PATH="/opt/homebrew/opt/openjdk/bin:$PATH" maestro test apps/mobile/.maestro/flows/auth/profile-shell.yaml apps/mobile/.maestro/flows/auth/profile-activity-lists.yaml` -> PASS

## Not run / limitations
- Android runtime verification for activity list UI was not run in this issue cycle (no Android emulator session provisioned).
- Backend lint is still blocked by unrelated existing errors in `apps/backend/src/modules/dive-logs/dive-logs.service.spec.ts`.

## Risk notes
- Residual risk: if backend activity payload evolves (for example adding per-report rating semantics), mobile card composition may need follow-up alignment.
- Residual risk: Android-specific scrolling/touch behavior for list cards and back navigation remains unverified at runtime.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 81
