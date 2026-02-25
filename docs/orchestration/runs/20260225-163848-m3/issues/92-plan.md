# Issue #92 Plan

## Scope
- Build M3 dive-log submission flow from spot detail (`+ Add Dive`) with Design OS parity.
- Add backend `POST /dive-logs` endpoint and supporting persistence.
- Add photo upload support for dive logs (up to 5 photos).
- Trigger rating follow-up sheet when user has no existing rating for the spot.

## Risk tier
- High (cross-workspace behavior, auth/ownership, schema + API contract changes, mobile UI flow changes).

## Design OS assets used
- `docs/design-os-plan/product-overview.md`
- `docs/design-os-plan/instructions/incremental/03-dive-reports.md`
- `docs/design-os-plan/sections/dive-reports/README.md`
- `docs/design-os-plan/sections/dive-reports/tests.md`
- `docs/design-os-plan/sections/dive-reports/components/AddDiveForm.tsx`
- `docs/design-os-plan/sections/dive-reports/components/RatingSheet.tsx`
- `docs/design-os-plan/sections/dive-reports/types.ts`
- `docs/design-os-plan/sections/dive-reports/screenshot.png`

## Component mapping
- `AddDiveForm` -> `apps/mobile/src/features/map/components/add-dive-form-sheet.tsx`
- `RatingSheet` -> `apps/mobile/src/features/map/components/rating-sheet.tsx`
- Design OS submit flow integration -> `apps/mobile/src/features/map/screens/map-screen.tsx`
- Dive log submission orchestration -> `apps/mobile/src/features/map/hooks/use-dive-log-submit.ts`
- Dive log photo upload orchestration -> `apps/mobile/src/features/map/hooks/use-dive-log-photo-upload.ts`

## Implementation steps
1. Extend Prisma schema with `DiveLog` and `SpotRating` entities, relations, and indexes.
2. Add backend `dive-logs` module with DTO/service/repository/controller and `POST /dive-logs`.
3. Add backend storage service endpoint for dive log photo upload URL generation.
4. Wire module into backend app and add tests for DTO/service/controller/repository behavior.
5. Implement Design OS-aligned add-dive sheet UI and connect from spot detail `+ Add Dive` action.
6. Integrate photo picker/upload pipeline, validation limits, and submit payload mapping.
7. Trigger rating sheet display based on backend `shouldPromptRating` from create response.
8. Add/adjust mobile tests for map-screen and new components/hooks.
