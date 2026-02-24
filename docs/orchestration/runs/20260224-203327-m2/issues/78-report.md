## Changes made

- Added persisted spot summary fields to backend `DiveSpot` schema for M2 stats-row support:
  - `averageVisibilityMeters`
  - `averageRating`
  - `reportCount`
  - `latestReportAt`
- Added migration:
  - `apps/backend/prisma/migrations/0003_add_spot_summary_fields/migration.sql`
- Regenerated Prisma client after schema updates.
- Updated seed data to populate representative summary metrics (including stale and fresh report timestamps).
- Updated `SpotsService` detail mapping to return summary values from persisted spot data instead of hardcoded placeholders.
- Expanded `SpotsService` tests to verify:
  - summary values pass through correctly
  - null/empty summary states remain graceful

## Verification run

- `pnpm --filter backend test -- spots.service.spec.ts spots.controller.spec.ts spots.repository.spec.ts` (pass)
- `pnpm --filter mobile test -- use-spot-detail.test.ts spot-detail-sheet.test.tsx` (pass)
- `pnpm prisma:validate` (pass)
- `pnpm lint:backend` (pass)
- `pnpm lint:mobile` (pass; existing unrelated warnings in `login-screen.test.tsx`)
- `pnpm --filter backend run type-check` (pass)
- `pnpm --filter mobile run type-check` (pass)
- `pnpm test:backend` (pass)
- `pnpm test:mobile` (pass; existing unrelated console warnings)

## Not run / limitations

- iOS/Android runtime screenshot verification was not run for this issue in this environment.
- Migration application against a live database (`prisma migrate dev/deploy`) was not executed here.

## Risk notes

- Spot detail API now returns non-hardcoded summary values in a single spot-row read path (no additional per-row query fanout).
- Residual risk remains around live DB rollout ordering (migration timing) and runtime UI confirmation on device/simulator.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: false
IOS_VERIFIED: false
ISSUE_NUMBER: 78
