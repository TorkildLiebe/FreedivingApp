# Issue #93 Plan

## Scope
- Populate spot detail dive-log rows from real backend data.
- Add paginated `GET /spots/:id/dive-logs` endpoint with newest-first ordering and no N+1 author lookup.
- Wire mobile spot detail rendering to the paginated endpoint and preserve Design OS list semantics.

## Risk tier
- High (backend query contract + mobile networked list behavior + API shape change).

## Design OS assets used
- `docs/design-os-plan/product-overview.md`
- `docs/design-os-plan/instructions/incremental/03-dive-reports.md`
- `docs/design-os-plan/sections/dive-reports/README.md`
- `docs/design-os-plan/sections/dive-reports/tests.md`
- `docs/design-os-plan/sections/dive-reports/screenshot.png`

## Component mapping
- Dive-log list behavior in spot detail -> `apps/mobile/src/features/map/components/spot-detail-sheet.tsx`
- Spot detail dive-log fetch orchestration -> `apps/mobile/src/features/map/hooks/use-spot-detail.ts`
- Backend list contract -> `apps/backend/src/modules/spots/{spots.controller.ts,spots.service.ts,spots.repository.ts,dto/*}`

## Implementation steps
1. Add paginated backend DTO + response DTO for `GET /spots/:id/dive-logs`.
2. Add repository query with `include: { author }`, `orderBy: divedAt desc`, offset pagination.
3. Add service/controller wiring and not-found/empty-state handling.
4. Update mobile `useSpotDetail` to fetch paginated dive logs from the new endpoint and merge into spot detail state.
5. Update spot detail list row rendering to match required fields (author alias/avatar fallback, visibility badge, current strength, notes preview truncation, date).
6. Add/update backend and mobile tests for endpoint, sort order mapping, and empty-state text.
