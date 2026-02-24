# Issue #76 Plan — Build spot creation flow (map pin + form)

## Understand

- Issue requires a two-step mobile flow:
  1. place/reposition a map pin location
  2. submit a form (name required, optional description/access info/photos)
- Creation must call existing `POST /spots`, then show the new marker on map.
- Flow must be auth-restricted and integrate optional photos (up to 5) using issue #75 upload behavior.

## Plan

- Risk tier: High (new user flow with map interactions, API writes, optional media upload, and UI/state orchestration).
- Skills used:
  - `freediving-frontend-dev`
  - `freediving-test-mobile`
  - `freediving-audit-rules`
- Implementation steps:
  1. Add a create-spot controller hook to own flow state, validation, submit, and map refresh behavior.
  2. Add map pin placement mode tied to current map center and confirm/reposition controls.
  3. Add step-2 form overlay with required title validation and optional description/access info.
  4. Add optional photo staging (up to 5) and post-create upload/attach sequence via issue #75 endpoints.
  5. Ensure auth gate behavior in UI (hide/deny creation action without session).
  6. Refresh spot list and select/focus newly created marker after successful submission.
  7. Add/expand mobile tests for create flow state transitions, validation, submit path, and auth restriction.
- Verification steps:
  - targeted mobile tests for new hook/component/screen behavior
  - mobile lint + type-check
  - broader mobile test suite due high-risk flow orchestration
  - iOS simulator runtime screenshots for pin step and form submission success state
