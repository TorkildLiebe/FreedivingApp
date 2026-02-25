## Changes made
- Added backend M3 data foundation for dive logs and ratings:
  - Prisma schema + migration for `DiveLog` and `SpotRating` entities and indexes.
  - New `dive-logs` module with `POST /dive-logs` and `POST /dive-logs/photos/upload-url`.
  - Spot summary metrics update on dive-log create (`averageVisibilityMeters`, `reportCount`, `latestReportAt`).
- Added mobile M3 submission flow from spot detail:
  - New `AddDiveFormSheet` with 2-step flow, date validation (no future dates), notes counter, and photo selection up to 5.
  - New `useDiveLogSubmit` + `useDiveLogPhotoUpload` hooks to upload selected photos and submit `POST /dive-logs`.
  - Map screen now opens add-dive sheet from `+ Add Dive` and conditionally opens follow-up rating sheet based on `shouldPromptRating`.
  - Added `RatingSheet` component and wiring for post-submit follow-up prompt.
- Added/updated tests for new backend and mobile paths.
- Design OS assets used: docs/design-os-plan/product-overview.md; docs/design-os-plan/instructions/incremental/03-dive-reports.md; docs/design-os-plan/sections/dive-reports/{README.md,tests.md,components/AddDiveForm.tsx,components/RatingSheet.tsx,types.ts,screenshot.png}
- Component mapping: AddDiveForm -> apps/mobile/src/features/map/components/add-dive-form-sheet.tsx; RatingSheet -> apps/mobile/src/features/map/components/rating-sheet.tsx; flow orchestration -> apps/mobile/src/features/map/screens/map-screen.tsx + hooks/use-dive-log-submit.ts

## Verification run
- `pnpm prisma:generate` (pass)
- `pnpm --filter backend test -- dive-logs.controller.spec.ts dive-logs.service.spec.ts dive-logs.repository.spec.ts` (pass)
- `pnpm --filter mobile test -- add-dive-form-sheet.test.tsx rating-sheet.test.tsx map-screen.test.tsx` (pass)
- `pnpm orchestrator:mobile-auth-check` (pass)
- `pnpm lint:backend` (pass)
- `pnpm --filter backend run type-check` (pass)
- `pnpm lint:mobile` (pass)
- `pnpm --filter mobile run type-check` (pass)
- iOS runtime evidence captured on simulator:
  - `docs/orchestration/runs/20260225-163848-m3/issues/screenshots/92-map-default.png`
- Design parity evidence: implemented add-dive two-step hierarchy, visibility/current controls, notes/photo optional step, and post-submit rating prompt semantics against M3 Design OS references; runtime capture confirms app launch and map-shell integration while component-level behavior parity is covered by targeted RN tests.
- Approved deviations: visibility control uses RN plus/minus stepper + live track fill instead of a draggable native range slider to keep dependency footprint minimal while preserving 0-30 semantics and visible meter feedback.

## Not run / limitations
- Android runtime verification and screenshots were not executed in this issue run.
- End-to-end simulator interaction screenshots for add-dive step states were not automated in this run; detailed behavior validation is covered by targeted component/screen tests.

## Risk notes
- Android parity remains residual risk until runtime validation is executed.
- Issue #92 includes prompt wiring for post-dive rating; persistence endpoint integration for rating submission is completed in later M3 issue scope.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 92
