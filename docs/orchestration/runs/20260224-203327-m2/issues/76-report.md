## Changes made

- Added a new two-step mobile spot-creation experience:
  - Step 1 (`placing`): centered pin placement overlay with live coordinate preview and confirm/cancel actions.
  - Step 2 (`form`): create form with required name, optional description/access info, optional photos (max 5), and submit/back actions.
- Added `CreateSpotOverlay` component:
  - map-centered placement guidance
  - form fields and validation UI
  - photo staging UI with remove support and 5-photo cap
- Added `useCreateSpot` hook:
  - `POST /spots` creation call
  - optional photo upload sequence per selected image:
    - `POST /spots/:id/photos/upload-url`
    - signed URL `PUT` upload
    - `POST /spots/:id/photos` attach
  - loading/error state handling for submit flow
- Updated map orchestration in `MapScreen`:
  - create-flow state machine (`idle -> placing -> form -> idle`)
  - create FAB integration
  - create success path refreshes spots and focuses/selects created marker
  - create flow temporarily suppresses spot-detail sheet visibility to avoid interaction overlap
- Updated `useSpots` with explicit `refresh()` support so spot list can be refetched after successful creation.
- Added tests for:
  - `useCreateSpot` happy/error paths
  - `CreateSpotOverlay` step rendering and submit enable/disable behavior
  - map-screen integration for showing create overlay state
- Added development-only runtime verification controls (guarded by `NODE_ENV === 'development'`) to allow deterministic simulator capture for placement/form states in unattended runs:
  - `EXPO_PUBLIC_DEV_CREATE_STEP`
  - `EXPO_PUBLIC_DEV_CREATE_LAT`
  - `EXPO_PUBLIC_DEV_CREATE_LON`

## Verification run

- `pnpm --filter mobile test -- create-spot-overlay.test.tsx use-create-spot.test.ts map-screen.test.tsx` (pass)
- `pnpm --filter mobile test -- spot-detail-sheet.test.tsx use-spot-detail.test.ts use-spot-photo-upload.test.ts map-screen.test.tsx create-spot-overlay.test.tsx use-create-spot.test.ts` (pass)
- `pnpm lint:mobile` (pass; existing unrelated warnings in `login-screen.test.tsx`)
- `pnpm --filter mobile run type-check` (pass)
- `pnpm test:mobile` (pass; existing unrelated console warnings in auth/map tests)
- iOS runtime verification (simulator):
  - placement step screenshot:
    - `docs/orchestration/runs/screenshots/issue-76/ios-create-spot-placement-step.png`
  - form step screenshot:
    - `docs/orchestration/runs/screenshots/issue-76/ios-create-spot-form-step.png`
  - successful create outcome screenshot (new marker selected, detail sheet opened):
    - `docs/orchestration/runs/screenshots/issue-76/ios-create-spot-created-marker.png`

## Not run / limitations

- Android runtime verification + screenshots were not run in this environment.
- Runtime capture used development-only create-flow overrides for deterministic unattended simulator evidence.

## Risk notes

- Main acceptance behavior is covered by unit/integration-style mobile tests and iOS runtime screenshots.
- Residual risk remains for Android runtime behavior and for non-dev runtime interaction nuances not exercised by unattended automation.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 76
