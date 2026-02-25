## Changes made
- Added backend spot-rating upsert endpoint:
  - `POST /spots/:id/ratings` in `apps/backend/src/modules/spots/spots.controller.ts`.
  - New DTOs:
    - `apps/backend/src/modules/spots/dto/upsert-spot-rating.dto.ts`
    - `apps/backend/src/modules/spots/dto/upsert-spot-rating-response.dto.ts`
- Implemented rating persistence and aggregate update in backend:
  - `SpotsService.upsertRating` validates spot existence and delegates upsert.
  - `SpotsRepository.upsertSpotRatingAndRefreshAverage` performs transaction:
    - upsert `(userId, spotId)` rating,
    - recompute average from `spot_ratings`,
    - update `dive_spots.average_rating`.
- Added backend tests for rating endpoint/service/repository behavior.
- Updated mobile rating flow to persist ratings through backend:
  - `MapScreen` now calls `POST /spots/:id/ratings` for:
    - post-dive `RatingSheet` selection,
    - spot-detail manual star rating action.
  - After save, spot data refreshes so updated average propagates to spot detail summary.
- Implemented in-session "Not now" suppression for post-dive prompt:
  - once dismissed for a spot, prompt is not shown again for that spot in the same session.
- Updated `RatingSheet` labels to match issue/design copy:
  - 1 `Not great`, 2 `Below average`, 3 `Average`, 4 `Really good`, 5 `Outstanding`.
- Added/updated mobile tests for rating labels and map-screen rating orchestration.
- Design OS assets used: `docs/design-os-plan/product-overview.md`; `docs/design-os-plan/instructions/incremental/03-dive-reports.md`; `docs/design-os-plan/sections/dive-reports/{README.md,tests.md,components/RatingSheet.tsx,types.ts,screenshot.png}`; `docs/design-os-plan/sections/map-and-spots/{README.md,tests.md,components/SpotDetailSheet.tsx}`.
- Component mapping: rating prompt UI -> `apps/mobile/src/features/map/components/rating-sheet.tsx`; post-dive + manual rating orchestration -> `apps/mobile/src/features/map/screens/map-screen.tsx`; backend contract/aggregate update -> `apps/backend/src/modules/spots/{spots.controller.ts,spots.service.ts,spots.repository.ts}`.

## Verification run
- `pnpm --filter backend test -- spots.controller.spec.ts spots.service.spec.ts spots.repository.spec.ts` (pass)
- `pnpm --filter mobile test -- rating-sheet.test.tsx map-screen.test.tsx` (pass)
- `pnpm orchestrator:mobile-auth-check` (pass)
- `pnpm --filter backend run lint` (pass)
- `pnpm --filter backend run type-check` (pass)
- `pnpm --filter mobile run lint` (pass)
- `pnpm --filter mobile run type-check` (pass)
- iOS runtime evidence captured on simulator:
  - `docs/orchestration/runs/20260225-163848-m3/issues/screenshots/95-map-default.png`
- Design parity evidence: post-dive follow-up rating sheet remains separate from dive form, preserves header/copy structure, and now persists selection via backend while keeping dismiss semantics aligned with Dive Reports design/test specs.
- Approved deviations: explicit in-session suppression after tapping "Not now" is implemented in map-screen state (Design OS describes dismissal but not session-memory mechanics); this follows issue #95 acceptance criteria.

## Not run / limitations
- Android runtime verification/screenshots were not executed for this issue run.
- Deterministic iOS screenshot for visible rating-sheet state was not automated; runtime evidence confirms app launch integration and behavior parity is covered by targeted tests.

## Risk notes
- Android parity remains residual risk until runtime validation is completed.
- Local runtime API port mismatch (`apps/mobile/.env` uses `3100`, active backend observed on `3000`) required runtime override during screenshot capture.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 95
