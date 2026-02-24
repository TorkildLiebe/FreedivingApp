# Issue #73 Plan — Add marker clustering and name-based spot search

## Understand

- Existing implementation already has:
  - marker clustering enabled in `MapView` (`ShapeSource cluster=true`)
  - map search input filtering marker list client-side in `MapScreen`
- Gaps against acceptance criteria:
  - cluster count badge text is missing
  - selected marker is not visually distinct from unselected markers

## Plan

- Risk tier: Medium (module-level mobile UI/behavior change in one workspace).
- Skills used:
  - `freediving-frontend-dev`
  - `freediving-test-mobile`
  - `freediving-audit-rules`
- Implementation steps:
  1. Extend `MapView` props to accept `selectedSpotId`.
  2. Add cluster count `SymbolLayer` over clustered markers.
  3. Update unclustered marker style with expression-based selected-state styling.
  4. Pass `selectedSpotId` from `MapScreen` to `MapView`.
  5. Update map component tests to validate cluster count layer and selected style wiring.
- Verification steps:
  - targeted map tests for `MapView` and `MapScreen`
  - mobile lint + mobile type-check for medium risk
