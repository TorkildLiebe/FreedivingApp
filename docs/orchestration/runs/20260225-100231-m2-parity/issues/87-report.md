## Changes made

- Updated `CreateSpotOverlay` and map create-flow orchestration for Design OS parity:
  - placement step copy aligned (`Pan & zoom to position your spot`)
  - primary CTA copy aligned (`Create Dive Spot`)
  - form labels/placeholders aligned to Design OS examples
  - added parking placement sub-flow (`parking` step) with add/remove parking list behavior
- Extended create hook payload to include optional `parkingLocations` so frontend flow remains parity-consistent with backend contract.
- Design OS assets used: docs/design-os-plan/product-overview.md; docs/design-os-plan/instructions/incremental/02-map-and-spots.md; docs/design-os-plan/sections/map-and-spots/{README.md,tests.md,components/CreateSpotOverlay.tsx,types.ts,create-divespot-select-pos.png,create-divespot.png}
- Component mapping: `CreateSpotOverlay` -> `/Users/torkildliebe/freedive/apps/mobile/src/features/map/components/create-spot-overlay.tsx`; create state machine -> `/Users/torkildliebe/freedive/apps/mobile/src/features/map/screens/map-screen.tsx`; submit contract -> `/Users/torkildliebe/freedive/apps/mobile/src/features/map/hooks/use-create-spot.ts`

## Verification run

- `pnpm --filter mobile test -- create-spot-overlay.test.tsx spot-detail-sheet.test.tsx map-screen.test.tsx use-create-spot.test.ts` (pass)
- `pnpm lint:mobile` (pass)
- `pnpm --filter mobile run type-check` (pass)
- Design parity evidence: iOS screenshots compared against Design OS create-flow references:
  - `docs/orchestration/runs/screenshots/issue-87/ios-map-screen.png`
  - `docs/orchestration/runs/screenshots/issue-87/ios-spot-detail-sheet-open.png`
  - `docs/orchestration/runs/screenshots/issue-87/ios-create-spot-placement-step.png`
  - `docs/orchestration/runs/screenshots/issue-87/ios-create-spot-form-step.png`

## Not run / limitations

- Android runtime verification/screenshots were not run.
- Approved deviations: parking placement uses current map center coordinate capture (equivalent interaction outcome to Design OS reference).

## Risk notes

- iOS runtime evidence confirms create flow states; Android-specific keyboard/layout behavior remains residual risk.
- Design parity evidence: create flow labels, placeholders, and state transitions now match Design OS intent.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 87
