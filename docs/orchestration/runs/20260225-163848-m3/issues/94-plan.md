# Issue #94 Plan

## Scope
- Add editable dive-log flow (2-step form reuse) for own logs within 48 hours.
- Add backend `PATCH /dive-logs/:id` with ownership + edit-window enforcement.
- Show/hide edit action in spot detail dive-log list based on eligibility and refresh list after successful edit.
- Ensure runtime-safe auth wiring in `DiveLogsModule` for guarded endpoints.

## Risk tier
- High (permission/business-rule enforcement + backend mutation + mobile edit-state flow).

## Guided decision resolution
- Decision `M3-94-01` resolved in guided mode with user-selected option 1: strict owner-only edits within 48 hours.

## Design OS bundle used for UI parity checks
- `docs/design-os-plan/product-overview.md`
- `docs/design-os-plan/instructions/incremental/03-dive-reports.md`
- `docs/design-os-plan/sections/dive-reports/{README.md,tests.md,components/AddDiveForm.tsx,types.ts,screenshot.png}`
- `docs/design-os-plan/sections/map-and-spots/components/SpotDetailSheet.tsx` (dive-log row placement context)

## Implementation checklist
- Backend:
  - Add update DTO and `PATCH /dive-logs/:id` controller route.
  - Enforce owner-only + 48-hour window in service (`403` non-owner, `422` expired).
  - Keep spot aggregate metrics refreshed after edit.
  - Return full updated dive-log response for UI refresh.
- Mobile:
  - Add edit affordance per row for eligible logs only (current user + within 48h).
  - Reuse AddDiveForm in edit mode with prefilled date/current/visibility/notes/photos.
  - Submit edit via `PATCH /dive-logs/:id` and refresh spot detail list on success.
  - Preserve create flow behavior and rating prompt logic for non-edit submissions.
