# Issue #78 Plan — Show ratings summary on spot detail

## Understand

- Spot detail UI already renders rating/visibility/report-count/stale states, but backend currently hardcodes summary fields (`null/0`) in the spot detail response mapper.
- Issue requires summary data to come from `GET /spots/:id` with no N+1 behavior.
- Current codebase does not yet have report/rating entities wired for runtime aggregation, so summary values need to be sourced efficiently from spot-level data.

## Plan

- Risk tier: High (backend contract/data model change consumed by existing mobile UI path).
- Skills used:
  - `freediving-backend-dev`
  - `freediving-test-backend`
  - `freediving-audit-rules`
- Implementation steps:
  1. Add precomputed summary columns on `DiveSpot` in Prisma schema:
     - `averageVisibilityMeters`
     - `averageRating`
     - `reportCount`
     - `latestReportAt`
  2. Add migration SQL for those columns and regenerate Prisma client.
  3. Seed representative summary data for at least one spot to support realistic manual/runtime verification.
  4. Update spot detail mapping in `SpotsService` to return these persisted summary values (remove hardcoded placeholders).
  5. Update backend tests to verify summary mapping passthrough and graceful null handling.
- Verification steps:
  - targeted spots service/controller/repository tests
  - backend lint + type-check
  - full backend test suite
  - mobile test suite to confirm client contract compatibility
