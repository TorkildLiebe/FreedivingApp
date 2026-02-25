## Changes made

- Reworked `SpotDetailSheet` to restore Design OS parity for layout/copy/state details:
  - visibility freshness text (`No data yet` / `Xm · N days ago`) with stale/fresh color semantics
  - header controls with proper favorite/close labels
  - active `+ Add Dive` action and rating trigger
  - dive log empty state copy aligned to Design OS (`No dive logs yet. Be the first!`)
- Design OS assets used: docs/design-os-plan/product-overview.md; docs/design-os-plan/instructions/incremental/02-map-and-spots.md; docs/design-os-plan/sections/map-and-spots/{README.md,tests.md,components/SpotDetailSheet.tsx,components/SpotReportRow.tsx,types.ts,divespot.png}
- Component mapping: `SpotDetailSheet` -> `/Users/torkildliebe/freedive/apps/mobile/src/features/map/components/spot-detail-sheet.tsx`; spot/detail wiring -> `/Users/torkildliebe/freedive/apps/mobile/src/features/map/screens/map-screen.tsx`

## Verification run

- `pnpm --filter mobile test -- create-spot-overlay.test.tsx spot-detail-sheet.test.tsx map-screen.test.tsx use-create-spot.test.ts` (pass)
- `pnpm lint:mobile` (pass)
- `pnpm --filter mobile run type-check` (pass)
- Design parity evidence: iOS screenshots and states compared against Design OS detail sheet references:
  - `docs/orchestration/runs/screenshots/issue-86/ios-map-screen.png`
  - `docs/orchestration/runs/screenshots/issue-86/ios-spot-detail-sheet-open.png`
  - `docs/orchestration/runs/screenshots/issue-86/ios-create-spot-placement-step.png`
  - `docs/orchestration/runs/screenshots/issue-86/ios-create-spot-form-step.png`

## Not run / limitations

- Android runtime verification/screenshots were not run.
- Approved deviations: rating persistence backend endpoint is not in M2 scope; UI interaction and callback semantics are implemented and verified.

## Risk notes

- If backend rating persistence is added later, callback path in map screen should switch from alert to API call.
- Design parity evidence: detail sheet copy/state behavior now aligns to Design OS intent.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 86
