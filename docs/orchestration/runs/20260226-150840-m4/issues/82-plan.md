# Issue #82 Plan

## Scope
Enable inline profile editing (alias, bio, avatar replace/remove) in profile header with backend persistence and upload-url flow.

## Design Bundle
- docs/design-os-plan/product-overview.md
- docs/design-os-plan/instructions/incremental/04-auth-and-profiles.md
- docs/design-os-plan/sections/auth-and-profiles/README.md
- docs/design-os-plan/sections/auth-and-profiles/tests.md
- docs/design-os-plan/sections/auth-and-profiles/types.ts
- docs/design-os-plan/sections/auth-and-profiles/components/ProfilePage.tsx
- docs/design-os-plan/sections/auth-and-profiles/screenshot-profile.png

## Implementation Steps
1. Add backend profile edit endpoints:
   - `PATCH /users/me` for alias/bio/avatarUrl updates
   - `POST /users/me/avatar/upload-url` for signed upload URL generation
2. Reuse Supabase signed upload pattern from M2 spot photos for user avatar uploads.
3. Add inline edit mode in profile header with:
   - editable alias and bio fields
   - avatar replace/remove controls
   - inline validation (alias required; max lengths)
   - save/cancel controls
4. Save path persists via backend and refreshes profile data; cancel exits without persisting.
5. Add backend and mobile tests plus Maestro inline edit flow.

## Verification
- Backend users-module targeted tests + backend type-check/lint
- Mobile profile screen targeted tests + mobile lint/type-check
- Maestro profile shell + inline edit flows
- `pnpm orchestrator:mobile-auth-check`
