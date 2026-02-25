## Changes made

- Implemented backend favorites persistence on the users API:
  - Extended `GET /users/me` to include `favoriteSpotIds`.
  - Added `POST /users/me/favorites/:spotId` and `DELETE /users/me/favorites/:spotId`.
  - Enforced domain constraints for favorites:
    - user must exist
    - adding a favorite requires a non-deleted target spot
    - favorite IDs remain unique
- Added backend coverage for favorites behavior in users module controller/service/repository tests.
- Updated mobile spot detail favorite behavior to be backend-driven instead of local-only:
  - `SpotDetailSheet` favorite control is now controlled by spot state from parent.
  - Added `useFavoriteSpots` hook in map feature to:
    - load favorites from `/users/me` at startup/auth-session availability
    - optimistically toggle favorites with backend sync + rollback on failure
  - Wired `MapScreen` to merge spot detail with persisted favorite state and execute optimistic toggle requests.
  - Added unauthenticated favorite action gate: prompts sign-in and routes to login when user taps sign-in.
- Added/updated mobile tests for:
  - `useFavoriteSpots` loading/toggle/rollback/auth-gate behavior
  - `MapScreen` favorite state wiring and toggle/login prompt behavior
  - `SpotDetailSheet` favorite toggle callback behavior

## Verification run

- `pnpm --filter backend test -- users.controller.spec.ts users.service.spec.ts users.repository.spec.ts` (pass)
- `pnpm --filter mobile test -- use-favorite-spots.test.ts map-screen.test.tsx spot-detail-sheet.test.tsx` (pass)
- `pnpm lint:backend` (pass)
- `pnpm lint:mobile` (pass; existing unrelated warnings in `login-screen.test.tsx`)
- `pnpm --filter backend run type-check` (pass)
- `pnpm --filter mobile run type-check` (pass)
- `pnpm test:backend` (pass)
- `pnpm test:mobile` (pass; existing unrelated console warnings in legacy tests)

## Not run / limitations

- iOS runtime simulator verification screenshots for the new favorite toggle flow were not captured in this environment.
- Android runtime verification and screenshots were not run.

## Risk notes

- Core behavior is covered by backend + mobile unit/integration-style tests, including optimistic update rollback and unauthenticated gating.
- Residual risk remains for runtime UI behavior differences on iOS/Android devices until simulator/device flow is exercised end-to-end with screenshots.

RESULT: PASS
VERIFICATION: PASS
MOBILE_UI_TOUCHED: true
IOS_VERIFIED: false
ISSUE_NUMBER: 77
