## Changes made

- Added selected marker support to `MapView` by introducing `selectedSpotId` and expression-driven styling for unclustered markers (larger radius + darker color when selected).
- Added cluster count labels via `SymbolLayer` (`spot-cluster-count`) so clustered markers show a visible count badge.
- Wired `MapScreen` to pass `selectedSpotId` into `MapView`.
- Updated map tests:
  - `map-view.native.test.tsx` now validates cluster count layer and selected marker style expression.
  - `map-screen.test.tsx` now validates `selectedSpotId` state updates after marker press.
- Fixed a pre-existing lint-blocking import case mismatch in `apps/mobile/src/shared/theme/index.ts` (`./Colors`).

## Verification run

- `pnpm --filter mobile test -- map-view.native.test.tsx map-screen.test.tsx` (pass: 2 suites, 15 tests)
- `pnpm lint:mobile` (pass; warnings only in unrelated auth test file)
- `pnpm --filter mobile run type-check` (pass)
- `pnpm --filter mobile exec expo run:ios --device "iPhone 17"` (pass; iOS build/install/launch succeeded)
- iOS screenshot evidence captured:
  - `docs/orchestration/runs/screenshots/issue-73/ios-map-screen.png`
  - `docs/orchestration/runs/screenshots/issue-73/ios-login-screen.png`

## Not run / limitations

- Android runtime verification and screenshot capture were not run in this environment (`adb`/Android emulator not available).
- Simulator runtime landed on auth screens (no authenticated session), so on-device marker interaction could not be exercised end-to-end against live map data.

## Risk notes

- Selected-state and cluster count behavior is covered by component and screen tests, but a full authenticated device check on map markers should still be executed on both iOS and Android in a follow-up validation pass.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 73
