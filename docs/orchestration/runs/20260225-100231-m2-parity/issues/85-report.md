## Changes made

- Updated map/search and spot-entry flow to align with Design OS map-and-spots behavior:
  - preserved cluster/selected marker behavior
  - aligned search bar copy to Design OS style (`Search spots...`)
  - ensured create FAB visibility semantics (`visible only when no active spot and not in create flow`)
- Design OS assets used: docs/design-os-plan/product-overview.md; docs/design-os-plan/instructions/incremental/02-map-and-spots.md; docs/design-os-plan/sections/map-and-spots/{README.md,tests.md,components/MapAndSpots.tsx,types.ts,map.png}
- Component mapping: `MapAndSpots` -> `/Users/torkildliebe/freedive/apps/mobile/src/features/map/screens/map-screen.tsx`; map marker/cluster interactions -> `/Users/torkildliebe/freedive/apps/mobile/src/features/map/components/map-view.native.tsx`

## Verification run

- `pnpm --filter mobile test -- create-spot-overlay.test.tsx spot-detail-sheet.test.tsx map-screen.test.tsx use-create-spot.test.ts` (pass)
- `pnpm lint:mobile` (pass)
- `pnpm --filter mobile run type-check` (pass)
- Design parity evidence: iOS screenshots captured and compared to Design OS map references:
  - `docs/orchestration/runs/screenshots/issue-85/ios-map-screen.png`
  - `docs/orchestration/runs/screenshots/issue-85/ios-spot-detail-sheet-open.png`
  - `docs/orchestration/runs/screenshots/issue-85/ios-create-spot-placement-step.png`
  - `docs/orchestration/runs/screenshots/issue-85/ios-create-spot-form-step.png`

## Not run / limitations

- Android runtime verification/screenshots were not run.
- Approved deviations: Search placeholder uses ASCII ellipsis (`...`) in React Native for consistent rendering.

## Risk notes

- Residual risk is Android-only rendering/interaction variance.
- Design parity evidence: map overlay hierarchy and FAB visibility now match Design OS semantics.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 85
