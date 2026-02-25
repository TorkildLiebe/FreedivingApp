## Changes made
- Added backend dive-log edit API with strict owner + 48-hour enforcement:
  - `PATCH /dive-logs/:id` in `apps/backend/src/modules/dive-logs/dive-logs.controller.ts`.
  - New `UpdateDiveLogDto` for partial updates (`visibilityMeters`, `currentStrength`, `divedAt`, `notes`, `photoUrls`).
  - `DiveLogsService.update` now enforces:
    - `404` when dive log does not exist,
    - `403` when actor is not the author,
    - `422` when edit window is expired.
  - `DiveLogsRepository.updateDiveLog` updates the row and refreshes spot visibility/report aggregate fields in one transaction.
- Added new backend domain error for missing logs:
  - `apps/backend/src/common/errors/dive-log-not-found.error.ts`
  - exported from `apps/backend/src/common/errors/index.ts`.
- Fixed backend runtime dependency wiring uncovered during runtime verification:
  - `apps/backend/src/modules/dive-logs/dive-logs.module.ts` now imports `UsersModule` so `AuthGuard` can resolve `UsersService` at app boot.
- Updated mobile dive-log UI flow for edit mode:
  - `SpotDetailSheet` shows `Edit` only when `authorId === currentUserId` and `createdAt <= 48h`.
  - `MapScreen` tracks edit target and opens `AddDiveFormSheet` in `mode="edit"` with prefilled values.
  - `AddDiveFormSheet` supports edit mode title/action text, existing photo retention/removal, and combined photo limit handling.
  - `useDiveLogSubmit` now exposes `updateDiveLog` and sends `PATCH /dive-logs/:id` with existing + newly uploaded photos.
  - `useFavoriteSpots` now returns `currentUserId` from `/users/me` for row-level edit eligibility checks.
- Updated backend/mobile tests for edit permissions, edit window, update path wiring, and edit button visibility logic.
- Design OS assets used: `docs/design-os-plan/product-overview.md`; `docs/design-os-plan/instructions/incremental/03-dive-reports.md`; `docs/design-os-plan/sections/dive-reports/{README.md,tests.md,components/AddDiveForm.tsx,types.ts,screenshot.png}`; `docs/design-os-plan/sections/map-and-spots/components/SpotDetailSheet.tsx`.
- Component mapping: edit-mode form reuse -> `apps/mobile/src/features/map/components/add-dive-form-sheet.tsx`; row-level edit affordance -> `apps/mobile/src/features/map/components/spot-detail-sheet.tsx`; flow orchestration -> `apps/mobile/src/features/map/screens/map-screen.tsx`; backend policy gate -> `apps/backend/src/modules/dive-logs/{dive-logs.controller.ts,dive-logs.service.ts,dive-logs.repository.ts}`.

## Verification run
- `pnpm --filter backend test -- dive-logs.service.spec.ts dive-logs.controller.spec.ts dive-logs.repository.spec.ts spots.service.spec.ts` (pass)
- `pnpm --filter mobile test -- add-dive-form-sheet.test.tsx spot-detail-sheet.test.tsx map-screen.test.tsx use-favorite-spots.test.ts` (pass)
- `pnpm orchestrator:mobile-auth-check` (pass)
- `pnpm --filter backend run lint` (pass)
- `pnpm --filter backend run type-check` (pass)
- `pnpm --filter mobile run lint` (pass)
- `pnpm --filter mobile run type-check` (pass)
- iOS runtime evidence captured on simulator:
  - `docs/orchestration/runs/20260225-163848-m3/issues/screenshots/94-map-default.png`
- Design parity evidence: the 2-step dive form structure/copy and submit semantics remain aligned with Dive Reports Design OS assets, while edit mode reuses the same structure and control hierarchy; dive-log row placement remains in spot detail as specified by Map & Spots section and now conditionally exposes owner-only edit action.
- Approved deviations: Design OS does not define an explicit edit affordance for dive logs; added a compact inline `Edit` button per eligible row to satisfy issue #94 acceptance criteria without altering base row information hierarchy.

## Not run / limitations
- Android runtime verification/screenshots were not executed for this issue run.
- Deterministic iOS screenshot capture of the explicit "Edit visible on eligible row" state was not automated; runtime capture confirms app launch/integration shell while edit-specific behavior is validated via targeted component/screen tests.

## Risk notes
- Android parity remains a residual risk until runtime validation is completed.
- Local runtime environment currently has API port divergence (`mobile .env` points to `3100`, active backend process observed on `3000`); verification used explicit runtime override during iOS launch.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 94
