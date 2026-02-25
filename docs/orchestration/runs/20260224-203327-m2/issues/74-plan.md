# Issue #74 Plan — Build spot detail bottom sheet

## Understand

- Existing bottom sheet opens on marker tap and supports swipe-down dismissal.
- Current gaps vs issue requirements:
  - missing header controls (favorite toggle, explicit close button)
  - missing stats row (visibility, rating, report count, stale marker)
  - missing photos section and dive-log placeholder section
  - missing `+ Add Dive` action button
  - API response type lacks fields needed to drive these sections consistently

## Plan

- Risk tier: High (cross-workspace backend + mobile API contract and UI behavior updates).
- Skills used:
  - `freediving-backend-dev`
  - `freediving-frontend-dev`
  - `freediving-test-backend`
  - `freediving-test-mobile`
  - `freediving-audit-rules`
- Implementation steps:
  1. Extend backend `GET /spots/:id` response DTO/mapping with spot-detail presentation fields used by M2 sheet (`photoUrls`, stats fields, placeholder dive-log entries).
  2. Update mobile spot detail types to match backend contract additions.
  3. Rebuild `SpotDetailSheet` UI structure to include required header controls, stats row, description/access/photos/parking sections, dive-log placeholder, and disabled `+ Add Dive` action.
  4. Keep favorite toggle non-persistent (UI-only) until issue #77 backend persistence is implemented.
  5. Add/update unit tests for backend mapping and mobile sheet rendering behavior (including stale indicator logic and placeholders).
- Verification steps:
  - targeted backend + mobile tests for touched units
  - workspace lint/type-check for backend and mobile
  - broader regression commands for both workspaces due high risk
