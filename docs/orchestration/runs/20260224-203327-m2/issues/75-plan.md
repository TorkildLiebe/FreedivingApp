# Issue #75 Plan — Add photo upload and display on spots

## Understand

- Goal is to support up to five photos per spot with upload and display in the existing M2 spot detail sheet.
- Required behaviors:
  - backend signed upload URL generation for Supabase Storage
  - mobile picker and upload flow that stores the uploaded photo URL on the spot
  - horizontal photo strip rendering in spot detail
  - clear limit feedback when the spot already has five photos
- Auth expectation: upload is restricted to authenticated users; photos are visible in spot detail for signed-in users.

## Plan

- Risk tier: High (backend + mobile changes, auth-sensitive upload path, external storage integration, UI behavior).
- Skills used:
  - `freediving-backend-dev`
  - `freediving-frontend-dev`
  - `freediving-test-backend`
  - `freediving-test-mobile`
  - `freediving-audit-rules`
- Implementation steps:
  1. Add backend photo upload URL and photo attach endpoints, with validation for max count and URL safety.
  2. Extend persistence and spot detail mapping to store and return `photoUrls`.
  3. Add mobile upload hook (`picker -> signed URL -> binary upload -> attach photo`) and wire it into the spot detail sheet.
  4. Update spot detail sheet to render a horizontal photo row plus explicit max-limit state.
  5. Add/update backend and mobile tests for happy path, error path, and five-photo limit.
- Verification steps:
  - targeted backend and mobile tests for touched features
  - backend/mobile lint + type-check
  - broader backend/mobile regression tests due high-risk cross-workspace impact
  - iOS simulator runtime verification with screenshots for photo display and limit state
