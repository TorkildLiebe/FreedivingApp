# Issue #80 Plan

## Scope
Replace profile placeholder with full Design OS profile page shell in mobile app.

## Design Bundle
- docs/design-os-plan/product-overview.md
- docs/design-os-plan/instructions/incremental/04-auth-and-profiles.md
- docs/design-os-plan/sections/auth-and-profiles/README.md
- docs/design-os-plan/sections/auth-and-profiles/tests.md
- docs/design-os-plan/sections/auth-and-profiles/types.ts
- docs/design-os-plan/sections/auth-and-profiles/components/ProfilePage.tsx
- docs/design-os-plan/sections/auth-and-profiles/screenshot-profile.png

## Implementation Steps
1. Replace placeholder `profile-screen.tsx` with Design OS-inspired profile page structure:
   - header + avatar initials fallback + alias/bio + edit button
   - stat strip
   - grouped Activity / Account / More sections
2. Add profile data hook to load `/users/me` and stats endpoint data for live values.
3. Wire Activity rows to internal profile views so navigation targets are functional.
4. Ensure log out row is visually red (action wiring finalized in issue #83).
5. Add/adjust profile unit tests for core render and row navigation.

## Verification
- Targeted profile screen tests
- Mobile lint + type-check
- Maestro tab/profile navigation checks with iOS runtime evidence
