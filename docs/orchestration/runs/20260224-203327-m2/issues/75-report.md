## Changes made

- Backend spot photo upload flow implemented:
  - Added signed upload URL endpoint `POST /spots/:id/photos/upload-url`.
  - Added photo attach endpoint `POST /spots/:id/photos`.
  - Added Supabase storage integration service (`SpotPhotoStorageService`) with configurable bucket.
  - Added photo domain guards in `SpotsService`: URL validation, duplicate URL rejection, max 5 photos per spot.
  - Added supporting domain errors and DTOs for upload URL + add-photo operations.
  - Extended repository support for persisting `photoUrls`, including Prisma schema update (`DiveSpot.photoUrls`).
- Mobile photo upload and display flow implemented:
  - Added `expo-image-picker`.
  - Added `useSpotPhotoUpload` hook for picker -> signed URL -> binary upload -> photo attach.
  - Wired map screen to trigger upload from spot detail and refresh detail on success.
  - Updated `SpotDetailSheet` photos section to render horizontal image strip, upload state, and max-limit state.
- Tests were added/updated across backend and mobile for new upload/display logic and limit/error paths.
- iOS runtime evidence captured for spot detail photo strip rendering and max-limit state:
  - `docs/orchestration/runs/screenshots/issue-75/ios-spot-detail-sheet-open.png`
  - `docs/orchestration/runs/screenshots/issue-75/ios-spot-photo-strip-visible.png`
  - `docs/orchestration/runs/screenshots/issue-75/ios-spot-photo-limit-state.png`

## Verification run

- `pnpm --filter backend run test -- spots.service.spec.ts spots.controller.spec.ts` (pass)
- `pnpm --filter mobile test -- spot-detail-sheet.test.tsx use-spot-detail.test.ts use-spot-photo-upload.test.ts map-screen.test.tsx` (pass)
- `pnpm lint:backend` (pass)
- `pnpm lint:mobile` (pass; existing unrelated warnings in `login-screen.test.tsx`)
- `pnpm --filter backend run type-check` (pass)
- `pnpm --filter mobile run type-check` (pass)
- `pnpm test:backend` (pass)
- `pnpm test:mobile` (pass; existing unrelated console warnings in auth/map tests)
- iOS runtime verification:
  - rebuilt dev client with native dependency inclusion: `pnpm --filter mobile exec expo run:ios --device "iPhone 17"`
  - validated signed upload + attach API flow on backend and seeded spot to max 5 photos
  - captured simulator screenshots showing spot detail sheet open, photo strip visible, and max-limit state

## Not run / limitations

- Android runtime verification + screenshots were not run in this environment.
- The iOS automation path did not drive an end-to-end picker selection action in simulator UI; picker flow is covered by mobile hook tests and backend runtime upload/attach verification.

## Risk notes

- Core acceptance behavior (signed upload URL, persisted photo references, spot detail photo rendering, max 5 state) is covered by backend/mobile tests plus iOS runtime evidence.
- Residual risk is primarily platform-specific UI behavior on Android and simulator-only differences around native picker interactions.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: true
ISSUE_NUMBER: 75
