# Issue #77 Plan — Add favorite toggle for spots

## Understand

- Spot detail sheet already shows a heart icon, but it only toggles local UI state.
- Backend user model already includes `favoriteSpotIds`, but API does not expose or mutate favorites.
- Issue requires optimistic toggle UX, backend persistence, startup hydration from `/users/me`, and auth-gated behavior.

## Plan

- Risk tier: High (cross-module behavior across backend user APIs, auth-bound state, and mobile UI orchestration).
- Skills used:
  - `freediving-frontend-dev`
  - `freediving-test-mobile`
  - `freediving-audit-rules`
- Implementation steps:
  1. Extend backend `GET /users/me` response to include `favoriteSpotIds`.
  2. Add auth-protected favorites endpoints on users module:
     - `POST /users/me/favorites/:spotId`
     - `DELETE /users/me/favorites/:spotId`
     with active-spot validation and unique-id favorites enforcement.
  3. Add backend tests for controller/service/repository favorite add/remove flows and idempotency.
  4. Extend mobile auth context to hydrate favorites from `/users/me` when session is available at app start.
  5. Add optimistic favorite toggle handler in auth/mobile flow with rollback on API failure.
  6. Make spot detail heart fully controlled from persisted favorite state and wire it through map screen.
  7. Enforce unauthenticated favorite taps to show login prompt/auth gate.
  8. Add/update mobile tests for heart toggle callback wiring and map screen favorite state orchestration.
- Verification steps:
  - targeted backend users tests
  - targeted mobile map/auth tests
  - lint + type-check in backend and mobile workspaces
  - broader backend + mobile test suites for regression confidence
  - iOS runtime verification evidence if simulator tooling is available in this environment
