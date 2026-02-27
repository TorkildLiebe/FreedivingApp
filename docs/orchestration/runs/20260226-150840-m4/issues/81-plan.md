# Issue #81 Plan

## Scope
Implement profile activity detail lists (Dive Reports, My Spots, Saved Spots) with real backend-backed data and Design OS-aligned card layouts/empty states.

## Design Bundle
- docs/design-os-plan/product-overview.md
- docs/design-os-plan/instructions/incremental/04-auth-and-profiles.md
- docs/design-os-plan/sections/auth-and-profiles/README.md
- docs/design-os-plan/sections/auth-and-profiles/tests.md
- docs/design-os-plan/sections/auth-and-profiles/types.ts
- docs/design-os-plan/sections/auth-and-profiles/components/ProfilePage.tsx
- docs/design-os-plan/sections/auth-and-profiles/screenshot-profile.png

## Implementation Steps
1. Add backend profile activity endpoint to provide:
   - dive report summaries for current user
   - created spot summaries for current user
   - favorite spot summaries with latest report signal
2. Extend profile mobile data hook to load activity data once and keep it in-memory for view switching without refetch on back.
3. Replace placeholder profile detail views with Design OS-style list cards for reports/spots/favorites, preserving empty states and Back behavior.
4. Add/update unit tests for backend users module and mobile profile hook/screen.
5. Add Maestro profile activity flow and capture iOS screenshot evidence for changed list states.

## Verification
- Backend targeted tests + backend type-check/lint (noting unrelated lint blockers)
- Mobile targeted tests + mobile lint/type-check
- Maestro profile shell + activity flows on iOS
- `pnpm orchestrator:mobile-auth-check`
