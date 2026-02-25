## Changes made

- Completed M2 accessibility/copy/token/state-flow cleanup for touched map-and-spots UI:
  - normalized key labels/copy in create and detail flows to Design OS language
  - ensured state-flow transitions for idle -> placing -> form -> parking -> form -> submit are explicit and deterministic
  - preserved design token usage where available in shared mobile theme
- Design OS assets used: docs/design-os-plan/product-overview.md; docs/design-os-plan/instructions/incremental/02-map-and-spots.md; docs/design-os-plan/design-system/{tokens.css,fonts.md,tailwind-colors.md}; docs/design-os-plan/sections/map-and-spots/{README.md,tests.md}
- Component mapping: state-flow/copy updates -> `/Users/torkildliebe/freedive/apps/mobile/src/features/map/screens/map-screen.tsx`; tokenized UI components -> `/Users/torkildliebe/freedive/apps/mobile/src/features/map/components/{create-spot-overlay.tsx,spot-detail-sheet.tsx}`

## Verification run

- `pnpm --filter mobile test -- create-spot-overlay.test.tsx spot-detail-sheet.test.tsx map-screen.test.tsx use-create-spot.test.ts` (pass)
- `pnpm lint:mobile` (pass)
- `pnpm --filter mobile run type-check` (pass)
- Design parity evidence: iOS screenshots and design token/copy state spot-check:
  - `docs/orchestration/runs/screenshots/issue-89/ios-map-screen.png`
  - `docs/orchestration/runs/screenshots/issue-89/ios-spot-detail-sheet-open.png`
  - `docs/orchestration/runs/screenshots/issue-89/ios-create-spot-placement-step.png`
  - `docs/orchestration/runs/screenshots/issue-89/ios-create-spot-form-step.png`

## Not run / limitations

- Android runtime verification/screenshots were not run.
- Approved deviations: warning/error accent colors use local hex values where the shared mobile token set currently has no dedicated warning/error scales.

## Risk notes

- Residual risk is limited to Android parity and future token-palette expansion.
- Design parity evidence: copy/state flow and control semantics for touched M2 screens are aligned with Design OS references.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 89
